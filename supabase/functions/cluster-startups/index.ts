import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScrapedArticle {
  url: string;
  title: string;
  excerpt: string;
  content: string;
  scrapedAt: string;
  fundingAmount?: number;
}

interface Startup {
  name: string;
  website?: string;
  tags?: string;
  linkedin?: string;
}

interface ClusterResult {
  id: number;
  name: string;
  description: string;
  keywords: string[];
  articleCount: number;
  totalFunding: number;
  avgRecency: number; // Days since scrape
}

interface StartupClusterMatch {
  startup: Startup;
  clusters: { clusterId: number; clusterName: string; score: number }[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { scrapedArticles, startups, numClusters = 6 } = await req.json() as {
      scrapedArticles: ScrapedArticle[];
      startups: Startup[];
      numClusters?: number;
    };
    
    if (!scrapedArticles || !Array.isArray(scrapedArticles) || scrapedArticles.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Scraped articles array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!startups || !Array.isArray(startups) || startups.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Startups array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: 'LOVABLE_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Clustering ${scrapedArticles.length} articles into ${numClusters} clusters for ${startups.length} startups`);

    // Step 1: Use AI to analyze articles and identify clusters using K-means-like grouping
    const articleSummaries = scrapedArticles.map((article, idx) => {
      const recencyDays = Math.floor((Date.now() - new Date(article.scrapedAt).getTime()) / (1000 * 60 * 60 * 24));
      const fundingInfo = article.fundingAmount ? ` (Funding: $${article.fundingAmount}M)` : '';
      return `[${idx + 1}] "${article.title}"${fundingInfo} - ${article.excerpt}`;
    }).join('\n');

    const clusterPrompt = `You are analyzing startup/tech news articles to identify thematic clusters. 
    
Analyze these articles and group them into exactly ${numClusters} thematic clusters (like K-means clustering would do).
Consider article importance based on:
1. Funding amounts mentioned (higher = more important)
2. Recency (more recent = more important)

Articles to analyze:
${articleSummaries}

Return a JSON object with this exact structure:
{
  "clusters": [
    {
      "id": 1,
      "name": "Short name like 'AI Infrastructure' or 'Fintech Payments'",
      "description": "2-3 sentence description of what this cluster covers",
      "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
      "articleIndices": [1, 5, 12]
    }
  ]
}

Rules:
- Each article should be assigned to exactly ONE cluster
- Cluster names should be concise (2-4 words)
- Include 5-8 keywords per cluster that capture the theme
- Consider funding amounts to weight cluster importance
- Return ONLY valid JSON, no other text`;

    console.log('Calling AI to identify clusters...');
    
    const clusterResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'You are an expert at analyzing startup and tech news to identify industry trends and thematic clusters. Always return valid JSON.' },
          { role: 'user', content: clusterPrompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!clusterResponse.ok) {
      const errorText = await clusterResponse.text();
      console.error('AI clustering error:', errorText);
      
      if (clusterResponse.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (clusterResponse.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: 'Payment required. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: false, error: 'AI analysis failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const clusterData = await clusterResponse.json();
    const clusterContent = clusterData.choices?.[0]?.message?.content || '';
    
    console.log('AI cluster response received');
    
    // Parse cluster results
    let parsedClusters: { clusters: { id: number; name: string; description: string; keywords: string[]; articleIndices: number[] }[] };
    try {
      // Extract JSON from response (handle markdown code blocks)
      let jsonStr = clusterContent;
      const jsonMatch = clusterContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
      parsedClusters = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to parse cluster JSON:', e, clusterContent);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to parse AI cluster analysis' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build cluster results with metadata
    const clusterResults: ClusterResult[] = parsedClusters.clusters.map(cluster => {
      const clusterArticles = cluster.articleIndices.map(idx => scrapedArticles[idx - 1]).filter(Boolean);
      const totalFunding = clusterArticles.reduce((sum, a) => sum + (a?.fundingAmount || 0), 0);
      const now = Date.now();
      const avgRecency = clusterArticles.length > 0 
        ? clusterArticles.reduce((sum, a) => sum + (now - new Date(a.scrapedAt).getTime()) / (1000 * 60 * 60 * 24), 0) / clusterArticles.length
        : 0;
      
      return {
        id: cluster.id,
        name: cluster.name,
        description: cluster.description,
        keywords: cluster.keywords,
        articleCount: clusterArticles.length,
        totalFunding,
        avgRecency: Math.round(avgRecency * 10) / 10,
      };
    });

    // Step 2: Match startups to clusters
    const startupData = startups.map((s, idx) => 
      `[${idx + 1}] ${s.name}${s.tags ? ` | Tags: ${s.tags}` : ''}${s.website ? ` | ${s.website}` : ''}`
    ).join('\n');

    const clusterData2 = clusterResults.map(c => 
      `Cluster ${c.id}: "${c.name}" - Keywords: ${c.keywords.join(', ')}`
    ).join('\n');

    const matchPrompt = `Match each startup to the most relevant cluster(s).

CLUSTERS:
${clusterData2}

STARTUPS:
${startupData}

Return a JSON object:
{
  "matches": [
    {
      "startupIndex": 1,
      "clusters": [
        { "clusterId": 1, "score": 0.85 },
        { "clusterId": 3, "score": 0.45 }
      ]
    }
  ]
}

Rules:
- Match based on startup name, tags, and website domain
- Score from 0 to 1 (1 = perfect match)
- Include up to 3 clusters per startup if relevant
- Only include matches with score > 0.3
- Return ONLY valid JSON`;

    console.log('Calling AI to match startups to clusters...');

    const matchResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'You are an expert at matching startups to industry clusters. Always return valid JSON.' },
          { role: 'user', content: matchPrompt }
        ],
        temperature: 0.2,
      }),
    });

    if (!matchResponse.ok) {
      console.error('AI matching error');
      return new Response(
        JSON.stringify({ success: false, error: 'AI startup matching failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const matchData = await matchResponse.json();
    const matchContent = matchData.choices?.[0]?.message?.content || '';

    let parsedMatches: { matches: { startupIndex: number; clusters: { clusterId: number; score: number }[] }[] };
    try {
      let jsonStr = matchContent;
      const jsonMatch = matchContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
      parsedMatches = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to parse match JSON:', e, matchContent);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to parse AI matching results' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build final startup cluster matches
    const startupMatches: StartupClusterMatch[] = parsedMatches.matches.map(match => {
      const startup = startups[match.startupIndex - 1];
      return {
        startup,
        clusters: match.clusters.map(c => ({
          clusterId: c.clusterId,
          clusterName: clusterResults.find(cr => cr.id === c.clusterId)?.name || 'Unknown',
          score: c.score,
        })).sort((a, b) => b.score - a.score),
      };
    });

    // Include startups that weren't matched
    const matchedIndices = new Set(parsedMatches.matches.map(m => m.startupIndex));
    startups.forEach((startup, idx) => {
      if (!matchedIndices.has(idx + 1)) {
        startupMatches.push({
          startup,
          clusters: [],
        });
      }
    });

    console.log(`Clustering complete: ${clusterResults.length} clusters, ${startupMatches.length} startups matched`);

    return new Response(
      JSON.stringify({
        success: true,
        clusters: clusterResults,
        startupMatches,
        stats: {
          totalArticles: scrapedArticles.length,
          totalStartups: startups.length,
          clustersCreated: clusterResults.length,
          startupsMatched: startupMatches.filter(m => m.clusters.length > 0).length,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in cluster-startups:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
