import React from 'react';
import { Flame, Trophy, ChevronRight, Zap } from 'lucide-react';
import { Button } from './ui/button';

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

  return (
    <div className="bento-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{greeting}</p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {firstName}
          </h1>
        </div>
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-xl">👋</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {/* Streak */}
        <div className="bg-secondary/50 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Flame className="w-4 h-4 text-warning" />
          </div>
          <p className="text-lg font-bold text-foreground">{currentStreak}</p>
          <p className="text-xs text-muted-foreground">Sequência</p>
        </div>

        {/* Level */}
        <div className="bg-secondary/50 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Trophy className="w-4 h-4 text-warning" />
          </div>
          <p className="text-lg font-bold text-foreground">{level}</p>
          <p className="text-xs text-muted-foreground">Nível</p>
        </div>

        {/* Points */}
        <div className="bg-secondary/50 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <p className="text-lg font-bold text-foreground">{points}</p>
          <p className="text-xs text-muted-foreground">Pontos</p>
        </div>
      </div>

      {/* CTA Button */}
      <Button 
        onClick={onCheckIn}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium h-12 rounded-xl shadow-soft tap-scale transition-all duration-200"
      >
        <span>Check-in diário</span>
        <ChevronRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
}
