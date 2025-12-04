import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import RealSocialFeed from '@/components/RealSocialFeed';
import { UserSearch } from '@/components/UserSearch';
import FriendsSystem from '@/components/FriendsSystem';
import { StoriesSystem } from '@/components/StoriesSystem';
import { SkeletonCard } from '@/components/SkeletonCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, Trophy, Camera } from 'lucide-react';
import MobileBottomNav from '@/components/MobileBottomNav';

export default function Social() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [userAvatar, setUserAvatar] = useState<string>('');
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        
        // Fetch user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, name, avatar_url')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          setUserName(profile.display_name || profile.name || 'Usuário');
          setUserAvatar(profile.avatar_url || '');
        }
        
        // Fetch pending friend requests count
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border mobile-safe">
          <div className="p-4">
            <h1 className="text-2xl font-bold text-gradient flex items-center gap-2">
              <Users className="w-6 h-6" />
              Comunidade GlowUp
            </h1>
          </div>
        </div>
        <div className="p-4 space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <MobileBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border mobile-safe">
        <div className="p-4">
          <h1 className="text-2xl font-bold text-gradient flex items-center gap-2">
            <Users className="w-6 h-6" />
            Comunidade GlowUp
          </h1>
          <p className="text-sm text-muted-foreground">
            Conecte-se, compita e evolua junto com outros membros
          </p>
        </div>
      </div>

      <div className="p-4 space-y-6">
        <Tabs defaultValue="feed" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="feed">Feed</TabsTrigger>
            <TabsTrigger value="stories">
              <Camera className="w-4 h-4 mr-1 hidden sm:inline" />
              Stories
            </TabsTrigger>
            <TabsTrigger value="friends" className="relative">
              Amigos
              {pendingRequestsCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center">
                  {pendingRequestsCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="ranking">Ranking</TabsTrigger>
            <TabsTrigger value="users">Buscar</TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="space-y-4">
            <RealSocialFeed />
          </TabsContent>

          <TabsContent value="stories" className="space-y-4">
            {userId ? (
              <StoriesSystem userId={userId} userName={userName} userAvatar={userAvatar} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Faça login para ver stories
              </div>
            )}
          </TabsContent>

          <TabsContent value="friends" className="space-y-4">
            {userId ? (
              <FriendsSystem userId={userId} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Faça login para ver seus amigos
              </div>
            )}
          </TabsContent>

          <TabsContent value="ranking" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Top 10 Ranking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {leaderboard.map((user, index) => (
                    <div
                      key={user.id}
                      className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                        index === 0 ? 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20' :
                        index === 1 ? 'bg-gradient-to-r from-gray-500/10 to-gray-600/10 border border-gray-500/20' :
                        index === 2 ? 'bg-gradient-to-r from-orange-600/10 to-orange-700/10 border border-orange-600/20' :
                        'bg-secondary/30 hover:bg-secondary/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0 ? 'bg-yellow-500 text-white' :
                          index === 1 ? 'bg-gray-400 text-white' :
                          index === 2 ? 'bg-orange-600 text-white' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {index < 3 ? <Trophy className="w-4 h-4" /> : index + 1}
                        </div>
                        <div>
                          <p className="font-semibold">{user.name || 'Usuário'}</p>
                          <p className="text-sm text-muted-foreground">Nível {user.level || 1}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">{user.pontos || 0}</p>
                        <p className="text-xs text-muted-foreground">pontos</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <UserSearch onChallengeUser={handleChallengeUser} />
          </TabsContent>
        </Tabs>
      </div>
      <MobileBottomNav />
    </div>
  );
}
