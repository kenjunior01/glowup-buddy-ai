import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { Flame, Trophy, Star, Sparkles, Zap, Crown, Target, Heart, X, Gift } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

// Celebration Types
type CelebrationType = 
  | 'streak' 
  | 'level_up' 
  | 'achievement' 
  | 'challenge_complete' 
  | 'goal_complete'
  | 'buddy_win'
  | 'points_milestone';

interface CelebrationData {
  type: CelebrationType;
  value?: number;
  title?: string;
  subtitle?: string;
  points?: number;
}

interface CelebrationContextType {
  celebrate: (data: CelebrationData) => void;
  showConfetti: () => void;
}

const CelebrationContext = createContext<CelebrationContextType | null>(null);

export const useCelebration = () => {
  const context = useContext(CelebrationContext);
  if (!context) {
    throw new Error('useCelebration must be used within CelebrationProvider');
  }
  return context;
};

// Confetti Component
const ConfettiExplosion = ({ isActive }: { isActive: boolean }) => {
  const [pieces, setPieces] = useState<Array<{
    id: number;
    x: number;
    y: number;
    color: string;
    size: number;
    rotation: number;
    type: 'square' | 'circle' | 'star';
  }>>([]);

  useEffect(() => {
    if (isActive) {
      const colors = [
        'hsl(333, 71%, 50%)', // Pink
        'hsl(262, 100%, 64%)', // Purple
        'hsl(45, 100%, 60%)', // Gold
        'hsl(142, 76%, 36%)', // Green
        'hsl(320, 100%, 70%)', // Magenta
        'hsl(217, 91%, 60%)', // Blue
        'hsl(15, 100%, 55%)', // Orange
      ];

      const types: Array<'square' | 'circle' | 'star'> = ['square', 'circle', 'star'];

      const newPieces = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        x: 50 + (Math.random() - 0.5) * 20,
        y: 50,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 6 + Math.random() * 10,
        rotation: Math.random() * 360,
        type: types[Math.floor(Math.random() * types.length)],
      }));

      setPieces(newPieces);

      const timeout = setTimeout(() => {
        setPieces([]);
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [isActive]);

  if (!isActive || pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute confetti-piece"
          style={{
            left: `${piece.x}%`,
            top: `${piece.y}%`,
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.type !== 'star' ? piece.color : 'transparent',
            borderRadius: piece.type === 'circle' ? '50%' : '2px',
            transform: `rotate(${piece.rotation}deg)`,
            '--tx': `${(Math.random() - 0.5) * 400}px`,
            '--ty': `${Math.random() * -600 - 200}px`,
            '--r': `${Math.random() * 720 - 360}deg`,
          } as React.CSSProperties}
        >
          {piece.type === 'star' && (
            <Star className="w-full h-full" style={{ color: piece.color }} fill={piece.color} />
          )}
        </div>
      ))}
      <style>{`
        @keyframes confetti-explosion {
          0% {
            transform: translateY(0) rotate(0deg) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateX(var(--tx)) translateY(var(--ty)) rotate(var(--r)) scale(0);
            opacity: 0;
          }
        }
        .confetti-piece {
          animation: confetti-explosion 2.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
      `}</style>
    </div>
  );
};

// Floating Emojis
const FloatingEmojis = ({ emojis, isActive }: { emojis: string[]; isActive: boolean }) => {
  const [particles, setParticles] = useState<Array<{ id: number; emoji: string; x: number; delay: number }>>([]);

  useEffect(() => {
    if (isActive) {
      const newParticles = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        emoji: emojis[i % emojis.length],
        x: Math.random() * 100,
        delay: Math.random() * 1,
      }));
      setParticles(newParticles);

      const timeout = setTimeout(() => setParticles([]), 4000);
      return () => clearTimeout(timeout);
    }
  }, [isActive, emojis]);

  if (!isActive || particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[199] overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute text-3xl floating-emoji"
          style={{
            left: `${p.x}%`,
            bottom: '-50px',
            animationDelay: `${p.delay}s`,
          }}
        >
          {p.emoji}
        </div>
      ))}
      <style>{`
        @keyframes float-up {
          0% {
            transform: translateY(0) scale(0.5);
            opacity: 0;
          }
          10% {
            opacity: 1;
            transform: translateY(-20vh) scale(1);
          }
          100% {
            transform: translateY(-120vh) scale(0.8);
            opacity: 0;
          }
        }
        .floating-emoji {
          animation: float-up 3.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

// Main Celebration Modal
const CelebrationModal = ({ 
  data, 
  onClose 
}: { 
  data: CelebrationData | null; 
  onClose: () => void;
}) => {
  if (!data) return null;

  const config = getCelebrationConfig(data);

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 backdrop-blur-md animate-fade-in">
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 text-white/80 hover:text-white z-50 tap-scale"
      >
        <X className="w-8 h-8" />
      </button>

      <div className="relative text-center animate-celebration-enter px-6">
        {/* Background Glow */}
        <div className="absolute inset-0 -z-10 flex items-center justify-center">
          <div 
            className={cn(
              "w-80 h-80 rounded-full blur-3xl animate-pulse-glow",
              config.glowColor
            )} 
          />
        </div>

        {/* Icon/Emoji */}
        <div className="relative mb-6">
          <div className="text-[120px] animate-bounce-in">
            {config.emoji}
          </div>
          {config.icon && (
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 animate-spin-slow">
              {config.icon}
            </div>
          )}
        </div>

        {/* Value (if applicable) */}
        {data.value && (
          <div className={cn(
            "relative inline-flex items-center gap-3 mb-4",
            "text-7xl font-black text-white",
            "drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]"
          )}>
            {config.valuePrefix}
            <span className="animate-number-pop">{data.value}</span>
            {config.valueSuffix}
          </div>
        )}

        {/* Title */}
        <h2 className={cn(
          "text-4xl font-black mb-3 tracking-wide animate-slide-up",
          config.titleColor
        )}>
          {data.title || config.defaultTitle}
        </h2>

        {/* Subtitle */}
        <p className="text-lg text-white/80 mb-8 animate-slide-up-delay">
          {data.subtitle || config.defaultSubtitle}
        </p>

        {/* Points Earned */}
        {data.points && (
          <div className="flex items-center justify-center gap-2 mb-6 animate-scale-in-delay">
            <div className="px-6 py-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-full border border-yellow-500/30">
              <span className="text-yellow-400 font-bold text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                +{data.points} pontos!
              </span>
            </div>
          </div>
        )}

        {/* CTA Button */}
        <Button 
          onClick={onClose}
          size="lg"
          className={cn(
            "font-bold px-10 py-7 text-xl rounded-2xl shadow-2xl",
            "transform transition-all hover:scale-105 active:scale-95",
            config.buttonGradient
          )}
        >
          <Sparkles className="w-6 h-6 mr-2" />
          Incrível!
        </Button>
      </div>

      <style>{`
        @keyframes celebration-enter {
          0% {
            transform: scale(0.5) translateY(50px);
            opacity: 0;
          }
          60% {
            transform: scale(1.1) translateY(-10px);
          }
          100% {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
        }
        @keyframes bounce-in {
          0% { transform: scale(0); }
          50% { transform: scale(1.3); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); }
        }
        @keyframes number-pop {
          0% { transform: scale(0); }
          70% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        @keyframes slide-up {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes scale-in-delay {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
        }
        @keyframes spin-slow {
          from { transform: translateX(-50%) rotate(0deg); }
          to { transform: translateX(-50%) rotate(360deg); }
        }
        .animate-celebration-enter {
          animation: celebration-enter 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .animate-bounce-in {
          animation: bounce-in 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .animate-number-pop {
          animation: number-pop 0.5s ease-out 0.3s both;
        }
        .animate-slide-up {
          animation: slide-up 0.4s ease-out 0.4s both;
        }
        .animate-slide-up-delay {
          animation: slide-up 0.4s ease-out 0.5s both;
        }
        .animate-scale-in-delay {
          animation: scale-in-delay 0.4s ease-out 0.6s both;
        }
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
};

// Configuration for different celebration types
function getCelebrationConfig(data: CelebrationData) {
  const configs: Record<CelebrationType, {
    emoji: string;
    icon?: React.ReactNode;
    glowColor: string;
    titleColor: string;
    buttonGradient: string;
    defaultTitle: string;
    defaultSubtitle: string;
    valuePrefix?: React.ReactNode;
    valueSuffix?: React.ReactNode;
    emojis: string[];
  }> = {
    streak: {
      emoji: '🔥',
      icon: <Flame className="w-8 h-8 text-orange-400" />,
      glowColor: 'bg-gradient-to-br from-orange-500/50 to-red-500/50',
      titleColor: 'text-gradient-fire',
      buttonGradient: 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white',
      defaultTitle: 'SEQUÊNCIA!',
      defaultSubtitle: 'Continue assim, você está em chamas!',
      valuePrefix: <Flame className="w-10 h-10 text-orange-400 animate-wiggle" />,
      valueSuffix: <span className="text-3xl font-bold text-orange-300">dias</span>,
      emojis: ['🔥', '💪', '⚡', '✨', '🎯'],
    },
    level_up: {
      emoji: '⭐',
      icon: <Crown className="w-8 h-8 text-yellow-400" />,
      glowColor: 'bg-gradient-to-br from-yellow-500/50 to-purple-500/50',
      titleColor: 'text-yellow-400',
      buttonGradient: 'bg-gradient-to-r from-yellow-500 to-purple-500 hover:from-yellow-600 hover:to-purple-600 text-white',
      defaultTitle: 'LEVEL UP!',
      defaultSubtitle: 'Você subiu de nível!',
      valuePrefix: <span className="text-3xl font-bold text-yellow-300">Nível</span>,
      emojis: ['⭐', '🌟', '✨', '💫', '🏆'],
    },
    achievement: {
      emoji: '🏆',
      icon: <Trophy className="w-8 h-8 text-yellow-500" />,
      glowColor: 'bg-gradient-to-br from-yellow-500/50 to-amber-500/50',
      titleColor: 'text-yellow-500',
      buttonGradient: 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white',
      defaultTitle: 'CONQUISTA!',
      defaultSubtitle: 'Você desbloqueou uma nova conquista!',
      emojis: ['🏆', '🥇', '🎖️', '🏅', '👑'],
    },
    challenge_complete: {
      emoji: '🎯',
      icon: <Target className="w-8 h-8 text-green-400" />,
      glowColor: 'bg-gradient-to-br from-green-500/50 to-emerald-500/50',
      titleColor: 'text-green-400',
      buttonGradient: 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white',
      defaultTitle: 'DESAFIO COMPLETO!',
      defaultSubtitle: 'Você concluiu o desafio com sucesso!',
      emojis: ['🎯', '✅', '💪', '🎉', '⚡'],
    },
    goal_complete: {
      emoji: '🎉',
      icon: <Sparkles className="w-8 h-8 text-pink-400" />,
      glowColor: 'bg-gradient-to-br from-pink-500/50 to-purple-500/50',
      titleColor: 'text-pink-400',
      buttonGradient: 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white',
      defaultTitle: 'META ALCANÇADA!',
      defaultSubtitle: 'Você atingiu seu objetivo!',
      emojis: ['🎉', '🎊', '✨', '🌟', '💯'],
    },
    buddy_win: {
      emoji: '👯',
      icon: <Heart className="w-8 h-8 text-pink-400" />,
      glowColor: 'bg-gradient-to-br from-pink-500/50 to-red-500/50',
      titleColor: 'text-pink-400',
      buttonGradient: 'bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white',
      defaultTitle: 'DUPLA CAMPEÃ!',
      defaultSubtitle: 'Vocês dois conseguiram juntos!',
      emojis: ['👯', '❤️', '🤝', '🎉', '💕'],
    },
    points_milestone: {
      emoji: '💎',
      icon: <Gift className="w-8 h-8 text-cyan-400" />,
      glowColor: 'bg-gradient-to-br from-cyan-500/50 to-blue-500/50',
      titleColor: 'text-cyan-400',
      buttonGradient: 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white',
      defaultTitle: 'MARCO DE PONTOS!',
      defaultSubtitle: 'Você alcançou um novo marco!',
      valuePrefix: <Zap className="w-10 h-10 text-cyan-400" />,
      valueSuffix: <span className="text-3xl font-bold text-cyan-300">pts</span>,
      emojis: ['💎', '💰', '✨', '🌟', '💫'],
    },
  };

  return configs[data.type];
}

// Provider Component
export function CelebrationProvider({ children }: { children: React.ReactNode }) {
  const [celebration, setCelebration] = useState<CelebrationData | null>(null);
  const [showConfettiState, setShowConfettiState] = useState(false);
  const [currentEmojis, setCurrentEmojis] = useState<string[]>([]);

  const celebrate = useCallback((data: CelebrationData) => {
    const config = getCelebrationConfig(data);
    setCelebration(data);
    setCurrentEmojis(config.emojis);
    setShowConfettiState(true);
    
    // Auto-hide confetti after animation
    setTimeout(() => setShowConfettiState(false), 3000);
  }, []);

  const showConfetti = useCallback(() => {
    setShowConfettiState(true);
    setCurrentEmojis(['🎉', '🎊', '✨', '🌟', '💫']);
    setTimeout(() => setShowConfettiState(false), 3000);
  }, []);

  const handleClose = useCallback(() => {
    setCelebration(null);
  }, []);

  return (
    <CelebrationContext.Provider value={{ celebrate, showConfetti }}>
      {children}
      <ConfettiExplosion isActive={showConfettiState} />
      <FloatingEmojis emojis={currentEmojis} isActive={showConfettiState} />
      <CelebrationModal data={celebration} onClose={handleClose} />
    </CelebrationContext.Provider>
  );
}

// CSS for text gradients
const additionalStyles = `
  .text-gradient-fire {
    background: linear-gradient(135deg, #ff6b35, #f7931a, #ff4500);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.innerText = additionalStyles;
  document.head.appendChild(styleSheet);
}
