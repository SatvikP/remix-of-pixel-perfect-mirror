import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Settings2, 
  TrendingUp, 
  Building2, 
  BarChart3, 
  ChevronDown, 
  RotateCcw,
  Info,
  Check,
  ChevronsUpDown,
  X
} from 'lucide-react';
import { 
  ScoringConfig, 
  ScoringMetric, 
  DEFAULT_SCORING_CONFIG,
  normalizeWeights,
  getMetricsByCategory,
  DOMAIN_OPTIONS,
  DomainOption
} from '@/lib/scoring-config';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface ScoringConfiguratorProps {
  config: ScoringConfig;
  onConfigChange: (config: ScoringConfig) => void;
  selectedDomains?: DomainOption[];
  onDomainsChange?: (domains: DomainOption[]) => void;
}

const CATEGORY_INFO = {
  market: { 
    icon: TrendingUp, 
    label: 'Market Metrics', 
    description: 'Derived from article trends and news analysis',
    color: 'text-blue-500 bg-blue-500/10'
  },
  startup: { 
    icon: Building2, 
    label: 'Startup Metrics', 
    description: 'Based on startup CSV data',
    color: 'text-purple-500 bg-purple-500/10'
  },
  trend: { 
    icon: BarChart3, 
    label: 'Trend Metrics', 
    description: 'Cluster-based trend signals',
    color: 'text-amber-500 bg-amber-500/10'
  },
};

const MARKET_SIZE_OPTIONS = [
  { value: 100, label: '$100B' },
  { value: 200, label: '$200B' },
  { value: 300, label: '$300B' },
  { value: 400, label: '$400B' },
  { value: 500, label: '$500B' },
  { value: 600, label: '$600B' },
  { value: 700, label: '$700B' },
  { value: 800, label: '$800B' },
  { value: 900, label: '$900B' },
  { value: 1000, label: '$1T' },
];

export function ScoringConfigurator({ 
  config, 
  onConfigChange,
  selectedDomains = [],
  onDomainsChange
}: ScoringConfiguratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localConfig, setLocalConfig] = useState<ScoringConfig>(config);
  const [domainsOpen, setDomainsOpen] = useState(false);
  const [marketSizeMin, setMarketSizeMin] = useState(100);
  
  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleMetricToggle = (metricId: string) => {
    const updatedMetrics = localConfig.metrics.map(m =>
      m.id === metricId ? { ...m, enabled: !m.enabled } : m
    );
    const newConfig = { ...localConfig, metrics: updatedMetrics };
    setLocalConfig(newConfig);
    onConfigChange(newConfig);
  };

  const handleWeightChange = (metricId: string, value: number[]) => {
    const updatedMetrics = localConfig.metrics.map(m =>
      m.id === metricId ? { ...m, weight: value[0] } : m
    );
    const newConfig = { ...localConfig, metrics: updatedMetrics };
    setLocalConfig(newConfig);
    onConfigChange(newConfig);
  };

  const handleReset = () => {
    setLocalConfig(DEFAULT_SCORING_CONFIG);
    onConfigChange(DEFAULT_SCORING_CONFIG);
    onDomainsChange?.([]);
    setMarketSizeMin(100);
  };

  const handleDomainToggle = (domain: DomainOption) => {
    if (!onDomainsChange) return;
    
    if (selectedDomains.includes(domain)) {
      onDomainsChange(selectedDomains.filter(d => d !== domain));
    } else {
      onDomainsChange([...selectedDomains, domain]);
    }
  };

  const handleRemoveDomain = (domain: DomainOption) => {
    if (!onDomainsChange) return;
    onDomainsChange(selectedDomains.filter(d => d !== domain));
  };

  const metricsByCategory = getMetricsByCategory(localConfig.metrics);
  const enabledCount = localConfig.metrics.filter(m => m.enabled).length;
  const normalizedMetrics = normalizeWeights(localConfig.metrics);

  const renderMetric = (metric: ScoringMetric) => {
    const normalizedMetric = normalizedMetrics.find(m => m.id === metric.id);
    const normalizedWeight = normalizedMetric?.weight || 0;
    const isMarketSize = metric.id === 'marketSize';
    
    return (
      <div key={metric.id} className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Switch
              checked={metric.enabled}
              onCheckedChange={() => handleMetricToggle(metric.id)}
            />
            <span className={`text-sm ${!metric.enabled ? 'text-muted-foreground' : ''}`}>
              {metric.name}
            </span>
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <button type="button" className="hover:bg-muted rounded p-0.5 transition-colors">
                  <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-sm p-4 space-y-2">
                <p className="font-semibold text-sm">{metric.name}</p>
                <p className="text-sm text-muted-foreground">{metric.description}</p>
                {'detailedInfo' in metric && metric.detailedInfo && (
                  <p className="text-xs leading-relaxed">{metric.detailedInfo}</p>
                )}
                {'example' in metric && metric.example && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Example: </span>
                      {metric.example}
                    </p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground pt-1">
                  Max contribution: {metric.maxPoints} points
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          {metric.enabled && !isMarketSize && (
            <Badge variant="secondary" className="text-xs">
              {normalizedWeight}%
            </Badge>
          )}
        </div>
        
        {metric.enabled && isMarketSize && (
          <div className="space-y-2 pl-8">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Minimum TAM</span>
              <Badge variant="outline" className="text-xs">
                {marketSizeMin >= 1000 ? `$${marketSizeMin / 1000}T` : `$${marketSizeMin}B`}
              </Badge>
            </div>
            <Slider
              value={[marketSizeMin]}
              onValueChange={(v) => setMarketSizeMin(v[0])}
              max={1000}
              min={100}
              step={100}
              className="flex-1"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>$100B</span>
              <span>$1T</span>
            </div>
          </div>
        )}
        
        {metric.enabled && !isMarketSize && (
          <div className="flex items-center gap-3">
            <Slider
              value={[metric.weight]}
              onValueChange={(v) => handleWeightChange(metric.id, v)}
              max={100}
              min={1}
              step={1}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-8">
              {metric.weight}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <TooltipProvider>
      <Card>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Settings2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Scoring Configuration</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {enabledCount} metrics enabled
                      {selectedDomains.length > 0 && ` • ${selectedDomains.length} domains`}
                    </p>
                  </div>
                </div>
                <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-6">
              {/* Domain Filter */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Domain Filter</p>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleReset}
                    className="h-7 text-xs"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Reset All
                  </Button>
                </div>
                <Popover open={domainsOpen} onOpenChange={setDomainsOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={domainsOpen}
                      className="w-full justify-between"
                    >
                      {selectedDomains.length === 0 
                        ? "Select domains..." 
                        : `${selectedDomains.length} domain${selectedDomains.length > 1 ? 's' : ''} selected`}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <div className="max-h-64 overflow-auto p-1">
                      {DOMAIN_OPTIONS.map((domain) => (
                        <button
                          key={domain.value}
                          onClick={() => handleDomainToggle(domain.value)}
                          className={cn(
                            "relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 px-3 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                            selectedDomains.includes(domain.value) && "bg-accent/50"
                          )}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedDomains.includes(domain.value) ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {domain.label}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                
                {/* Selected domains chips */}
                {selectedDomains.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selectedDomains.map(domain => {
                      const domainInfo = DOMAIN_OPTIONS.find(d => d.value === domain);
                      return (
                        <Badge 
                          key={domain} 
                          variant="secondary"
                          className="gap-1 pr-1"
                        >
                          {domainInfo?.label}
                          <button
                            onClick={() => handleRemoveDomain(domain)}
                            className="ml-1 rounded-full hover:bg-muted p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Metrics by Category */}
              {Object.entries(metricsByCategory).map(([category, metrics]) => {
                const catInfo = CATEGORY_INFO[category as keyof typeof CATEGORY_INFO];
                const Icon = catInfo.icon;
                
                return (
                  <div key={category} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded ${catInfo.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{catInfo.label}</p>
                        <p className="text-xs text-muted-foreground">{catInfo.description}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3 pl-8">
                      {metrics.map(metric => renderMetric(metric))}
                    </div>
                  </div>
                );
              })}

              {/* Weight Summary */}
              <div className="pt-3 border-t">
                <p className="text-xs text-muted-foreground">
                  Weights are automatically normalized to 100%. The final investment score (0-100) 
                  is calculated based on your enabled metrics and their relative weights.
                </p>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </TooltipProvider>
  );
}