import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClusterBadge } from './ClusterBadge';
import { ExternalLink, TrendingUp, Flame } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { StartupClusterMatch } from '@/lib/types';

interface StartupsTableProps {
  startupMatches: StartupClusterMatch[];
  activeCluster: number | null;
}

function getInvestmentTier(score: number): { label: string; className: string; icon?: React.ReactNode } {
  if (score >= 80) {
    return {
      label: 'Hot',
      className: 'bg-destructive/10 text-destructive border-destructive/20',
      icon: <Flame className="h-3 w-3" />,
    };
  }
  if (score >= 60) return { label: 'Strong', className: 'bg-primary/10 text-primary border-primary/20' };
  if (score >= 40) return { label: 'Moderate', className: 'bg-secondary text-secondary-foreground border-border' };
  if (score >= 20) return { label: 'Low', className: 'bg-muted text-muted-foreground border-border' };
  return { label: 'Minimal', className: 'bg-muted text-muted-foreground border-border' };
}

export function StartupsTable({ startupMatches, activeCluster }: StartupsTableProps) {
  const filteredMatches = activeCluster !== null
    ? startupMatches.filter(match => 
        match.clusters.some(c => c.clusterId === activeCluster)
      )
    : startupMatches;

  // Already sorted by investmentScore from backend, but re-sort for filtered view
  const sortedMatches = [...filteredMatches].sort((a, b) => {
    return b.investmentScore - a.investmentScore;
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Investment Rankings
          <span className="text-sm font-normal text-muted-foreground ml-2">
            ({sortedMatches.length} startups ranked by trend correlation)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">#</TableHead>
                <TableHead className="min-w-[180px]">Startup</TableHead>
                <TableHead className="min-w-[100px]">Investment Score</TableHead>
                <TableHead className="min-w-[100px]">Trend Match</TableHead>
                <TableHead className="min-w-[200px]">Website</TableHead>
                <TableHead className="min-w-[250px]">Matched Clusters</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedMatches.map((match, idx) => {
                const tier = getInvestmentTier(match.investmentScore);
                return (
                  <TableRow key={idx} className={idx < 3 ? 'bg-primary/5' : ''}>
                    <TableCell className="text-center font-bold text-muted-foreground">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="font-medium">{match.startup.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`gap-1 ${tier.className}`}>
                        {tier.icon}
                        {match.investmentScore}/100
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${match.trendCorrelation * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(match.trendCorrelation * 100)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {match.startup.website ? (
                        <a
                          href={match.startup.website.startsWith('http') ? match.startup.website : `https://${match.startup.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-1"
                        >
                          {match.startup.website.replace(/^https?:\/\//, '').slice(0, 30)}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {match.clusters.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {match.clusters.map((cluster, cidx) => (
                            <ClusterBadge
                              key={cidx}
                              clusterId={cluster.clusterId}
                              name={cluster.clusterName}
                              score={cluster.score}
                              size="sm"
                            />
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">
                          No trend match
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
