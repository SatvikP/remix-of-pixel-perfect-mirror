import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ClusterBadge } from './ClusterBadge';
import { EmailComposer } from './EmailComposer';
import type { StartupClusterMatch } from '@/lib/types';
import { SCORING_WEIGHTS_BY_TYPE, SCORING_WEIGHTS_BY_MATURITY } from '@/lib/types';
import { 
  ExternalLink, 
  Linkedin, 
  MapPin, 
  TrendingUp, 
  Users, 
  Target, 
  Swords, 
  DollarSign,
  Building,
  Flame,
  Info,
  Mail
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface StartupDetailModalProps {
  match: StartupClusterMatch | null;
  open: boolean;
  onClose: () => void;
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

const businessTypeLabels: Record<string, string> = {
  'saas': 'SaaS',
  'hardware': 'Hardware',
  'biotech': 'Biotech',
  'food': 'FoodTech',
  'fintech': 'Fintech',
  'marketplace': 'Marketplace',
  'deeptech': 'DeepTech',
  'other': 'Other',
};

export function StartupDetailModal({ match, open, onClose }: StartupDetailModalProps) {
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  
  if (!match) return null;

  const { startup, clusters, investmentScore, trendCorrelation, scoreBreakdown } = match;
  const tier = getInvestmentTier(investmentScore);

  // Get scoring weights based on business type and maturity
  const businessType = startup.businessType || 'other';
  const maturity = startup.maturity || 'seed';
  const typeWeights = SCORING_WEIGHTS_BY_TYPE[businessType];
  const maturityWeights = SCORING_WEIGHTS_BY_MATURITY[maturity];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="text-xl">{startup.name}</span>
            <Badge variant="outline" className={`gap-1 ${tier.className}`}>
              {tier.icon}
              {investmentScore}/100
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Info Row */}
          <div className="flex flex-wrap gap-3">
            {startup.location && (
              <Badge variant="secondary" className="gap-1">
                <MapPin className="h-3 w-3" />
                {startup.location}
              </Badge>
            )}
            {startup.maturity && (
              <Badge variant="secondary" className="gap-1">
                <Building className="h-3 w-3" />
                {maturityLabels[startup.maturity] || startup.maturity}
              </Badge>
            )}
            {startup.businessType && (
              <Badge variant="secondary">
                {businessTypeLabels[startup.businessType] || startup.businessType}
              </Badge>
            )}
            {startup.amountRaised && (
              <Badge variant="secondary" className="gap-1">
                <DollarSign className="h-3 w-3" />
                {startup.amountRaised}
              </Badge>
            )}
          </div>

          {/* Blurb */}
          {startup.blurb && (
            <div>
              <p className="text-muted-foreground">{startup.blurb}</p>
            </div>
          )}

          {/* Links */}
          <div className="flex flex-wrap gap-3">
            {startup.website && (
              <a
                href={startup.website.startsWith('http') ? startup.website : `https://${startup.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1 text-sm"
              >
                <ExternalLink className="h-4 w-4" />
                Website
              </a>
            )}
            {startup.linkedin && (
              <a
                href={startup.linkedin.startsWith('http') ? startup.linkedin : `https://${startup.linkedin}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1 text-sm"
              >
                <Linkedin className="h-4 w-4" />
                LinkedIn
              </a>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEmailComposer(true)}
              className="gap-1.5"
            >
              <Mail className="h-4 w-4" />
              Send Email
            </Button>
          </div>

          {/* Email Composer Dialog */}
          <EmailComposer
            match={match}
            open={showEmailComposer}
            onClose={() => setShowEmailComposer(false)}
          />

          <Separator />

          {/* Score Breakdown */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Score Breakdown
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Scoring weights vary by business type and maturity stage. {businessTypeLabels[businessType]} at {maturityLabels[maturity]} stage uses adjusted weights.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Trend Alignment</span>
                  <span className="text-muted-foreground">
                    {scoreBreakdown?.trendAlignment || Math.round(investmentScore * 0.4)}/{typeWeights.trendAlignment}
                  </span>
                </div>
                <Progress value={(scoreBreakdown?.trendAlignment || investmentScore * 0.4) / typeWeights.trendAlignment * 100} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Market Timing</span>
                  <span className="text-muted-foreground">
                    {scoreBreakdown?.marketTiming || Math.round(investmentScore * 0.3)}/{typeWeights.marketTiming}
                  </span>
                </div>
                <Progress value={(scoreBreakdown?.marketTiming || investmentScore * 0.3) / typeWeights.marketTiming * 100} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Sector Fit</span>
                  <span className="text-muted-foreground">
                    {scoreBreakdown?.sectorFit || Math.round(investmentScore * 0.3)}/{typeWeights.sectorFit}
                  </span>
                </div>
                <Progress value={(scoreBreakdown?.sectorFit || investmentScore * 0.3) / typeWeights.sectorFit * 100} className="h-2" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Weights: Trend {typeWeights.trendAlignment}% | Timing {typeWeights.marketTiming}% | Fit {typeWeights.sectorFit}%
            </p>
          </div>

          <Separator />

          {/* Matched Clusters */}
          {clusters.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Matched Trends</h3>
              <div className="flex flex-wrap gap-2">
                {clusters.map((cluster, idx) => (
                  <ClusterBadge
                    key={idx}
                    clusterId={cluster.clusterId}
                    name={cluster.clusterName}
                    score={cluster.score}
                    size="md"
                  />
                ))}
              </div>
            </div>
          )}

          {/* One-Pager Section */}
          {(startup.team || startup.market || startup.valueProp || startup.competition) && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-4">One-Pager</h3>
                <div className="grid gap-4">
                  {startup.team && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 text-sm font-medium mb-1">
                        <Users className="h-4 w-4 text-primary" />
                        Team
                      </div>
                      <p className="text-sm text-muted-foreground">{startup.team}</p>
                    </div>
                  )}
                  {startup.market && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 text-sm font-medium mb-1">
                        <Target className="h-4 w-4 text-primary" />
                        Market
                      </div>
                      <p className="text-sm text-muted-foreground">{startup.market}</p>
                    </div>
                  )}
                  {startup.valueProp && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 text-sm font-medium mb-1">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        Value Proposition
                      </div>
                      <p className="text-sm text-muted-foreground">{startup.valueProp}</p>
                    </div>
                  )}
                  {startup.competition && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 text-sm font-medium mb-1">
                        <Swords className="h-4 w-4 text-primary" />
                        Competition
                      </div>
                      <p className="text-sm text-muted-foreground">{startup.competition}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Tags */}
          {startup.tags && (
            <div>
              <h3 className="font-semibold mb-2 text-sm">Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {startup.tags.split(',').map((tag, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {tag.trim()}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
