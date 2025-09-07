import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import RealSocialFeed from '@/components/RealSocialFeed';
import UsersList from '@/components/UsersList';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, Award } from 'lucide-react';

export default function Social() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, name, pontos, level')
        .order('pontos', { ascending: false })
        .limit(10);
      
      setLeaderboard(data || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChallengeUser = (userId: string, userName: string) => {
    // Navigate to challenge creation or show modal
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
        <LoadingSpinner text="Carregando comunidade..." className="mt-20" />
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="feed">Feed</TabsTrigger>
            <TabsTrigger value="ranking">Ranking</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="space-y-4">
            <RealSocialFeed />
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
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Carregando ranking...
                  </div>
                ) : (
                  <div className="space-y-3">
                    {leaderboard.map((user, index) => (
                      <div
                        key={user.id}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          index === 0 ? 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20' :
                          index === 1 ? 'bg-gradient-to-r from-gray-500/10 to-gray-600/10 border border-gray-500/20' :
                          index === 2 ? 'bg-gradient-to-r from-orange-600/10 to-orange-700/10 border border-orange-600/20' :
                          'bg-secondary/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                            index === 0 ? 'bg-yellow-500 text-white' :
                            index === 1 ? 'bg-gray-500 text-white' :
                            index === 2 ? 'bg-orange-600 text-white' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {index < 3 ? '🏆' : index + 1}
                          </div>
                          <div>
                            <p className="font-semibold">{user.name || 'Usuário'}</p>
                            <p className="text-sm text-muted-foreground">Nível {user.level}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">{user.pontos || 0}</p>
                          <p className="text-xs text-muted-foreground">pontos</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <UsersList onChallengeUser={handleChallengeUser} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}