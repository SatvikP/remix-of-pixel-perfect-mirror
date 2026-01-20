import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/use-notifications';
import { clusterStartups } from '@/lib/api';
import { configToWeights, type ScoringConfig } from '@/lib/scoring-config';
import type { Article, ScrapedArticle, ClusteringResult, Startup } from '@/lib/types';
import siftedArticles from '@/data/sifted_articles.json';

export type ProcessingStep = 'idle' | 'scraping' | 'clustering' | 'complete' | 'error';

interface ProcessingContextValue {
  processingStep: ProcessingStep;
  progress: number;
  statusMessage: string;
  error: string | undefined;
  result: ClusteringResult | null;
  isProcessing: boolean;
  processStartups: (
    startups: Startup[],
    dbArticles: Article[],
    scoringConfig: ScoringConfig,
    hasAnalyzed: boolean,
    callbacks?: {
      onSaveToDb?: () => Promise<void>;
      onMarkAnalyzed?: () => Promise<void>;
    }
  ) => Promise<void>;
  resetProcessing: () => void;
  setResult: React.Dispatch<React.SetStateAction<ClusteringResult | null>>;
}

const ProcessingContext = createContext<ProcessingContextValue | null>(null);

export function ProcessingProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { requestPermission, sendNotification } = useNotifications();
  
  const [processingStep, setProcessingStep] = useState<ProcessingStep>('idle');
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [result, setResult] = useState<ClusteringResult | null>(null);

  const isProcessing = processingStep === 'scraping' || processingStep === 'clustering';

  const resetProcessing = useCallback(() => {
    setProcessingStep('idle');
    setProgress(0);
    setStatusMessage('');
    setError(undefined);
    setResult(null);
  }, []);

  const processStartups = useCallback(async (
    startups: Startup[],
    dbArticles: Article[],
    scoringConfig: ScoringConfig,
    hasAnalyzed: boolean,
    callbacks?: {
      onSaveToDb?: () => Promise<void>;
      onMarkAnalyzed?: () => Promise<void>;
    }
  ) => {
    try {
      setError(undefined);
      setResult(null);
      
      // Request notification permission when starting long-running operation
      await requestPermission();

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

      // Execute save callback if provided
      if (callbacks?.onSaveToDb) {
        await callbacks.onSaveToDb();
      }

      setResult(clusterResult);
      setProcessingStep('complete');
      
      // Mark user as having analyzed (only updates DB if not already set)
      if (!hasAnalyzed && callbacks?.onMarkAnalyzed) {
        await callbacks.onMarkAnalyzed();
      }
      
      toast({ title: 'Complete!', description: `Created ${clusterResult.stats.clustersCreated} clusters across sectors.` });
      sendNotification('Clustering Complete!', `Created ${clusterResult.stats.clustersCreated} clusters across sectors.`);

    } catch (err) {
      setProcessingStep('error');
      const errorMessage = err instanceof Error ? err.message : 'Error occurred';
      setError(errorMessage);
      toast({ title: 'Failed', description: String(err), variant: 'destructive' });
      sendNotification('Clustering Failed', errorMessage);
    }
  }, [toast, requestPermission, sendNotification]);

  return (
    <ProcessingContext.Provider
      value={{
        processingStep,
        progress,
        statusMessage,
        error,
        result,
        isProcessing,
        processStartups,
        resetProcessing,
        setResult,
      }}
    >
      {children}
    </ProcessingContext.Provider>
  );
}

export function useProcessing() {
  const context = useContext(ProcessingContext);
  if (!context) {
    throw new Error('useProcessing must be used within a ProcessingProvider');
  }
  return context;
}
