import React from 'react';
import { Flame, Calendar, Target, Trophy } from 'lucide-react';
import { Button } from './ui/button';

interface StreakCounterProps {
  currentStreak: number;
  longestStreak: number;
  todayCompleted: boolean;
  onCheckIn?: () => void;
}

export default function StreakCounter({ 
  currentStreak, 
  longestStreak, 
  todayCompleted, 
  onCheckIn 
}: StreakCounterProps) {
  return (
    <div className="post-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 gradient-primary rounded-full flex items-center justify-center">
            <Flame className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-semibold">Sua Sequência</h3>
        </div>
        
        {!todayCompleted && (
          <Button 
            size="sm" 
            onClick={onCheckIn}
            className="social-button text-xs px-3 py-1 h-8"
          >
            Check-in Diário
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-gradient mb-1">
            {currentStreak}
          </div>
          <div className="flex items-center justify-center space-x-1 text-xs text-muted-foreground">
            <Flame className="w-3 h-3" />
            <span>Sequência Atual</span>
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-warning mb-1">
            {longestStreak}
          </div>
          <div className="flex items-center justify-center space-x-1 text-xs text-muted-foreground">
            <Trophy className="w-3 h-3" />
            <span>Melhor Sequência</span>
          </div>
        </div>
      </div>

      {todayCompleted && (
        <div className="gradient-success p-3 rounded-xl text-center animate-bounce-subtle">
          <div className="text-white">
            <Calendar className="w-5 h-5 mx-auto mb-1" />
            <p className="font-semibold text-sm">Check-in Completo!</p>
            <p className="text-xs opacity-90">Volte amanhã para continuar</p>
          </div>
        </div>
      )}

      {!todayCompleted && currentStreak > 0 && (
        <div className="bg-warning/10 border border-warning/20 p-3 rounded-xl text-center">
          <div className="text-warning">
            <Target className="w-5 h-5 mx-auto mb-1" />
            <p className="font-semibold text-sm">Não perca sua sequência!</p>
            <p className="text-xs">Faça seu check-in hoje</p>
          </div>
        </div>
      )}
    </div>
  );
}