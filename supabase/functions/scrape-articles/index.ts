import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Article {
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

interface ScrapeResult {
  url: string;
  title: string;
  excerpt: string;
  content: string;
  scrapedAt: string;
  fundingAmount?: number;
}

// Extract funding amount from text (in millions)
function extractFundingAmount(text: string): number | undefined {
  let maxAmount = 0;
  
  // Billion patterns - match number followed by bn/billion
  const billionPatterns = [
    /[\$€£](\d+(?:[.,]\d+)?)\s*(?:bn|billion)/gi,
    /(\d+(?:[.,]\d+)?)\s*(?:bn|billion)\s*(?:dollars|euros|pounds)/gi,
  ];
  
  // Million patterns - match number followed by m/mn/million
  const millionPatterns = [
    /[\$€£](\d+(?:[.,]\d+)?)\s*(?:m|mn|million)/gi,
    /(\d+(?:[.,]\d+)?)\s*(?:m|mn|million)\s*(?:dollars|euros|pounds)/gi,
    /raised\s+[\$€£]?(\d+(?:[.,]\d+)?)\s*(?:m|mn|million)/gi,
    /funding\s+(?:of\s+)?[\$€£]?(\d+(?:[.,]\d+)?)\s*(?:m|mn|million)/gi,
    /series\s+[a-z]\s+(?:of\s+)?[\$€£]?(\d+(?:[.,]\d+)?)\s*(?:m|mn|million)/gi,
  ];
  
  // Process billion patterns (convert to millions)
  for (const pattern of billionPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const amount = parseFloat(match[1].replace(',', '.')) * 1000;
      if (amount > maxAmount) maxAmount = amount;
    }
  }
  
  // Process million patterns
  for (const pattern of millionPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const amount = parseFloat(match[1].replace(',', '.'));
      if (amount > maxAmount) maxAmount = amount;
    }
  }
  
  // Also try to catch plain currency amounts like $50M or €100M
  const shortPatterns = [
    /[\$€£](\d+(?:\.\d+)?)[Mm]\b/g,
    /[\$€£](\d+(?:\.\d+)?)[Bb]\b/g,
  ];
  
  for (let i = 0; i < shortPatterns.length; i++) {
    const pattern = shortPatterns[i];
    let match;
    while ((match = pattern.exec(text)) !== null) {
      let amount = parseFloat(match[1]);
      if (i === 1) amount *= 1000; // Billion pattern
      if (amount > maxAmount) maxAmount = amount;
    }
  }
  
  return maxAmount > 0 ? maxAmount : undefined;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { articles } = await req.json() as { articles: Article[] };
    
    if (!articles || !Array.isArray(articles)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Articles array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${articles.length} articles for scraping`);
    
    const results: ScrapeResult[] = [];
    const errors: { url: string; error: string }[] = [];
    
    // Process articles in batches to avoid rate limiting
    const batchSize = 5;
    for (let i = 0; i < articles.length; i += batchSize) {
      const batch = articles.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (article) => {
        try {
          console.log(`Scraping: ${article.url}`);
          
          const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: article.url,
              formats: ['markdown'],
              onlyMainContent: true,
              waitFor: 2000,
            }),
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Failed to scrape ${article.url}: ${errorText}`);
            errors.push({ url: article.url, error: `HTTP ${response.status}` });
            return null;
          }
          
          const data = await response.json();
          const content = data.data?.markdown || data.markdown || '';
          const fullText = `${article.title} ${article.excerpt} ${content}`;
          
          const result: ScrapeResult = {
            url: article.url,
            title: article.title,
            excerpt: article.excerpt,
            content: content.slice(0, 5000), // Limit content size
            scrapedAt: new Date().toISOString(),
            fundingAmount: extractFundingAmount(fullText),
          };
          
          return result;
        } catch (error) {
          console.error(`Error scraping ${article.url}:`, error);
          errors.push({ url: article.url, error: String(error) });
          return null;
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.filter((r): r is ScrapeResult => r !== null));
      
      // Small delay between batches to avoid rate limiting
      if (i + batchSize < articles.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`Successfully scraped ${results.length} articles, ${errors.length} errors`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: results,
        errors: errors.length > 0 ? errors : undefined,
        stats: {
          total: articles.length,
          scraped: results.length,
          failed: errors.length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in scrape-articles:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
