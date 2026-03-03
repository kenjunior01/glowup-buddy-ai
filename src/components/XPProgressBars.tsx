import { cn } from '@/lib/utils';
import { Heart, Sparkles, Dumbbell, Brain } from 'lucide-react';

interface XPCategory {
  id: string;
  name: string;
  icon: typeof Heart;
  current: number;
  max: number;
  color: string;
}

interface XPProgressBarsProps {
  level: number;
  totalXP: number;
  categories?: XPCategory[];
}

const defaultCategories: XPCategory[] = [
  { id: 'saude', name: 'Saúde', icon: Heart, current: 0, max: 100, color: 'from-red-500 to-pink-500' },
  { id: 'estetica', name: 'Estética', icon: Sparkles, current: 0, max: 100, color: 'from-purple-500 to-fuchsia-500' },
  { id: 'forca', name: 'Força', icon: Dumbbell, current: 0, max: 100, color: 'from-orange-500 to-amber-500' },
  { id: 'mente', name: 'Intelecto', icon: Brain, current: 0, max: 100, color: 'from-blue-500 to-cyan-500' },
];

export default function XPProgressBars({ level, totalXP, categories }: XPProgressBarsProps) {
  const cats = categories || defaultCategories.map(c => ({
    ...c,
    current: Math.min(Math.floor(Math.random() * totalXP * 0.4), c.max),
  }));

  const xpForNextLevel = level * 100;
  const currentLevelXP = totalXP % 100;
  const overallProgress = (currentLevelXP / 100) * 100;

  return (
    <div className="bento-card space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Atributos de Personagem</h3>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-muted-foreground">Nv.</span>
          <span className="font-bold text-primary xp-counter">{level}</span>
        </div>
      </div>

      {/* Overall XP bar */}
      <div>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
          <span>XP Total</span>
          <span>{totalXP} / {xpForNextLevel}</span>
        </div>
        <div className="xp-bar h-3">
          <div
            className="xp-bar-fill progress-fill h-full"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Category bars */}
      <div className="space-y-3">
        {cats.map((cat) => {
          const Icon = cat.icon;
          const percent = cat.max > 0 ? (cat.current / cat.max) * 100 : 0;

          return (
            <div key={cat.id} className="group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-5 h-5 rounded-md bg-gradient-to-br flex items-center justify-center",
                    cat.color
                  )}>
                    <Icon className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-xs font-medium text-foreground">{cat.name}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">{cat.current}/{cat.max}</span>
              </div>
              <div className="xp-bar">
                <div
                  className={cn("h-full rounded-full progress-fill bg-gradient-to-r", cat.color)}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
