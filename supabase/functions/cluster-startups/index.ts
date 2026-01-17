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
  blurb?: string;
  location?: string;
  maturity?: string;
  amountRaised?: string;
  businessType?: string;
  team?: string;
  market?: string;
  valueProp?: string;
  competition?: string;
}

type ParentCategory = 'biotech' | 'saas' | 'hardware' | 'food' | 'fintech' | 'marketplace' | 'deeptech' | 'climate' | 'other';

interface ClusterResult {
  id: number;
  name: string;
  description: string;
  keywords: string[];
  articleCount: number;
  trendScore: number;
  parentCategory: ParentCategory;
}

interface StartupClusterMatch {
  startup: Startup;
  clusters: { clusterId: number; clusterName: string; score: number }[];
  investmentScore: number;
  trendCorrelation: number;
  scoreBreakdown: {
    trendAlignment: number;
    marketTiming: number;
    sectorFit: number;
  };
}

// Scoring weights by business type
const SCORING_WEIGHTS: Record<string, { trendAlignment: number; marketTiming: number; sectorFit: number }> = {
  saas: { trendAlignment: 40, marketTiming: 35, sectorFit: 25 },
  biotech: { trendAlignment: 25, marketTiming: 25, sectorFit: 50 },
  hardware: { trendAlignment: 30, marketTiming: 30, sectorFit: 40 },
  food: { trendAlignment: 35, marketTiming: 35, sectorFit: 30 },
  fintech: { trendAlignment: 40, marketTiming: 30, sectorFit: 30 },
  deeptech: { trendAlignment: 20, marketTiming: 30, sectorFit: 50 },
  climate: { trendAlignment: 35, marketTiming: 40, sectorFit: 25 },
  marketplace: { trendAlignment: 45, marketTiming: 35, sectorFit: 20 },
  other: { trendAlignment: 35, marketTiming: 35, sectorFit: 30 },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { scrapedArticles, startups, numClusters = 12 } = await req.json() as {
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

    // Step 1: Use AI to analyze articles and identify HIERARCHICAL clusters
    const articleSummaries = scrapedArticles.map((article, idx) => {
      return `[${idx + 1}] "${article.title}" - ${article.excerpt}`;
    }).join('\n');

    const clusterPrompt = `Analyze these startup/tech news articles and identify ${numClusters} SPECIFIC trend clusters organized under parent categories.

Articles:
${articleSummaries}

Parent categories (MUST use one of these):
- biotech: Biotechnology, healthcare, pharma, medtech, life sciences
- saas: B2B/B2C software, enterprise tools, AI/ML software
- hardware: Physical products, IoT, robotics, manufacturing
- food: FoodTech, AgriTech, alternative proteins, restaurants
- fintech: Payments, banking, insurance, crypto, investments
- marketplace: B2B/B2C marketplaces, e-commerce platforms
- deeptech: Quantum computing, space tech, advanced materials, nuclear
- climate: CleanTech, renewables, sustainability, carbon capture
- other: Other emerging sectors

Create SPECIFIC, NICHE clusters within these parent categories. Examples:
- "AI Drug Discovery" (parent: biotech) NOT just "Healthcare"
- "Vertical SaaS for Construction" (parent: saas) NOT just "B2B Software"
- "Electric Vehicle Batteries" (parent: climate) NOT just "Clean Energy"
- "AI Code Assistants" (parent: saas) NOT just "AI"

Return JSON:
{
  "clusters": [
    {
      "id": 1,
      "name": "Specific 3-5 word niche like 'AI-Powered Legal Tech'",
      "parentCategory": "saas",
      "description": "2-3 sentence description of this specific niche",
      "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6"],
      "articleIndices": [1, 5, 12],
      "trendScore": 85
    }
  ]
}

Rules:
- Be SPECIFIC and GRANULAR - avoid broad categories
- Each cluster MUST have a valid parentCategory from the list above
- Each article in exactly ONE cluster
- trendScore: 0-100 based on article volume and momentum signals
- Include 6-8 specific keywords per cluster
- Aim for 2-4 clusters per active parent category
- Return ONLY valid JSON`;

    console.log('Calling AI to identify hierarchical clusters...');
    
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
    let parsedClusters: { clusters: { id: number; name: string; parentCategory: ParentCategory; description: string; keywords: string[]; articleIndices: number[]; trendScore: number }[] };
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

    // Build cluster results with parent categories
    const clusterResults: ClusterResult[] = parsedClusters.clusters.map((cluster) => {
      const clusterArticles = cluster.articleIndices
        .map((idx) => scrapedArticles[idx - 1])
        .filter((a): a is ScrapedArticle => Boolean(a));

      return {
        id: cluster.id,
        name: cluster.name,
        description: cluster.description,
        keywords: cluster.keywords,
        articleCount: clusterArticles.length,
        trendScore: cluster.trendScore || 50,
        parentCategory: cluster.parentCategory || 'other',
      };
    });

    // Sort clusters by trend score
    const sortedClusters = [...clusterResults].sort((a, b) => b.trendScore - a.trendScore);

    // Step 2: Match startups and calculate detailed investment scores
    const startupData = startups.map((s, idx) => 
      `[${idx + 1}] ${s.name}${s.tags ? ` | Tags: ${s.tags}` : ''}${s.website ? ` | ${s.website}` : ''}${s.businessType ? ` | Type: ${s.businessType}` : ''}${s.maturity ? ` | Stage: ${s.maturity}` : ''}`
    ).join('\n');

    const clusterInfo = sortedClusters.map(c => 
      `Cluster ${c.id}: "${c.name}" (Category: ${c.parentCategory}, Trend: ${c.trendScore}/100) - Keywords: ${c.keywords.join(', ')}`
    ).join('\n');

    const matchPrompt = `Match startups to trend clusters and calculate detailed investment scores with breakdown.

CLUSTERS (sorted by trend score):
${clusterInfo}

STARTUPS:
${startupData}

For each startup, calculate:
1. Which clusters they match (based on name, tags, website, business type)
2. Match score per cluster (0-1)
3. Investment score breakdown:
   - trendAlignment (0-40): How well they align with HIGH-trend clusters
   - marketTiming (0-30): Is the market ready? Are they positioned well?
   - sectorFit (0-30): How well does their sector match trending areas?

Return JSON:
{
  "matches": [
    {
      "startupIndex": 1,
      "clusters": [
        { "clusterId": 1, "score": 0.85 }
      ],
      "scoreBreakdown": {
        "trendAlignment": 32,
        "marketTiming": 25,
        "sectorFit": 21
      },
      "trendCorrelation": 0.82
    }
  ]
}

Rules:
- trendAlignment: 0-40, based on cluster trend scores
- marketTiming: 0-30, based on market signals
- sectorFit: 0-30, how well startup fits trending sectors
- Total investmentScore = trendAlignment + marketTiming + sectorFit (0-100)
- trendCorrelation: 0-1, overall trend alignment
- Up to 3 clusters per startup, score > 0.3
- Return ONLY valid JSON`;

    console.log('Calling AI to match startups with score breakdowns...');

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

    let parsedMatches: { matches: { startupIndex: number; clusters: { clusterId: number; score: number }[]; scoreBreakdown: { trendAlignment: number; marketTiming: number; sectorFit: number }; trendCorrelation: number }[] };
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

    // Build final startup cluster matches with score breakdowns
    const startupMatches: StartupClusterMatch[] = parsedMatches.matches.map(match => {
      const startup = startups[match.startupIndex - 1];
      const scoreBreakdown = match.scoreBreakdown || { trendAlignment: 0, marketTiming: 0, sectorFit: 0 };
      const investmentScore = scoreBreakdown.trendAlignment + scoreBreakdown.marketTiming + scoreBreakdown.sectorFit;
      
      return {
        startup,
        clusters: match.clusters.map(c => ({
          clusterId: c.clusterId,
          clusterName: clusterResults.find(cr => cr.id === c.clusterId)?.name || 'Unknown',
          score: c.score,
        })).sort((a, b) => b.score - a.score),
        investmentScore,
        trendCorrelation: match.trendCorrelation || 0,
        scoreBreakdown,
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
          scoreBreakdown: { trendAlignment: 0, marketTiming: 0, sectorFit: 0 },
        });
      }
    });

    // Sort by investment score (highest first)
    startupMatches.sort((a, b) => b.investmentScore - a.investmentScore);

    console.log(`Clustering complete: ${clusterResults.length} clusters in categories, ${startupMatches.length} startups matched`);

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
