// Configurable scoring system types and defaults

export interface ScoringMetric {
  id: string;
  name: string;
  description: string;
  detailedInfo: string; // Extended info for tooltip
  example: string; // Example of what this means
  category: 'market' | 'startup' | 'trend';
  enabled: boolean;
  weight: number; // 0-100, will be normalized
  maxPoints: number; // Maximum points this metric can contribute
}

export interface ScoringConfig {
  metrics: ScoringMetric[];
  normalizeWeights: boolean; // If true, weights are normalized to 100%
}

// Market-focused metrics (derived from articles/trends)
export const MARKET_METRICS: ScoringMetric[] = [
  {
    id: 'trendAlignment',
    name: 'Trend Alignment',
    description: 'How well the startup aligns with current market trends from news analysis',
    detailedInfo: 'This metric analyzes the startup\'s core offering against trending topics identified from 350+ daily news articles across EU tech sources. Higher scores indicate the startup is working on problems that are currently generating significant media attention.',
    example: 'A startup building AI agents would score high when AI agent articles dominate the news cycle.',
    category: 'market',
    enabled: true,
    weight: 40,
    maxPoints: 40,
  },
  {
    id: 'marketTiming',
    name: 'Market Timing',
    description: 'Market readiness signals - is the market ready for this solution?',
    detailedInfo: 'Evaluates whether the broader market conditions favor this type of solution. Considers factors like regulatory tailwinds, adoption signals from news, enterprise interest, and funding momentum in the space.',
    example: 'Climate tech scores higher when policy announcements and corporate sustainability commitments are trending.',
    category: 'market',
    enabled: true,
    weight: 30,
    maxPoints: 30,
  },
  {
    id: 'marketMomentum',
    name: 'Market Momentum',
    description: 'Article volume growth rate in matched clusters (accelerating vs cooling)',
    detailedInfo: 'Measures whether interest in the startup\'s sector is growing or declining based on article frequency trends. Derived from the trend scores of matched clusters, indicating if the market is heating up or cooling down.',
    example: 'A startup in a cluster with 85/100 trend score indicates strong, accelerating market interest.',
    category: 'market',
    enabled: true,
    weight: 15,
    maxPoints: 15,
  },
  {
    id: 'fundingClimate',
    name: 'Funding Climate',
    description: 'Recent funding activity in the sector based on news mentions',
    detailedInfo: 'Infers the investment climate from news about funding rounds, VC activity, and deal flow in the startup\'s matched sectors. Higher scores suggest active investor interest in similar companies.',
    example: 'Fintech startups score higher when there are many funding announcements in payments/banking clusters.',
    category: 'market',
    enabled: true,
    weight: 10,
    maxPoints: 10,
  },
  {
    id: 'competitiveDensity',
    name: 'Competitive Density',
    description: 'Number of similar startups in trend clusters (inverse - less is better)',
    detailedInfo: 'Measures how crowded the startup\'s space is. Lower competition can indicate first-mover advantage, while high competition might suggest a saturated market. Score is inversely proportional to density.',
    example: 'A quantum computing startup in a niche cluster with few competitors would score higher than one in crowded SaaS.',
    category: 'market',
    enabled: false,
    weight: 5,
    maxPoints: 5,
  },
];

// Startup-specific metrics (from CSV data)
export const STARTUP_METRICS: ScoringMetric[] = [
  {
    id: 'sectorFit',
    name: 'Sector Fit',
    description: 'How well the startup fits within its identified sector/cluster',
    detailedInfo: 'Evaluates the match quality between the startup\'s business model, tags, and description against the characteristics of identified trend clusters. Strong sector fit suggests the startup is well-positioned within its market segment.',
    example: 'A B2B SaaS startup matching to "Enterprise AI Tools" cluster would score higher than one loosely matched to "General Tech".',
    category: 'startup',
    enabled: true,
    weight: 30,
    maxPoints: 30,
  },
  {
    id: 'maturityScore',
    name: 'Maturity Stage',
    description: 'Investment attractiveness based on funding stage',
    detailedInfo: 'Different stages offer different risk/reward profiles. Pre-seed/Seed often have higher upside but more risk. Series A+ shows validation but may have lower multiples. This metric adjusts based on your investment thesis.',
    example: 'For early-stage VCs, pre-seed startups score higher. For growth funds, Series B+ would score higher.',
    category: 'startup',
    enabled: false,
    weight: 10,
    maxPoints: 10,
  },
  {
    id: 'teamStrength',
    name: 'Team Strength',
    description: 'Quality signals from team description (if provided)',
    detailedInfo: 'Analyzes the team field from your CSV for signals like prior exits, domain expertise, technical depth, and complementary skills. Requires team information to be included in your upload.',
    example: 'A team with "ex-Google, 2x founder, PhD in ML" would score higher than "passionate entrepreneurs".',
    category: 'startup',
    enabled: false,
    weight: 10,
    maxPoints: 10,
  },
];

// Trend-derived metrics
export const TREND_METRICS: ScoringMetric[] = [
  {
    id: 'clusterTrendScore',
    name: 'Cluster Trend Score',
    description: 'Average trend score of matched clusters',
    detailedInfo: 'Each cluster is assigned a trend score (0-100) based on article volume, recency, and momentum. This metric averages the scores of all clusters the startup matches, indicating overall trendiness.',
    example: 'A startup matching clusters with scores [85, 72, 68] would get ~75, indicating strong trend alignment.',
    category: 'trend',
    enabled: true,
    weight: 20,
    maxPoints: 20,
  },
  {
    id: 'multiClusterBonus',
    name: 'Multi-Cluster Bonus',
    description: 'Bonus for matching multiple trending clusters',
    detailedInfo: 'Startups that match multiple relevant clusters may have broader market appeal or be positioned at the intersection of multiple trends. This bonus rewards versatility without penalizing focused players.',
    example: 'A startup matching "AI Healthcare" + "Digital Health" + "Enterprise SaaS" gets a bonus for cross-trend potential.',
    category: 'trend',
    enabled: false,
    weight: 5,
    maxPoints: 5,
  },
];

export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  metrics: [...MARKET_METRICS, ...STARTUP_METRICS, ...TREND_METRICS],
  normalizeWeights: true,
};

// Preset configurations
export const SCORING_PRESETS: Record<string, ScoringConfig> = {
  'market-focused': {
    metrics: [
      ...MARKET_METRICS.map(m => ({ ...m, enabled: true })),
      ...STARTUP_METRICS.map(m => ({ ...m, enabled: false })),
      ...TREND_METRICS.map(m => ({ ...m, enabled: true })),
    ],
    normalizeWeights: true,
  },
  'balanced': {
    metrics: [
      ...MARKET_METRICS.map(m => ({ ...m, enabled: true, weight: m.weight * 0.5 })),
      ...STARTUP_METRICS.map(m => ({ ...m, enabled: true, weight: m.weight * 0.5 })),
      ...TREND_METRICS.map(m => ({ ...m, enabled: true })),
    ],
    normalizeWeights: true,
  },
  'startup-focused': {
    metrics: [
      ...MARKET_METRICS.map(m => ({ ...m, enabled: true, weight: m.weight * 0.3 })),
      ...STARTUP_METRICS.map(m => ({ ...m, enabled: true, weight: m.weight * 1.5 })),
      ...TREND_METRICS.map(m => ({ ...m, enabled: true })),
    ],
    normalizeWeights: true,
  },
};

// Helper to normalize weights to 100%
export function normalizeWeights(metrics: ScoringMetric[]): ScoringMetric[] {
  const enabledMetrics = metrics.filter(m => m.enabled);
  const totalWeight = enabledMetrics.reduce((sum, m) => sum + m.weight, 0);
  
  if (totalWeight === 0) return metrics;
  
  return metrics.map(m => ({
    ...m,
    weight: m.enabled ? Math.round((m.weight / totalWeight) * 100) : m.weight,
  }));
}

// Convert config to weights for edge function
export function configToWeights(config: ScoringConfig): Record<string, number> {
  const normalized = config.normalizeWeights ? normalizeWeights(config.metrics) : config.metrics;
  const weights: Record<string, number> = {};
  
  normalized.filter(m => m.enabled).forEach(m => {
    weights[m.id] = m.weight;
  });
  
  return weights;
}

// Get enabled metrics grouped by category
export function getMetricsByCategory(metrics: ScoringMetric[]): Record<string, ScoringMetric[]> {
  return metrics.reduce((acc, m) => {
    if (!acc[m.category]) acc[m.category] = [];
    acc[m.category].push(m);
    return acc;
  }, {} as Record<string, ScoringMetric[]>);
}
