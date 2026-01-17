import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ProcessingStep = 'idle' | 'scraping' | 'clustering' | 'complete' | 'error';

interface ProcessingStatusProps {
  step: ProcessingStep;
  progress?: number;
  message?: string;
  error?: string;
}

const stepConfig = {
  idle: {
    icon: null,
    label: 'Ready to process',
    color: 'text-muted-foreground',
  },
  scraping: {
    icon: Loader2,
    label: 'Scraping articles...',
    color: 'text-blue-500',
  },
  clustering: {
    icon: Loader2,
    label: 'Running K-means clustering...',
    color: 'text-purple-500',
  },
  complete: {
    icon: CheckCircle2,
    label: 'Processing complete!',
    color: 'text-emerald-500',
  },
  error: {
    icon: AlertCircle,
    label: 'Error occurred',
    color: 'text-destructive',
  },
};

export function ProcessingStatus({ step, progress, message, error }: ProcessingStatusProps) {
  const config = stepConfig[step];
  const Icon = config.icon;
  const isAnimated = step === 'scraping' || step === 'clustering';

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        {Icon && (
          <Icon
            className={cn(
              'h-5 w-5',
              config.color,
              isAnimated && 'animate-spin'
            )}
          />
        )}
        <div className="flex-1">
          <p className={cn('font-medium text-sm', config.color)}>
            {config.label}
          </p>
          {message && (
            <p className="text-xs text-muted-foreground mt-0.5">{message}</p>
          )}
          {error && (
            <p className="text-xs text-destructive mt-0.5">{error}</p>
          )}
        </div>
      </div>
      {progress !== undefined && step !== 'idle' && step !== 'complete' && step !== 'error' && (
        <Progress value={progress} className="mt-3 h-1.5" />
      )}
    </Card>
  );
}
