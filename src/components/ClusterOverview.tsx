import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClusterBadge } from './ClusterBadge';
import type { ClusterResult } from '@/lib/types';
import { DollarSign, FileText, Clock } from 'lucide-react';

interface ClusterOverviewProps {
  clusters: ClusterResult[];
  activeCluster: number | null;
  onClusterClick: (clusterId: number | null) => void;
}

export function ClusterOverview({ clusters, activeCluster, onClusterClick }: ClusterOverviewProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Discovered Clusters</span>
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
          {clusters.map((cluster) => (
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
                <ClusterBadge
                  clusterId={cluster.id}
                  name={cluster.name}
                  isActive={activeCluster === cluster.id}
                  size="lg"
                />
              </div>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {cluster.description}
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  {cluster.articleCount} articles
                </span>
                {cluster.totalFunding > 0 && (
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5" />
                    ${cluster.totalFunding}M raised
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  ~{cluster.avgRecency}d ago
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {cluster.keywords.slice(0, 5).map((keyword, idx) => (
                  <span
                    key={idx}
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
