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
import { ExternalLink } from 'lucide-react';
import type { StartupClusterMatch } from '@/lib/types';

interface StartupsTableProps {
  startupMatches: StartupClusterMatch[];
  activeCluster: number | null;
}

export function StartupsTable({ startupMatches, activeCluster }: StartupsTableProps) {
  const filteredMatches = activeCluster !== null
    ? startupMatches.filter(match => 
        match.clusters.some(c => c.clusterId === activeCluster)
      )
    : startupMatches;

  const sortedMatches = [...filteredMatches].sort((a, b) => {
    // Sort by whether they have clusters, then by highest score
    if (a.clusters.length === 0 && b.clusters.length > 0) return 1;
    if (a.clusters.length > 0 && b.clusters.length === 0) return -1;
    if (a.clusters.length > 0 && b.clusters.length > 0) {
      return (b.clusters[0]?.score || 0) - (a.clusters[0]?.score || 0);
    }
    return 0;
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">
          Clustered Startups
          <span className="text-sm font-normal text-muted-foreground ml-2">
            ({sortedMatches.length} startups)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[180px]">Startup</TableHead>
                <TableHead className="min-w-[200px]">Website</TableHead>
                <TableHead className="min-w-[150px]">Tags</TableHead>
                <TableHead className="min-w-[250px]">Clusters</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedMatches.map((match, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{match.startup.name}</TableCell>
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
                    {match.startup.tags ? (
                      <span className="text-sm text-muted-foreground line-clamp-2">
                        {match.startup.tags}
                      </span>
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
                        No match found
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
