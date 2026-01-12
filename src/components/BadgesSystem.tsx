import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Award, Star, Trophy, Zap, Target, Users, Calendar, Crown, Sparkles, Flame, Heart, MessageSquare, Gift, Rocket, Medal } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: any;
  requirement: number;
  current: number;
  unlocked: boolean;
  category: 'streak' | 'social' | 'challenges' | 'login' | 'special';
  reward_points: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  emoji: string;
}

interface BadgesSystemProps {
  userId: string;
  userStats: {
    current_streak: number;
    longest_streak: number;
    total_challenges: number;
    friends_count: number;
    login_days: number;
    points: number;
  };
  compact?: boolean;
}

const RARITY_STYLES = {
  common: {
    bg: 'from-gray-400 to-gray-600',
    border: 'border-gray-400',
    text: 'text-gray-500',
    glow: 'shadow-gray-400/30'
  },
  uncommon: {
    bg: 'from-green-400 to-emerald-600',
    border: 'border-green-400',
    text: 'text-green-500',
    glow: 'shadow-green-400/30'
  },
  rare: {
    bg: 'from-blue-400 to-indigo-600',
    border: 'border-blue-400',
    text: 'text-blue-500',
    glow: 'shadow-blue-400/30'
  },
  epic: {
    bg: 'from-purple-400 to-violet-600',
    border: 'border-purple-400',
    text: 'text-purple-500',
    glow: 'shadow-purple-400/30'
  },
  legendary: {
    bg: 'from-amber-400 via-yellow-500 to-orange-500',
    border: 'border-yellow-400',
    text: 'text-yellow-500',
    glow: 'shadow-yellow-400/50'
  }
};

export const BadgesSystem = ({ userId, userStats, compact = false }: BadgesSystemProps) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<string[]>([]);
  const [showAnimation, setShowAnimation] = useState<string | null>(null);
  const { toast } = useToast();

  const achievementTemplates: Omit<Achievement, 'id' | 'current' | 'unlocked'>[] = [
    // Streak Achievements
    {
      title: 'Primeiro Passo',
      description: 'Complete sua primeira sequência de 3 dias',
      icon: Flame,
      requirement: 3,
      category: 'streak',
      reward_points: 50,
      rarity: 'common',
      emoji: '🔥'
    },
    {
      title: 'Semana de Fogo',
      description: 'Mantenha uma sequência de 7 dias',
      icon: Target,
      requirement: 7,
      category: 'streak',
      reward_points: 150,
      rarity: 'uncommon',
      emoji: '🎯'
    },
    {
      title: 'Guerreiro Mensal',
      description: 'Conquiste uma sequência de 30 dias',
      icon: Crown,
      requirement: 30,
      category: 'streak',
      reward_points: 500,
      rarity: 'epic',
      emoji: '👑'
    },
    {
      title: 'Lenda Imparável',
      description: 'Sequência de 100 dias - você é lendário!',
      icon: Rocket,
      requirement: 100,
      category: 'streak',
      reward_points: 2000,
      rarity: 'legendary',
      emoji: '🚀'
    },
    
    // Social Achievements
    {
      title: 'Fazendo Amigos',
      description: 'Adicione seu primeiro amigo',
      icon: Heart,
      requirement: 1,
      category: 'social',
      reward_points: 25,
      rarity: 'common',
      emoji: '💖'
    },
    {
      title: 'Sociável',
      description: 'Tenha 5 amigos conectados',
      icon: Users,
      requirement: 5,
      category: 'social',
      reward_points: 100,
      rarity: 'uncommon',
      emoji: '👥'
    },
    {
      title: 'Popular',
      description: 'Tenha 15 amigos conectados',
      icon: Star,
      requirement: 15,
      category: 'social',
      reward_points: 300,
      rarity: 'rare',
      emoji: '⭐'
    },
    {
      title: 'Influenciador',
      description: 'Tenha 50 amigos conectados',
      icon: Sparkles,
      requirement: 50,
      category: 'social',
      reward_points: 1000,
      rarity: 'legendary',
      emoji: '✨'
    },
    
    // Challenge Achievements
    {
      title: 'Desafiante',
      description: 'Complete seu primeiro desafio',
      icon: Zap,
      requirement: 1,
      category: 'challenges',
      reward_points: 75,
      rarity: 'common',
      emoji: '⚡'
    },
    {
      title: 'Competidor',
      description: 'Complete 10 desafios',
      icon: Trophy,
      requirement: 10,
      category: 'challenges',
      reward_points: 300,
      rarity: 'uncommon',
      emoji: '🏆'
    },
    {
      title: 'Mestre dos Desafios',
      description: 'Complete 50 desafios',
      icon: Medal,
      requirement: 50,
      category: 'challenges',
      reward_points: 750,
      rarity: 'rare',
      emoji: '🎖️'
    },
    {
      title: 'Campeão Supremo',
      description: 'Complete 100 desafios',
      icon: Award,
      requirement: 100,
      category: 'challenges',
      reward_points: 2000,
      rarity: 'legendary',
      emoji: '🏅'
    },
    
    // Login Achievements
    {
      title: 'Bem-vindo',
      description: 'Faça login pela primeira vez',
      icon: Gift,
      requirement: 1,
      category: 'login',
      reward_points: 25,
      rarity: 'common',
      emoji: '🎁'
    },
    {
      title: 'Frequente',
      description: 'Faça login por 15 dias diferentes',
      icon: Calendar,
      requirement: 15,
      category: 'login',
      reward_points: 200,
      rarity: 'uncommon',
      emoji: '📅'
    },
    {
      title: 'Dedicado',
      description: 'Faça login por 60 dias diferentes',
      icon: MessageSquare,
      requirement: 60,
      category: 'login',
      reward_points: 600,
      rarity: 'rare',
      emoji: '💬'
    }
  ];

  useEffect(() => {
    initializeAchievements();
    fetchUserAchievements();
  }, [userId, userStats]);

  const initializeAchievements = () => {
    const processedAchievements: Achievement[] = achievementTemplates.map((template, index) => {
      let current = 0;
      
      switch (template.category) {
        case 'streak':
          current = Math.max(userStats.current_streak, userStats.longest_streak);
          break;
        case 'social':
          current = userStats.friends_count;
          break;
        case 'challenges':
          current = userStats.total_challenges;
          break;
        case 'login':
          current = userStats.login_days;
          break;
      }

      return {
        ...template,
        id: `achievement_${template.title.toLowerCase().replace(/\s+/g, '_')}`,
        current,
        unlocked: current >= template.requirement
      };
    });

    setAchievements(processedAchievements);
    checkForNewAchievements(processedAchievements);
  };

  const fetchUserAchievements = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('conquistas')
      .eq('id', userId)
      .single();

    if (data?.conquistas) {
      setUserAchievements(data.conquistas as string[]);
    }
  };

  const checkForNewAchievements = async (currentAchievements: Achievement[]) => {
    const newlyUnlocked = currentAchievements.filter(
      achievement => achievement.unlocked && !userAchievements.includes(achievement.id)
    );

    if (newlyUnlocked.length > 0) {
      for (const achievement of newlyUnlocked) {
        await awardAchievement(achievement);
      }
    }
  };

  const awardAchievement = async (achievement: Achievement) => {
    try {
      const updatedAchievements = [...userAchievements, achievement.id];
      
      const { error } = await supabase
        .from('profiles')
        .update({
          conquistas: updatedAchievements,
          pontos: userStats.points + achievement.reward_points,
          experience_points: userStats.points + achievement.reward_points
        })
        .eq('id', userId);

      if (!error) {
        setUserAchievements(updatedAchievements);
        setShowAnimation(achievement.id);
        setTimeout(() => setShowAnimation(null), 3000);
        
        toast({
          title: `${achievement.emoji} Nova Conquista!`,
          description: `${achievement.title} desbloqueado! +${achievement.reward_points} pontos`,
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Error awarding achievement:', error);
    }
  };

  const getCategoryEmoji = (category: string) => {
    switch (category) {
      case 'streak': return '🔥';
      case 'social': return '👥';
      case 'challenges': return '⚔️';
      case 'login': return '📱';
      case 'special': return '✨';
      default: return '🎯';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'streak': return 'Sequência';
      case 'social': return 'Social';
      case 'challenges': return 'Desafios';
      case 'login': return 'Frequência';
      case 'special': return 'Especial';
      default: return 'Geral';
    }
  };

  const getRarityLabel = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'Comum';
      case 'uncommon': return 'Incomum';
      case 'rare': return 'Raro';
      case 'epic': return 'Épico';
      case 'legendary': return 'Lendário';
      default: return rarity;
    }
  };

  const unlockedCount = achievements.filter(a => userAchievements.includes(a.id)).length;
  const totalPoints = achievements
    .filter(a => userAchievements.includes(a.id))
    .reduce((sum, a) => sum + a.reward_points, 0);

  if (compact) {
    const recentUnlocked = achievements
      .filter(a => userAchievements.includes(a.id))
      .slice(-3);

    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-2 bg-gradient-to-r from-primary/5 to-transparent">
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              Conquistas
            </span>
            <Badge variant="secondary" className="text-xs">
              {unlockedCount}/{achievements.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="flex items-center gap-2">
            {recentUnlocked.map((a) => (
              <div
                key={a.id}
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center text-lg",
                  "bg-gradient-to-br shadow-lg",
                  RARITY_STYLES[a.rarity].bg,
                  RARITY_STYLES[a.rarity].glow
                )}
                title={a.title}
              >
                {a.emoji}
              </div>
            ))}
            {recentUnlocked.length < 3 && (
              <div className="w-10 h-10 rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center text-muted-foreground">
                ?
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-0 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-red-500/10 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-lg">Conquistas</span>
              <p className="text-xs font-normal text-muted-foreground">
                {unlockedCount}/{achievements.length} desbloqueadas
              </p>
            </div>
          </CardTitle>
          
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{totalPoints}</p>
            <p className="text-xs text-muted-foreground">pontos ganhos</p>
          </div>
        </div>

        {/* Progress bar geral */}
        <div className="mt-4 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Progresso total</span>
            <span className="font-medium">{Math.round((unlockedCount / achievements.length) * 100)}%</span>
          </div>
          <Progress 
            value={(unlockedCount / achievements.length) * 100} 
            className="h-2"
          />
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="p-4 space-y-3">
            {achievements.map((achievement) => {
              const Icon = achievement.icon;
              const progress = Math.min((achievement.current / achievement.requirement) * 100, 100);
              const isUnlocked = userAchievements.includes(achievement.id);
              const styles = RARITY_STYLES[achievement.rarity];
              const isAnimating = showAnimation === achievement.id;
              
              return (
                <div
                  key={achievement.id}
                  className={cn(
                    "relative p-4 rounded-xl border transition-all duration-300",
                    isUnlocked 
                      ? `bg-gradient-to-r from-${achievement.rarity === 'legendary' ? 'amber' : 'primary'}-50/50 to-transparent ${styles.border} dark:from-${achievement.rarity === 'legendary' ? 'amber' : 'primary'}-900/20` 
                      : 'bg-muted/30 border-border opacity-70 hover:opacity-100',
                    isAnimating && 'animate-pulse ring-2 ring-yellow-400'
                  )}
                >
                  {/* Animated sparkles for newly unlocked */}
                  {isAnimating && (
                    <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
                      {[...Array(8)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute animate-ping"
                          style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${i * 0.1}s`
                          }}
                        >
                          ✨
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    {/* Icon badge */}
                    <div className={cn(
                      "relative w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-lg transition-transform",
                      isUnlocked 
                        ? `bg-gradient-to-br ${styles.bg} ${styles.glow}` 
                        : 'bg-muted grayscale',
                      isUnlocked && 'hover:scale-110'
                    )}>
                      {isUnlocked ? achievement.emoji : '🔒'}
                      
                      {/* Rarity indicator */}
                      <div className={cn(
                        "absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-background flex items-center justify-center text-[8px]",
                        `bg-gradient-to-br ${styles.bg}`
                      )}>
                        {achievement.rarity === 'legendary' ? '⭐' : 
                         achievement.rarity === 'epic' ? '💎' : 
                         achievement.rarity === 'rare' ? '💠' : 
                         achievement.rarity === 'uncommon' ? '🌟' : '•'}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className={cn(
                          "font-semibold text-sm",
                          isUnlocked ? styles.text : 'text-muted-foreground'
                        )}>
                          {achievement.title}
                        </h4>
                        <Badge 
                          variant="secondary" 
                          className={cn(
                            "text-[10px] px-1.5",
                            isUnlocked && `bg-gradient-to-r ${styles.bg} text-white border-0`
                          )}
                        >
                          {getRarityLabel(achievement.rarity)}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] px-1.5">
                          {getCategoryEmoji(achievement.category)} {getCategoryLabel(achievement.category)}
                        </Badge>
                      </div>
                      
                      <p className="text-xs text-muted-foreground mb-2">
                        {achievement.description}
                      </p>
                      
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="flex items-center gap-1">
                            <span className={isUnlocked ? 'text-green-500 font-medium' : ''}>
                              {achievement.current}/{achievement.requirement}
                            </span>
                            {isUnlocked && <span className="text-green-500">✓</span>}
                          </span>
                          <span className={cn(
                            "font-medium",
                            isUnlocked ? 'text-green-500' : 'text-primary'
                          )}>
                            +{achievement.reward_points} pts
                          </span>
                        </div>
                        <Progress 
                          value={progress} 
                          className={cn(
                            "h-1.5",
                            isUnlocked && 'bg-green-200 dark:bg-green-900/30'
                          )} 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
