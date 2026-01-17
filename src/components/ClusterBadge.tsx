import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const clusterColors = [
  'bg-blue-500/10 text-blue-700 border-blue-500/20 hover:bg-blue-500/20',
  'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 hover:bg-emerald-500/20',
  'bg-purple-500/10 text-purple-700 border-purple-500/20 hover:bg-purple-500/20',
  'bg-amber-500/10 text-amber-700 border-amber-500/20 hover:bg-amber-500/20',
  'bg-rose-500/10 text-rose-700 border-rose-500/20 hover:bg-rose-500/20',
  'bg-cyan-500/10 text-cyan-700 border-cyan-500/20 hover:bg-cyan-500/20',
  'bg-indigo-500/10 text-indigo-700 border-indigo-500/20 hover:bg-indigo-500/20',
  'bg-orange-500/10 text-orange-700 border-orange-500/20 hover:bg-orange-500/20',
];

interface ClusterBadgeProps {
  clusterId: number;
  name: string;
  score?: number;
  count?: number;
  onClick?: () => void;
  isActive?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ClusterBadge({
  clusterId,
  name,
  score,
  count,
  onClick,
  isActive,
  size = 'md',
}: ClusterBadgeProps) {
  const colorClass = clusterColors[(clusterId - 1) % clusterColors.length];
  
  return (
    <Badge
      variant="outline"
      className={cn(
        'transition-all cursor-pointer border',
        colorClass,
        isActive && 'ring-2 ring-offset-1 ring-primary',
        size === 'sm' && 'text-xs px-2 py-0.5',
        size === 'md' && 'text-sm px-2.5 py-1',
        size === 'lg' && 'text-base px-3 py-1.5'
      )}
      onClick={onClick}
    >
      {name}
      {score !== undefined && (
        <span className="ml-1.5 opacity-70">
          {Math.round(score * 100)}%
        </span>
      )}
      {count !== undefined && (
        <span className="ml-1.5 opacity-70">
          ({count})
        </span>
      )}
    </Badge>
  );
}
