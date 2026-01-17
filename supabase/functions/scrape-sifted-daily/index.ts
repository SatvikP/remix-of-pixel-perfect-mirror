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

const SIFTED_BASE = "https://sifted.eu";

// Extract article URLs from Sifted's latest pages using Firecrawl map
async function discoverArticles(apiKey: string): Promise<string[]> {
  console.log("Discovering articles from Sifted...");
  
  const allUrls: string[] = [];
  
  // Use Firecrawl map to discover article URLs
  const mapResponse = await fetch("https://api.firecrawl.dev/v1/map", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      url: `${SIFTED_BASE}/latest`,
      search: "articles",
      limit: 100,
    }),
  });

  const mapData: FirecrawlMapResponse = await mapResponse.json();
  
  if (mapData.success && mapData.links) {
    const articleUrls = mapData.links.filter(url => 
      url.match(/^https:\/\/sifted\.eu\/articles\/[^\/\s]+\/?$/)
    );
    allUrls.push(...articleUrls);
    console.log(`Found ${articleUrls.length} article URLs from map`);
  } else {
    console.log("Map failed, trying scrape method:", mapData.error);
    
    // Fallback: scrape the latest page directly
    for (let page = 1; page <= 5; page++) {
      const pageUrl = page === 1 ? `${SIFTED_BASE}/latest` : `${SIFTED_BASE}/latest/page/${page}`;
      
      try {
        const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            url: pageUrl,
            formats: ["markdown"],
          }),
        });

        const scrapeData: FirecrawlScrapeResponse = await scrapeResponse.json();
        
        if (scrapeData.success && scrapeData.data?.markdown) {
          // Extract article URLs from markdown
          const urlMatches = scrapeData.data.markdown.match(/https:\/\/sifted\.eu\/articles\/[^\s\)]+/g) || [];
          const cleanUrls = urlMatches.map(u => u.replace(/[)\]]+$/, ''));
          allUrls.push(...cleanUrls);
        }
      } catch (e) {
        console.log(`Error scraping page ${page}:`, e);
      }
    }
  }

  // Dedupe
  const uniqueUrls = [...new Set(allUrls.map(u => u.replace(/\/$/, '')))];
  console.log(`Total unique article URLs: ${uniqueUrls.length}`);
  
  return uniqueUrls.slice(0, 80); // Limit to 80 articles
}

// Parse article content from scraped data
function parseArticle(url: string, data: FirecrawlScrapeResponse["data"]): Article {
  const metadata = data?.metadata || {};
  
  // Extract authors from markdown if available
  const authors: string[] = [];
  if (metadata.author) {
    authors.push(...metadata.author.split(/[,&]/).map(a => a.trim()).filter(Boolean));
  }

  // Extract tags from URL or metadata
  const tags: string[] = [];
  if (metadata.keywords) {
    tags.push(...metadata.keywords.split(",").map(t => t.trim()).filter(Boolean));
  }

  // Check if article is Pro (from content)
  const isPro = data?.markdown?.includes("Sifted Pro") || 
                data?.markdown?.includes("Pro members") ||
                false;

  return {
    source: "sifted",
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

// Scrape individual articles
async function scrapeArticles(urls: string[], apiKey: string): Promise<Article[]> {
  const articles: Article[] = [];
  const batchSize = 5;
  
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    console.log(`Scraping batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(urls.length/batchSize)}`);
    
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
          return parseArticle(url, data.data);
        }
        return null;
      } catch (e) {
        console.log(`Error scraping ${url}:`, e);
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

    console.log("Starting daily Sifted scrape...");
    const startTime = Date.now();

    // 1. Discover article URLs
    const articleUrls = await discoverArticles(firecrawlKey);
    
    if (articleUrls.length === 0) {
      throw new Error("No article URLs discovered");
    }

    // 2. Scrape articles
    const allArticles = await scrapeArticles(articleUrls, firecrawlKey);
    console.log(`Scraped ${allArticles.length} articles`);

    // 3. Filter to last 7 days
    const recentArticles = filterRecentArticles(allArticles);
    console.log(`${recentArticles.length} articles from last 7 days`);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`Daily scrape completed in ${duration}s`);

    return new Response(
      JSON.stringify({
        success: true,
        stats: {
          discovered: articleUrls.length,
          scraped: allArticles.length,
          recent: recentArticles.length,
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
