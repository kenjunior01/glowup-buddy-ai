import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import ProfileForm from '@/components/ProfileForm';
import { BadgesSystem } from '@/components/BadgesSystem';
import { DailyMissions } from '@/components/DailyMissions';
import { CalendarIntegration } from '@/components/CalendarIntegration';
import { StoriesSystem } from '@/components/StoriesSystem';
import { CommunityGroups } from '@/components/CommunityGroups';
import GoalsWithAI from '@/components/GoalsWithAI';
import PlansView from '@/components/PlansView';
import MobileBottomNav from '@/components/MobileBottomNav';
import { ProfileAchievements } from '@/components/ProfileAchievements';
import SuggestedUsers from '@/components/SuggestedUsers';
import TrendingChallenges from '@/components/TrendingChallenges';
import JournalEntry from '@/components/JournalEntry';
import GamificationHelp from '@/components/GamificationHelp';
import PersonalAnalytics from '@/components/PersonalAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Trophy, 
  Flame, 
  Star, 
  Calendar, 
  Target,
  LogOut,
  Settings,
  Award,
  Sparkles,
  TrendingUp,
  BookOpen,
  BarChart3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

interface UserProfile {
  id: string;
  name: string;
  age?: number;
  ocupacao?: string;
  avatar_url?: string;
  pontos: number;
  level: number;
  experience_points: number;
  total_challenges_completed: number;
  conquistas: string[];
  created_at: string;
}

interface UserStats {
  current_streak: number;
  longest_streak: number;
  total_friends: number;
  total_plans: number;
}

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchUserProfile();
    fetchUserStats();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;
      setProfile({
        ...data,
        conquistas: (data.conquistas as string[]) || []
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o perfil.",
        variant: "destructive"
      });
    }
  };

  const fetchUserStats = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: streakData } = await supabase
        .from('streaks')
        .select('current_streak, longest_streak')
        .eq('user_id', session.user.id)
        .single();

      const { count: friendsCount } = await supabase
        .from('friendships')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .eq('status', 'accepted');

      const { count: plansCount } = await supabase
        .from('plans')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id);

      setStats({
        current_streak: streakData?.current_streak || 0,
        longest_streak: streakData?.longest_streak || 0,
        total_friends: friendsCount || 0,
        total_plans: plansCount || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const memberSince = profile?.created_at 
    ? new Date(profile.created_at).toLocaleDateString('pt-BR')
    : 'N/A';

  const progressToNextLevel = profile 
    ? ((profile.experience_points % 100) / 100) * 100
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse-soft">
          <div className="w-8 h-8 gradient-primary rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border mobile-safe">
        <div className="max-w-7xl mx-auto p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gradient flex items-center gap-2">
              <User className="w-6 h-6" />
              Meu Perfil
            </h1>
            <div className="flex items-center gap-2">
              <GamificationHelp />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-destructive hover:text-destructive"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        <div className="flex gap-6">
          {/* Left Sidebar - Desktop Only */}
          {!isMobile && (
            <aside className="hidden lg:block w-72 flex-shrink-0 space-y-4 animate-fade-in">
              <ProfileAchievements 
                currentStreak={stats?.current_streak || 0}
                totalChallenges={profile?.total_challenges_completed || 0}
                totalFriends={stats?.total_friends || 0}
                points={profile?.pontos || 0}
              />
              <SuggestedUsers />
            </aside>
          )}

          {/* Main Content */}
          <main className="flex-1 min-w-0 space-y-6">
            {/* Profile Header */}
            <Card className="gradient-primary text-white animate-fade-in">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="w-20 h-20 border-4 border-white/20 animate-scale-in">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback className="text-primary text-xl font-bold">
                      {profile?.name?.slice(0, 2).toUpperCase() || 'US'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold">{profile?.name || 'Usuário'}</h2>
                    <p className="opacity-90">{profile?.ocupacao || 'Membro GlowUp'}</p>
                    
                    <div className="flex items-center gap-4 mt-3">
                      <Badge className="bg-white/20 text-white border-white/30">
                        Nível {profile?.level || 1}
                      </Badge>
                      <Badge className="bg-white/20 text-white border-white/30">
                        {profile?.pontos || 0} pontos
                      </Badge>
                    </div>

                    <div className="mt-3">
                      <div className="flex justify-between text-sm opacity-90 mb-1">
                        <span>Progresso para nível {(profile?.level || 1) + 1}</span>
                        <span>{Math.round(progressToNextLevel)}%</span>
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-2">
                        <div 
                          className="bg-white h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progressToNextLevel}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Flame, value: stats?.current_streak || 0, label: 'Sequência', color: 'text-orange-500' },
                { icon: Trophy, value: profile?.total_challenges_completed || 0, label: 'Desafios', color: 'text-yellow-500' },
                { icon: Star, value: stats?.total_friends || 0, label: 'Amigos', color: 'text-blue-500' },
                { icon: Target, value: stats?.total_plans || 0, label: 'Planos', color: 'text-green-500' }
              ].map((stat, index) => (
                <Card key={stat.label} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                  <CardContent className="p-4 text-center">
                    <stat.icon className={`w-8 h-8 mx-auto mb-2 ${stat.color}`} />
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Tabs defaultValue="goals" className="w-full">
              <TabsList className="grid w-full grid-cols-4 md:grid-cols-8 bg-muted/50 backdrop-blur-sm">
                <TabsTrigger value="goals" className="flex items-center gap-1">
                  <Target className="w-4 h-4" />
                  <span className="hidden md:inline">Objetivos</span>
                </TabsTrigger>
                <TabsTrigger value="plans" className="flex items-center gap-1">
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden md:inline">Planos IA</span>
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-1">
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden md:inline">Analytics</span>
                </TabsTrigger>
                <TabsTrigger value="journal" className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  <span className="hidden md:inline">Reflexões</span>
                </TabsTrigger>
                <TabsTrigger value="missions" className="flex items-center gap-1">
                  <Award className="w-4 h-4" />
                  <span className="hidden md:inline">Missões</span>
                </TabsTrigger>
                <TabsTrigger value="achievements" className="flex items-center gap-1">
                  <Trophy className="w-4 h-4" />
                  <span className="hidden md:inline">Conquistas</span>
                </TabsTrigger>
                <TabsTrigger value="info" className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span className="hidden md:inline">Perfil</span>
                </TabsTrigger>
                <TabsTrigger value="calendar" className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span className="hidden md:inline">Calendário</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="goals" className="space-y-4 mt-4 animate-fade-in">
                <GoalsWithAI userId={profile?.id || ''} onDataChange={fetchUserStats} />
              </TabsContent>

              <TabsContent value="plans" className="space-y-4 mt-4 animate-fade-in">
                <PlansView userId={profile?.id || ''} onDataChange={fetchUserStats} />
              </TabsContent>

              <TabsContent value="analytics" className="space-y-4 mt-4 animate-fade-in">
                <PersonalAnalytics userId={profile?.id || ''} />
              </TabsContent>

              <TabsContent value="journal" className="space-y-4 mt-4 animate-fade-in">
                <JournalEntry userId={profile?.id || ''} />
              </TabsContent>

              <TabsContent value="missions" className="space-y-4 mt-4 animate-fade-in">
                <DailyMissions userId={profile?.id || ''} />
              </TabsContent>

              <TabsContent value="achievements" className="space-y-4 mt-4 animate-fade-in">
                <BadgesSystem 
                  userId={profile?.id || ''} 
                  userStats={{
                    current_streak: stats?.current_streak || 0,
                    longest_streak: stats?.longest_streak || 0,
                    total_challenges: profile?.total_challenges_completed || 0,
                    friends_count: stats?.total_friends || 0,
                    login_days: 15,
                    points: profile?.pontos || 0
                  }}
                />
              </TabsContent>

              <TabsContent value="info" className="space-y-4 mt-4 animate-fade-in">
                <ProfileForm userId={profile?.id || ''} />
              </TabsContent>

              <TabsContent value="calendar" className="space-y-4 mt-4 animate-fade-in">
                <CalendarIntegration userId={profile?.id || ''} />
              </TabsContent>
            </Tabs>
          </main>

          {/* Right Sidebar - Desktop Only */}
          {!isMobile && (
            <aside className="hidden lg:block w-72 flex-shrink-0 space-y-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Estatísticas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Membro desde</span>
                    <span className="font-medium">{memberSince}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Maior sequência</span>
                    <span className="font-medium">{stats?.longest_streak || 0} dias</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">XP Total</span>
                    <span className="font-medium">{profile?.experience_points || 0}</span>
                  </div>
                </CardContent>
              </Card>
              
              <TrendingChallenges />
            </aside>
          )}
        </div>
      </div>
      <MobileBottomNav />
    </div>
  );
}
