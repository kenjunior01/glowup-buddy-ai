import React, { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import GamificationHub from '../components/GamificationHub';
import MobileBottomNav from '../components/MobileBottomNav';
import StoryRing from '../components/StoryRing';
import StreakCounter from '../components/StreakCounter';
import QuickStats from '../components/QuickStats';
import RealSocialFeed from '../components/RealSocialFeed';
import UsersList from '../components/UsersList';
import ChallengeModal from '../components/ChallengeModal';
import MyChallenges from '../components/MyChallenges';
import { Bell, Search, Plus } from 'lucide-react';
import { Button } from '../components/ui/button';
import { ScrollArea } from '../components/ui/scroll-area';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedUserName, setSelectedUserName] = useState<string>('');
  const [activeView, setActiveView] = useState<'feed' | 'users' | 'challenges'>('feed');

  // Mock stories - pode ser real depois
  const stories = [
    { name: 'Ana Silva', avatar: '', hasStory: true, isViewed: false },
    { name: 'Carlos', avatar: '', hasStory: true, isViewed: true },
    { name: 'Maria', avatar: '', hasStory: true, isViewed: false },
    { name: 'João', avatar: '', hasStory: false },
  ];

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Fetch user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        // Fetch user streak
        const { data: streak } = await supabase
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

        const userProfile = profile || {};
        const userStreak = streak || { current_streak: 0, longest_streak: 0 };

        setUser({
          ...session.user,
          profile: userProfile
        });

        setUserStats({
          level: (userProfile as any)?.level || 1,
          points: (userProfile as any)?.pontos || 0,
          rank: 127, // Mock rank for now
          friends: friendsCount || 0,
          achievements: ((userProfile as any)?.conquistas as any[])?.length || 0,
          weeklyGrowth: 12 // Mock growth
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

      await supabase.rpc('update_user_streak', {
        user_uuid: session.user.id
      });

      // Refresh user data
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

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border mobile-safe">
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="text-xl font-bold text-gradient">GlowUp</h1>
            <p className="text-sm text-muted-foreground">
              Olá, {user?.profile?.name || 'Usuário'}! 👋
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="scale-press tap-highlight relative"
              onClick={() => setActiveView('feed')}
            >
              <Bell className={`w-5 h-5 ${activeView === 'feed' ? 'text-primary' : ''}`} />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full notification-pulse"></div>
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="scale-press tap-highlight"
              onClick={() => setActiveView('users')}
            >
              <Search className={`w-5 h-5 ${activeView === 'users' ? 'text-primary' : ''}`} />
            </Button>
            <Button 
              size="icon" 
              className="social-button"
              onClick={() => setActiveView('challenges')}
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-140px)]">
        <div className="space-y-6">
          {/* Stories Section */}
          <div className="px-4 pt-4">
            <div className="flex space-x-4 overflow-x-auto pb-2">
              <StoryRing isAddStory onClick={() => console.log('Add story')} />
              {stories.map((story, index) => (
                <StoryRing
                  key={index}
                  user={story}
                  onClick={() => console.log('View story')}
                />
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="px-4">
            <QuickStats stats={userStats || {}} />
          </div>

          {/* Streak Counter */}
          <div className="px-4">
            <StreakCounter
              currentStreak={currentStreak}
              longestStreak={14}
              todayCompleted={false}
              onCheckIn={handleCheckIn}
            />
          </div>

          {/* Gamification Hub */}
          <div className="px-4">
            <GamificationHub />
          </div>

          {/* Dynamic Content Based on Active View */}
          <div className="px-4 space-y-4">
            {activeView === 'feed' && <RealSocialFeed />}
            {activeView === 'users' && (
              <UsersList onChallengeUser={handleChallengeUser} />
            )}
            {activeView === 'challenges' && <MyChallenges />}
          </div>

          {/* Bottom padding for mobile nav */}
          <div className="h-8"></div>
        </div>
      </ScrollArea>

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