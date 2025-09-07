import React from 'react';
import { TrendingUp, Users, Trophy, Zap } from 'lucide-react';
import { Badge } from './ui/badge';

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
      value: stats.level,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      trend: `+${stats.weeklyGrowth}% esta semana`
    },
    {
      icon: Zap,
      label: 'Pontos',
      value: stats.points.toLocaleString(),
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      icon: Trophy,
      label: 'Ranking',
      value: `#${stats.rank}`,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      icon: Users,
      label: 'Amigos',
      value: stats.friends,
      color: 'text-info',
      bgColor: 'bg-info/10',
    }
  ];

  return (
    <div className="post-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Seu Progresso</h3>
        <Badge className="achievement-badge px-2 py-1 text-xs">
          {stats.achievements} conquistas
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {statItems.map(({ icon: Icon, label, value, color, bgColor, trend }) => (
          <div 
            key={label}
            className="bg-secondary/50 p-3 rounded-xl space-y-2 scale-press tap-highlight transition-all duration-200 hover:bg-secondary/70"
          >
            <div className="flex items-center space-x-2">
              <div className={`w-7 h-7 ${bgColor} rounded-lg flex items-center justify-center`}>
                <Icon className={`w-3.5 h-3.5 ${color}`} />
              </div>
              <span className="text-xs font-medium text-muted-foreground">{label}</span>
            </div>
            
            <div className="space-y-1">
              <div className={`text-xl font-bold ${color}`}>
                {value}
              </div>
              {trend && (
                <div className="text-xs text-success font-medium">
                  {trend}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

          <div className="pt-2 border-t border-border/50">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Próximo nível</span>
          <span className="font-medium">Nível {stats.level + 1}</span>
        </div>
        
        <div className="mt-2 w-full bg-muted rounded-full h-2">
          <div 
            className="gradient-primary h-2 rounded-full progress-fill"
            style={{ width: `${((stats.points % 100) / 100) * 100}%` }}
          />
        </div>
        
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>{stats.points} XP</span>
          <span>{(stats.level * 100)} XP</span>
        </div>
      </div>
    </div>
  );
}