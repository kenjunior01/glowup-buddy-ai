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
import OnboardingWizard from '@/components/OnboardingWizard';
import GamificationHelp from '@/components/GamificationHelp';
import { TickerTape } from '@/components/ads/TickerTape';
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
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(true);

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

        // Check if onboarding is completed
        const hasCompletedOnboarding = (userProfile as any)?.onboarding_completed === true;
        setOnboardingCompleted(hasCompletedOnboarding);
        if (!hasCompletedOnboarding) {
          setShowOnboarding(true);
        }

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
        {/* Onboarding Wizard */}
        {showOnboarding && user?.id && (
          <OnboardingWizard 
            userId={user.id} 
            onComplete={() => {
              setShowOnboarding(false);
              setOnboardingCompleted(true);
              fetchUserData();
            }} 
          />
        )}

        {/* Ticker Tape */}
        <TickerTape />

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
              <GamificationHelp />
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

  // Mobile Layout - Clean & Friendly
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Onboarding Wizard */}
      {showOnboarding && user?.id && (
        <OnboardingWizard 
          userId={user.id} 
          onComplete={() => {
            setShowOnboarding(false);
            setOnboardingCompleted(true);
            fetchUserData();
          }} 
        />
      )}

      {/* Streak Celebration Modal */}
      <StreakCelebration 
        streak={currentStreak + 1}
        isVisible={showStreakCelebration}
        onClose={() => setShowStreakCelebration(false)}
      />

      {/* Mobile Header - Compact */}
      <div className="sticky top-16 z-30 bg-card/95 backdrop-blur-lg border-b border-border/30">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <h1 className="text-lg font-bold text-gradient">GlowUp</h1>
          </div>
          
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm"
              className="w-9 h-9 rounded-lg tap-scale relative"
              onClick={() => navigate('/notifications')}
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="w-9 h-9 rounded-lg tap-scale"
              onClick={() => setActiveView('users')}
            >
              <Search className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 space-y-4 pt-3 pb-6">
        {/* Hero Welcome Card */}
        <HeroWelcome 
          userName={user?.profile?.name || 'Usuário'}
          currentStreak={currentStreak}
          level={userStats?.level || 1}
          points={userStats?.points || 0}
          onCheckIn={handleCheckIn}
        />

        {/* Quick Stats */}
        <QuickStats stats={userStats || {}} />

        {/* Quick Actions - Compact chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          <button 
            onClick={() => navigate('/chat')}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full bg-primary/10 text-primary text-xs font-medium tap-scale"
          >
            <span>💬</span> Chat IA
          </button>
          <button 
            onClick={() => setActiveView('challenges')}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full bg-orange-500/10 text-orange-600 text-xs font-medium tap-scale"
          >
            <span>🎯</span> Desafios
          </button>
          <button 
            onClick={() => setActiveView('plans')}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full bg-purple-500/10 text-purple-600 text-xs font-medium tap-scale"
          >
            <span>🤖</span> Planos IA
          </button>
          <button 
            onClick={() => navigate('/social')}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full bg-green-500/10 text-green-600 text-xs font-medium tap-scale"
          >
            <span>👥</span> Social
          </button>
        </div>

        {/* Main Tabs - Simplified */}
        <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-4 h-11 bg-muted/40 p-1 rounded-xl">
            {[
              { value: 'goals', emoji: '🎯', label: 'Metas' },
              { value: 'plans', emoji: '✨', label: 'IA' },
              { value: 'challenges', emoji: '🏆', label: 'Desafios' },
              { value: 'feed', emoji: '📱', label: 'Feed' },
              { value: 'users', emoji: '👥', label: 'Social' },
            ].map(({ value, emoji, label }) => (
              <TabsTrigger 
                key={value}
                value={value} 
                className={cn(
                  "flex flex-col items-center gap-0.5 h-full rounded-lg text-[10px] py-1",
                  "data-[state=active]:bg-card data-[state=active]:shadow-sm"
                )}
              >
                <span className="text-sm">{emoji}</span>
                <span className="font-medium">{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="goals" className="space-y-3">
            {user?.id && <GoalsWithAI userId={user.id} onDataChange={fetchUserData} />}
          </TabsContent>

          <TabsContent value="plans" className="space-y-3">
            {user?.id && <PlansView userId={user.id} onDataChange={fetchUserData} />}
          </TabsContent>

          <TabsContent value="challenges" className="space-y-3">
            <MyChallenges />
          </TabsContent>

          <TabsContent value="feed" className="space-y-3">
            <RealSocialFeed />
          </TabsContent>

          <TabsContent value="users" className="space-y-3">
            <UsersList onChallengeUser={handleChallengeUser} />
          </TabsContent>
        </Tabs>
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
