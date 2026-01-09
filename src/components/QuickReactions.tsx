import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface QuickReactionsProps {
  onReact?: (emoji: string) => void;
  className?: string;
}

const QUICK_EMOJIS = [
  { emoji: '🔥', label: 'Fogo', animation: 'animate-bounce-subtle' },
  { emoji: '💪', label: 'Força', animation: 'animate-wiggle' },
  { emoji: '🎉', label: 'Celebrar', animation: 'animate-bounce-subtle' },
  { emoji: '❤️', label: 'Amor', animation: 'animate-pulse-soft' },
  { emoji: '⭐', label: 'Estrela', animation: 'animate-wiggle' },
];

export default function QuickReactions({ onReact, className }: QuickReactionsProps) {
  const [activeEmoji, setActiveEmoji] = useState<string | null>(null);
  const [flyingEmojis, setFlyingEmojis] = useState<{ id: number; emoji: string; x: number }[]>([]);

  const handleReact = (emoji: string) => {
    setActiveEmoji(emoji);
    
    // Create flying emoji animation
    const newEmoji = {
      id: Date.now(),
      emoji,
      x: Math.random() * 100
    };
    setFlyingEmojis(prev => [...prev, newEmoji]);
    
    // Remove flying emoji after animation
    setTimeout(() => {
      setFlyingEmojis(prev => prev.filter(e => e.id !== newEmoji.id));
    }, 1000);

    // Haptic feedback simulation
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }

    onReact?.(emoji);
    
    setTimeout(() => setActiveEmoji(null), 300);
  };

  return (
    <div className={cn("relative", className)}>
      {/* Flying emojis container */}
      <div className="absolute inset-0 pointer-events-none overflow-visible z-50">
        {flyingEmojis.map(({ id, emoji, x }) => (
          <div
            key={id}
            className="absolute text-3xl animate-[flyUp_1s_ease-out_forwards]"
            style={{ 
              left: `${x}%`,
              bottom: 0
            }}
          >
            {emoji}
          </div>
        ))}
      </div>

      {/* Emoji buttons */}
      <div className="flex items-center justify-center gap-3 py-3 px-4 bg-card/80 backdrop-blur-xl rounded-full shadow-lg border border-border/50">
        {QUICK_EMOJIS.map(({ emoji, label, animation }) => (
          <button
            key={emoji}
            onClick={() => handleReact(emoji)}
            className={cn(
              "relative w-12 h-12 flex items-center justify-center text-2xl rounded-full transition-all duration-200",
              "hover:bg-muted/50 active:scale-125",
              activeEmoji === emoji && "scale-125 bg-primary/20"
            )}
            title={label}
          >
            <span className={cn(
              "transition-transform duration-200",
              activeEmoji === emoji && animation
            )}>
              {emoji}
            </span>
            
            {/* Ripple effect */}
            {activeEmoji === emoji && (
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-scale-in" />
            )}
          </button>
        ))}
      </div>

      <style>{`
        @keyframes flyUp {
          0% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-100px) scale(1.5);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
