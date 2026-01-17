import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClusterBadge } from './ClusterBadge';
import type { ClusterResult } from '@/lib/types';
import { FileText, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ClusterOverviewProps {
  clusters: ClusterResult[];
  activeCluster: number | null;
  onClusterClick: (clusterId: number | null) => void;
}

export function ClusterOverview({ clusters, activeCluster, onClusterClick }: ClusterOverviewProps) {
  // Sort clusters by trend score
  const sortedClusters = [...clusters].sort((a, b) => b.trendScore - a.trendScore);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Trend Clusters
          </span>
          {activeCluster !== null && (
            <button
              onClick={() => onClusterClick(null)}
              className="text-sm font-normal text-primary hover:underline"
            >
              Clear filter
            </button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedClusters.map((cluster, idx) => (
            <div
              key={cluster.id}
              className={`p-3 rounded-lg border transition-all cursor-pointer ${
                activeCluster === cluster.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 hover:bg-accent/50'
              }`}
              onClick={() => onClusterClick(activeCluster === cluster.id ? null : cluster.id)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground">#{idx + 1}</span>
                  <ClusterBadge
                    clusterId={cluster.id}
                    name={cluster.name}
                    isActive={activeCluster === cluster.id}
                    size="lg"
                  />
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-muted-foreground">Trend:</span>
                  <span className={`font-semibold ${
                    cluster.trendScore >= 70 ? 'text-destructive' :
                    cluster.trendScore >= 50 ? 'text-primary' :
                    'text-muted-foreground'
                  }`}>
                    {cluster.trendScore}
                  </span>
                </div>
              </div>
              
              <Progress 
                value={cluster.trendScore} 
                className="h-1.5 mb-2"
              />
              
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {cluster.description}
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  {cluster.articleCount} articles
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {cluster.keywords.slice(0, 8).map((keyword, kidx) => (
                  <span
                    key={kidx}
                    className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
