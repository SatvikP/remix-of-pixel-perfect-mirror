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

interface FirecrawlScrapeResponse {
  success: boolean;
  data?: {
    markdown?: string;
    links?: string[];
    metadata?: {
      title?: string;
      description?: string;
      publishedTime?: string;
      author?: string;
      keywords?: string;
      ogTitle?: string;
      ogDescription?: string;
    };
  };
  error?: string;
}

// High-yield EU startup news sources - optimized for speed
const SOURCES = [
  // Core EU sources - scrape main pages with lots of articles
  { name: "sifted", url: "https://sifted.eu/latest", articlePattern: /sifted\.eu\/articles\/[a-z0-9-]+/gi },
  { name: "tech_eu", url: "https://tech.eu", articlePattern: /tech\.eu\/\d{4}\/\d{2}\/\d{2}\/[a-z0-9-]+/gi },
  { name: "eu_startups", url: "https://www.eu-startups.com", articlePattern: /eu-startups\.com\/\d{4}\/\d{2}\/[a-z0-9-]+/gi },
  { name: "silicon_canals", url: "https://siliconcanals.com", articlePattern: /siliconcanals\.com\/news\/startups\/[a-z0-9-]+/gi },
  { name: "tnw", url: "https://thenextweb.com/latest", articlePattern: /thenextweb\.com\/news\/[a-z0-9-]+/gi },
  { name: "uktn", url: "https://www.uktech.news", articlePattern: /uktech\.news\/news\/[a-z0-9-]+/gi },
  { name: "techcrunch", url: "https://techcrunch.com/region/europe", articlePattern: /techcrunch\.com\/\d{4}\/\d{2}\/\d{2}\/[a-z0-9-]+/gi },
  { name: "arctic_startup", url: "https://arcticstartup.com", articlePattern: /arcticstartup\.com\/article\/[a-z0-9-]+/gi },
  { name: "finsmes", url: "https://www.finsmes.com", articlePattern: /finsmes\.com\/\d{4}\/\d{2}\/[a-z0-9-]+\.html/gi },
  { name: "venturebeat", url: "https://venturebeat.com", articlePattern: /venturebeat\.com\/\d{4}\/\d{2}\/\d{2}\/[a-z0-9-]+/gi },
];

// Extract article URLs from markdown content
function extractArticleUrls(markdown: string, pattern: RegExp): string[] {
  const matches = markdown.match(pattern) || [];
  return [...new Set(matches.map(url => {
    let cleanUrl = url.replace(/[)\]\"'\s]+$/, '');
    if (!cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }
    return cleanUrl.replace(/\/$/, '');
  }))];
}

// Scrape a page and extract article links - fast mode
async function scrapePageForLinks(
  pageUrl: string,
  articlePattern: RegExp,
  apiKey: string
): Promise<string[]> {
  try {
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url: pageUrl,
        formats: ["markdown", "links"],
        onlyMainContent: false,
        waitFor: 1000,
      }),
    });

    const data: FirecrawlScrapeResponse = await response.json();
    
    if (!data.success) {
      console.log(`Failed to scrape ${pageUrl}: ${data.error}`);
      return [];
    }

    const urls: string[] = [];
    
    if (data.data?.markdown) {
      urls.push(...extractArticleUrls(data.data.markdown, articlePattern));
    }
    
    if (data.data?.links) {
      const filteredLinks = data.data.links.filter(link => articlePattern.test(link));
      urls.push(...filteredLinks);
    }

    return [...new Set(urls)];
  } catch (e) {
    console.error(`Error scraping ${pageUrl}:`, e);
    return [];
  }
}

// Batch scrape articles with metadata extraction from URLs only (faster)
async function scrapeArticlesBatch(
  articles: { url: string; source: string }[],
  apiKey: string
): Promise<Article[]> {
  const results: Article[] = [];
  
  const promises = articles.map(async ({ url, source }) => {
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
          onlyMainContent: true,
        }),
      });

      const data: FirecrawlScrapeResponse = await response.json();
      
      if (!data.success || !data.data) return null;

      const metadata = data.data.metadata || {};
      const title = metadata.title || metadata.ogTitle;
      
      // Skip invalid
      if (!title || title.length < 10 || title.includes("404") || title.includes("not found")) {
        return null;
      }

      const authors: string[] = [];
      if (metadata.author) {
        authors.push(...metadata.author.split(/[,&]/).map(a => a.trim()).filter(Boolean));
      }

      const tags: string[] = [];
      if (metadata.keywords) {
        tags.push(...metadata.keywords.split(",").map(t => t.trim()).filter(Boolean).slice(0, 5));
      }

      return {
        source,
        url,
        title,
        published_date: metadata.publishedTime || null,
        authors,
        section: null,
        tags,
        is_pro: source === "sifted" && Boolean(data.data.markdown?.includes("Sifted Pro")),
        excerpt: metadata.description || metadata.ogDescription || null,
      };
    } catch {
      return null;
    }
  });

  const batchResults = await Promise.all(promises);
  for (const article of batchResults) {
    if (article) results.push(article);
  }
  
  return results;
}

// Save articles to database
async function saveArticlesToDatabase(
  articles: Article[],
  supabaseUrl: string,
  supabaseKey: string
): Promise<{ saved: number; errors: number }> {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  let saved = 0;
  let errors = 0;

  const batchSize = 50;
  for (let i = 0; i < articles.length; i += batchSize) {
    const batch = articles.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('articles')
      .upsert(
        batch.map(a => ({
          source: a.source,
          url: a.url,
          title: a.title,
          excerpt: a.excerpt,
          published_date: a.published_date,
          authors: a.authors,
          section: a.section,
          tags: a.tags,
          is_pro: a.is_pro,
        })),
        { onConflict: 'url', ignoreDuplicates: false }
      );

    if (error) {
      console.error(`Batch upsert error:`, error);
      errors += batch.length;
    } else {
      saved += batch.length;
    }
  }

  return { saved, errors };
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

    console.log(`Starting EU startup news scrape (${SOURCES.length} sources)...`);
    const startTime = Date.now();

    // Phase 1: Discover article URLs in parallel (faster)
    console.log("Phase 1: Discovering article URLs in parallel...");
    
    const discoveryPromises = SOURCES.map(async (source) => {
      const urls = await scrapePageForLinks(source.url, source.articlePattern, firecrawlKey);
      console.log(`[${source.name}] Found ${urls.length} URLs`);
      return { source: source.name, urls };
    });

    const discoveryResults = await Promise.all(discoveryPromises);
    
    // Collect all unique URLs
    const allArticleUrls: Map<string, { url: string; source: string }> = new Map();
    const urlCounts: Record<string, number> = {};
    
    for (const { source, urls } of discoveryResults) {
      urlCounts[source] = urls.length;
      for (const url of urls) {
        if (!allArticleUrls.has(url)) {
          allArticleUrls.set(url, { url, source });
        }
      }
    }

    console.log(`Total unique URLs discovered: ${allArticleUrls.size}`);
    const discoveryTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`Discovery took ${discoveryTime}s`);

    // Phase 2: Scrape articles in smaller batches with immediate saves
    console.log("\nPhase 2: Scraping article content...");
    const urlsToScrape = Array.from(allArticleUrls.values()).slice(0, 100); // Reduced limit
    const articles: Article[] = [];
    const batchSize = 10; // Smaller batch

    for (let i = 0; i < urlsToScrape.length; i += batchSize) {
      const batch = urlsToScrape.slice(i, i + batchSize);
      console.log(`Batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(urlsToScrape.length/batchSize)}`);
      
      const batchArticles = await scrapeArticlesBatch(batch, firecrawlKey);
      articles.push(...batchArticles);
      
      // Save immediately after each batch
      if (batchArticles.length > 0) {
        await saveArticlesToDatabase(batchArticles, supabaseUrl, supabaseKey);
      }
      
      // Check time limit (40s to be safe)
      const elapsed = (Date.now() - startTime) / 1000;
      if (elapsed > 50) {
        console.log(`Time limit approaching (${elapsed.toFixed(1)}s), stopping scrape`);
        break;
      }
    }

    console.log(`Total articles scraped: ${articles.length}`);

    // Phase 3: Save to database
    console.log("\nPhase 3: Saving to database...");
    const dbResult = await saveArticlesToDatabase(articles, supabaseUrl, supabaseKey);
    console.log(`Saved: ${dbResult.saved}, Errors: ${dbResult.errors}`);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\nScrape completed in ${duration}s`);

    // Count by source
    const articlesBySource: Record<string, number> = {};
    for (const article of articles) {
      articlesBySource[article.source] = (articlesBySource[article.source] || 0) + 1;
    }

    return new Response(
      JSON.stringify({
        success: true,
        stats: {
          sourcesScanned: SOURCES.length,
          urlsDiscovered: allArticleUrls.size,
          urlCounts,
          articlesScraped: articles.length,
          savedToDb: dbResult.saved,
          dbErrors: dbResult.errors,
          durationSeconds: parseFloat(duration),
          articlesBySource,
        },
        articles,
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
