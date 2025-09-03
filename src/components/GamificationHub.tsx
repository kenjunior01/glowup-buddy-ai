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
      const { error } = await supabase.rpc('update_user_streak', {
        user_uuid: currentUserId
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
    <div className="space-y-6">
      {/* User Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4 text-center">
            <Crown className="h-8 w-8 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold text-primary">{userStats?.level || 1}</div>
            <div className="text-sm text-muted-foreground">Nível</div>
            <Progress value={getProgressToNextLevel()} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
          <CardContent className="p-4 text-center">
            <Flame className="h-8 w-8 mx-auto mb-2 text-orange-500" />
            <div className="text-2xl font-bold text-orange-500">{userStats?.current_streak || 0}</div>
            <div className="text-sm text-muted-foreground">Sequência</div>
            <div className="text-xs mt-1">Recorde: {userStats?.longest_streak || 0}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20">
          <CardContent className="p-4 text-center">
            <Star className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
            <div className="text-2xl font-bold text-yellow-500">{userStats?.pontos || 0}</div>
            <div className="text-sm text-muted-foreground">Pontos</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="p-4 text-center">
            <Trophy className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold text-green-500">{getUnlockedAchievements().length}</div>
            <div className="text-sm text-muted-foreground">Conquistas</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="missions" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="missions">Missões</TabsTrigger>
          <TabsTrigger value="achievements">Conquistas</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
        </TabsList>

        <TabsContent value="missions" className="space-y-4">
          {/* Daily Mission */}
          {dailyMission && (
            <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-500" />
                    Missão Diária
                  </h3>
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-700">
                    {dailyMission.reward} pontos
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium">{dailyMission.title}</h4>
                    <p className="text-sm text-muted-foreground">{dailyMission.description}</p>
                  </div>
                  <Button onClick={claimDailyReward} className="w-full hover-scale">
                    <Gift className="h-4 w-4 mr-2" />
                    Coletar Recompensa
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Weekly Missions */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold">Missões Semanais</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {weeklyMissions.slice(0, 3).map((mission) => (
                  <div key={mission.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                    <div>
                      <h4 className="font-medium text-sm">{mission.title}</h4>
                      <p className="text-xs text-muted-foreground">{mission.description}</p>
                    </div>
                    <Badge variant="outline">
                      {mission.reward} pts
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader>
              <h3 className="font-semibold">Suas Conquistas ({getUnlockedAchievements().length}/{achievements.length})</h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {achievements.map((achievement) => {
                  const isUnlocked = userStats?.conquistas.includes(achievement.id);
                  return (
                    <div
                      key={achievement.id}
                      className={`p-4 rounded-lg border transition-all ${
                        isUnlocked
                          ? 'bg-primary/10 border-primary/30 hover:bg-primary/15'
                          : 'bg-secondary/20 border-secondary/30 opacity-60'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`text-2xl ${isUnlocked ? '' : 'grayscale'}`}>
                          {achievement.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className={`font-medium text-sm ${isUnlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {achievement.title}
                          </h4>
                          <p className="text-xs text-muted-foreground">{achievement.description}</p>
                          {isUnlocked && (
                            <Badge variant="secondary" className="mt-2 text-xs">
                              <Award className="h-3 w-3 mr-1" />
                              Desbloqueado!
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <h3 className="font-semibold">Últimas Notificações</h3>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <div className="text-center py-8">
                  <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhuma notificação ainda</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        notification.read
                          ? 'bg-secondary/20 border-secondary/30'
                          : 'bg-primary/10 border-primary/30'
                      }`}
                      onClick={() => markNotificationAsRead(notification.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-sm">{notification.title}</h4>
                          <p className="text-xs text-muted-foreground">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(notification.created_at).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GamificationHub;