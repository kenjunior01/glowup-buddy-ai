import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { achievements, getAchievementById } from '@/lib/achievements';
import { weeklyMissions, getRandomMission } from '@/lib/missions';
import { useCelebration } from '@/components/CelebrationSystem';
import { calculateLevel } from '@/lib/scoring';

interface UserStats {
  level: number;
  experience_points: number;
  pontos: number;
  current_streak: number;
  longest_streak: number;
  conquistas: string[];
  total_challenges_completed: number;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

const GamificationHub = () => {
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [dailyMission, setDailyMission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { celebrate } = useCelebration();

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchUserStats();
      fetchNotifications();
      updateUserStreak();
      setDailyMission(getRandomMission());
    }
  }, [currentUserId]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const fetchUserStats = async () => {
    if (!currentUserId) return;

    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('level, experience_points, pontos, conquistas, total_challenges_completed')
        .eq('id', currentUserId)
        .single();

      if (profileError) throw profileError;

      const { data: streak, error: streakError } = await supabase
        .from('streaks')
        .select('current_streak, longest_streak')
        .eq('user_id', currentUserId)
        .single();

      if (streakError && streakError.code !== 'PGRST116') {
        console.error('Error fetching streak:', streakError);
      }

      setUserStats({
        level: profile?.level || 1,
        experience_points: profile?.experience_points || 0,
        pontos: profile?.pontos || 0,
        current_streak: streak?.current_streak || 0,
        longest_streak: streak?.longest_streak || 0,
        conquistas: (profile?.conquistas as string[]) || [],
        total_challenges_completed: profile?.total_challenges_completed || 0
      });

    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    if (!currentUserId) return;

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', currentUserId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      setNotifications(data);
    }
  };

  const updateUserStreak = async () => {
    if (!currentUserId) return;

    try {
      const { error } = await supabase.functions.invoke('update-user-streak', {
        body: {}
      });

      if (error) {
        console.error('Error updating streak:', error);
      } else {
        toast({
          title: "Bem-vindo de volta! 🔥",
          description: "Sua sequência foi atualizada!",
        });
      }
    } catch (error) {
      console.error('Error calling update_user_streak:', error);
    }
  };

  const claimDailyReward = async () => {
    if (!currentUserId || !dailyMission) return;

    const rewardPoints = dailyMission.reward;
    const currentXP = userStats?.experience_points || 0;
    const currentLevel = userStats?.level || 1;
    const newXP = currentXP + rewardPoints;
    
    try {
      const levelInfo = calculateLevel(newXP);
      const willLevelUp = levelInfo.level > currentLevel;

      const { error } = await supabase
        .from('profiles')
        .update({ 
          pontos: (userStats?.pontos || 0) + rewardPoints,
          experience_points: newXP,
          level: levelInfo.level
        })
        .eq('id', currentUserId);

      if (!error) {
        toast({
          title: "Recompensa Coletada! 🎁",
          description: `Você ganhou ${rewardPoints} pontos!`,
        });
        
        if (willLevelUp) {
          celebrate({
            type: 'level_up',
            value: levelInfo.level,
            title: `Nível ${levelInfo.level}! ${levelInfo.emoji}`,
            subtitle: `Você evoluiu para ${levelInfo.title}!`
          });
        }
        
        await supabase
          .from('notifications')
          .insert({
            user_id: currentUserId,
            title: willLevelUp ? `🎉 Level Up! Nível ${levelInfo.level}` : "Recompensa Diária! 🎁",
            message: willLevelUp 
              ? `Parabéns! Você agora é ${levelInfo.title}! ${levelInfo.emoji}`
              : `Você coletou ${rewardPoints} pontos da missão diária!`,
            type: willLevelUp ? "level_up" : "reward"
          });
        
        fetchUserStats();
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error claiming reward:', error);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);
    
    fetchNotifications();
  };

  const getProgressToNextLevel = () => {
    if (!userStats) return 0;
    const currentLevelXP = (userStats.level - 1) * 100;
    const nextLevelXP = userStats.level * 100;
    const progress = userStats.experience_points - currentLevelXP;
    const maxProgress = nextLevelXP - currentLevelXP;
    return Math.max(0, Math.min(100, (progress / maxProgress) * 100));
  };

  const getUnlockedAchievements = () => {
    if (!userStats) return [];
    return userStats.conquistas.map(id => getAchievementById(id)).filter(Boolean);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Grid - Clean Glow */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bento-card p-3 text-center">
          <span className="text-lg block">👑</span>
          <p className="text-lg font-bold text-foreground">{userStats?.level || 1}</p>
          <p className="text-[10px] text-muted-foreground">Nível</p>
          <Progress value={getProgressToNextLevel()} className="mt-1.5 h-1" />
        </div>

        <div className="bento-card p-3 text-center">
          <span className="text-lg block">🔥</span>
          <p className="text-lg font-bold text-foreground">{userStats?.current_streak || 0}</p>
          <p className="text-[10px] text-muted-foreground">Sequência</p>
        </div>

        <div className="bento-card p-3 text-center">
          <span className="text-lg block">⭐</span>
          <p className="text-lg font-bold text-foreground">{userStats?.pontos || 0}</p>
          <p className="text-[10px] text-muted-foreground">Pontos</p>
        </div>

        <div className="bento-card p-3 text-center">
          <span className="text-lg block">🏆</span>
          <p className="text-lg font-bold text-foreground">{getUnlockedAchievements().length}</p>
          <p className="text-[10px] text-muted-foreground">Conquistas</p>
        </div>
      </div>

      <Tabs defaultValue="missions" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-10 bg-muted/30 rounded-xl p-1">
          <TabsTrigger value="missions" className="text-xs rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
            🎯 Missões
          </TabsTrigger>
          <TabsTrigger value="achievements" className="text-xs rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
            🏅 Conquistas
          </TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
            🔔 Alertas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="missions" className="space-y-3 mt-3">
          {/* Daily Mission */}
          {dailyMission && (
            <div className="bento-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-foreground">🎯 Missão Diária</span>
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  +{dailyMission.reward} pts
                </span>
              </div>
              <p className="text-sm font-medium text-foreground mb-1">{dailyMission.title}</p>
              <p className="text-xs text-muted-foreground mb-3">{dailyMission.description}</p>
              <Button onClick={claimDailyReward} size="sm" className="w-full h-9 text-xs">
                🎁 Coletar Recompensa
              </Button>
            </div>
          )}

          {/* Weekly Missions */}
          <div className="bento-card p-4">
            <p className="text-xs font-medium text-foreground mb-3">📋 Missões Semanais</p>
            <div className="space-y-2">
              {weeklyMissions.slice(0, 3).map((mission) => (
                <div key={mission.id} className="flex items-center justify-between p-2.5 bg-muted/30 rounded-lg">
                  <p className="text-xs font-medium text-foreground truncate flex-1">{mission.title}</p>
                  <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full ml-2">
                    +{mission.reward}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="mt-3">
          <div className="bento-card p-4">
            <p className="text-xs font-medium text-foreground mb-3">
              🏅 Conquistas ({getUnlockedAchievements().length}/{achievements.length})
            </p>
            <div className="grid grid-cols-2 gap-2">
              {achievements.slice(0, 6).map((achievement) => {
                const isUnlocked = userStats?.conquistas.includes(achievement.id);
                return (
                  <div
                    key={achievement.id}
                    className={`p-2.5 rounded-lg transition-all ${
                      isUnlocked
                        ? 'bg-primary/5 border border-primary/20'
                        : 'bg-muted/30 opacity-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-xl ${isUnlocked ? '' : 'grayscale'}`}>
                        {achievement.icon}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{achievement.title}</p>
                        {isUnlocked && (
                          <span className="text-[10px] text-primary">✓ Desbloqueado</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="mt-3">
          <div className="bento-card p-4">
            {notifications.length === 0 ? (
              <div className="text-center py-6">
                <span className="text-3xl block mb-2">🔔</span>
                <p className="text-xs text-muted-foreground">Nenhuma notificação</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.slice(0, 5).map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => markNotificationAsRead(notification.id)}
                    className={`p-2.5 rounded-lg cursor-pointer transition-colors ${
                      notification.read
                        ? 'bg-muted/20'
                        : 'bg-primary/5 border border-primary/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground">{notification.title}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{notification.message}</p>
                      </div>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GamificationHub;
