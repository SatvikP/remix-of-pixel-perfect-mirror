import { supabase } from "@/integrations/supabase/client";
import type { Article, ScrapeResult, Startup, ClusteringResult, ScrapedArticle } from "./types";

export async function scrapeArticles(articles: Article[]): Promise<ScrapeResult> {
  const { data, error } = await supabase.functions.invoke('scrape-articles', {
    body: { articles },
  });

  if (error) {
    console.error('Scrape error:', error);
    return { success: false, error: error.message };
  }

  return data;
}

export async function clusterStartups(
  scrapedArticles: ScrapedArticle[],
  startups: Startup[],
  numClusters: number = 10
): Promise<ClusteringResult> {
  const { data, error } = await supabase.functions.invoke('cluster-startups', {
    body: { scrapedArticles, startups, numClusters },
  });

  if (error) {
    console.error('Clustering error:', error);
    return { 
      success: false, 
      error: error.message,
      clusters: [],
      startupMatches: [],
      stats: { totalArticles: 0, totalStartups: 0, clustersCreated: 0, startupsMatched: 0 }
    };
  }

  return data;
}

export function parseCSV(csvText: string): Startup[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
  
  // Find column indices
  const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('startup'));
  const websiteIdx = headers.findIndex(h => h.includes('website') || h.includes('url') || h.includes('site'));
  const tagsIdx = headers.findIndex(h => h.includes('tag') || h.includes('category') || h.includes('sector'));
  const linkedinIdx = headers.findIndex(h => h.includes('linkedin'));

  if (nameIdx === -1) {
    throw new Error('CSV must have a "Name" or "Startup Name" column');
  }

  const startups: Startup[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Handle quoted values with commas
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/^["']|["']$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^["']|["']$/g, ''));

    const name = values[nameIdx]?.trim();
    if (!name) continue;

    startups.push({
      name,
      website: websiteIdx >= 0 ? values[websiteIdx]?.trim() : undefined,
      tags: tagsIdx >= 0 ? values[tagsIdx]?.trim() : undefined,
      linkedin: linkedinIdx >= 0 ? values[linkedinIdx]?.trim() : undefined,
    });
  }

  return startups;
}
