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
}

export interface ClusterResult {
  id: number;
  name: string;
  description: string;
  keywords: string[];
  articleCount: number;
  totalFunding: number;
  avgRecency: number;
  trendScore: number;
}

export interface StartupClusterMatch {
  startup: Startup;
  clusters: { clusterId: number; clusterName: string; score: number }[];
  investmentScore: number;
  trendCorrelation: number;
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
