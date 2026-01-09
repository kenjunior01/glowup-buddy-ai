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
import HeroWelcome from '@/components/HeroWelcome';
import QuickReactions from '@/components/QuickReactions';
import StreakCelebration from '@/components/StreakCelebration';
import { Bell, Search, Plus, Target, Sparkles, Users, Newspaper, MessageCircle, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

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
  const [showStreakCelebration, setShowStreakCelebration] = useState(false);

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
          weeklyGrowth: Math.min(weeklyGrowth, 99),
          longest_streak: userStreak.longest_streak
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

      // Show celebration
      setShowStreakCelebration(true);

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
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 gradient-primary rounded-full animate-pulse-soft" />
          <p className="text-muted-foreground animate-pulse-soft">Carregando...</p>
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

  // Mobile Layout - TikTok/Instagram Inspired
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Streak Celebration Modal */}
      <StreakCelebration 
        streak={currentStreak + 1}
        isVisible={showStreakCelebration}
        onClose={() => setShowStreakCelebration(false)}
      />

      {/* Mobile Header - Minimal & Clean */}
      <div className="sticky top-16 z-30 glass">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="animate-fade-in">
            <h1 className="text-2xl font-bold text-gradient tracking-tight">GlowUp</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="w-11 h-11 rounded-xl tap-scale relative hover:bg-muted/50"
              onClick={() => navigate('/notifications')}
            >
              <Bell className="w-6 h-6" />
              <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="w-11 h-11 rounded-xl tap-scale hover:bg-muted/50"
              onClick={() => setActiveView('users')}
            >
              <Search className={cn(
                "w-6 h-6 transition-colors",
                activeView === 'users' && "text-primary"
              )} />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-5 space-y-6 pb-8">
        {/* Hero Welcome Card */}
        <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <HeroWelcome 
            userName={user?.profile?.name || 'Usuário'}
            currentStreak={currentStreak}
            level={userStats?.level || 1}
            points={userStats?.points || 0}
            onCheckIn={handleCheckIn}
          />
        </div>

        {/* Stories Row */}
        {stories.length > 0 && (
          <div className="animate-fade-in-up -mx-5 px-5" style={{ animationDelay: '200ms' }}>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              <StoryRing isAddStory onClick={() => {}} />
              {stories.map((story, index) => (
                <div 
                  key={index}
                  className="animate-scale-in"
                  style={{ animationDelay: `${(index + 1) * 100}ms` }}
                >
                  <StoryRing user={story} onClick={() => {}} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Stats - Horizontal Scroll */}
        <div className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <QuickStats stats={userStats || {}} />
        </div>

        {/* Quick Actions Row */}
        <div className="animate-fade-in-up flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-5 px-5" style={{ animationDelay: '400ms' }}>
          <Button 
            variant="outline" 
            className="flex-shrink-0 gap-2 h-12 px-4 rounded-xl bg-card border-border/50 hover:bg-muted/50 tap-scale"
            onClick={() => navigate('/chat')}
          >
            <MessageCircle className="w-5 h-5 text-primary" />
            <span className="font-medium">Chat IA</span>
          </Button>
          <Button 
            variant="outline" 
            className="flex-shrink-0 gap-2 h-12 px-4 rounded-xl bg-card border-border/50 hover:bg-muted/50 tap-scale"
            onClick={() => setActiveView('challenges')}
          >
            <Target className="w-5 h-5 text-orange-500" />
            <span className="font-medium">Desafios</span>
          </Button>
          <Button 
            variant="outline" 
            className="flex-shrink-0 gap-2 h-12 px-4 rounded-xl bg-card border-border/50 hover:bg-muted/50 tap-scale"
            onClick={() => setActiveView('plans')}
          >
            <Sparkles className="w-5 h-5 text-purple-500" />
            <span className="font-medium">Planos IA</span>
          </Button>
        </div>

        {/* Main Tabs */}
        <div className="animate-fade-in-up" style={{ animationDelay: '500ms' }}>
          <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-5 h-14 bg-muted/30 backdrop-blur-sm p-1.5 rounded-2xl">
              {[
                { value: 'goals', icon: Target, label: 'Metas' },
                { value: 'plans', icon: Sparkles, label: 'IA' },
                { value: 'challenges', icon: Plus, label: 'Desafios' },
                { value: 'feed', icon: Newspaper, label: 'Feed' },
                { value: 'users', icon: Users, label: 'Social' },
              ].map(({ value, icon: Icon, label }) => (
                <TabsTrigger 
                  key={value}
                  value={value} 
                  className={cn(
                    "flex flex-col items-center gap-1 h-full rounded-xl transition-all duration-300",
                    "data-[state=active]:bg-card data-[state=active]:shadow-md",
                    "data-[state=active]:text-primary"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">{label}</span>
                </TabsTrigger>
              ))}
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

        {/* Gamification Hub - Compact for mobile */}
        <div className="animate-fade-in-up" style={{ animationDelay: '600ms' }}>
          <GamificationHub />
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Challenge Modal */}
      <ChallengeModal
        isOpen={showChallengeModal}
        onClose={() => setShowChallengeModal(false)}
        targetUserId={selectedUserId}
        targetUserName={selectedUserName}
      />
    </div>
  );
}
