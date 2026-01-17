import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Article {
  source: string;
  url: string;
  title: string | null;
  published_date: string | null;
  authors: string[];
  section: string | null;
  tags: string[];
  is_pro: boolean;
  excerpt: string | null;
}

interface FirecrawlMapResponse {
  success: boolean;
  links?: string[];
  error?: string;
}

interface FirecrawlScrapeResponse {
  success: boolean;
  data?: {
    markdown?: string;
    metadata?: {
      title?: string;
      description?: string;
      publishedTime?: string;
      author?: string;
      keywords?: string;
    };
  };
  error?: string;
}

// All 7 EU startup news sources
const SOURCES = {
  sifted: {
    name: "sifted",
    baseUrl: "https://sifted.eu",
    latestPath: "/latest",
    articlePattern: /^https:\/\/sifted\.eu\/articles\/[^\/\s]+\/?$/,
    linkExtractPattern: /https:\/\/sifted\.eu\/articles\/[^\s\)]+/g,
  },
  tech_eu: {
    name: "tech_eu",
    baseUrl: "https://tech.eu",
    latestPath: "/news",
    articlePattern: /^https:\/\/tech\.eu\/\d{4}\/\d{2}\/\d{2}\/[^\/\s]+\/?$/,
    linkExtractPattern: /https:\/\/tech\.eu\/\d{4}\/\d{2}\/\d{2}\/[^\s\)\"]+/g,
  },
  eu_startups: {
    name: "eu_startups",
    baseUrl: "https://www.eu-startups.com",
    latestPath: "/category/news",
    articlePattern: /^https:\/\/www\.eu-startups\.com\/\d{4}\/\d{2}\/[^\/\s]+\/?$/,
    linkExtractPattern: /https:\/\/www\.eu-startups\.com\/\d{4}\/\d{2}\/[^\s\)\"]+/g,
  },
  silicon_canals: {
    name: "silicon_canals",
    baseUrl: "https://siliconcanals.com",
    latestPath: "/news",
    articlePattern: /^https:\/\/siliconcanals\.com\/news\/[^\/\s]+\/?$/,
    linkExtractPattern: /https:\/\/siliconcanals\.com\/news\/[^\s\)\"]+/g,
  },
  maddyness: {
    name: "maddyness",
    baseUrl: "https://www.maddyness.com",
    latestPath: "/uk/category/startups",
    articlePattern: /^https:\/\/www\.maddyness\.com\/uk\/\d{4}\/\d{2}\/\d{2}\/[^\/\s]+\/?$/,
    linkExtractPattern: /https:\/\/www\.maddyness\.com\/uk\/\d{4}\/\d{2}\/\d{2}\/[^\s\)\"]+/g,
  },
  bpifrance_hub: {
    name: "bpifrance_hub",
    baseUrl: "https://lehub.bpifrance.fr",
    latestPath: "/actualites",
    articlePattern: /^https:\/\/lehub\.bpifrance\.fr\/[^\/\s]+\/?$/,
    linkExtractPattern: /https:\/\/lehub\.bpifrance\.fr\/[^\s\)\"]+/g,
  },
  bpifrance_big: {
    name: "bpifrance_big",
    baseUrl: "https://bigmedia.bpifrance.fr",
    latestPath: "/decryptages",
    articlePattern: /^https:\/\/bigmedia\.bpifrance\.fr\/nos-dossiers\/[^\/\s]+\/?$/,
    linkExtractPattern: /https:\/\/bigmedia\.bpifrance\.fr\/nos-dossiers\/[^\s\)\"]+/g,
  },
};

// Discover article URLs from a source using Firecrawl map
async function discoverSourceArticles(
  source: typeof SOURCES[keyof typeof SOURCES],
  apiKey: string
): Promise<string[]> {
  console.log(`Discovering articles from ${source.name}...`);
  
  const allUrls: string[] = [];
  const fullUrl = `${source.baseUrl}${source.latestPath}`;
  
  try {
    // Try Firecrawl map first
    const mapResponse = await fetch("https://api.firecrawl.dev/v1/map", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url: fullUrl,
        search: "articles",
        limit: 50,
      }),
    });

    const mapData: FirecrawlMapResponse = await mapResponse.json();
    
    if (mapData.success && mapData.links) {
      const articleUrls = mapData.links.filter(url => source.articlePattern.test(url));
      allUrls.push(...articleUrls);
      console.log(`[${source.name}] Found ${articleUrls.length} article URLs from map`);
    } else {
      console.log(`[${source.name}] Map failed, trying scrape method`);
      
      // Fallback: scrape the latest page directly
      const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          url: fullUrl,
          formats: ["markdown"],
        }),
      });

      const scrapeData: FirecrawlScrapeResponse = await scrapeResponse.json();
      
      if (scrapeData.success && scrapeData.data?.markdown) {
        const urlMatches = scrapeData.data.markdown.match(source.linkExtractPattern) || [];
        const cleanUrls = urlMatches
          .map(u => u.replace(/[)\]\"]+$/, ''))
          .filter(u => source.articlePattern.test(u));
        allUrls.push(...cleanUrls);
        console.log(`[${source.name}] Found ${cleanUrls.length} article URLs from scrape`);
      }
    }
  } catch (e) {
    console.error(`[${source.name}] Error discovering articles:`, e);
  }

  // Dedupe and limit
  const uniqueUrls = [...new Set(allUrls.map(u => u.replace(/\/$/, '')))];
  return uniqueUrls.slice(0, 30); // Limit per source
}

// Parse article content from scraped data
function parseArticle(
  url: string, 
  source: string,
  data: FirecrawlScrapeResponse["data"]
): Article {
  const metadata = data?.metadata || {};
  
  // Extract authors
  const authors: string[] = [];
  if (metadata.author) {
    authors.push(...metadata.author.split(/[,&]/).map(a => a.trim()).filter(Boolean));
  }

  // Extract tags from keywords
  const tags: string[] = [];
  if (metadata.keywords) {
    tags.push(...metadata.keywords.split(",").map(t => t.trim()).filter(Boolean));
  }

  // Check if article is Pro (Sifted-specific)
  const isPro = source === "sifted" && Boolean(
    data?.markdown?.includes("Sifted Pro") || 
    data?.markdown?.includes("Pro members")
  );

  return {
    source,
    url,
    title: metadata.title || null,
    published_date: metadata.publishedTime || null,
    authors,
    section: null,
    tags: tags.slice(0, 5),
    is_pro: isPro,
    excerpt: metadata.description || null,
  };
}

// Scrape individual articles from a source
async function scrapeArticles(
  urls: string[], 
  source: string,
  apiKey: string
): Promise<Article[]> {
  const articles: Article[] = [];
  const batchSize = 5;
  
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    console.log(`[${source}] Scraping batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(urls.length/batchSize)}`);
    
    const promises = batch.map(async (url) => {
      try {
        const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            url,
            formats: ["markdown"],
          }),
        });

        const data: FirecrawlScrapeResponse = await response.json();
        
        if (data.success && data.data) {
          return parseArticle(url, source, data.data);
        }
        return null;
      } catch (e) {
        console.log(`[${source}] Error scraping ${url}:`, e);
        return null;
      }
    });

    const results = await Promise.all(promises);
    articles.push(...results.filter((a): a is Article => a !== null));
    
    // Small delay between batches
    if (i + batchSize < urls.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  return articles;
}

// Filter articles from last 7 days
function filterRecentArticles(articles: Article[]): Article[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  
  return articles.filter(article => {
    if (!article.published_date) return true; // Keep articles without date
    
    try {
      const pubDate = new Date(article.published_date);
      return pubDate >= cutoff;
    } catch {
      return true;
    }
  });
}

// Upsert articles to database
async function saveArticlesToDatabase(
  articles: Article[],
  supabaseUrl: string,
  supabaseKey: string
): Promise<{ inserted: number; updated: number; errors: number }> {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  let inserted = 0;
  let updated = 0;
  let errors = 0;

  for (const article of articles) {
    try {
      const { error } = await supabase
        .from('articles')
        .upsert({
          source: article.source,
          url: article.url,
          title: article.title,
          excerpt: article.excerpt,
          published_date: article.published_date,
          authors: article.authors,
          section: article.section,
          tags: article.tags,
          is_pro: article.is_pro,
        }, { 
          onConflict: 'url',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error(`Error upserting article ${article.url}:`, error);
        errors++;
      } else {
        // Can't easily tell if insert or update, count as success
        inserted++;
      }
    } catch (e) {
      console.error(`Exception upserting article:`, e);
      errors++;
    }
  }

  return { inserted, updated, errors };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!firecrawlKey) {
      throw new Error("FIRECRAWL_API_KEY not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase credentials not configured");
    }

    console.log("Starting daily EU startup news scrape (7 sources)...");
    const startTime = Date.now();

    const allArticles: Article[] = [];
    const sourceStats: Record<string, { discovered: number; scraped: number }> = {};

    // Process each source
    for (const [key, source] of Object.entries(SOURCES)) {
      try {
        console.log(`\n=== Processing ${source.name} ===`);
        
        // 1. Discover articles
        const articleUrls = await discoverSourceArticles(source, firecrawlKey);
        
        if (articleUrls.length === 0) {
          console.log(`[${source.name}] No articles discovered, skipping`);
          sourceStats[key] = { discovered: 0, scraped: 0 };
          continue;
        }

        // 2. Scrape articles
        const articles = await scrapeArticles(articleUrls, source.name, firecrawlKey);
        allArticles.push(...articles);
        
        sourceStats[key] = { 
          discovered: articleUrls.length, 
          scraped: articles.length 
        };
        
        console.log(`[${source.name}] Scraped ${articles.length}/${articleUrls.length} articles`);
        
        // Delay between sources to avoid rate limiting
        await new Promise(r => setTimeout(r, 1000));
        
      } catch (e) {
        console.error(`[${source.name}] Source error:`, e);
        sourceStats[key] = { discovered: 0, scraped: 0 };
      }
    }

    console.log(`\nTotal scraped: ${allArticles.length} articles`);

    // 3. Filter to last 7 days
    const recentArticles = filterRecentArticles(allArticles);
    console.log(`${recentArticles.length} articles from last 7 days`);

    // 4. Save to database
    console.log("Saving to database...");
    const dbResult = await saveArticlesToDatabase(recentArticles, supabaseUrl, supabaseKey);
    console.log(`Database: ${dbResult.inserted} saved, ${dbResult.errors} errors`);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\nDaily scrape completed in ${duration}s`);

    return new Response(
      JSON.stringify({
        success: true,
        stats: {
          sources: sourceStats,
          totalScraped: allArticles.length,
          recentArticles: recentArticles.length,
          savedToDb: dbResult.inserted,
          dbErrors: dbResult.errors,
          durationSeconds: parseFloat(duration),
        },
        articles: recentArticles,
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Scrape error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});