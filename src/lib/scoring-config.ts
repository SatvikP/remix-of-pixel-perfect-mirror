// Configurable scoring system types and defaults

export interface ScoringMetric {
  id: string;
  name: string;
  description: string;
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
    category: 'market',
    enabled: true,
    weight: 40,
    maxPoints: 40,
  },
  {
    id: 'marketTiming',
    name: 'Market Timing',
    description: 'Market readiness signals - is the market ready for this solution?',
    category: 'market',
    enabled: true,
    weight: 30,
    maxPoints: 30,
  },
  {
    id: 'marketMomentum',
    name: 'Market Momentum',
    description: 'Article volume growth rate in matched clusters (accelerating vs cooling)',
    category: 'market',
    enabled: true,
    weight: 15,
    maxPoints: 15,
  },
  {
    id: 'fundingClimate',
    name: 'Funding Climate',
    description: 'Recent funding activity in the sector based on news mentions',
    category: 'market',
    enabled: true,
    weight: 10,
    maxPoints: 10,
  },
  {
    id: 'competitiveDensity',
    name: 'Competitive Density',
    description: 'Number of similar startups in trend clusters (inverse - less is better)',
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
    category: 'startup',
    enabled: true,
    weight: 30,
    maxPoints: 30,
  },
  {
    id: 'maturityScore',
    name: 'Maturity Stage',
    description: 'Investment attractiveness based on funding stage',
    category: 'startup',
    enabled: false,
    weight: 10,
    maxPoints: 10,
  },
  {
    id: 'teamStrength',
    name: 'Team Strength',
    description: 'Quality signals from team description (if provided)',
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
    category: 'trend',
    enabled: true,
    weight: 20,
    maxPoints: 20,
  },
  {
    id: 'multiClusterBonus',
    name: 'Multi-Cluster Bonus',
    description: 'Bonus for matching multiple trending clusters',
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
