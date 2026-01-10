import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Trophy, 
  Flame, 
  Star, 
  Crown, 
  Target, 
  Zap, 
  Gift,
  TrendingUp,
  Award,
  Users
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { achievements, getAchievementById } from '@/lib/achievements';
import { weeklyMissions, getRandomMission } from '@/lib/missions';

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
      // Get profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('level, experience_points, pontos, conquistas, total_challenges_completed')
        .eq('id', currentUserId)
        .single();

      if (profileError) throw profileError;

      // Get streak data
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
        // Show welcome back message
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
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          pontos: (userStats?.pontos || 0) + rewardPoints,
          experience_points: (userStats?.experience_points || 0) + rewardPoints
        })
        .eq('id', currentUserId);

      if (!error) {
        toast({
          title: "Recompensa Coletada! 🎁",
          description: `Você ganhou ${rewardPoints} pontos!`,
        });
        
        // Create notification
        await supabase
          .from('notifications')
          .insert({
            user_id: currentUserId,
            title: "Recompensa Diária! 🎁",
            message: `Você coletou ${rewardPoints} pontos da missão diária!`,
            type: "reward"
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* User Stats Overview - Compact grid */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-2.5 text-center border border-primary/20">
          <span className="text-lg">👑</span>
          <div className="text-lg font-bold text-primary">{userStats?.level || 1}</div>
          <div className="text-[10px] text-muted-foreground">Nível</div>
          <Progress value={getProgressToNextLevel()} className="mt-1 h-1" />
        </div>

        <div className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 rounded-xl p-2.5 text-center border border-orange-500/20">
          <span className="text-lg">🔥</span>
          <div className="text-lg font-bold text-orange-500">{userStats?.current_streak || 0}</div>
          <div className="text-[10px] text-muted-foreground">Sequência</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 rounded-xl p-2.5 text-center border border-yellow-500/20">
          <span className="text-lg">⭐</span>
          <div className="text-lg font-bold text-yellow-500">{userStats?.pontos || 0}</div>
          <div className="text-[10px] text-muted-foreground">Pontos</div>
        </div>

        <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-xl p-2.5 text-center border border-green-500/20">
          <span className="text-lg">🏆</span>
          <div className="text-lg font-bold text-green-500">{getUnlockedAchievements().length}</div>
          <div className="text-[10px] text-muted-foreground">Conquistas</div>
        </div>
      </div>

      <Tabs defaultValue="missions" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-10 bg-muted/40 rounded-xl p-1">
          <TabsTrigger value="missions" className="text-xs rounded-lg">🎯 Missões</TabsTrigger>
          <TabsTrigger value="achievements" className="text-xs rounded-lg">🏅 Conquistas</TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs rounded-lg">🔔 Alertas</TabsTrigger>
        </TabsList>

        <TabsContent value="missions" className="space-y-3 mt-3">
          {/* Daily Mission - Compact */}
          {dailyMission && (
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-3 border border-blue-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium flex items-center gap-1">
                  <span>🎯</span> Missão Diária
                </span>
                <span className="text-xs font-bold text-blue-600 bg-blue-500/20 px-2 py-0.5 rounded-full">
                  +{dailyMission.reward} pts
                </span>
              </div>
              <p className="text-sm font-medium mb-1">{dailyMission.title}</p>
              <p className="text-xs text-muted-foreground mb-3">{dailyMission.description}</p>
              <Button onClick={claimDailyReward} size="sm" className="w-full h-9 text-xs">
                <span className="mr-1">🎁</span> Coletar Recompensa
              </Button>
            </div>
          )}

          {/* Weekly Missions - Compact */}
          <div className="bg-card rounded-xl p-3 border border-border/50">
            <p className="text-xs font-medium mb-2">📋 Missões Semanais</p>
            <div className="space-y-2">
              {weeklyMissions.slice(0, 3).map((mission) => (
                <div key={mission.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{mission.title}</p>
                  </div>
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full ml-2">
                    +{mission.reward}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="mt-3">
          <div className="bg-card rounded-xl p-3 border border-border/50">
            <p className="text-xs font-medium mb-3">🏅 Suas Conquistas ({getUnlockedAchievements().length}/{achievements.length})</p>
            <div className="grid grid-cols-2 gap-2">
              {achievements.slice(0, 6).map((achievement) => {
                const isUnlocked = userStats?.conquistas.includes(achievement.id);
                return (
                  <div
                    key={achievement.id}
                    className={`p-2.5 rounded-lg border transition-all ${
                      isUnlocked
                        ? 'bg-primary/10 border-primary/30'
                        : 'bg-muted/30 border-muted opacity-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-xl ${isUnlocked ? '' : 'grayscale'}`}>
                        {achievement.icon}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{achievement.title}</p>
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
          <div className="bg-card rounded-xl p-3 border border-border/50">
            {notifications.length === 0 ? (
              <div className="text-center py-6">
                <span className="text-3xl">🔔</span>
                <p className="text-xs text-muted-foreground mt-2">Nenhuma notificação</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.slice(0, 5).map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => markNotificationAsRead(notification.id)}
                    className={`p-2.5 rounded-lg border cursor-pointer ${
                      notification.read
                        ? 'bg-muted/20 border-muted'
                        : 'bg-primary/5 border-primary/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-medium">{notification.title}</p>
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