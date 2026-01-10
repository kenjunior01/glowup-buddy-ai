import React from 'react';
import { Sparkles, Flame, Trophy, ChevronRight, Star, Zap } from 'lucide-react';
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

  const motivationalPhrases = [
    "Você está arrasando! 🔥",
    "Continue assim! 💪",
    "Hoje é seu dia! ⭐",
    "Vamos conquistar! 🚀",
  ];
  const phrase = motivationalPhrases[Math.floor(Math.random() * motivationalPhrases.length)];

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-accent p-5 text-primary-foreground">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-2xl animate-pulse-soft" />
        <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-white/5 rounded-full blur-xl" />
        {/* Floating emojis */}
        <span className="absolute top-3 right-12 text-xl animate-float opacity-60">✨</span>
        <span className="absolute bottom-4 right-6 text-lg animate-bounce-subtle opacity-50">🌟</span>
      </div>

      <div className="relative z-10">
        {/* Greeting row */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">👋</span>
          <span className="text-sm font-medium opacity-90">{greeting}</span>
        </div>

        {/* User name */}
        <h1 className="text-2xl font-bold mb-1 tracking-tight">
          {firstName}!
        </h1>

        {/* Motivational phrase */}
        <p className="text-sm opacity-90 mb-4">
          {phrase}
        </p>

        {/* Stats row - Compact */}
        <div className="flex items-center gap-2 mb-4">
          {/* Streak */}
          <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2">
            <Flame className="w-4 h-4 text-orange-300" />
            <span className="text-lg font-bold">{currentStreak}</span>
            <span className="text-xs opacity-80">🔥</span>
          </div>

          {/* Level */}
          <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2">
            <Trophy className="w-4 h-4 text-yellow-300" />
            <span className="text-lg font-bold">Nv.{level}</span>
          </div>

          {/* Points */}
          <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2">
            <Zap className="w-4 h-4 text-cyan-300" />
            <span className="text-sm font-semibold">{points}</span>
          </div>
        </div>

        {/* CTA Button - Compact */}
        <Button 
          onClick={onCheckIn}
          className="w-full bg-white text-primary hover:bg-white/90 font-semibold text-sm py-5 rounded-xl shadow-md tap-scale transition-all duration-200"
        >
          <span>Check-in diário</span>
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
