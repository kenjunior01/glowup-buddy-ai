import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import ProfileForm from '@/components/ProfileForm';
import { BadgesSystem } from '@/components/BadgesSystem';
import { DailyMissions } from '@/components/DailyMissions';
import { CalendarIntegration } from '@/components/CalendarIntegration';
import { StoriesSystem } from '@/components/StoriesSystem';
import { CommunityGroups } from '@/components/CommunityGroups';
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
  Award
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

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

      // Fetch streak data
      const { data: streakData } = await supabase
        .from('streaks')
        .select('current_streak, longest_streak')
        .eq('user_id', session.user.id)
        .single();

      // Count friends
      const { count: friendsCount } = await supabase
        .from('friendships')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .eq('status', 'accepted');

      // Count plans
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
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border mobile-safe">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gradient flex items-center gap-2">
              <User className="w-6 h-6" />
              Meu Perfil
            </h1>
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

      <div className="p-4 space-y-6">
        {/* Profile Header */}
        <Card className="gradient-primary text-white">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Avatar className="w-20 h-20 border-4 border-white/20">
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
          <Card>
            <CardContent className="p-4 text-center">
              <Flame className="w-8 h-8 mx-auto mb-2 text-orange-500" />
              <div className="text-2xl font-bold">{stats?.current_streak || 0}</div>
              <div className="text-sm text-muted-foreground">Sequência</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              <div className="text-2xl font-bold">{profile?.total_challenges_completed || 0}</div>
              <div className="text-sm text-muted-foreground">Desafios</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Star className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">{stats?.total_friends || 0}</div>
              <div className="text-sm text-muted-foreground">Amigos</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Target className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold">{stats?.total_plans || 0}</div>
              <div className="text-sm text-muted-foreground">Planos</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="achievements">Conquistas</TabsTrigger>
            <TabsTrigger value="missions">Missões</TabsTrigger>
            <TabsTrigger value="calendar">Calendário</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            <ProfileForm userId={profile?.id || ''} />
          </TabsContent>

          <TabsContent value="achievements" className="space-y-4">
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

          <TabsContent value="missions" className="space-y-4">
            <DailyMissions userId={profile?.id || ''} />
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4">
            <CalendarIntegration userId={profile?.id || ''} />
          </TabsContent>

          <TabsContent value="social" className="space-y-4">
            <StoriesSystem 
              userId={profile?.id || ''} 
              userName={profile?.name || 'Usuário'}
              userAvatar={profile?.avatar_url}
            />
            <CommunityGroups 
              userId={profile?.id || ''}
              userName={profile?.name || 'Usuário'}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}