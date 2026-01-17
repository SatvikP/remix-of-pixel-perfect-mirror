import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { FileUploader } from '@/components/FileUploader';
import { HierarchicalClusters } from '@/components/HierarchicalClusters';
import { EnhancedStartupsTable } from '@/components/EnhancedStartupsTable';
import { ProcessingStatus, ProcessingStep } from '@/components/ProcessingStatus';
import { StatsCards } from '@/components/StatsCards';
import { clusterStartups, parseCSV } from '@/lib/api';
import type { Article, ScrapedArticle, ClusteringResult } from '@/lib/types';
import siftedArticles from '@/data/sifted_articles.json';
import { Sparkles, RotateCcw } from 'lucide-react';

export default function Index() {
  const { toast } = useToast();
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [processingStep, setProcessingStep] = useState<ProcessingStep>('idle');
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [result, setResult] = useState<ClusteringResult | null>(null);
  const [activeCluster, setActiveCluster] = useState<number | null>(null);

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

      // Convert articles to scraped format directly
      const articles = siftedArticles as Article[];
      console.log(`Using ${articles.length} articles from JSON for analysis`);
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

      const clusterResult = await clusterStartups(articlesToUse, startups, 20);
      if (!clusterResult.success) throw new Error(clusterResult.error || 'Failed to cluster');

      setResult(clusterResult);
      setProcessingStep('complete');
      toast({ title: 'Complete!', description: `Created ${clusterResult.stats.clustersCreated} clusters across sectors.` });
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
