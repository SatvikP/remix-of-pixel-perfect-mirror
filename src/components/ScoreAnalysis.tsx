import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Target, 
  Zap, 
  DollarSign,
  Users,
  BarChart3,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import type { StartupClusterMatch, ClusterResult } from '@/lib/types';
import type { ScoringConfig } from '@/lib/scoring-config';

interface ScoreAnalysisProps {
  match: StartupClusterMatch;
  clusters: ClusterResult[];
  config: ScoringConfig;
}

interface MetricDisplay {
  id: string;
  name: string;
  value: number;
  maxValue: number;
  icon: React.ElementType;
  color: string;
  insight: string;
}

export function ScoreAnalysis({ match, clusters, config }: ScoreAnalysisProps) {
  const { startup, scoreBreakdown, investmentScore, trendCorrelation, clusters: matchedClusters } = match;
  
  // Calculate market momentum from matched clusters
  const matchedClusterData = matchedClusters.map(mc => 
    clusters.find(c => c.id === mc.clusterId)
  ).filter(Boolean) as ClusterResult[];
  
  const avgTrendScore = matchedClusterData.length > 0
    ? Math.round(matchedClusterData.reduce((sum, c) => sum + c.trendScore, 0) / matchedClusterData.length)
    : 0;
  
  const highestTrendCluster = matchedClusterData.sort((a, b) => b.trendScore - a.trendScore)[0];
  
  // Build metric displays
  const metrics: MetricDisplay[] = [
    {
      id: 'trendAlignment',
      name: 'Trend Alignment',
      value: scoreBreakdown?.trendAlignment || 0,
      maxValue: 40,
      icon: TrendingUp,
      color: 'text-blue-500',
      insight: scoreBreakdown?.trendAlignment && scoreBreakdown.trendAlignment > 30 
        ? 'Strong alignment with current market trends'
        : scoreBreakdown?.trendAlignment && scoreBreakdown.trendAlignment > 20
        ? 'Moderate trend alignment - room for growth'
        : 'Limited trend visibility in current news cycle',
    },
    {
      id: 'marketTiming',
      name: 'Market Timing',
      value: scoreBreakdown?.marketTiming || 0,
      maxValue: 30,
      icon: Clock,
      color: 'text-amber-500',
      insight: scoreBreakdown?.marketTiming && scoreBreakdown.marketTiming > 22
        ? 'Market conditions are favorable for this sector'
        : scoreBreakdown?.marketTiming && scoreBreakdown.marketTiming > 15
        ? 'Market is developing - monitor for signals'
        : 'Early stage market - higher risk/reward',
    },
    {
      id: 'sectorFit',
      name: 'Sector Fit',
      value: scoreBreakdown?.sectorFit || 0,
      maxValue: 30,
      icon: Target,
      color: 'text-emerald-500',
      insight: scoreBreakdown?.sectorFit && scoreBreakdown.sectorFit > 22
        ? 'Excellent fit within identified sector clusters'
        : scoreBreakdown?.sectorFit && scoreBreakdown.sectorFit > 15
        ? 'Good sector positioning with some overlap'
        : 'Cross-sector play - diversified but less focused',
    },
  ];

  // Market-derived metrics
  const marketMetrics: MetricDisplay[] = [
    {
      id: 'clusterTrendScore',
      name: 'Cluster Trend Score',
      value: avgTrendScore,
      maxValue: 100,
      icon: BarChart3,
      color: 'text-purple-500',
      insight: avgTrendScore > 70
        ? 'Matched to high-momentum clusters'
        : avgTrendScore > 50
        ? 'Moderate cluster momentum'
        : 'Clusters show lower activity levels',
    },
    {
      id: 'trendCorrelation',
      name: 'Trend Correlation',
      value: Math.round(trendCorrelation * 100),
      maxValue: 100,
      icon: Zap,
      color: 'text-cyan-500',
      insight: trendCorrelation > 0.7
        ? 'Strong correlation with trending topics'
        : trendCorrelation > 0.4
        ? 'Partial trend alignment detected'
        : 'Limited correlation with current trends',
    },
  ];

  const getScoreTier = (score: number) => {
    if (score >= 80) return { label: 'Hot', className: 'bg-red-500 text-white', icon: TrendingUp };
    if (score >= 65) return { label: 'Strong', className: 'bg-orange-500 text-white', icon: CheckCircle2 };
    if (score >= 50) return { label: 'Moderate', className: 'bg-yellow-500 text-black', icon: AlertCircle };
    if (score >= 35) return { label: 'Low', className: 'bg-blue-500 text-white', icon: TrendingDown };
    return { label: 'Minimal', className: 'bg-muted text-muted-foreground', icon: AlertCircle };
  };

  const tier = getScoreTier(investmentScore);
  const TierIcon = tier.icon;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Score Analysis</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">{investmentScore}</span>
            <Badge className={tier.className}>
              <TierIcon className="h-3 w-3 mr-1" />
              {tier.label}
            </Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {startup.name} • {matchedClusters.length} cluster{matchedClusters.length !== 1 ? 's' : ''} matched
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Core Metrics */}
        <div>
          <p className="text-sm font-medium mb-3 flex items-center gap-2">
            <Target className="h-4 w-4" />
            Core Investment Metrics
          </p>
          <div className="space-y-4">
            {metrics.map(metric => {
              const Icon = metric.icon;
              const percentage = (metric.value / metric.maxValue) * 100;
              
              return (
                <div key={metric.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${metric.color}`} />
                      <span className="text-sm font-medium">{metric.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {metric.value}/{metric.maxValue}
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                  <p className="text-xs text-muted-foreground">{metric.insight}</p>
                </div>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Market Metrics */}
        <div>
          <p className="text-sm font-medium mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Market-Derived Metrics
          </p>
          <div className="space-y-4">
            {marketMetrics.map(metric => {
              const Icon = metric.icon;
              const percentage = metric.value;
              
              return (
                <div key={metric.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${metric.color}`} />
                      <span className="text-sm font-medium">{metric.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {metric.value}%
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                  <p className="text-xs text-muted-foreground">{metric.insight}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Highest Trend Cluster */}
        {highestTrendCluster && (
          <>
            <Separator />
            <div>
              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                Hottest Matched Trend
              </p>
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{highestTrendCluster.name}</span>
                  <Badge variant="secondary">{highestTrendCluster.trendScore}/100</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{highestTrendCluster.description}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {highestTrendCluster.keywords.slice(0, 4).map(kw => (
                    <Badge key={kw} variant="outline" className="text-xs">{kw}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Startup Info Summary */}
        {(startup.location || startup.maturity || startup.businessType) && (
          <>
            <Separator />
            <div className="grid grid-cols-3 gap-3 text-center">
              {startup.location && (
                <div>
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="text-sm font-medium">{startup.location}</p>
                </div>
              )}
              {startup.maturity && (
                <div>
                  <p className="text-xs text-muted-foreground">Stage</p>
                  <p className="text-sm font-medium capitalize">{startup.maturity.replace('-', ' ')}</p>
                </div>
              )}
              {startup.businessType && (
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="text-sm font-medium capitalize">{startup.businessType}</p>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
