import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ScraperProvider = 'firecrawl' | 'lightpanda';

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

const SOURCES = [
  // Core EU Startup News
  { name: "sifted", url: "https://sifted.eu/latest", articlePattern: /sifted\.eu\/articles\/[a-z0-9-]+/gi },
  { name: "tech_eu", url: "https://tech.eu", articlePattern: /tech\.eu\/\d{4}\/\d{2}\/\d{2}\/[a-z0-9-]+/gi },
  { name: "eu_startups", url: "https://www.eu-startups.com", articlePattern: /eu-startups\.com\/\d{4}\/\d{2}\/[a-z0-9-]+/gi },
  { name: "silicon_canals", url: "https://siliconcanals.com", articlePattern: /siliconcanals\.com\/news\/startups\/[a-z0-9-]+/gi },
  { name: "tnw", url: "https://thenextweb.com/latest", articlePattern: /thenextweb\.com\/news\/[a-z0-9-]+/gi },
  { name: "uktn", url: "https://www.uktech.news", articlePattern: /uktech\.news\/news\/[a-z0-9-]+/gi },
  { name: "techcrunch", url: "https://techcrunch.com/region/europe", articlePattern: /techcrunch\.com\/\d{4}\/\d{2}\/\d{2}\/[a-z0-9-]+/gi },
  
  // Funding & Investment News
  { name: "finsmes", url: "https://www.finsmes.com", articlePattern: /finsmes\.com\/\d{4}\/\d{2}\/[a-z0-9-]+\.html/gi },
  { name: "venturebeat", url: "https://venturebeat.com", articlePattern: /venturebeat\.com\/\d{4}\/\d{2}\/\d{2}\/[a-z0-9-]+/gi },
  { name: "crunchbase", url: "https://news.crunchbase.com", articlePattern: /news\.crunchbase\.com\/[a-z0-9-]+\/[a-z0-9-]+/gi },
  
  // Nordic & Regional
  { name: "arctic_startup", url: "https://arcticstartup.com", articlePattern: /arcticstartup\.com\/article\/[a-z0-9-]+/gi },
  { name: "nordic9", url: "https://nordic9.com", articlePattern: /nordic9\.com\/news\/[a-z0-9-]+/gi },
  
  // DACH Region (Germany, Austria, Switzerland)
  { name: "gruenderszene", url: "https://www.businessinsider.de/gruenderszene", articlePattern: /businessinsider\.de\/gruenderszene\/[a-z0-9-]+/gi },
  { name: "deutsche_startups", url: "https://www.deutsche-startups.de", articlePattern: /deutsche-startups\.de\/\d{4}\/\d{2}\/\d{2}\/[a-z0-9-]+/gi },
  
  // France
  { name: "maddyness", url: "https://www.maddyness.com/uk", articlePattern: /maddyness\.com\/uk\/\d{4}\/\d{2}\/\d{2}\/[a-z0-9-]+/gi },
  { name: "french_web", url: "https://www.frenchweb.fr", articlePattern: /frenchweb\.fr\/[a-z0-9-]+\/\d+/gi },
  
  // Spain & Southern Europe
  { name: "novobrief", url: "https://novobrief.com", articlePattern: /novobrief\.com\/\d{4}\/\d{2}\/\d{2}\/[a-z0-9-]+/gi },
  
  // Benelux
  { name: "silicon_canals_benelux", url: "https://siliconcanals.com/news", articlePattern: /siliconcanals\.com\/news\/[a-z0-9-]+\/[a-z0-9-]+/gi },
  
  // Global VC/Startup News with EU coverage
  { name: "techfundingnews", url: "https://techfundingnews.com", articlePattern: /techfundingnews\.com\/[a-z0-9-]+/gi },
  { name: "eu_tech", url: "https://tech.eu/category/deep-tech", articlePattern: /tech\.eu\/\d{4}\/\d{2}\/\d{2}\/[a-z0-9-]+/gi },
  
  // Climate & Impact Tech
  { name: "sifted_sustainability", url: "https://sifted.eu/sector/sustainability", articlePattern: /sifted\.eu\/articles\/[a-z0-9-]+/gi },
  
  // AI & Deep Tech
  { name: "the_decoder", url: "https://the-decoder.com", articlePattern: /the-decoder\.com\/[a-z0-9-]+/gi },
];

function extractArticleUrls(markdown: string, pattern: RegExp): string[] {
  const matches = markdown.match(pattern) || [];
  return [...new Set(matches.map(url => {
    let cleanUrl = url.replace(/[)\]\"'\s]+$/, '');
    if (!cleanUrl.startsWith('https://')) cleanUrl = 'https://' + cleanUrl;
    return cleanUrl.replace(/\/$/, '');
  }))];
}

async function scrapePageForLinks(pageUrl: string, articlePattern: RegExp, apiKey: string): Promise<string[]> {
  try {
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({ url: pageUrl, formats: ["markdown", "links"], onlyMainContent: false, waitFor: 1000 }),
    });
    const data: FirecrawlScrapeResponse = await response.json();
    if (!data.success) return [];
    const urls: string[] = [];
    if (data.data?.markdown) urls.push(...extractArticleUrls(data.data.markdown, articlePattern));
    if (data.data?.links) urls.push(...data.data.links.filter(link => articlePattern.test(link)));
    return [...new Set(urls)];
  } catch (e) {
    console.error(`Error scraping ${pageUrl}:`, e);
    return [];
  }
}

async function scrapeArticlesBatch(articles: { url: string; source: string }[], apiKey: string): Promise<Article[]> {
  const results: Article[] = [];
  const promises = articles.map(async ({ url, source }) => {
    try {
      const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true }),
      });
      const data: FirecrawlScrapeResponse = await response.json();
      if (!data.success || !data.data) return null;
      const metadata = data.data.metadata || {};
      const title = metadata.title || metadata.ogTitle;
      if (!title || title.length < 10 || title.includes("404")) return null;
      const authors: string[] = metadata.author ? metadata.author.split(/[,&]/).map(a => a.trim()).filter(Boolean) : [];
      const tags: string[] = metadata.keywords ? metadata.keywords.split(",").map(t => t.trim()).filter(Boolean).slice(0, 5) : [];
      return { source, url, title, published_date: metadata.publishedTime || null, authors, section: null, tags, is_pro: source === "sifted" && Boolean(data.data.markdown?.includes("Sifted Pro")), excerpt: metadata.description || metadata.ogDescription || null };
    } catch { return null; }
  });
  const batchResults = await Promise.all(promises);
  for (const article of batchResults) { if (article) results.push(article); }
  return results;
}

async function saveArticlesToDatabase(articles: Article[], supabaseUrl: string, supabaseKey: string): Promise<{ saved: number; errors: number }> {
  const supabase = createClient(supabaseUrl, supabaseKey);
  let saved = 0, errors = 0;
  const batchSize = 50;
  for (let i = 0; i < articles.length; i += batchSize) {
    const batch = articles.slice(i, i + batchSize);
    const { error } = await supabase.from('articles').upsert(batch.map(a => ({ source: a.source, url: a.url, title: a.title, excerpt: a.excerpt, published_date: a.published_date, authors: a.authors, section: a.section, tags: a.tags, is_pro: a.is_pro })), { onConflict: 'url', ignoreDuplicates: false });
    if (error) { console.error(`Batch upsert error:`, error); errors += batch.length; } else { saved += batch.length; }
  }
  return { saved, errors };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const provider: ScraperProvider = body.provider || 'firecrawl';
    
    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!firecrawlKey) throw new Error("FIRECRAWL_API_KEY not configured");
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) throw new Error("Supabase credentials not configured");

    console.log(`Starting scrape with provider: ${provider} (${SOURCES.length} sources)...`);
    const startTime = Date.now();

    const discoveryPromises = SOURCES.map(async (source) => {
      const urls = await scrapePageForLinks(source.url, source.articlePattern, firecrawlKey);
      console.log(`[${source.name}] Found ${urls.length} URLs`);
      return { source: source.name, urls };
    });

    const discoveryResults = await Promise.all(discoveryPromises);
    const allArticleUrls: Map<string, { url: string; source: string }> = new Map();
    const urlCounts: Record<string, number> = {};
    
    for (const { source, urls } of discoveryResults) {
      urlCounts[source] = urls.length;
      for (const url of urls) { if (!allArticleUrls.has(url)) allArticleUrls.set(url, { url, source }); }
    }

    console.log(`Total unique URLs: ${allArticleUrls.size}`);
    
    const urlsToScrape = Array.from(allArticleUrls.values()).slice(0, 300); // Increased limit
    const articles: Article[] = [];
    const batchSize = 15; // Larger batches

    for (let i = 0; i < urlsToScrape.length; i += batchSize) {
      const batch = urlsToScrape.slice(i, i + batchSize);
      console.log(`Scraping batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(urlsToScrape.length/batchSize)}...`);
      const batchArticles = await scrapeArticlesBatch(batch, firecrawlKey);
      articles.push(...batchArticles);
      if (batchArticles.length > 0) await saveArticlesToDatabase(batchArticles, supabaseUrl, supabaseKey);
      if ((Date.now() - startTime) / 1000 > 55) { // Extended time limit
        console.log(`Time limit reached, scraped ${articles.length} articles`);
        break;
      }
    }

    const dbResult = await saveArticlesToDatabase(articles, supabaseUrl, supabaseKey);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    return new Response(JSON.stringify({
      success: true,
      stats: { sourcesScanned: SOURCES.length, urlsDiscovered: allArticleUrls.size, urlCounts, articlesScraped: articles.length, savedToDb: dbResult.saved, provider, durationSeconds: parseFloat(duration) },
      articles,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
  } catch (error) {
    console.error("Scrape error:", error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }
});
