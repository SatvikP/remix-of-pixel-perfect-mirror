export interface Article {
  source: string;
  url: string;
  title: string;
  published_date: string | null;
  authors: string[];
  section: string | null;
  tags: string[];
  is_pro: boolean;
  excerpt: string;
}

export interface ScrapedArticle {
  url: string;
  title: string;
  excerpt: string;
  content: string;
  scrapedAt: string;
  fundingAmount?: number;
}

export interface Startup {
  name: string;
  website?: string;
  tags?: string;
  linkedin?: string;
  // Extended info from VC feedback
  blurb?: string;
  location?: string;
  maturity?: 'pre-seed' | 'seed' | 'series-a' | 'series-b' | 'series-c+' | 'growth';
  amountRaised?: string;
  businessType?: 'saas' | 'hardware' | 'biotech' | 'food' | 'fintech' | 'marketplace' | 'deeptech' | 'other';
  // One-pager info
  team?: string;
  market?: string;
  valueProp?: string;
  competition?: string;
}

// Parent category for hierarchical clusters
export type ParentCategory = 
  | 'biotech'
  | 'saas'
  | 'hardware'
  | 'food'
  | 'fintech'
  | 'marketplace'
  | 'deeptech'
  | 'climate'
  | 'other';

export interface ParentCategoryInfo {
  id: ParentCategory;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export const PARENT_CATEGORIES: ParentCategoryInfo[] = [
  { id: 'biotech', name: 'Biotech & Health', description: 'Biotechnology, healthcare, pharma, medtech', icon: 'Dna', color: 'emerald' },
  { id: 'saas', name: 'SaaS & Software', description: 'B2B/B2C software, enterprise tools, AI/ML', icon: 'Cloud', color: 'blue' },
  { id: 'hardware', name: 'Hardware & Robotics', description: 'Physical products, IoT, robotics, manufacturing', icon: 'Cpu', color: 'orange' },
  { id: 'food', name: 'Food & Agri', description: 'FoodTech, AgriTech, alternative proteins', icon: 'Leaf', color: 'green' },
  { id: 'fintech', name: 'Fintech', description: 'Payments, banking, insurance, crypto', icon: 'Wallet', color: 'purple' },
  { id: 'marketplace', name: 'Marketplace', description: 'B2B/B2C marketplaces, e-commerce', icon: 'ShoppingBag', color: 'pink' },
  { id: 'deeptech', name: 'DeepTech', description: 'Quantum, space, advanced materials', icon: 'Atom', color: 'cyan' },
  { id: 'climate', name: 'Climate & Energy', description: 'CleanTech, renewables, sustainability', icon: 'Zap', color: 'yellow' },
  { id: 'other', name: 'Other', description: 'Other emerging sectors', icon: 'Sparkles', color: 'gray' },
];

export interface ClusterResult {
  id: number;
  name: string;
  description: string;
  keywords: string[];
  articleCount: number;
  trendScore: number;
  parentCategory: ParentCategory; // Which parent category this cluster belongs to
}

export interface StartupClusterMatch {
  startup: Startup;
  clusters: { clusterId: number; clusterName: string; score: number }[];
  investmentScore: number;
  trendCorrelation: number;
  // Score breakdown for transparency
  scoreBreakdown?: {
    trendAlignment: number; // 0-40 points
    marketTiming: number; // 0-30 points
    sectorFit: number; // 0-30 points
  };
}

export interface ClusteringResult {
  success: boolean;
  clusters: ClusterResult[];
  startupMatches: StartupClusterMatch[];
  stats: {
    totalArticles: number;
    totalStartups: number;
    clustersCreated: number;
    startupsMatched: number;
  };
  error?: string;
}

export interface ScrapeResult {
  success: boolean;
  data?: ScrapedArticle[];
  errors?: { url: string; error: string }[];
  stats?: {
    total: number;
    scraped: number;
    failed: number;
  };
  error?: string;
}

// Scoring weights by business type
export interface ScoringWeights {
  trendAlignment: number;
  marketTiming: number;
  sectorFit: number;
}

export const SCORING_WEIGHTS_BY_TYPE: Record<string, ScoringWeights> = {
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

export const SCORING_WEIGHTS_BY_MATURITY: Record<string, ScoringWeights> = {
  'pre-seed': { trendAlignment: 45, marketTiming: 35, sectorFit: 20 },
  'seed': { trendAlignment: 40, marketTiming: 35, sectorFit: 25 },
  'series-a': { trendAlignment: 35, marketTiming: 35, sectorFit: 30 },
  'series-b': { trendAlignment: 30, marketTiming: 35, sectorFit: 35 },
  'series-c+': { trendAlignment: 25, marketTiming: 30, sectorFit: 45 },
  'growth': { trendAlignment: 20, marketTiming: 30, sectorFit: 50 },
};
