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
    { emoji: '📈', label: 'Nível', value: stats.level || 1 },
    { emoji: '⚡', label: 'XP', value: (stats.points || 0).toLocaleString() },
    { emoji: '🏆', label: 'Rank', value: `#${stats.rank || 1}` },
    { emoji: '👥', label: 'Amigos', value: stats.friends || 0 },
  ];

  const xpForNext = (stats.level || 1) * 100;
  const currentXP = (stats.points || 0) % 100;
  const progressPercent = (currentXP / 100) * 100;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Seu Progresso</h2>
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
          {stats.achievements || 0} conquistas
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-2">
        {statItems.map(({ emoji, label, value }) => (
          <div 
            key={label}
            className="cyber-card p-3 text-center !rounded-xl !p-2.5"
          >
            <span className="text-base block mb-0.5">{emoji}</span>
            <p className="text-sm font-bold text-foreground xp-counter">{value}</p>
            <p className="text-[9px] text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* XP Bar */}
      <div className="bento-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-foreground">Próximo nível</span>
          <span className="text-[10px] text-muted-foreground">
            Nv. {(stats.level || 1) + 1}
          </span>
        </div>
        <div className="xp-bar h-2.5">
          <div
            className="xp-bar-fill progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5">
          <span>{stats.points || 0} XP</span>
          <span>{xpForNext} XP</span>
        </div>
      </div>
    </div>
  );
}
