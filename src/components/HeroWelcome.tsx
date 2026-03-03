import { Flame, Trophy, ChevronRight, Zap, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface HeroWelcomeProps {
  userName: string;
  currentStreak: number;
  level: number;
  points: number;
  onCheckIn?: () => void;
}

export default function HeroWelcome({ 
  userName, 
  currentStreak, 
  level,
  points,
  onCheckIn 
}: HeroWelcomeProps) {
  const firstName = userName?.split(' ')[0] || 'Usuário';
  const timeOfDay = new Date().getHours();
  const greeting = timeOfDay < 12 ? 'Bom dia' : timeOfDay < 18 ? 'Boa tarde' : 'Boa noite';

  const xpForNext = level * 100;
  const currentXP = points % 100;
  const xpPercent = (currentXP / 100) * 100;

  return (
    <div className="cyber-card overflow-hidden">
      {/* Gradient mesh background */}
      <div className="absolute inset-0 gradient-mesh opacity-40 pointer-events-none" />
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">{greeting}</p>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {firstName} <span className="inline-block animate-fade-in">👋</span>
            </h1>
          </div>
          <div className="w-10 h-10 rounded-xl gradient-cyber flex items-center justify-center shadow-glow">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-secondary/50 rounded-xl p-3 text-center tap-scale">
            <Flame className="w-4 h-4 text-warning mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground xp-counter">{currentStreak}</p>
            <p className="text-[10px] text-muted-foreground">Sequência</p>
          </div>
          <div className="bg-secondary/50 rounded-xl p-3 text-center tap-scale">
            <Trophy className="w-4 h-4 text-warning mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground xp-counter">{level}</p>
            <p className="text-[10px] text-muted-foreground">Nível</p>
          </div>
          <div className="bg-secondary/50 rounded-xl p-3 text-center tap-scale">
            <Zap className="w-4 h-4 text-primary mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground xp-counter">{points}</p>
            <p className="text-[10px] text-muted-foreground">XP Total</p>
          </div>
        </div>

        {/* XP to next level */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
            <span>Nível {level + 1}</span>
            <span>{currentXP}/{100} XP</span>
          </div>
          <div className="xp-bar h-2">
            <div className="xp-bar-fill progress-fill" style={{ width: `${xpPercent}%` }} />
          </div>
        </div>

        {/* CTA */}
        <Button 
          onClick={onCheckIn}
          className="w-full gradient-primary text-primary-foreground font-medium h-11 rounded-xl shadow-glow tap-scale"
        >
          <Zap className="w-4 h-4 mr-2" />
          Check-in diário
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
