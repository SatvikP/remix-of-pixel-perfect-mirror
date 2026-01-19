import { supabase } from "@/integrations/supabase/client";
import type { Article, ScrapeResult, Startup, ClusteringResult, ScrapedArticle } from "./types";

export type ScraperProvider = 'firecrawl' | 'lightpanda';

// ============= User Startups Persistence =============

// Fetch user's saved startups from database
export async function fetchUserStartups(): Promise<Startup[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('user_startups')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching user startups:', error);
    return [];
  }

  return (data || []).map(row => ({
    name: row.name,
    website: row.website || undefined,
    tags: row.tags || undefined,
    linkedin: row.linkedin || undefined,
    blurb: row.blurb || undefined,
    location: row.location || undefined,
    maturity: row.maturity as Startup['maturity'],
    amountRaised: row.amount_raised || undefined,
    businessType: row.business_type as Startup['businessType'],
  }));
}

// Save startups to database for current user
export async function saveUserStartups(startups: Startup[]): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  // First, delete existing startups for this user
  const { error: deleteError } = await supabase
    .from('user_startups')
    .delete()
    .eq('user_id', user.id);

  if (deleteError) {
    console.error('Error deleting existing startups:', deleteError);
    return false;
  }

  // Insert new startups
  const startupsToInsert = startups.map(s => ({
    user_id: user.id,
    name: s.name,
    website: s.website || null,
    tags: s.tags || null,
    linkedin: s.linkedin || null,
    blurb: s.blurb || null,
    location: s.location || null,
    maturity: s.maturity || null,
    amount_raised: s.amountRaised || null,
    business_type: s.businessType || null,
  }));

  const { error: insertError } = await supabase
    .from('user_startups')
    .insert(startupsToInsert);

  if (insertError) {
    console.error('Error saving startups:', insertError);
    return false;
  }

  // Update user profile to track CSV upload
  await updateProfileCsvUpload();

  return true;
}

// Update user profile when CSV is uploaded
async function updateProfileCsvUpload(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Check if profile exists
  const { data: existingProfile } = await supabase
    .from('user_profiles')
    .select('id, has_uploaded_csv, total_csv_uploads')
    .eq('user_id', user.id)
    .single();

  if (existingProfile) {
    // Update existing profile
    await supabase
      .from('user_profiles')
      .update({
        has_uploaded_csv: true,
        first_csv_upload_at: existingProfile.has_uploaded_csv ? undefined : new Date().toISOString(),
        total_csv_uploads: (existingProfile.total_csv_uploads || 0) + 1,
        last_seen_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);
  } else {
    // Insert new profile (should have been created by trigger, but fallback)
    await supabase
      .from('user_profiles')
      .insert({
        user_id: user.id,
        email: user.email,
        has_uploaded_csv: true,
        first_csv_upload_at: new Date().toISOString(),
        total_csv_uploads: 1,
      });
  }
}

// Update last_seen_at for current user
export async function updateLastSeen(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('user_profiles')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('user_id', user.id);
}


// Delete all startups for current user
export async function deleteUserStartups(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('user_startups')
    .delete()
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting user startups:', error);
    return false;
  }

  return true;
}

// Fetch articles from the database
export async function fetchArticlesFromDatabase(): Promise<{
  articles: Article[];
  lastUpdated: string | null;
  count: number;
}> {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .order('published_date', { ascending: false })
    .limit(500);

  if (error) {
    console.error('Error fetching articles:', error);
    return { articles: [], lastUpdated: null, count: 0 };
  }

  // Get the most recent update time
  const lastUpdated = data?.[0]?.updated_at || data?.[0]?.created_at || null;

  // Convert database format to Article format
  const articles: Article[] = (data || []).map(row => ({
    source: row.source,
    url: row.url,
    title: row.title,
    published_date: row.published_date,
    authors: row.authors || [],
    section: row.section,
    tags: row.tags || [],
    is_pro: row.is_pro || false,
    excerpt: row.excerpt || '',
  }));

  return { 
    articles, 
    lastUpdated,
    count: articles.length 
  };
}

// Trigger a manual refresh of articles
export async function triggerArticleScrape(provider: ScraperProvider = 'firecrawl'): Promise<{
  success: boolean;
  stats?: {
    totalScraped: number;
    recentArticles: number;
    savedToDb: number;
    provider?: ScraperProvider;
  };
  error?: string;
}> {
  const { data, error } = await supabase.functions.invoke('scrape-sifted-daily', {
    body: { provider },
  });

  if (error) {
    console.error('Scrape trigger error:', error);
    return { success: false, error: error.message };
  }

  return {
    success: data?.success || false,
    stats: { ...data?.stats, provider },
    error: data?.error,
  };
}

export async function scrapeArticles(articles: Article[], provider: ScraperProvider = 'firecrawl'): Promise<ScrapeResult> {
  const { data, error } = await supabase.functions.invoke('scrape-articles', {
    body: { articles, provider },
  });

  if (error) {
    console.error('Scrape error:', error);
    return { success: false, error: error.message };
  }

  return { ...data, provider };
}

// Scrape a single URL with Lightpanda
export async function scrapeWithLightpanda(url: string): Promise<{
  success: boolean;
  data?: {
    markdown?: string;
    content?: string;
    metadata?: {
      title?: string;
      description?: string;
    };
  };
  error?: string;
}> {
  const { data, error } = await supabase.functions.invoke('scrape-lightpanda', {
    body: { url },
  });

  if (error) {
    console.error('Lightpanda scrape error:', error);
    return { success: false, error: error.message };
  }

  return data;
}

export async function clusterStartups(
  scrapedArticles: ScrapedArticle[],
  startups: Startup[],
  numClusters: number = 10,
  scoringWeights?: Record<string, number>
): Promise<ClusteringResult> {
  const { data, error } = await supabase.functions.invoke('cluster-startups', {
    body: { scrapedArticles, startups, numClusters, scoringWeights },
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
  
  // Find column indices - extended fields
  const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('startup'));
  const websiteIdx = headers.findIndex(h => h.includes('website') || h.includes('url') || h.includes('site'));
  const tagsIdx = headers.findIndex(h => h.includes('tag') || h.includes('category') || h.includes('sector'));
  const linkedinIdx = headers.findIndex(h => h.includes('linkedin'));
  const blurbIdx = headers.findIndex(h => h.includes('blurb') || h.includes('description') || h.includes('about'));
  const locationIdx = headers.findIndex(h => h.includes('location') || h.includes('country') || h.includes('city') || h.includes('hq'));
  const maturityIdx = headers.findIndex(h => h.includes('maturity') || h.includes('stage') || h.includes('round'));
  const amountIdx = headers.findIndex(h => h.includes('amount') || h.includes('raised') || h.includes('funding'));
  const typeIdx = headers.findIndex(h => h.includes('type') || h.includes('business'));

  if (nameIdx === -1) {
    throw new Error('CSV must have a "Name" or "Startup Name" column');
  }

  const startups: Startup[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

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

    // Parse maturity stage
    const maturityRaw = maturityIdx >= 0 ? values[maturityIdx]?.trim().toLowerCase() : undefined;
    let maturity: Startup['maturity'] = undefined;
    if (maturityRaw) {
      if (maturityRaw.includes('pre-seed') || maturityRaw.includes('preseed')) maturity = 'pre-seed';
      else if (maturityRaw.includes('seed')) maturity = 'seed';
      else if (maturityRaw.includes('series a') || maturityRaw.includes('series-a')) maturity = 'series-a';
      else if (maturityRaw.includes('series b') || maturityRaw.includes('series-b')) maturity = 'series-b';
      else if (maturityRaw.includes('series c') || maturityRaw.includes('series-c') || maturityRaw.includes('late')) maturity = 'series-c+';
      else if (maturityRaw.includes('growth')) maturity = 'growth';
    }

    // Parse business type
    const typeRaw = typeIdx >= 0 ? values[typeIdx]?.trim().toLowerCase() : undefined;
    let businessType: Startup['businessType'] = undefined;
    if (typeRaw) {
      if (typeRaw.includes('saas') || typeRaw.includes('software')) businessType = 'saas';
      else if (typeRaw.includes('biotech') || typeRaw.includes('health')) businessType = 'biotech';
      else if (typeRaw.includes('hardware') || typeRaw.includes('robot')) businessType = 'hardware';
      else if (typeRaw.includes('food') || typeRaw.includes('agri')) businessType = 'food';
      else if (typeRaw.includes('fintech') || typeRaw.includes('finance')) businessType = 'fintech';
      else if (typeRaw.includes('marketplace')) businessType = 'marketplace';
      else if (typeRaw.includes('deep') || typeRaw.includes('quantum')) businessType = 'deeptech';
      else businessType = 'other';
    }

    startups.push({
      name,
      website: websiteIdx >= 0 ? values[websiteIdx]?.trim() : undefined,
      tags: tagsIdx >= 0 ? values[tagsIdx]?.trim() : undefined,
      linkedin: linkedinIdx >= 0 ? values[linkedinIdx]?.trim() : undefined,
      blurb: blurbIdx >= 0 ? values[blurbIdx]?.trim() : undefined,
      location: locationIdx >= 0 ? values[locationIdx]?.trim() : undefined,
      maturity,
      amountRaised: amountIdx >= 0 ? values[amountIdx]?.trim() : undefined,
      businessType,
    });
  }

  return startups;
}

// ============= Email Outreach =============

export interface OutreachEmailData {
  to: string;
  subject: string;
  body: string;
  senderName: string;
  replyTo: string;
  startupName: string;
}

export async function sendOutreachEmail(data: OutreachEmailData): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { data: response, error } = await supabase.functions.invoke('send-outreach-email', {
      body: data,
    });

    if (error) {
      console.error('Send email error:', error);
      return { success: false, error: error.message };
    }

    if (response?.error) {
      return { success: false, error: response.error };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Send email exception:', error);
    return { success: false, error: error.message || 'Failed to send email' };
  }
}