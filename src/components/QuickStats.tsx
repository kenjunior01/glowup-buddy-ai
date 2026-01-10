import React from 'react';
import { TrendingUp, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    { emoji: '📈', label: 'Nível', value: stats.level || 1, color: 'from-blue-500 to-cyan-500' },
    { emoji: '⚡', label: 'Pontos', value: (stats.points || 0).toLocaleString(), color: 'from-purple-500 to-pink-500' },
    { emoji: '🏆', label: 'Rank', value: `#${stats.rank || 1}`, color: 'from-yellow-500 to-orange-500' },
    { emoji: '👥', label: 'Amigos', value: stats.friends || 0, color: 'from-green-500 to-emerald-500' },
  ];

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold flex items-center gap-2">
          <span>📊</span> Seu Progresso
        </h2>
        <div className="flex items-center gap-1 text-xs text-primary font-medium bg-primary/10 px-2 py-1 rounded-full">
          <span>🏅</span> {stats.achievements || 0} conquistas
        </div>
      </div>

      {/* Stats grid - Horizontal scroll */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {statItems.map(({ emoji, label, value, color }, index) => (
          <div 
            key={label}
            className={cn(
              "flex-shrink-0 w-[100px] p-3 rounded-xl bg-card border border-border/50",
              "tap-scale transition-all duration-200"
            )}
          >
            {/* Emoji */}
            <div className="text-xl mb-1">{emoji}</div>
            
            {/* Value */}
            <div className={cn("text-lg font-bold bg-gradient-to-r bg-clip-text text-transparent", color)}>
              {value}
            </div>
            
            {/* Label */}
            <div className="text-xs text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      {/* Progress bar - Compact */}
      <div className="bg-card rounded-xl p-3 border border-border/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">🎯</span>
            <span className="text-xs font-medium">Próximo nível</span>
          </div>
          <span className="text-xs text-muted-foreground">
            Nv.{(stats.level || 1) + 1} →
          </span>
        </div>
        
        {/* Progress bar */}
        <div className="relative h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent rounded-full"
            style={{ width: `${Math.min(((stats.points || 0) % 100), 100)}%` }}
          />
        </div>
        
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>{stats.points || 0} XP</span>
          <span>{(stats.level || 1) * 100} XP</span>
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
