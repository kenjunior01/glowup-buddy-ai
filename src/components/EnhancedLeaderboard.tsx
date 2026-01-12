import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { getRankByPoints, getPositionInfo } from '@/lib/ranking';
import { Trophy, Medal, Crown, Flame, TrendingUp, Users, Star, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeaderboardUser {
  id: string;
  display_name: string;
  avatar_url: string | null;
  pontos: number;
  level: number;
  total_challenges_completed: number;
}

interface EnhancedLeaderboardProps {
  currentUserId?: string;
  limit?: number;
}

export const EnhancedLeaderboard = ({ currentUserId, limit = 10 }: EnhancedLeaderboardProps) => {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pontos');

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase.rpc('get_leaderboard', { limit_count: 50 });
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const sortedUsers = [...users].sort((a, b) => {
    if (activeTab === 'pontos') return (b.pontos || 0) - (a.pontos || 0);
    if (activeTab === 'level') return (b.level || 1) - (a.level || 1);
    if (activeTab === 'challenges') return (b.total_challenges_completed || 0) - (a.total_challenges_completed || 0);
    return 0;
  }).slice(0, limit);

  const currentUserPosition = users.findIndex(u => u.id === currentUserId) + 1;
  const currentUser = users.find(u => u.id === currentUserId);

  const getPositionIcon = (position: number) => {
    if (position === 1) return <Crown className="w-5 h-5 text-yellow-500 animate-pulse" />;
    if (position === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (position === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">#{position}</span>;
  };

  const getPositionStyles = (position: number) => {
    if (position === 1) return 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-300 dark:from-yellow-900/30 dark:to-amber-900/30 dark:border-yellow-700';
    if (position === 2) return 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-300 dark:from-gray-800/30 dark:to-slate-800/30 dark:border-gray-600';
    if (position === 3) return 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300 dark:from-amber-900/30 dark:to-orange-900/30 dark:border-amber-700';
    return 'bg-card hover:bg-muted/50';
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-14 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-0 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg">Ranking</span>
              <p className="text-xs font-normal text-muted-foreground">
                Top {limit} jogadores
              </p>
            </div>
          </CardTitle>
          
          {currentUserPosition > 0 && (
            <Badge 
              variant="secondary" 
              className="bg-primary/10 text-primary border-primary/20"
            >
              <Star className="w-3 h-3 mr-1" />
              Você: #{currentUserPosition}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-3 rounded-none border-b bg-transparent h-auto p-0">
            <TabsTrigger 
              value="pontos"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-3 gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Pontos</span>
            </TabsTrigger>
            <TabsTrigger 
              value="level"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-3 gap-1.5"
            >
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Nível</span>
            </TabsTrigger>
            <TabsTrigger 
              value="challenges"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-3 gap-1.5"
            >
              <Flame className="w-4 h-4" />
              <span className="hidden sm:inline">Desafios</span>
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[350px]">
            <TabsContent value={activeTab} className="m-0 p-3 space-y-2">
              {sortedUsers.map((user, index) => {
                const position = index + 1;
                const rank = getRankByPoints(user.pontos || 0);
                const positionInfo = getPositionInfo(position);
                const isCurrentUser = user.id === currentUserId;
                
                return (
                  <div
                    key={user.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border transition-all",
                      getPositionStyles(position),
                      isCurrentUser && "ring-2 ring-primary shadow-md",
                      "hover:scale-[1.01]"
                    )}
                  >
                    {/* Posição */}
                    <div className="w-8 flex items-center justify-center">
                      {getPositionIcon(position)}
                    </div>

                    {/* Avatar e info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="relative">
                        <Avatar className={cn(
                          "w-10 h-10 border-2",
                          position === 1 && "border-yellow-400",
                          position === 2 && "border-gray-400",
                          position === 3 && "border-amber-500",
                          position > 3 && "border-muted"
                        )}>
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback className={cn(
                            "text-sm font-bold",
                            `bg-gradient-to-br ${rank.gradient} text-white`
                          )}>
                            {(user.display_name || 'U')[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        {/* Rank badge */}
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-background border flex items-center justify-center text-xs">
                          {rank.emoji}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={cn(
                            "font-semibold text-sm truncate",
                            isCurrentUser && "text-primary"
                          )}>
                            {user.display_name || 'Usuário'}
                          </p>
                          {isCurrentUser && (
                            <Badge variant="outline" className="text-[10px] px-1 py-0">
                              VOCÊ
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className={rank.color}>{rank.name}</span>
                          <span>•</span>
                          <span>Nv.{user.level || 1}</span>
                        </div>
                      </div>
                    </div>

                    {/* Estatística principal */}
                    <div className="text-right">
                      <p className="font-bold text-sm">
                        {activeTab === 'pontos' && `${(user.pontos || 0).toLocaleString()}`}
                        {activeTab === 'level' && `Nv.${user.level || 1}`}
                        {activeTab === 'challenges' && `${user.total_challenges_completed || 0}`}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {activeTab === 'pontos' && 'pontos'}
                        {activeTab === 'level' && 'nível'}
                        {activeTab === 'challenges' && 'desafios'}
                      </p>
                    </div>
                  </div>
                );
              })}

              {sortedUsers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum jogador encontrado</p>
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {/* Footer com posição atual */}
        {currentUser && currentUserPosition > limit && (
          <div className="p-3 border-t bg-muted/30">
            <div className="flex items-center gap-3 p-2 rounded-lg bg-primary/10 border border-primary/20">
              <div className="w-8 text-center text-sm font-bold text-primary">
                #{currentUserPosition}
              </div>
              <Avatar className="w-8 h-8 border-2 border-primary">
                <AvatarImage src={currentUser.avatar_url || undefined} />
                <AvatarFallback className="text-xs bg-primary text-white">
                  {(currentUser.display_name || 'U')[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="flex-1 text-sm font-medium">
                {currentUser.display_name || 'Você'}
              </span>
              <span className="text-sm font-bold text-primary">
                {(currentUser.pontos || 0).toLocaleString()} pts
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
