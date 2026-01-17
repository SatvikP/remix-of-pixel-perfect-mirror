import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClusterBadge } from './ClusterBadge';
import type { ClusterResult, ParentCategory, ParentCategoryInfo } from '@/lib/types';
import { PARENT_CATEGORIES } from '@/lib/types';
import { FileText, TrendingUp, ChevronRight, ChevronDown, ArrowLeft, Dna, Cloud, Cpu, Leaf, Wallet, ShoppingBag, Atom, Zap, Sparkles } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const IconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Dna, Cloud, Cpu, Leaf, Wallet, ShoppingBag, Atom, Zap, Sparkles,
};

const ColorMap: Record<string, string> = {
  emerald: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  blue: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  orange: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  green: 'bg-green-500/10 text-green-600 border-green-500/20',
  purple: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  pink: 'bg-pink-500/10 text-pink-600 border-pink-500/20',
  cyan: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
  yellow: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  gray: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
};

interface HierarchicalClustersProps {
  clusters: ClusterResult[];
  activeCluster: number | null;
  onClusterClick: (clusterId: number | null) => void;
}

export function HierarchicalClusters({ clusters, activeCluster, onClusterClick }: HierarchicalClustersProps) {
  const [selectedCategory, setSelectedCategory] = useState<ParentCategory | null>(null);

  // Group clusters by parent category
  const clustersByCategory = useMemo(() => {
    const grouped: Record<ParentCategory, ClusterResult[]> = {} as Record<ParentCategory, ClusterResult[]>;
    PARENT_CATEGORIES.forEach(cat => {
      grouped[cat.id] = [];
    });
    
    clusters.forEach(cluster => {
      const category = cluster.parentCategory || 'other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(cluster);
    });

    // Sort clusters within each category by trend score
    Object.keys(grouped).forEach(key => {
      grouped[key as ParentCategory].sort((a, b) => b.trendScore - a.trendScore);
    });

    return grouped;
  }, [clusters]);

  // Calculate aggregate stats for each category
  const categoryStats = useMemo(() => {
    return PARENT_CATEGORIES.map(cat => {
      const categoryClusters = clustersByCategory[cat.id] || [];
      const avgTrendScore = categoryClusters.length > 0
        ? Math.round(categoryClusters.reduce((sum, c) => sum + c.trendScore, 0) / categoryClusters.length)
        : 0;
      const totalArticles = categoryClusters.reduce((sum, c) => sum + c.articleCount, 0);
      
      return {
        ...cat,
        clusterCount: categoryClusters.length,
        avgTrendScore,
        totalArticles,
      };
    }).filter(cat => cat.clusterCount > 0).sort((a, b) => b.avgTrendScore - a.avgTrendScore);
  }, [clustersByCategory]);

  const handleCategoryClick = (categoryId: ParentCategory) => {
    setSelectedCategory(categoryId);
    onClusterClick(null); // Clear any active cluster filter
  };

  const handleBackClick = () => {
    setSelectedCategory(null);
    onClusterClick(null);
  };

  const selectedCategoryInfo = PARENT_CATEGORIES.find(c => c.id === selectedCategory);
  const selectedCategoryClusters = selectedCategory ? clustersByCategory[selectedCategory] : [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            {selectedCategory ? (
              <span className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleBackClick} className="h-6 px-2">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                {selectedCategoryInfo?.name}
              </span>
            ) : (
              'Trend Sectors'
            )}
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
        {!selectedCategory ? (
          // Parent categories view
          <div className="space-y-2">
            {categoryStats.map((cat) => {
              const IconComponent = IconMap[cat.icon] || Sparkles;
              return (
                <div
                  key={cat.id}
                  className="p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-all cursor-pointer"
                  onClick={() => handleCategoryClick(cat.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg border ${ColorMap[cat.color]}`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {cat.name}
                          <Badge variant="secondary" className="text-xs">
                            {cat.clusterCount} clusters
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{cat.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className={`text-sm font-semibold ${
                          cat.avgTrendScore >= 70 ? 'text-destructive' :
                          cat.avgTrendScore >= 50 ? 'text-primary' :
                          'text-muted-foreground'
                        }`}>
                          {cat.avgTrendScore}
                        </div>
                        <div className="text-xs text-muted-foreground">avg trend</div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Sub-clusters view
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground mb-4">
              {selectedCategoryClusters.length} specific trends in {selectedCategoryInfo?.name}
            </p>
            {selectedCategoryClusters.map((cluster, idx) => (
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
                  {cluster.keywords.slice(0, 6).map((keyword, kidx) => (
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
        )}
      </CardContent>
    </Card>
  );
}
