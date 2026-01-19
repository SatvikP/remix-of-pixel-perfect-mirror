import { ExternalLink, User, MapPin, Briefcase, Tag, StickyNote, TrendingUp } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { StealthFounder } from '@/lib/types';

interface FoundersTableProps {
  founders: StealthFounder[];
}

export function FoundersTable({ founders }: FoundersTableProps) {
  if (founders.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No founders analyzed yet. Upload a CSV to get started.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[180px]">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Name
              </div>
            </TableHead>
            <TableHead className="w-[250px]">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Past Experience
              </div>
            </TableHead>
            <TableHead className="w-[130px]">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location
              </div>
            </TableHead>
            <TableHead className="w-[180px]">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Industry Tags
              </div>
            </TableHead>
            <TableHead className="w-[100px]">LinkedIn</TableHead>
            <TableHead>
              <div className="flex items-center gap-2">
                <StickyNote className="h-4 w-4" />
                Notes
              </div>
            </TableHead>
            {founders.some(f => f.investmentScore !== undefined) && (
              <TableHead className="w-[100px] text-right">
                <div className="flex items-center gap-2 justify-end">
                  <TrendingUp className="h-4 w-4" />
                  Score
                </div>
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {founders.map((founder, index) => (
            <TableRow key={`${founder.name}-${index}`} className="hover:bg-muted/30">
              <TableCell className="font-medium">{founder.name}</TableCell>
              <TableCell>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {founder.pastExperience || '—'}
                </p>
              </TableCell>
              <TableCell>
                {founder.currentLocation ? (
                  <span className="text-sm">{founder.currentLocation}</span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                {founder.industryTag ? (
                  <div className="flex flex-wrap gap-1">
                    {founder.industryTag.split(',').slice(0, 3).map((tag, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {tag.trim()}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                {founder.linkedinUrl ? (
                  <a
                    href={founder.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline text-sm"
                  >
                    View
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {founder.notes || '—'}
                </p>
              </TableCell>
              {founders.some(f => f.investmentScore !== undefined) && (
                <TableCell className="text-right">
                  {founder.investmentScore !== undefined ? (
                    <Badge 
                      variant={founder.investmentScore >= 70 ? 'default' : founder.investmentScore >= 40 ? 'secondary' : 'outline'}
                      className="font-mono"
                    >
                      {founder.investmentScore}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
