import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ScrapeRequest {
  url: string;
  waitFor?: number;
  onlyMainContent?: boolean;
}

interface ScrapeResponse {
  success: boolean;
  data?: {
    markdown?: string;
    content?: string;
    metadata?: {
      title?: string;
      description?: string;
      publishedTime?: string;
      author?: string;
      keywords?: string;
    };
  };
  provider: "lightpanda";
  timing?: {
    durationMs: number;
  };
  error?: string;
}

// Convert HTML to simple markdown-like text
function htmlToText(html: string): string {
  return html
    // Remove script and style content
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    // Convert headers
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n\n")
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n\n")
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n\n")
    // Convert paragraphs and line breaks
    .replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    // Convert lists
    .replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n")
    // Convert links (keep text only)
    .replace(/<a[^>]*>(.*?)<\/a>/gi, "$1")
    // Remove remaining tags
    .replace(/<[^>]+>/g, "")
    // Clean up whitespace
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function scrapeWithLightpanda(
  url: string,
  token: string,
  options?: { waitFor?: number; onlyMainContent?: boolean }
): Promise<ScrapeResponse> {
  const startTime = Date.now();
  let browser;

  try {
    console.log(`Connecting to Lightpanda Cloud for: ${url}`);
    
    // Connect to Lightpanda Cloud via WebSocket
    browser = await puppeteer.connect({
      browserWSEndpoint: `wss://euwest.cloud.lightpanda.io/ws?token=${token}`,
    });

    const page = await browser.newPage();
    
    // Set a reasonable timeout
    await page.setDefaultNavigationTimeout(30000);
    
    // Navigate to the URL
    await page.goto(url, { 
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    // Wait additional time if specified
    if (options?.waitFor && options.waitFor > 0) {
      await new Promise(resolve => setTimeout(resolve, options.waitFor));
    }

    // Extract page content and metadata
    // Note: The function passed to evaluate runs in browser context
    const result = await page.evaluate(`
      (function(onlyMain) {
        const getMetaContent = (name) => {
          const meta = document.querySelector('meta[name="' + name + '"], meta[property="' + name + '"], meta[property="og:' + name + '"]');
          return meta ? meta.getAttribute("content") : undefined;
        };

        let contentElement = null;
        if (onlyMain) {
          contentElement = document.querySelector("main, article, [role='main'], .main-content, #main-content, .article-content, .post-content");
        }
        if (!contentElement) {
          contentElement = document.body;
        }

        return {
          html: contentElement.innerHTML,
          text: contentElement.innerText,
          metadata: {
            title: document.title || getMetaContent("title"),
            description: getMetaContent("description") || getMetaContent("og:description"),
            publishedTime: getMetaContent("article:published_time") || getMetaContent("datePublished"),
            author: getMetaContent("author") || getMetaContent("article:author"),
            keywords: getMetaContent("keywords"),
          },
        };
      })(${options?.onlyMainContent ?? true})
    `) as {
      html: string;
      text: string;
      metadata: {
        title?: string;
        description?: string;
        publishedTime?: string;
        author?: string;
        keywords?: string;
      };
    };

    const durationMs = Date.now() - startTime;
    console.log(`Lightpanda scrape completed in ${durationMs}ms`);

    return {
      success: true,
      data: {
        markdown: htmlToText(result.html),
        content: result.text,
        metadata: result.metadata,
      },
      provider: "lightpanda",
      timing: { durationMs },
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    console.error(`Lightpanda scrape error for ${url}:`, error);
    
    return {
      success: false,
      provider: "lightpanda",
      timing: { durationMs },
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch {
        // Ignore close errors
      }
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, waitFor, onlyMainContent } = await req.json() as ScrapeRequest;

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: "URL is required", provider: "lightpanda" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const lightpandaToken = Deno.env.get("LIGHTPANDA_TOKEN");
    if (!lightpandaToken) {
      console.error("LIGHTPANDA_TOKEN not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Lightpanda not configured", provider: "lightpanda" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format URL
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log(`Scraping with Lightpanda: ${formattedUrl}`);
    
    const result = await scrapeWithLightpanda(formattedUrl, lightpandaToken, {
      waitFor,
      onlyMainContent,
    });

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in scrape-lightpanda:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error",
        provider: "lightpanda",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

