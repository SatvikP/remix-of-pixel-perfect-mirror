import puppeteer from "puppeteer-core";
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

// EU startup news sources
const SOURCES = [
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

// Extract article URLs from page content
function extractArticleUrls(content: string, pattern: RegExp): string[] {
  const matches = content.match(pattern) || [];
  return [...new Set(matches.map(url => {
    let cleanUrl = url.replace(/[)\]\"'\s]+$/, '');
    if (!cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }
    return cleanUrl.replace(/\/$/, '');
  }))];
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

  const startTime = Date.now();
  let browser: Awaited<ReturnType<typeof puppeteer.connect>> | null = null;
  
  try {
    const lightpandaToken = Deno.env.get("LIGHTPANDA_TOKEN");
    if (!lightpandaToken) {
      throw new Error("LIGHTPANDA_TOKEN not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase credentials not configured");
    }

    console.log(`Starting Lightpanda EU startup news scrape (${SOURCES.length} sources)...`);

    // Connect to Lightpanda Cloud - EU West region for lower latency
    const browserWSEndpoint = `wss://euwest.cloud.lightpanda.io/ws?token=${lightpandaToken}`;
    console.log("Connecting to Lightpanda Cloud (EU West)...");
    
    browser = await puppeteer.connect({
      browserWSEndpoint,
    });
    
    console.log("Connected to Lightpanda successfully!");

    const allArticleUrls: Map<string, { url: string; source: string }> = new Map();
    const urlCounts: Record<string, number> = {};
    const articles: Article[] = [];

    // Phase 1: Discover article URLs from source pages
    console.log("\nPhase 1: Discovering article URLs...");
    
    for (const source of SOURCES) {
      try {
        const page = await browser.newPage();
        
        // Set a realistic user agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        console.log(`[${source.name}] Navigating to ${source.url}...`);
        
        await page.goto(source.url, { 
          waitUntil: 'domcontentloaded',
          timeout: 15000 
        });
        
        // Wait for content to load
        await page.waitForSelector('body', { timeout: 5000 }).catch(() => {});
        
        // Get all links from the page
        const links = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('a[href]'))
            .map(a => (a as HTMLAnchorElement).href)
            .filter(href => href && href.startsWith('http'));
        });
        
        // Also get page content for pattern matching
        const content = await page.content();
        
        // Extract article URLs using pattern
        const patternMatches = extractArticleUrls(content, source.articlePattern);
        const linkMatches = links.filter(link => source.articlePattern.test(link));
        
        const uniqueUrls = [...new Set([...patternMatches, ...linkMatches])];
        urlCounts[source.name] = uniqueUrls.length;
        
        console.log(`[${source.name}] Found ${uniqueUrls.length} article URLs`);
        
        for (const url of uniqueUrls) {
          if (!allArticleUrls.has(url)) {
            allArticleUrls.set(url, { url, source: source.name });
          }
        }
        
        await page.close();
        
        // Check time limit
        const elapsed = (Date.now() - startTime) / 1000;
        if (elapsed > 45) {
          console.log(`Time limit approaching (${elapsed.toFixed(1)}s), moving to article scraping`);
          break;
        }
        
      } catch (err) {
        console.error(`[${source.name}] Error:`, err);
        urlCounts[source.name] = 0;
      }
    }

    console.log(`\nTotal unique URLs discovered: ${allArticleUrls.size}`);

    // Phase 2: Scrape individual article content
    console.log("\nPhase 2: Scraping article content...");
    const urlsToScrape = Array.from(allArticleUrls.values()).slice(0, 50); // Limit for time
    
    for (let i = 0; i < urlsToScrape.length; i++) {
      const { url, source } = urlsToScrape[i];
      
      try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        await page.goto(url, { 
          waitUntil: 'domcontentloaded',
          timeout: 10000 
        });
        
        // Extract article metadata
        const articleData = await page.evaluate(() => {
          const getMetaContent = (name: string): string | null => {
            const meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
            return meta ? (meta as HTMLMetaElement).content : null;
          };
          
          const title = getMetaContent('og:title') || 
                        getMetaContent('twitter:title') || 
                        document.title;
          
          const excerpt = getMetaContent('og:description') || 
                          getMetaContent('description') || 
                          getMetaContent('twitter:description');
          
          const publishedDate = getMetaContent('article:published_time') || 
                                getMetaContent('published_time') ||
                                getMetaContent('date');
          
          const author = getMetaContent('author') || 
                         getMetaContent('article:author');
          
          const keywords = getMetaContent('keywords') || 
                           getMetaContent('article:tag');
          
          // Check for pro/premium content
          const isPro = document.body.innerHTML.includes('Sifted Pro') || 
                        document.body.innerHTML.includes('premium-content') ||
                        document.body.innerHTML.includes('subscriber-only');
          
          return {
            title: title || null,
            excerpt: excerpt || null,
            publishedDate: publishedDate || null,
            author: author || null,
            keywords: keywords || null,
            isPro
          };
        });
        
        // Skip invalid articles
        if (!articleData.title || articleData.title.length < 10 || 
            articleData.title.includes('404') || articleData.title.includes('not found')) {
          await page.close();
          continue;
        }
        
        const authors: string[] = [];
        if (articleData.author) {
          authors.push(...articleData.author.split(/[,&]/).map(a => a.trim()).filter(Boolean));
        }
        
        const tags: string[] = [];
        if (articleData.keywords) {
          tags.push(...articleData.keywords.split(",").map(t => t.trim()).filter(Boolean).slice(0, 5));
        }
        
        articles.push({
          source,
          url,
          title: articleData.title,
          published_date: articleData.publishedDate,
          authors,
          section: null,
          tags,
          is_pro: articleData.isPro,
          excerpt: articleData.excerpt,
        });
        
        await page.close();
        
        // Log progress every 10 articles
        if ((i + 1) % 10 === 0) {
          console.log(`Scraped ${i + 1}/${urlsToScrape.length} articles...`);
        }
        
        // Check time limit
        const elapsed = (Date.now() - startTime) / 1000;
        if (elapsed > 50) {
          console.log(`Time limit approaching (${elapsed.toFixed(1)}s), stopping scrape`);
          break;
        }
        
      } catch (err) {
        console.error(`Error scraping ${url}:`, err);
      }
    }

    console.log(`\nTotal articles scraped: ${articles.length}`);

    // Phase 3: Save to database
    console.log("\nPhase 3: Saving to database...");
    const dbResult = await saveArticlesToDatabase(articles, supabaseUrl, supabaseKey);
    console.log(`Saved: ${dbResult.saved}, Errors: ${dbResult.errors}`);

    // Disconnect from browser
    if (browser) {
      await browser.disconnect();
      console.log("Disconnected from Lightpanda");
    }

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
        engine: "lightpanda",
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
    
    // Make sure to disconnect on error
    if (browser) {
      try {
        await browser.disconnect();
      } catch (e) {
        console.error("Error disconnecting:", e);
      }
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        engine: "lightpanda",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
