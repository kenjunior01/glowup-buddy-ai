import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import GamificationHub from '@/components/GamificationHub';
import MobileBottomNav from '@/components/MobileBottomNav';
import StoryRing from '@/components/StoryRing';
import StreakProtection from '@/components/StreakProtection';
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
import MoodTracker from '@/components/MoodTracker';
import SundayReset from '@/components/SundayReset';
import BuddyChallenge from '@/components/BuddyChallenge';
import { TickerTape } from '@/components/ads/TickerTape';
import { Bell, Search, Plus, Target, Sparkles, Users, Newspaper, MessageCircle, ChevronRight, Heart } from 'lucide-react';
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
  const [activeView, setActiveView] = useState<'feed' | 'users' | 'challenges' | 'goals' | 'plans' | 'buddy'>('goals');
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
          <div className="w-12 h-12 rounded-full bg-primary/20 animate-pulse" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
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

        {/* Header - Clean Glow Style */}
        <div className="sticky top-16 z-30 bg-background/80 backdrop-blur-md border-b border-border/40">
          <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
            <div>
              <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Olá, {user?.profile?.name || 'Usuário'}!
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <GamificationHelp />
              <Button 
                variant="outline" 
                size="sm"
                className="border-border/60 hover:bg-muted/50"
                onClick={() => navigate('/chat')}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat IA
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative hover:bg-muted/50"
                onClick={() => navigate('/notifications')}
              >
                <Bell className="w-5 h-5 text-muted-foreground" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-12 gap-8">
            {/* Left Sidebar - Clean Glow */}
            <aside className="col-span-3 space-y-6">
              {/* Profile Card - Bento Style */}
              <div className="bento-card p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg">
                    {user?.profile?.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{user?.profile?.name || 'Usuário'}</p>
                    <p className="text-xs text-muted-foreground">Nível {userStats?.level || 1}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 rounded-lg bg-muted/30">
                    <p className="text-lg font-bold text-foreground">{userStats?.points || 0}</p>
                    <p className="text-[10px] text-muted-foreground">Pontos</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/30">
                    <p className="text-lg font-bold text-foreground">{currentStreak}</p>
                    <p className="text-[10px] text-muted-foreground">Streak</p>
                  </div>
                </div>
              </div>

              <QuickActions />
              <SuggestedUsers />
            </aside>

            {/* Main Content */}
            <main className="col-span-6">
              <div className="space-y-6">
                <QuickStats stats={userStats || {}} />

                {/* Mood Tracker */}
                {user?.id && <MoodTracker userId={user.id} onMoodLogged={fetchUserData} />}

                <StreakProtection
                  userId={user?.id || ''}
                  currentStreak={currentStreak}
                  longestStreak={userStats?.longest_streak || 0}
                  todayCompleted={false}
                  onCheckIn={handleCheckIn}
                  onStreakUpdate={fetchUserData}
                />

                <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)} className="w-full">
                  <TabsList className="grid w-full grid-cols-6 mb-4">
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
                    <TabsTrigger value="buddy" className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      Dupla
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

                  <TabsContent value="buddy" className="space-y-4">
                    {user?.id && <BuddyChallenge userId={user.id} onChallengeCreated={fetchUserData} />}
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
              
              {/* Sunday Reset */}
              {user?.id && <SundayReset userId={user.id} />}
              
              <TrendingChallenges />
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

  // Mobile Layout - Clean Glow Style
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

      {/* Mobile Header - Clean Glow */}
      <div className="sticky top-16 z-30 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-semibold text-foreground">GlowUp</h1>
          
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm"
              className="w-9 h-9 rounded-lg relative hover:bg-muted/50"
              onClick={() => navigate('/notifications')}
            >
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="w-9 h-9 rounded-lg hover:bg-muted/50"
              onClick={() => setActiveView('users')}
            >
              <Search className="w-5 h-5 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 space-y-5 pt-4 pb-6">
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

        {/* Quick Actions - Clean Chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          <button 
            onClick={() => navigate('/chat')}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full bg-primary/10 text-primary text-xs font-medium"
          >
            <span>💬</span> Chat IA
          </button>
          <button 
            onClick={() => setActiveView('challenges')}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full bg-accent/10 text-accent text-xs font-medium"
          >
            <span>🎯</span> Desafios
          </button>
          <button 
            onClick={() => setActiveView('plans')}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full bg-secondary text-secondary-foreground text-xs font-medium"
          >
            <span>🤖</span> Planos IA
          </button>
          <button 
            onClick={() => navigate('/social')}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full bg-muted text-muted-foreground text-xs font-medium"
          >
            <span>👥</span> Social
          </button>
        </div>

        {/* Main Tabs - Simplified */}
        <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-4 h-11 bg-muted/40 p-1 rounded-xl">
            {[
              { value: 'goals', emoji: '🎯', label: 'Metas' },
              { value: 'plans', emoji: '✨', label: 'IA' },
              { value: 'challenges', emoji: '🏆', label: 'Desafios' },
              { value: 'buddy', emoji: '💕', label: 'Dupla' },
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
            {user?.id && <MoodTracker userId={user.id} onMoodLogged={fetchUserData} />}
            {user?.id && <GoalsWithAI userId={user.id} onDataChange={fetchUserData} />}
          </TabsContent>

          <TabsContent value="plans" className="space-y-3">
            {user?.id && <PlansView userId={user.id} onDataChange={fetchUserData} />}
          </TabsContent>

          <TabsContent value="challenges" className="space-y-3">
            <MyChallenges />
          </TabsContent>

          <TabsContent value="buddy" className="space-y-3">
            {user?.id && <BuddyChallenge userId={user.id} onChallengeCreated={fetchUserData} />}
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
