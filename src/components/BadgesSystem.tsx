import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Award, Star, Trophy, Zap, Target, Users, Calendar, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
}

export const BadgesSystem = ({ userId, userStats }: BadgesSystemProps) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<string[]>([]);
  const { toast } = useToast();

  const achievementTemplates: Omit<Achievement, 'id' | 'current' | 'unlocked'>[] = [
    // Streak Achievements
    {
      title: 'Primeiro Passo',
      description: 'Complete sua primeira sequência de 3 dias',
      icon: Zap,
      requirement: 3,
      category: 'streak',
      reward_points: 50
    },
    {
      title: 'Constância',
      description: 'Mantenha uma sequência de 7 dias',
      icon: Target,
      requirement: 7,
      category: 'streak',
      reward_points: 100
    },
    {
      title: 'Determinação',
      description: 'Conquiste uma sequência de 30 dias',
      icon: Crown,
      requirement: 30,
      category: 'streak',
      reward_points: 500
    },
    
    // Social Achievements
    {
      title: 'Social',
      description: 'Adicione seu primeiro amigo',
      icon: Users,
      requirement: 1,
      category: 'social',
      reward_points: 25
    },
    {
      title: 'Popular',
      description: 'Tenha 10 amigos conectados',
      icon: Star,
      requirement: 10,
      category: 'social',
      reward_points: 200
    },
    
    // Challenge Achievements
    {
      title: 'Desafiante',
      description: 'Complete seu primeiro desafio',
      icon: Trophy,
      requirement: 1,
      category: 'challenges',
      reward_points: 75
    },
    {
      title: 'Competidor',
      description: 'Complete 10 desafios',
      icon: Award,
      requirement: 10,
      category: 'challenges',
      reward_points: 300
    },
    
    // Login Achievements
    {
      title: 'Dedicado',
      description: 'Faça login por 15 dias diferentes',
      icon: Calendar,
      requirement: 15,
      category: 'login',
      reward_points: 150
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
          current = userStats.current_streak;
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
        id: `achievement_${index}`,
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
      // Add achievement to user profile
      const updatedAchievements = [...userAchievements, achievement.id];
      
      // Update user profile with new achievement and award points
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
        
        toast({
          title: "🏆 Nova Conquista!",
          description: `${achievement.title} desbloqueado! +${achievement.reward_points} pontos`,
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Error awarding achievement:', error);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'streak': return 'bg-orange-500';
      case 'social': return 'bg-blue-500';
      case 'challenges': return 'bg-purple-500';
      case 'login': return 'bg-green-500';
      case 'special': return 'bg-gold-500';
      default: return 'bg-gray-500';
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Conquistas ({userAchievements.length}/{achievements.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((achievement) => {
              const Icon = achievement.icon;
              const progress = Math.min((achievement.current / achievement.requirement) * 100, 100);
              const isUnlocked = userAchievements.includes(achievement.id);
              
              return (
                <div
                  key={achievement.id}
                  className={`p-4 rounded-lg border transition-all ${
                    isUnlocked 
                      ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 dark:from-yellow-900/20 dark:to-orange-900/20' 
                      : 'bg-muted/30 border-border'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${
                      isUnlocked ? getCategoryColor(achievement.category) : 'bg-muted'
                    } text-white`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`font-medium ${isUnlocked ? 'text-primary' : 'text-muted-foreground'}`}>
                          {achievement.title}
                        </h4>
                        <Badge variant="secondary" className="text-xs">
                          {getCategoryLabel(achievement.category)}
                        </Badge>
                        {isUnlocked && <Badge variant="default" className="text-xs">✓</Badge>}
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">
                        {achievement.description}
                      </p>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{achievement.current}/{achievement.requirement}</span>
                          <span className="text-primary">+{achievement.reward_points} pts</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};