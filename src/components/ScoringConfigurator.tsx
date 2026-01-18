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
  Sparkles,
  Info
} from 'lucide-react';
import { 
  ScoringConfig, 
  ScoringMetric, 
  DEFAULT_SCORING_CONFIG,
  SCORING_PRESETS,
  normalizeWeights,
  getMetricsByCategory 
} from '@/lib/scoring-config';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ScoringConfiguratorProps {
  config: ScoringConfig;
  onConfigChange: (config: ScoringConfig) => void;
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

export function ScoringConfigurator({ config, onConfigChange }: ScoringConfiguratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localConfig, setLocalConfig] = useState<ScoringConfig>(config);
  
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

  const handlePresetChange = (presetKey: string) => {
    const preset = SCORING_PRESETS[presetKey];
    if (preset) {
      setLocalConfig(preset);
      onConfigChange(preset);
    }
  };

  const handleReset = () => {
    setLocalConfig(DEFAULT_SCORING_CONFIG);
    onConfigChange(DEFAULT_SCORING_CONFIG);
  };

  const metricsByCategory = getMetricsByCategory(localConfig.metrics);
  const enabledCount = localConfig.metrics.filter(m => m.enabled).length;
  const normalizedMetrics = normalizeWeights(localConfig.metrics);

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
                    </p>
                  </div>
                </div>
                <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-6">
              {/* Presets */}
              <div>
                <p className="text-sm font-medium mb-2">Quick Presets</p>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handlePresetChange('market-focused')}
                  >
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Market-Focused
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handlePresetChange('balanced')}
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                    Balanced
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handlePresetChange('startup-focused')}
                  >
                    <Building2 className="h-3 w-3 mr-1" />
                    Startup-Focused
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleReset}
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Reset
                  </Button>
                </div>
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
                      {metrics.map(metric => {
                        const normalizedMetric = normalizedMetrics.find(m => m.id === metric.id);
                        const normalizedWeight = normalizedMetric?.weight || 0;
                        
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
                              {metric.enabled && (
                                <Badge variant="secondary" className="text-xs">
                                  {normalizedWeight}%
                                </Badge>
                              )}
                            </div>
                            
                            {metric.enabled && (
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
                      })}
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
