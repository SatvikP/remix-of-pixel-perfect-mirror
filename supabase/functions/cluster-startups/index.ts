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
    marketMomentum?: number;
    fundingClimate?: number;
    clusterTrendScore?: number;
  };
}

// Custom scoring weights passed from frontend
interface ScoringWeights {
  trendAlignment?: number;
  marketTiming?: number;
  sectorFit?: number;
  marketMomentum?: number;
  fundingClimate?: number;
  clusterTrendScore?: number;
}

// Default scoring weights by business type
const DEFAULT_SCORING_WEIGHTS: Record<string, { trendAlignment: number; marketTiming: number; sectorFit: number }> = {
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
    const { scrapedArticles, startups, numClusters = 20, scoringWeights } = await req.json() as {
      scrapedArticles: ScrapedArticle[];
      startups: Startup[];
      numClusters?: number;
      scoringWeights?: ScoringWeights;
    };
    
    // Merge custom weights with defaults
    const customWeights = scoringWeights || {};
    const hasCustomWeights = Object.keys(customWeights).length > 0;
    console.log('Using custom scoring weights:', hasCustomWeights ? customWeights : 'none (defaults)');
    
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

Create SPECIFIC but BROAD-ENOUGH clusters to capture most startups. Examples:
- "AI & Automation Tools" (parent: saas) - catches many AI startups
- "Digital Health & Wellness" (parent: biotech) - catches health apps
- "B2B Software & Enterprise" (parent: saas) - catches general B2B
- "Consumer & Retail Tech" (parent: marketplace) - catches e-commerce
- "Sustainability Solutions" (parent: climate) - catches green startups

Aim for 3-5 clusters per parent category so startups can find a match.

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

    const matchPrompt = `Match ALL startups to trend clusters. EVERY startup must be matched to at least one cluster.

CLUSTERS:
${clusterInfo}

STARTUPS:
${startupData}

IMPORTANT: You MUST match EVERY startup to at least 1-3 clusters. Be lenient and creative:
- Match by name keywords, tags, website domain hints
- If a startup seems tech-related, match to relevant tech clusters
- If unclear, match to the most general applicable cluster
- NO startup should have 0 matches

For each startup, calculate:
1. Clusters they match (1-4 clusters per startup, be generous)
2. Match score per cluster (0.3-1.0)
3. Score breakdown:
   - trendAlignment (0-40): Alignment with trending clusters
   - marketTiming (0-30): Market readiness signals
   - sectorFit (0-30): Sector match quality

Return JSON:
{
  "matches": [
    {
      "startupIndex": 1,
      "clusters": [
        { "clusterId": 1, "score": 0.75 }
      ],
      "scoreBreakdown": {
        "trendAlignment": 28,
        "marketTiming": 22,
        "sectorFit": 20
      },
      "trendCorrelation": 0.70
    }
  ]
}

CRITICAL RULES:
- EVERY startup in the list MUST appear in matches (indices 1 to ${startups.length})
- Each startup needs 1-4 cluster matches minimum
- Be generous with matching - partial relevance counts
- Even vague matches get score 0.3-0.5
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
      const errorText = await matchResponse.text();
      console.error('AI matching error:', matchResponse.status, errorText);
      
      if (matchResponse.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Rate limit exceeded during matching. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (matchResponse.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: 'Payment required. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: false, error: `AI startup matching failed: ${matchResponse.status}` }),
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
    // Apply custom weights if provided
    const startupMatches: StartupClusterMatch[] = parsedMatches.matches.map(match => {
      const startup = startups[match.startupIndex - 1];
      const rawBreakdown = match.scoreBreakdown || { trendAlignment: 0, marketTiming: 0, sectorFit: 0 };
      
      // Calculate additional market-derived metrics
      const matchedClusterData = match.clusters.map(c => 
        clusterResults.find(cr => cr.id === c.clusterId)
      ).filter(Boolean);
      
      const avgClusterTrendScore = matchedClusterData.length > 0
        ? Math.round(matchedClusterData.reduce((sum, c) => sum + (c?.trendScore || 0), 0) / matchedClusterData.length)
        : 0;
      
      // Market momentum: higher score for clusters with high trend scores
      const marketMomentum = Math.round(avgClusterTrendScore * 0.15); // 0-15 points
      
      // Funding climate: inferred from cluster trend scores and article density
      const fundingClimate = Math.round(avgClusterTrendScore * 0.10); // 0-10 points
      
      // Build enhanced score breakdown
      const scoreBreakdown = {
        trendAlignment: rawBreakdown.trendAlignment,
        marketTiming: rawBreakdown.marketTiming,
        sectorFit: rawBreakdown.sectorFit,
        marketMomentum,
        fundingClimate,
        clusterTrendScore: avgClusterTrendScore,
      };
      
      // Calculate investment score based on custom weights or defaults
      let investmentScore: number;
      if (hasCustomWeights) {
        // Use normalized custom weights
        const totalWeight = Object.values(customWeights).reduce((sum, w) => sum + (w || 0), 0);
        const normalize = totalWeight > 0 ? 100 / totalWeight : 1;
        
        investmentScore = Math.round(
          ((customWeights.trendAlignment || 0) * (scoreBreakdown.trendAlignment / 40) * normalize) +
          ((customWeights.marketTiming || 0) * (scoreBreakdown.marketTiming / 30) * normalize) +
          ((customWeights.sectorFit || 0) * (scoreBreakdown.sectorFit / 30) * normalize) +
          ((customWeights.marketMomentum || 0) * (marketMomentum / 15) * normalize) +
          ((customWeights.fundingClimate || 0) * (fundingClimate / 10) * normalize) +
          ((customWeights.clusterTrendScore || 0) * (avgClusterTrendScore / 100) * normalize)
        );
      } else {
        // Default: sum of core breakdown
        investmentScore = scoreBreakdown.trendAlignment + scoreBreakdown.marketTiming + scoreBreakdown.sectorFit;
      }
      
      return {
        startup,
        clusters: match.clusters.map(c => ({
          clusterId: c.clusterId,
          clusterName: clusterResults.find(cr => cr.id === c.clusterId)?.name || 'Unknown',
          score: c.score,
        })).sort((a, b) => b.score - a.score),
        investmentScore: Math.min(100, Math.max(0, investmentScore)),
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
          scoreBreakdown: { trendAlignment: 0, marketTiming: 0, sectorFit: 0, marketMomentum: 0, fundingClimate: 0, clusterTrendScore: 0 },
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
