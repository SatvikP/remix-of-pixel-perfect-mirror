import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { FileUploader } from '@/components/FileUploader';
import { HierarchicalClusters } from '@/components/HierarchicalClusters';
import { EnhancedStartupsTable } from '@/components/EnhancedStartupsTable';
import { ProcessingStatus, ProcessingStep } from '@/components/ProcessingStatus';
import { StatsCards } from '@/components/StatsCards';
import { AirtableWebhook, sendToAirtable } from '@/components/AirtableWebhook';
import { ScoringConfigurator } from '@/components/ScoringConfigurator';
import { ScoreAnalysis } from '@/components/ScoreAnalysis';
import { clusterStartups, parseCSV, fetchArticlesFromDatabase, triggerArticleScrape } from '@/lib/api';
import type { Article, ScrapedArticle, ClusteringResult, Startup } from '@/lib/types';
import { DEFAULT_SCORING_CONFIG, configToWeights, type ScoringConfig } from '@/lib/scoring-config';
import siftedArticles from '@/data/sifted_articles.json';
import { Sparkles, RotateCcw, RefreshCw, Database, FileText } from 'lucide-react';
import { format } from 'date-fns';

export default function Index() {
  const { toast } = useToast();
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [processingStep, setProcessingStep] = useState<ProcessingStep>('idle');
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [result, setResult] = useState<ClusteringResult | null>(null);
  const [activeCluster, setActiveCluster] = useState<number | null>(null);
  
  // Article state
  const [dbArticles, setDbArticles] = useState<Article[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Airtable webhook state
  const [airtableWebhookUrl, setAirtableWebhookUrl] = useState<string>(() => {
    return localStorage.getItem('airtable_webhook_url') || '';
  });
  const [parsedStartups, setParsedStartups] = useState<Startup[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(true);
  
  // Scoring configuration state
  const [scoringConfig, setScoringConfig] = useState<ScoringConfig>(() => {
    const saved = localStorage.getItem('scoring_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_SCORING_CONFIG;
      }
    }
    return DEFAULT_SCORING_CONFIG;
  });
  const [selectedStartupIndex, setSelectedStartupIndex] = useState<number | null>(null);
  
  // Save scoring config to localStorage
  const handleScoringConfigChange = useCallback((config: ScoringConfig) => {
    setScoringConfig(config);
    localStorage.setItem('scoring_config', JSON.stringify(config));
  }, []);

  // Fetch articles from database on mount
  useEffect(() => {
    async function loadArticles() {
      setArticlesLoading(true);
      try {
        const { articles, lastUpdated: updated, count } = await fetchArticlesFromDatabase();
        setDbArticles(articles);
        setLastUpdated(updated);
        console.log(`Loaded ${count} articles from database`);
      } catch (err) {
        console.error('Error loading articles:', err);
      } finally {
        setArticlesLoading(false);
      }
    }
    loadArticles();
  }, []);

  const handleRefreshArticles = async () => {
    setIsRefreshing(true);
    toast({ title: 'Refreshing articles...', description: 'This may take a few minutes as we scrape 7 sources.' });
    
    try {
      const result = await triggerArticleScrape();
      
      if (result.success) {
        toast({ 
          title: 'Articles refreshed!', 
          description: `Scraped ${result.stats?.recentArticles || 0} articles, saved ${result.stats?.savedToDb || 0} to database.` 
        });
        
        // Reload articles from database
        const { articles, lastUpdated: updated } = await fetchArticlesFromDatabase();
        setDbArticles(articles);
        setLastUpdated(updated);
      } else {
        toast({ title: 'Refresh failed', description: result.error, variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Refresh failed', description: String(err), variant: 'destructive' });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleFileSelect = useCallback((file: File) => {
    setCsvFile(file);
    setResult(null);
    setActiveCluster(null);
    setError(undefined);
    setProcessingStep('idle');
  }, []);

  const handleClearFile = useCallback(() => {
    setCsvFile(null);
    setResult(null);
    setActiveCluster(null);
    setError(undefined);
    setProcessingStep('idle');
  }, []);

  const handleProcess = async () => {
    if (!csvFile) {
      toast({ title: 'No file selected', description: 'Please upload a CSV file.', variant: 'destructive' });
      return;
    }

    try {
      setError(undefined);
      setResult(null);
      const csvText = await csvFile.text();
      const startups = parseCSV(csvText);
      
      if (startups.length === 0) {
        toast({ title: 'Invalid CSV', description: 'No valid startup data found.', variant: 'destructive' });
        return;
      }

      // Store parsed startups for Airtable webhook
      setParsedStartups(startups);

      // Use database articles if available, otherwise fallback to static JSON
      let articles: Article[];
      if (dbArticles.length > 0) {
        articles = dbArticles;
        console.log(`Using ${articles.length} articles from database`);
      } else {
        articles = siftedArticles as Article[];
        console.log(`Using ${articles.length} articles from static JSON (database empty)`);
      }

      setProcessingStep('scraping');
      setProgress(25);
      setStatusMessage(`Preparing ${articles.length} articles for analysis...`);
      
      // Convert Article[] to ScrapedArticle[] format
      const articlesToUse: ScrapedArticle[] = articles.map(article => ({
        url: article.url,
        title: article.title,
        excerpt: article.excerpt,
        content: `${article.title}. ${article.excerpt}`,
        scrapedAt: new Date().toISOString(),
      }));

      setProcessingStep('clustering');
      setProgress(50);
      setStatusMessage(`Clustering ${startups.length} startups into hierarchical sectors...`);

      // Pass scoring weights to the clustering function
      const scoringWeights = configToWeights(scoringConfig);
      const clusterResult = await clusterStartups(articlesToUse, startups, 20, scoringWeights);
      if (!clusterResult.success) throw new Error(clusterResult.error || 'Failed to cluster');

      setResult(clusterResult);
      setProcessingStep('complete');
      toast({ title: 'Complete!', description: `Created ${clusterResult.stats.clustersCreated} clusters across sectors.` });

      // Send to Airtable webhook if configured
      if (airtableWebhookUrl) {
        const webhookResult = await sendToAirtable(airtableWebhookUrl, startups);
        if (webhookResult.success) {
          toast({ title: 'Sent to Airtable', description: `${startups.length} startups sent to your webhook.` });
        } else {
          console.warn('Airtable webhook failed:', webhookResult.error);
        }
      }
    } catch (err) {
      setProcessingStep('error');
      setError(err instanceof Error ? err.message : 'Error occurred');
      toast({ title: 'Failed', description: String(err), variant: 'destructive' });
    }
  };

  const handleReset = () => {
    setCsvFile(null);
    setResult(null);
    setActiveCluster(null);
    setError(undefined);
    setProcessingStep('idle');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Startup Clustering Tool</h1>
              <p className="text-sm text-muted-foreground">AI-powered hierarchical trend analysis</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-8">
        {!result && (
          <div className="max-w-xl mx-auto space-y-6">
            {/* Article Status Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      {dbArticles.length > 0 ? (
                        <Database className="h-5 w-5 text-green-600" />
                      ) : (
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {articlesLoading ? 'Loading articles...' : (
                          dbArticles.length > 0 
                            ? `${dbArticles.length} articles from 7 EU sources`
                            : `${(siftedArticles as Article[]).length} articles (static backup)`
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {lastUpdated 
                          ? `Last updated: ${format(new Date(lastUpdated), 'MMM d, yyyy h:mm a')}`
                          : 'No database articles yet'
                        }
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRefreshArticles}
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                    {isRefreshing ? 'Refreshing...' : 'Refresh'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Airtable Webhook Integration */}
            <AirtableWebhook 
              webhookUrl={airtableWebhookUrl} 
              onWebhookUrlChange={setAirtableWebhookUrl} 
            />

            {/* Scoring Configuration */}
            <ScoringConfigurator 
              config={scoringConfig} 
              onConfigChange={handleScoringConfigChange} 
            />

            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold mb-2">Upload Your Startups</h2>
              <p className="text-muted-foreground">CSV with columns: Name, Website, Tags, Location, Stage, Business Type</p>
            </div>
            <FileUploader onFileSelect={handleFileSelect} selectedFile={csvFile} onClear={handleClearFile} />
            {processingStep !== 'idle' && (
              <ProcessingStatus step={processingStep} progress={progress} message={statusMessage} error={error} />
            )}
            <Button onClick={handleProcess} disabled={!csvFile || processingStep === 'scraping' || processingStep === 'clustering'} className="w-full" size="lg">
              <Sparkles className="h-4 w-4 mr-2" />
              Analyze & Cluster
            </Button>
          </div>
        )}

        {result && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Results</h2>
              <Button variant="outline" onClick={handleReset}><RotateCcw className="h-4 w-4 mr-2" />Start Over</Button>
            </div>
            <StatsCards stats={result.stats} />
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <HierarchicalClusters clusters={result.clusters} activeCluster={activeCluster} onClusterClick={setActiveCluster} />
              </div>
              <div className="lg:col-span-2">
                <EnhancedStartupsTable startupMatches={result.startupMatches} activeCluster={activeCluster} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}