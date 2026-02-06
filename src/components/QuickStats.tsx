import React from 'react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface QuickStatsProps {
  stats: {
    level: number;
    points: number;
    rank: number;
    friends: number;
    achievements: number;
    weeklyGrowth: number;
  };
}

export default function QuickStats({ stats }: QuickStatsProps) {
  const statItems = [
    { emoji: '📈', label: 'Nível', value: stats.level || 1 },
    { emoji: '⚡', label: 'Pontos', value: (stats.points || 0).toLocaleString() },
    { emoji: '🏆', label: 'Rank', value: `#${stats.rank || 1}` },
    { emoji: '👥', label: 'Amigos', value: stats.friends || 0 },
  ];

  const progressPercent = Math.min(((stats.points || 0) % 100), 100);

  return (
    <div className="space-y-4">
      {/* Header - Clean */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Seu Progresso</h2>
        <span className="text-xs text-muted-foreground">
          {stats.achievements || 0} conquistas
        </span>
      </div>

      {/* Stats Grid - Bento Style */}
      <div className="grid grid-cols-4 gap-3">
        {statItems.map(({ emoji, label, value }) => (
          <div 
            key={label}
            className="bento-card p-3 text-center"
          >
            <span className="text-lg block mb-1">{emoji}</span>
            <p className="text-base font-bold text-foreground">{value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Progress to Next Level - Clean Card */}
      <div className="bento-card p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-foreground">Próximo nível</span>
          <span className="text-xs text-muted-foreground">
            Nv. {(stats.level || 1) + 1}
          </span>
        </div>
        
        <Progress value={progressPercent} className="h-2" />
        
        <div className="flex justify-between text-[10px] text-muted-foreground mt-2">
          <span>{stats.points || 0} XP</span>
          <span>{(stats.level || 1) * 100} XP</span>
        </div>
      </div>
    </div>
  );
}
