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
  avgRecency: number;
  trendScore: number; // 0-100 score based on recency and article volume
}

interface StartupClusterMatch {
  startup: Startup;
  clusters: { clusterId: number; clusterName: string; score: number }[];
  investmentScore: number; // 0-100 investment significance score
  trendCorrelation: number; // How well matched to trending topics
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { scrapedArticles, startups, numClusters = 10 } = await req.json() as {
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

    // Calculate article metrics for trend analysis
    const now = Date.now();
    const articleMetrics = scrapedArticles.map((article, idx) => {
      const recencyDays = (now - new Date(article.scrapedAt).getTime()) / (1000 * 60 * 60 * 24);
      const recencyScore = Math.max(0, 100 - recencyDays * 10); // Decay over 10 days
      return {
        idx: idx + 1,
        recencyDays,
        recencyScore,
        funding: article.fundingAmount || 0,
      };
    });

    // Step 1: Use AI to analyze articles and identify clusters
    const articleSummaries = scrapedArticles.map((article, idx) => {
      const metrics = articleMetrics[idx];
      const fundingInfo = article.fundingAmount ? ` [FUNDING: $${article.fundingAmount}M]` : '';
      const recencyInfo = ` [${metrics.recencyDays.toFixed(1)} days ago]`;
      return `[${idx + 1}] "${article.title}"${fundingInfo}${recencyInfo} - ${article.excerpt}`;
    }).join('\n');

const clusterPrompt = `Analyze these startup/tech news articles and identify ${numClusters} SPECIFIC and GRANULAR trend clusters.

Articles:
${articleSummaries}

Create SPECIFIC, NICHE clusters - not broad categories. Examples of good clusters:
- "AI Code Assistants" NOT "Artificial Intelligence"
- "Electric Vehicle Batteries" NOT "Clean Energy"
- "Enterprise Security Automation" NOT "Cybersecurity"
- "AI Drug Discovery" NOT "Healthcare Tech"
- "Vertical SaaS for Construction" NOT "B2B Software"

Return JSON:
{
  "clusters": [
    {
      "id": 1,
      "name": "Specific 3-5 word niche like 'AI-Powered Legal Tech'",
      "description": "2-3 sentence description of this specific niche",
      "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6", "keyword7", "keyword8"],
      "articleIndices": [1, 5, 12],
      "trendScore": 85
    }
  ]
}

Rules:
- Be SPECIFIC and GRANULAR - avoid broad categories
- Each article in exactly ONE cluster
- trendScore: 0-100 based on recency + funding + volume
- Include 6-10 specific keywords per cluster
- Return ONLY valid JSON`;

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
          { role: 'system', content: 'You are an expert at analyzing startup and tech news to identify industry trends. Always return valid JSON.' },
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
    let parsedClusters: { clusters: { id: number; name: string; description: string; keywords: string[]; articleIndices: number[]; trendScore: number }[] };
    try {
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

    // Build cluster results with computed metadata
    const clusterResults: ClusterResult[] = parsedClusters.clusters.map(cluster => {
      const clusterArticles = cluster.articleIndices.map(idx => scrapedArticles[idx - 1]).filter(Boolean);
      const totalFunding = clusterArticles.reduce((sum, a) => sum + (a?.fundingAmount || 0), 0);
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
        trendScore: cluster.trendScore || 50,
      };
    });

    // Sort clusters by trend score for reference
    const sortedClusters = [...clusterResults].sort((a, b) => b.trendScore - a.trendScore);

    // Step 2: Match startups and calculate investment scores
    const startupData = startups.map((s, idx) => 
      `[${idx + 1}] ${s.name}${s.tags ? ` | Tags: ${s.tags}` : ''}${s.website ? ` | ${s.website}` : ''}`
    ).join('\n');

    const clusterInfo = sortedClusters.map(c => 
      `Cluster ${c.id}: "${c.name}" (Trend: ${c.trendScore}/100, Funding: $${c.totalFunding}M) - Keywords: ${c.keywords.join(', ')}`
    ).join('\n');

    const matchPrompt = `Match startups to trend clusters and score their investment potential.

CLUSTERS (sorted by trend score):
${clusterInfo}

STARTUPS:
${startupData}

For each startup, determine:
1. Which clusters they match (based on name, tags, website)
2. Match score per cluster (0-1)
3. Investment significance score (0-100) based on:
   - How well they align with HIGH-trend clusters
   - Stronger alignment with trending topics = higher score
   - Startups in hot sectors (high cluster trendScore) should rank higher

Return JSON:
{
  "matches": [
    {
      "startupIndex": 1,
      "clusters": [
        { "clusterId": 1, "score": 0.85 }
      ],
      "investmentScore": 78,
      "trendCorrelation": 0.82
    }
  ]
}

Rules:
- investmentScore: 0-100, weighted by cluster trend scores
- trendCorrelation: 0-1, how well startup aligns with trending topics
- Up to 3 clusters per startup, score > 0.3
- Startups matching high-trend clusters get higher investmentScore
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
          { role: 'system', content: 'You are an expert at evaluating startup investment potential based on market trends. Always return valid JSON.' },
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

    let parsedMatches: { matches: { startupIndex: number; clusters: { clusterId: number; score: number }[]; investmentScore: number; trendCorrelation: number }[] };
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
        investmentScore: match.investmentScore || 0,
        trendCorrelation: match.trendCorrelation || 0,
      };
    });

    // Include startups that weren't matched with zero scores
    const matchedIndices = new Set(parsedMatches.matches.map(m => m.startupIndex));
    startups.forEach((startup, idx) => {
      if (!matchedIndices.has(idx + 1)) {
        startupMatches.push({
          startup,
          clusters: [],
          investmentScore: 0,
          trendCorrelation: 0,
        });
      }
    });

    // Sort by investment score (highest first)
    startupMatches.sort((a, b) => b.investmentScore - a.investmentScore);

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
