import { Card, CardContent } from '@/components/ui/card';
import { FileText, Building2, Layers, CheckCircle2 } from 'lucide-react';

interface StatsCardsProps {
  stats: {
    totalArticles: number;
    totalStartups: number;
    clustersCreated: number;
    startupsMatched: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      label: 'Articles Analyzed',
      value: stats.totalArticles,
      icon: FileText,
      color: 'text-blue-500 bg-blue-500/10',
    },
    {
      label: 'Startups Processed',
      value: stats.totalStartups,
      icon: Building2,
      color: 'text-purple-500 bg-purple-500/10',
    },
    {
      label: 'Clusters Created',
      value: stats.clustersCreated,
      icon: Layers,
      color: 'text-amber-500 bg-amber-500/10',
    },
    {
      label: 'Startups Matched',
      value: stats.startupsMatched,
      icon: CheckCircle2,
      color: 'text-emerald-500 bg-emerald-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => (
        <Card key={idx}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${card.color}`}>
                <card.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
