import React from 'react';
import { TrendingUp, Users, Trophy, Zap, ChevronRight } from 'lucide-react';
import { Badge } from './ui/badge';
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
    {
      icon: TrendingUp,
      label: 'Nível',
      value: stats.level || 1,
      color: 'from-blue-500 to-cyan-500',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-500',
    },
    {
      icon: Zap,
      label: 'Pontos',
      value: (stats.points || 0).toLocaleString(),
      color: 'from-purple-500 to-pink-500',
      iconBg: 'bg-purple-500/20',
      iconColor: 'text-purple-500',
    },
    {
      icon: Trophy,
      label: 'Rank',
      value: `#${stats.rank || 1}`,
      color: 'from-yellow-500 to-orange-500',
      iconBg: 'bg-yellow-500/20',
      iconColor: 'text-yellow-500',
    },
    {
      icon: Users,
      label: 'Amigos',
      value: stats.friends || 0,
      color: 'from-green-500 to-emerald-500',
      iconBg: 'bg-green-500/20',
      iconColor: 'text-green-500',
    }
  ];

  return (
    <div className="space-y-4">
      {/* Header with achievements badge */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Seu Progresso</h2>
        <Badge className="bg-gradient-to-r from-primary to-primary-dark text-primary-foreground px-3 py-1 text-sm font-semibold shadow-md">
          🏆 {stats.achievements || 0} conquistas
        </Badge>
      </div>

      {/* Stats grid - horizontal scroll on mobile */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {statItems.map(({ icon: Icon, label, value, color, iconBg, iconColor }, index) => (
          <div 
            key={label}
            className={cn(
              "flex-shrink-0 w-[140px] p-4 rounded-2xl bg-card border border-border/50 shadow-sm",
              "scale-press tap-highlight transition-all duration-300",
              "hover:shadow-md hover:border-border"
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Icon */}
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", iconBg)}>
              <Icon className={cn("w-5 h-5", iconColor)} />
            </div>
            
            {/* Value - BIG */}
            <div className={cn("text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent", color)}>
              {value}
            </div>
            
            {/* Label */}
            <div className="text-sm text-muted-foreground font-medium mt-1">
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Progress to next level */}
      <div className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <span className="font-semibold">Próximo nível</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span>Nível {(stats.level || 1) + 1}</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="relative h-3 bg-muted rounded-full overflow-hidden">
          <div 
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary-dark rounded-full progress-fill"
            style={{ width: `${Math.min(((stats.points || 0) % 100), 100)}%` }}
          />
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]" />
        </div>
        
        {/* XP counter */}
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span className="font-medium">{stats.points || 0} XP</span>
          <span>{(stats.level || 1) * 100} XP</span>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
