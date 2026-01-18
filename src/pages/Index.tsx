import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { FileUploader } from '@/components/FileUploader';
import { HierarchicalClusters } from '@/components/HierarchicalClusters';
import { EnhancedStartupsTable } from '@/components/EnhancedStartupsTable';
import { ProcessingStatus, ProcessingStep } from '@/components/ProcessingStatus';
import { StatsCards } from '@/components/StatsCards';

import { ScoringConfigurator } from '@/components/ScoringConfigurator';
import { ScoreAnalysis } from '@/components/ScoreAnalysis';
import { ScrapeSettings, ScraperProvider } from '@/components/ScrapeSettings';
import { clusterStartups, parseCSV, fetchArticlesFromDatabase, triggerArticleScrape, fetchUserStartups, saveUserStartups, deleteUserStartups } from '@/lib/api';
import type { Article, ScrapedArticle, ClusteringResult, Startup } from '@/lib/types';
import { DEFAULT_SCORING_CONFIG, configToWeights, type ScoringConfig } from '@/lib/scoring-config';
import siftedArticles from '@/data/sifted_articles.json';
import { Sparkles, RotateCcw, RefreshCw, Database, FileText, LogOut, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import type { User, Session } from '@supabase/supabase-js';

export default function Index() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [processingStep, setProcessingStep] = useState<ProcessingStep>('idle');
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [result, setResult] = useState<ClusteringResult | null>(null);
  const [activeCluster, setActiveCluster] = useState<number | null>(null);
  const [savedStartups, setSavedStartups] = useState<Startup[]>([]);
  const [isLoadingStartups, setIsLoadingStartups] = useState(true);
  
  // Article state
  const [dbArticles, setDbArticles] = useState<Article[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [articlesLoading, setArticlesLoading] = useState(true);
  
  // Scraper provider state
  const [scraperProvider, setScraperProvider] = useState<ScraperProvider>(() => {
    const saved = localStorage.getItem('scraper_provider');
    return (saved === 'lightpanda' ? 'lightpanda' : 'firecrawl') as ScraperProvider;
  });
  
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

  // Auth check
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setAuthLoading(false);
        if (!session) {
          navigate('/auth', { replace: true });
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setAuthLoading(false);
      if (!session) {
        navigate('/auth', { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth', { replace: true });
  };

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

  // Fetch user's saved startups on mount
  useEffect(() => {
    async function loadSavedStartups() {
      if (!user) return;
      setIsLoadingStartups(true);
      try {
        const startups = await fetchUserStartups();
        setSavedStartups(startups);
        console.log(`Loaded ${startups.length} saved startups for user`);
      } catch (err) {
        console.error('Error loading saved startups:', err);
      } finally {
        setIsLoadingStartups(false);
      }
    }
    loadSavedStartups();
  }, [user]);

  const handleRefreshArticles = async () => {
    setIsRefreshing(true);
    toast({ 
      title: 'Refreshing articles...', 
      description: `Using ${scraperProvider === 'lightpanda' ? 'Lightpanda' : 'Firecrawl'}. This may take a few minutes.` 
    });
    
    try {
      const refreshResult = await triggerArticleScrape(scraperProvider);
      
      if (refreshResult.success) {
        toast({ 
          title: 'Articles refreshed!', 
          description: `Scraped ${refreshResult.stats?.recentArticles || 0} articles, saved ${refreshResult.stats?.savedToDb || 0} to database.` 
        });
        
        // Reload articles from database
        const { articles, lastUpdated: updated } = await fetchArticlesFromDatabase();
        setDbArticles(articles);
        setLastUpdated(updated);
      } else {
        toast({ title: 'Refresh failed', description: refreshResult.error, variant: 'destructive' });
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

  // Core processing function - can be used for both CSV upload and saved startups
  const processStartups = useCallback(async (startups: Startup[], saveToDb: boolean = false) => {
    try {
      setError(undefined);
      setResult(null);

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

      // Save startups to database if this is a new upload
      if (saveToDb) {
        const saved = await saveUserStartups(startups);
        if (saved) {
          setSavedStartups(startups);
          console.log(`Saved ${startups.length} startups to database`);
        }
      }

      setResult(clusterResult);
      setProcessingStep('complete');
      toast({ title: 'Complete!', description: `Created ${clusterResult.stats.clustersCreated} clusters across sectors.` });

    } catch (err) {
      setProcessingStep('error');
      setError(err instanceof Error ? err.message : 'Error occurred');
      toast({ title: 'Failed', description: String(err), variant: 'destructive' });
    }
  }, [dbArticles, scoringConfig, toast]);

  // Auto-run clustering when saved startups are loaded
  useEffect(() => {
    async function autoProcess() {
      if (savedStartups.length === 0 || result || processingStep !== 'idle') return;
      if (articlesLoading || isLoadingStartups) return;
      
      console.log('Auto-processing saved startups...');
      await processStartups(savedStartups);
    }
    autoProcess();
  }, [savedStartups, articlesLoading, isLoadingStartups, result, processingStep, processStartups]);

  const handleProcess = async () => {
    if (!csvFile) {
      toast({ title: 'No file selected', description: 'Please upload a CSV file.', variant: 'destructive' });
      return;
    }

    const csvText = await csvFile.text();
    const startups = parseCSV(csvText);
    
    if (startups.length === 0) {
      toast({ title: 'Invalid CSV', description: 'No valid startup data found.', variant: 'destructive' });
      return;
    }

    await processStartups(startups, true); // Save to DB when uploading new CSV
  };

  const handleClearData = async () => {
    const deleted = await deleteUserStartups();
    if (deleted) {
      setSavedStartups([]);
      setCsvFile(null);
      setResult(null);
      setActiveCluster(null);
      setError(undefined);
      setProcessingStep('idle');
      toast({ title: 'Data cleared', description: 'Your startup data has been deleted. Upload a new CSV to start again.' });
    } else {
      toast({ title: 'Failed to clear data', variant: 'destructive' });
    }
  };

  const handleReset = () => {
    setCsvFile(null);
    setResult(null);
    setActiveCluster(null);
    setError(undefined);
    setProcessingStep('idle');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-2xl font-bold">FundRadar</h1>
                <p className="text-sm text-muted-foreground">AI-powered hierarchical trend analysis</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground hidden sm:block">
                {user?.email}
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
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

            {/* Scraping Provider Settings */}
            <ScrapeSettings
              provider={scraperProvider}
              onProviderChange={setScraperProvider}
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
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClearData}>
                  <Trash2 className="h-4 w-4 mr-2" />Clear Data
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4 mr-2" />Start Over
                </Button>
              </div>
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