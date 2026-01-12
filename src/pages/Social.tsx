import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import RealSocialFeed from '@/components/RealSocialFeed';
import { UserSearch } from '@/components/UserSearch';
import FriendsSystem from '@/components/FriendsSystem';
import { StoriesSystem } from '@/components/StoriesSystem';
import { SkeletonCard } from '@/components/SkeletonCard';
import SuggestedUsers from '@/components/SuggestedUsers';
import TrendingChallenges from '@/components/TrendingChallenges';
import { OnlineUsers } from '@/components/OnlineUsers';
import { EnhancedLeaderboard } from '@/components/EnhancedLeaderboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, Trophy, Camera, Sparkles, Heart, MessageCircle, Zap, Crown, Star } from 'lucide-react';
import MobileBottomNav from '@/components/MobileBottomNav';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export default function Social() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [userAvatar, setUserAvatar] = useState<string>('');
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [activeTab, setActiveTab] = useState('feed');
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, name, avatar_url')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          setUserName(profile.display_name || profile.name || 'Usuário');
          setUserAvatar(profile.avatar_url || '');
        }
        
        const { count } = await supabase
          .from('friendships')
          .select('*', { count: 'exact', head: true })
          .eq('friend_id', session.user.id)
          .eq('status', 'pending');
        setPendingRequestsCount(count || 0);
      }

      const { data } = await supabase
        .from('profiles')
        .select('id, name, pontos, level')
        .order('pontos', { ascending: false })
        .limit(10);
      
      setLeaderboard(data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChallengeUser = (userId: string, userName: string) => {
    console.log('Challenge user:', userId, userName);
  };

  const tabItems = [
    { id: 'feed', label: 'Feed', emoji: '📱', icon: MessageCircle },
    { id: 'stories', label: 'Stories', emoji: '📸', icon: Camera },
    { id: 'friends', label: 'Amigos', emoji: '👥', icon: Heart, badge: pendingRequestsCount },
    { id: 'ranking', label: 'Ranking', emoji: '🏆', icon: Trophy },
    { id: 'users', label: 'Buscar', emoji: '🔍', icon: Users },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="sticky top-0 z-40 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent backdrop-blur-xl border-b border-border mobile-safe">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg animate-pulse">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Comunidade GlowUp ✨</h1>
                <div className="h-3 w-32 bg-muted rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
        <div className="p-4 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <MobileBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      {/* Header melhorado */}
      <div className="sticky top-0 z-40 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-blue-500/10 backdrop-blur-xl border-b border-border/50 mobile-safe">
        <div className="max-w-7xl mx-auto p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 flex items-center justify-center shadow-lg">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  Comunidade
                  <span className="text-lg">✨</span>
                </h1>
                <p className="text-xs text-muted-foreground">
                  Conecte, compita e evolua 🚀
                </p>
              </div>
            </div>
            
            {/* Quick stats */}
            <div className="hidden sm:flex items-center gap-2">
              <Badge variant="secondary" className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 border-pink-500/30">
                <Heart className="w-3 h-3 mr-1" />
                {pendingRequestsCount > 0 ? `${pendingRequestsCount} novos` : 'Social'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        <div className="flex gap-6">
          {/* Left Sidebar - Desktop Only */}
          {!isMobile && (
            <aside className="hidden lg:block w-72 flex-shrink-0 space-y-4 animate-fade-in">
              <OnlineUsers />
              <SuggestedUsers />
            </aside>
          )}

          {/* Main Content */}
          <main className="flex-1 min-w-0 space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              {/* Tabs com design melhorado */}
              <TabsList className={cn(
                "w-full bg-muted/30 backdrop-blur-sm p-1 rounded-2xl border border-border/50 shadow-sm",
                isMobile ? "grid grid-cols-5 h-auto" : "flex justify-start gap-1"
              )}>
                {tabItems.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger 
                      key={tab.id}
                      value={tab.id} 
                      className={cn(
                        "relative transition-all duration-300 rounded-xl gap-1.5",
                        "data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/20 data-[state=active]:to-primary/10",
                        "data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-primary/20",
                        isMobile ? "flex-col py-2 px-1 text-[10px]" : "px-4 py-2 text-sm"
                      )}
                    >
                      <span className={cn(
                        "transition-transform",
                        isMobile ? "text-lg" : "hidden"
                      )}>
                        {tab.emoji}
                      </span>
                      {!isMobile && <Icon className="w-4 h-4" />}
                      <span className={isMobile ? "leading-tight" : ""}>{tab.label}</span>
                      
                      {tab.badge && tab.badge > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white text-[10px] flex items-center justify-center font-bold animate-bounce shadow-lg">
                          {tab.badge}
                        </div>
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              <TabsContent value="feed" className="space-y-4 animate-fade-in mt-4">
                {/* Quick action chips para mobile */}
                {isMobile && (
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {['🔥 Em alta', '💬 Recentes', '⭐ Populares', '📸 Fotos'].map((chip, i) => (
                      <Badge 
                        key={i}
                        variant="secondary" 
                        className="whitespace-nowrap cursor-pointer hover:bg-primary/20 transition-colors px-3 py-1.5 text-xs shrink-0"
                      >
                        {chip}
                      </Badge>
                    ))}
                  </div>
                )}
                <RealSocialFeed />
              </TabsContent>

              <TabsContent value="stories" className="space-y-4 animate-fade-in mt-4">
                {userId ? (
                  <StoriesSystem userId={userId} userName={userName} userAvatar={userAvatar} />
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="py-12 text-center">
                      <Camera className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">Faça login para ver stories 📸</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="friends" className="space-y-4 animate-fade-in mt-4">
                {userId ? (
                  <FriendsSystem userId={userId} />
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="py-12 text-center">
                      <Heart className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">Faça login para ver seus amigos 👥</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="ranking" className="space-y-4 animate-fade-in mt-4">
                <EnhancedLeaderboard currentUserId={userId} limit={15} />
              </TabsContent>

              <TabsContent value="users" className="space-y-6 animate-fade-in mt-4">
                <UserSearch onChallengeUser={handleChallengeUser} />
              </TabsContent>
            </Tabs>
          </main>

          {/* Right Sidebar - Desktop Only */}
          {!isMobile && (
            <aside className="hidden lg:block w-72 flex-shrink-0 space-y-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
              <TrendingChallenges />
              
              <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-primary/5 to-primary/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-yellow-500" />
                    Dica do Dia ✨
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Interaja com outros membros para ganhar pontos de experiência e subir no ranking! 🚀
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Badge variant="secondary" className="text-xs">
                      <Zap className="w-3 h-3 mr-1" />
                      +50 XP
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      <Crown className="w-3 h-3 mr-1" />
                      Ranking
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Achievement preview */}
              <Card className="overflow-hidden">
                <CardHeader className="pb-2 bg-gradient-to-r from-yellow-500/10 to-orange-500/10">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    Próxima Conquista
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-lg shadow-md">
                      👥
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Popular</p>
                      <p className="text-xs text-muted-foreground">15 amigos</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Raro
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </aside>
          )}
        </div>
      </div>
      
      <MobileBottomNav />
    </div>
  );
}
