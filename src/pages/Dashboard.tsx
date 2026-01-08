import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import GamificationHub from '@/components/GamificationHub';
import MobileBottomNav from '@/components/MobileBottomNav';
import StoryRing from '@/components/StoryRing';
import StreakCounter from '@/components/StreakCounter';
import QuickStats from '@/components/QuickStats';
import RealSocialFeed from '@/components/RealSocialFeed';
import UsersList from '@/components/UsersList';
import ChallengeModal from '@/components/ChallengeModal';
import MyChallenges from '@/components/MyChallenges';
import GoalsWithAI from '@/components/GoalsWithAI';
import PlansView from '@/components/PlansView';
import SuggestedUsers from '@/components/SuggestedUsers';
import TrendingChallenges from '@/components/TrendingChallenges';
import QuickActions from '@/components/QuickActions';
import { Bell, Search, Plus, Target, Sparkles, Users, Newspaper, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';

export default function Dashboard() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [user, setUser] = useState<any>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedUserName, setSelectedUserName] = useState<string>('');
  const [activeView, setActiveView] = useState<'feed' | 'users' | 'challenges' | 'goals' | 'plans'>('goals');

  const [stories, setStories] = useState<any[]>([]);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        const { data: streak } = await supabase
          .from('streaks')
          .select('current_streak, longest_streak')
          .eq('user_id', session.user.id)
          .single();

        const { count: friendsCount } = await supabase
          .from('friendships')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', session.user.id)
          .eq('status', 'accepted');

        const userProfile = profile || {};
        const userStreak = streak || { current_streak: 0, longest_streak: 0 };

        setUser({
          ...session.user,
          profile: userProfile
        });

        const { data: allUsers } = await supabase
          .from('profiles')
          .select('pontos')
          .order('pontos', { ascending: false });
        
        const userRank = allUsers ? allUsers.findIndex(u => (u.pontos || 0) <= ((userProfile as any)?.pontos || 0)) + 1 : 1;
        
        const weeklyGrowth = Math.floor(((userProfile as any)?.pontos || 0) / 10) % 100;

        setUserStats({
          level: (userProfile as any)?.level || 1,
          points: (userProfile as any)?.pontos || 0,
          rank: userRank,
          friends: friendsCount || 0,
          achievements: ((userProfile as any)?.conquistas as any[])?.length || 0,
          weeklyGrowth: Math.min(weeklyGrowth, 99)
        });

        setCurrentStreak(userStreak.current_streak);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      await supabase.functions.invoke('update-user-streak', {
        body: {}
      });

      fetchUserData();
    } catch (error) {
      console.error('Error updating streak:', error);
    }
  };

  const handleChallengeUser = (userId: string, userName: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setShowChallengeModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse-soft">
          <div className="w-8 h-8 gradient-primary rounded-full"></div>
        </div>
      </div>
    );
  }

  // Desktop Layout with sidebars
  if (!isMobile) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-16 z-30 bg-card/95 backdrop-blur-lg border-b border-border">
          <div className="max-w-7xl mx-auto flex items-center justify-between p-4">
            <div>
              <h1 className="text-2xl font-bold text-gradient">Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Olá, {user?.profile?.name || 'Usuário'}! 👋
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/chat')}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat IA
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative"
                onClick={() => navigate('/notifications')}
              >
                <Bell className="w-5 h-5" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full notification-pulse"></div>
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-12 gap-6">
            {/* Left Sidebar */}
            <aside className="col-span-3 space-y-4">
              <Card className="overflow-hidden">
                <CardHeader className="pb-3 bg-gradient-to-r from-primary/10 to-accent/10">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg">
                      {user?.profile?.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                      <CardTitle className="text-base">{user?.profile?.name || 'Usuário'}</CardTitle>
                      <p className="text-xs text-muted-foreground">Nível {userStats?.level || 1}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="text-lg font-bold text-primary">{userStats?.points || 0}</p>
                      <p className="text-[10px] text-muted-foreground">Pontos</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="text-lg font-bold text-accent">{currentStreak}</p>
                      <p className="text-[10px] text-muted-foreground">Streak</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <QuickActions />
              <SuggestedUsers />
            </aside>

            {/* Main Content */}
            <main className="col-span-6">
              <div className="space-y-6">
                <QuickStats stats={userStats || {}} />

                <StreakCounter
                  currentStreak={currentStreak}
                  longestStreak={userStats?.longest_streak || 0}
                  todayCompleted={false}
                  onCheckIn={handleCheckIn}
                />

                <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)} className="w-full">
                  <TabsList className="grid w-full grid-cols-5 mb-4">
                    <TabsTrigger value="goals" className="flex items-center gap-1">
                      <Target className="w-4 h-4" />
                      Objetivos
                    </TabsTrigger>
                    <TabsTrigger value="plans" className="flex items-center gap-1">
                      <Sparkles className="w-4 h-4" />
                      Planos IA
                    </TabsTrigger>
                    <TabsTrigger value="challenges" className="flex items-center gap-1">
                      <Plus className="w-4 h-4" />
                      Desafios
                    </TabsTrigger>
                    <TabsTrigger value="feed" className="flex items-center gap-1">
                      <Newspaper className="w-4 h-4" />
                      Feed
                    </TabsTrigger>
                    <TabsTrigger value="users" className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      Usuários
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="goals" className="space-y-4">
                    {user?.id && <GoalsWithAI userId={user.id} onDataChange={fetchUserData} />}
                  </TabsContent>

                  <TabsContent value="plans" className="space-y-4">
                    {user?.id && <PlansView userId={user.id} onDataChange={fetchUserData} />}
                  </TabsContent>

                  <TabsContent value="challenges" className="space-y-4">
                    <MyChallenges />
                  </TabsContent>

                  <TabsContent value="feed" className="space-y-4">
                    <RealSocialFeed />
                  </TabsContent>

                  <TabsContent value="users" className="space-y-4">
                    <UsersList onChallengeUser={handleChallengeUser} />
                  </TabsContent>
                </Tabs>
              </div>
            </main>

            {/* Right Sidebar */}
            <aside className="col-span-3 space-y-4">
              <GamificationHub />
              <TrendingChallenges />

              <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
                <CardContent className="pt-4 text-center">
                  <Sparkles className="h-8 w-8 mx-auto text-primary mb-2" />
                  <h3 className="font-semibold text-sm mb-1">Dica do Dia</h3>
                  <p className="text-xs text-muted-foreground">
                    Complete desafios diários para manter seu streak e ganhar mais pontos! 🔥
                  </p>
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>

        <ChallengeModal
          isOpen={showChallengeModal}
          onClose={() => setShowChallengeModal(false)}
          targetUserId={selectedUserId}
          targetUserName={selectedUserName}
        />
      </div>
    );
  }

  // Mobile Layout with enhanced animations
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header with glassmorphism */}
      <div className="sticky top-16 z-30 bg-card/80 backdrop-blur-xl border-b border-border/30 mobile-safe">
        <div className="flex items-center justify-between p-4">
          <div className="animate-fade-in">
            <h1 className="text-xl font-bold text-gradient">GlowUp</h1>
            <p className="text-sm text-muted-foreground">
              Olá, {user?.profile?.name || 'Usuário'}! 👋
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="scale-press tap-highlight relative hover:bg-primary/10 transition-all duration-300"
              onClick={() => navigate('/notifications')}
            >
              <Bell className="w-5 h-5" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full notification-pulse"></div>
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="scale-press tap-highlight hover:bg-primary/10 transition-all duration-300"
              onClick={() => setActiveView('users')}
            >
              <Search className={`w-5 h-5 transition-colors duration-300 ${activeView === 'users' ? 'text-primary' : ''}`} />
            </Button>
            <Button 
              size="icon" 
              className="social-button hover:scale-110 active:scale-95 transition-transform duration-200"
              onClick={() => setActiveView('challenges')}
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="space-y-6">
          {/* Stories section with animation */}
          {stories.length > 0 && (
            <div className="px-4 pt-4 animate-fade-in">
              <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
                <StoryRing isAddStory onClick={() => {}} />
                {stories.map((story, index) => (
                  <div 
                    key={index}
                    className="animate-scale-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <StoryRing
                      user={story}
                      onClick={() => {}}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Stats with staggered animation */}
          <div className="px-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
            <QuickStats stats={userStats || {}} />
          </div>

          {/* Streak Counter with bounce animation */}
          <div className="px-4 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <StreakCounter
              currentStreak={currentStreak}
              longestStreak={userStats?.longest_streak || 0}
              todayCompleted={false}
              onCheckIn={handleCheckIn}
            />
          </div>

          {/* Gamification Hub */}
          <div className="px-4 animate-fade-in" style={{ animationDelay: '300ms' }}>
            <GamificationHub />
          </div>

          {/* Tabs with improved mobile UX */}
          <div className="px-4 animate-fade-in" style={{ animationDelay: '400ms' }}>
            <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-5 mb-4 bg-muted/50 backdrop-blur-sm p-1 rounded-xl">
                <TabsTrigger 
                  value="goals" 
                  className="flex items-center gap-1 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-300 rounded-lg"
                >
                  <Target className="w-4 h-4" />
                  <span className="hidden sm:inline">Metas</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="plans" 
                  className="flex items-center gap-1 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-300 rounded-lg"
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden sm:inline">IA</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="challenges" 
                  className="flex items-center gap-1 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-300 rounded-lg"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Desafios</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="feed" 
                  className="flex items-center gap-1 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-300 rounded-lg"
                >
                  <Newspaper className="w-4 h-4" />
                  <span className="hidden sm:inline">Feed</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="users" 
                  className="flex items-center gap-1 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-300 rounded-lg"
                >
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">Social</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="goals" className="space-y-4 animate-fade-in">
                {user?.id && <GoalsWithAI userId={user.id} onDataChange={fetchUserData} />}
              </TabsContent>

              <TabsContent value="plans" className="space-y-4 animate-fade-in">
                {user?.id && <PlansView userId={user.id} onDataChange={fetchUserData} />}
              </TabsContent>

              <TabsContent value="challenges" className="space-y-4 animate-fade-in">
                <MyChallenges />
              </TabsContent>

              <TabsContent value="feed" className="space-y-4 animate-fade-in">
                <RealSocialFeed />
              </TabsContent>

              <TabsContent value="users" className="space-y-4 animate-fade-in">
                <UsersList onChallengeUser={handleChallengeUser} />
              </TabsContent>
            </Tabs>
          </div>

          <div className="h-8"></div>
        </div>
      </ScrollArea>

      <MobileBottomNav />

      <ChallengeModal
        isOpen={showChallengeModal}
        onClose={() => setShowChallengeModal(false)}
        targetUserId={selectedUserId}
        targetUserName={selectedUserName}
      />
    </div>
  );
}
