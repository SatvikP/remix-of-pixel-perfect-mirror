import { useState } from 'react';
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
import { StartupDetailModal } from './StartupDetailModal';
import { ExternalLink, TrendingUp, Flame, MapPin, Building, Eye, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { StartupClusterMatch } from '@/lib/types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface EnhancedStartupsTableProps {
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

const maturityLabels: Record<string, string> = {
  'pre-seed': 'Pre-Seed',
  'seed': 'Seed',
  'series-a': 'Series A',
  'series-b': 'Series B',
  'series-c+': 'Series C+',
  'growth': 'Growth',
};

export function EnhancedStartupsTable({ startupMatches, activeCluster }: EnhancedStartupsTableProps) {
  const [selectedMatch, setSelectedMatch] = useState<StartupClusterMatch | null>(null);

  const filteredMatches = activeCluster !== null
    ? startupMatches.filter(match => 
        match.clusters.some(c => c.clusterId === activeCluster)
      )
    : startupMatches;

  const sortedMatches = [...filteredMatches].sort((a, b) => {
    return b.investmentScore - a.investmentScore;
  });

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Investment Rankings
            <span className="text-sm font-normal text-muted-foreground ml-2">
              ({sortedMatches.length} startups ranked by trend correlation)
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground ml-1" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Click on a startup row to view detailed one-pager with score breakdown, team info, market analysis, and more.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead className="min-w-[180px]">Startup</TableHead>
                  <TableHead className="min-w-[100px]">Score</TableHead>
                  <TableHead className="min-w-[100px]">Trend Match</TableHead>
                  <TableHead className="min-w-[120px]">Location</TableHead>
                  <TableHead className="min-w-[100px]">Stage</TableHead>
                  <TableHead className="min-w-[200px]">Matched Clusters</TableHead>
                  <TableHead className="w-16">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedMatches.map((match, idx) => {
                  const tier = getInvestmentTier(match.investmentScore);
                  return (
                    <TableRow 
                      key={idx} 
                      className={`cursor-pointer transition-colors hover:bg-accent/50 ${idx < 3 ? 'bg-primary/5' : ''}`}
                      onClick={() => setSelectedMatch(match)}
                    >
                      <TableCell className="text-center font-bold text-muted-foreground">
                        {idx + 1}
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="font-medium">{match.startup.name}</span>
                          {match.startup.blurb && (
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                              {match.startup.blurb}
                            </p>
                          )}
                        </div>
                      </TableCell>
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
                        {match.startup.location ? (
                          <span className="text-sm flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            {match.startup.location}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {match.startup.maturity ? (
                          <Badge variant="secondary" className="text-xs">
                            {maturityLabels[match.startup.maturity] || match.startup.maturity}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {match.clusters.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {match.clusters.slice(0, 2).map((cluster, cidx) => (
                              <ClusterBadge
                                key={cidx}
                                clusterId={cluster.clusterId}
                                name={cluster.clusterName}
                                score={cluster.score}
                                size="sm"
                              />
                            ))}
                            {match.clusters.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{match.clusters.length - 2}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground italic">
                            No trend match
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMatch(match);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <StartupDetailModal
        match={selectedMatch}
        open={selectedMatch !== null}
        onClose={() => setSelectedMatch(null)}
      />
    </>
  );
}
