import React, { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import GamificationHub from '../components/GamificationHub';
import MobileBottomNav from '../components/MobileBottomNav';
import StoryRing from '../components/StoryRing';
import PostCard from '../components/PostCard';
import StreakCounter from '../components/StreakCounter';
import QuickStats from '../components/QuickStats';
import { Bell, Search, Plus } from 'lucide-react';
import { Button } from '../components/ui/button';
import { ScrollArea } from '../components/ui/scroll-area';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Mock data for social media features
  const stories = [
    { name: 'Ana Silva', avatar: '', hasStory: true, isViewed: false },
    { name: 'Carlos', avatar: '', hasStory: true, isViewed: true },
    { name: 'Maria', avatar: '', hasStory: true, isViewed: false },
    { name: 'João', avatar: '', hasStory: false },
  ];

  const posts = [
    {
      id: '1',
      user: { name: 'Ana Silva', avatar: '', level: 12 },
      type: 'achievement' as const,
      content: 'Consegui completar meu primeiro mês de exercícios consecutivos! 🎉',
      timestamp: '2h atrás',
      likes: 24,
      comments: 8,
      achievement: {
        title: 'Mestre da Consistência',
        points: 500,
        icon: '🏆'
      }
    },
    {
      id: '2', 
      user: { name: 'Carlos Mendes', avatar: '', level: 8 },
      type: 'progress' as const,
      content: 'Mais um dia focado nos estudos! Quase chegando na meta mensal.',
      timestamp: '4h atrás',
      likes: 15,
      comments: 3,
      progress: {
        current: 18,
        target: 25,
        unit: 'dias'
      }
    },
    {
      id: '3',
      user: { name: 'Maria Santos', avatar: '', level: 15 },
      type: 'social' as const, 
      content: 'Bom dia pessoal! Quem mais vai encarar o desafio de 10.000 passos hoje? 💪',
      timestamp: '6h atrás',
      likes: 31,
      comments: 12
    }
  ];

  const userStats = {
    level: 9,
    points: 12450,
    rank: 127,
    friends: 23,
    achievements: 15,
    weeklyGrowth: 12
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          setUser({
            ...session.user,
            profile: profile || {}
          });
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleCheckIn = () => {
    // Handle daily check-in logic
    console.log('Daily check-in completed!');
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
            <Button variant="ghost" size="icon" className="scale-press tap-highlight relative">
              <Bell className="w-5 h-5" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full notification-pulse"></div>
            </Button>
            <Button variant="ghost" size="icon" className="scale-press tap-highlight">
              <Search className="w-5 h-5" />
            </Button>
            <Button size="icon" className="social-button">
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
            <QuickStats stats={userStats} />
          </div>

          {/* Streak Counter */}
          <div className="px-4">
            <StreakCounter
              currentStreak={7}
              longestStreak={14}
              todayCompleted={false}
              onCheckIn={handleCheckIn}
            />
          </div>

          {/* Gamification Hub */}
          <div className="px-4">
            <GamificationHub />
          </div>

          {/* Social Feed */}
          <div className="px-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Feed da Comunidade</h2>
              <Button variant="ghost" size="sm" className="text-primary">
                Ver todos
              </Button>
            </div>
            
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>

          {/* Bottom padding for mobile nav */}
          <div className="h-8"></div>
        </div>
      </ScrollArea>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}