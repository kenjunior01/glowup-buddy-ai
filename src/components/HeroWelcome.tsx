import React from 'react';
import { Sparkles, Flame, Trophy, ChevronRight } from 'lucide-react';
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
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary-dark to-accent p-6 text-primary-foreground">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -right-4 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse-soft" />
        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-white/5 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-white/10 rounded-full blur-xl animate-bounce-subtle" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Greeting */}
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 animate-wiggle" />
          <span className="text-sm font-medium opacity-90">{greeting}</span>
        </div>

        {/* User name - BIG */}
        <h1 className="text-3xl font-bold mb-2 tracking-tight">
          {firstName}! 🚀
        </h1>

        {/* Motivational message */}
        <p className="text-base opacity-90 mb-6 leading-relaxed">
          Continue assim! Você está no caminho certo para alcançar seus objetivos.
        </p>

        {/* Stats row */}
        <div className="flex items-center gap-4 mb-6">
          {/* Streak */}
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-3 scale-press">
            <div className="relative">
              <Flame className="w-6 h-6 text-orange-300 animate-pulse-soft" />
              {currentStreak >= 7 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-bounce-subtle" />
              )}
            </div>
            <div>
              <p className="text-2xl font-bold">{currentStreak}</p>
              <p className="text-xs opacity-80">dias</p>
            </div>
          </div>

          {/* Level */}
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-3 scale-press">
            <Trophy className="w-6 h-6 text-yellow-300" />
            <div>
              <p className="text-2xl font-bold">Nv.{level}</p>
              <p className="text-xs opacity-80">{points} pts</p>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <Button 
          onClick={onCheckIn}
          className="w-full bg-white text-primary hover:bg-white/90 font-semibold text-base py-6 rounded-2xl shadow-lg scale-press transition-all duration-200 group"
        >
          <span>Check-in diário</span>
          <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </div>
  );
}
