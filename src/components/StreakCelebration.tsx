import React, { useState, useEffect } from 'react';
import { Flame, Sparkles, Star, X } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface StreakCelebrationProps {
  streak: number;
  isVisible: boolean;
  onClose: () => void;
}

export default function StreakCelebration({ streak, isVisible, onClose }: StreakCelebrationProps) {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; delay: number }[]>([]);

  useEffect(() => {
    if (isVisible) {
      // Generate random particles
      const newParticles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 0.5
      }));
      setParticles(newParticles);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const getStreakMessage = () => {
    if (streak >= 30) return { emoji: '🏆', message: 'LENDÁRIO!', subtitle: 'Você é imparável!' };
    if (streak >= 14) return { emoji: '🔥', message: 'EM CHAMAS!', subtitle: 'Duas semanas seguidas!' };
    if (streak >= 7) return { emoji: '⭐', message: 'INCRÍVEL!', subtitle: 'Uma semana completa!' };
    if (streak >= 3) return { emoji: '💪', message: 'MUITO BEM!', subtitle: 'Continue assim!' };
    return { emoji: '🎯', message: 'COMEÇOU!', subtitle: 'O primeiro passo é o mais importante!' };
  };

  const { emoji, message, subtitle } = getStreakMessage();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      {/* Close button */}
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 text-white/80 hover:text-white z-50"
      >
        <X className="w-8 h-8" />
      </button>

      {/* Particles */}
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute text-2xl animate-[confetti_1.5s_ease-out_forwards]"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animationDelay: `${particle.delay}s`
          }}
        >
          {['✨', '🔥', '⭐', '💫', '🎉'][particle.id % 5]}
        </div>
      ))}

      {/* Main content */}
      <div className="relative text-center animate-scale-in">
        {/* Glow effect */}
        <div className="absolute inset-0 -z-10">
          <div className="w-64 h-64 mx-auto bg-gradient-to-br from-orange-500/50 to-yellow-500/50 rounded-full blur-3xl animate-pulse-soft" />
        </div>

        {/* Big emoji */}
        <div className="text-[100px] mb-4 animate-bounce-subtle">
          {emoji}
        </div>

        {/* Streak counter */}
        <div className="relative inline-flex items-center gap-3 mb-4">
          <Flame className="w-12 h-12 text-orange-500 animate-wiggle" />
          <span className="text-7xl font-black text-white drop-shadow-[0_0_20px_rgba(251,146,60,0.5)]">
            {streak}
          </span>
          <Flame className="w-12 h-12 text-orange-500 animate-wiggle" style={{ animationDelay: '0.1s' }} />
        </div>

        {/* Message */}
        <h2 className="text-3xl font-bold text-white mb-2 tracking-wide">
          {message}
        </h2>
        <p className="text-lg text-white/80 mb-8">
          {subtitle}
        </p>

        {/* CTA */}
        <Button 
          onClick={onClose}
          size="lg"
          className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-semibold px-8 py-6 text-lg rounded-2xl shadow-xl scale-press"
        >
          <Sparkles className="w-5 h-5 mr-2" />
          Continuar
        </Button>

        {/* Bonus info */}
        <div className="mt-6 flex items-center justify-center gap-2 text-white/70">
          <Star className="w-4 h-4" />
          <span className="text-sm">+{streak * 10} pontos de bônus!</span>
        </div>
      </div>

      <style>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-200px) rotate(720deg) scale(0);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
