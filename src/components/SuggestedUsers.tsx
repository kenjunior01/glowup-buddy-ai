import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Sparkles, Trophy, TrendingUp, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SuggestedUser {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  level: number | null;
  pontos: number | null;
  total_challenges_completed: number | null;
}

export default function SuggestedUsers() {
  const [users, setUsers] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [pendingRequests, setPendingRequests] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    fetchSuggestedUsers();
  }, []);

  const fetchSuggestedUsers = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      
      setCurrentUserId(session.user.id);

      // Get users the current user is already friends with
      const { data: friendships } = await supabase
        .from('friendships')
        .select('friend_id')
        .eq('user_id', session.user.id);

      const friendIds = friendships?.map(f => f.friend_id) || [];
      friendIds.push(session.user.id); // Exclude self

      // Get top users by points/level that aren't friends
      const { data: suggestedData } = await supabase
        .rpc('get_leaderboard', { limit_count: 10 });

      if (suggestedData) {
        const filtered = suggestedData.filter(
          (u: SuggestedUser) => !friendIds.includes(u.id)
        ).slice(0, 5);
        setUsers(filtered);
      }
    } catch (error) {
      console.error('Error fetching suggested users:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (userId: string, userName: string) => {
    if (!currentUserId) return;

    setPendingRequests(prev => new Set(prev).add(userId));

    try {
      const { error } = await supabase
        .from('friendships')
        .insert({
          user_id: currentUserId,
          friend_id: userId,
          status: 'pending'
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Pedido já enviado",
            description: "Você já enviou um pedido para este usuário.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Pedido enviado! 🎉",
          description: `Solicitação enviada para ${userName}.`,
        });
        setUsers(prev => prev.filter(u => u.id !== userId));
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar o pedido.",
        variant: "destructive",
      });
    } finally {
      setPendingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Sugestões para você
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-24" />
                <div className="h-3 bg-muted rounded w-16" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (users.length === 0) return null;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Sugestões para você
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {users.map((user) => (
          <div key={user.id} className="flex items-center gap-3 group">
            <Avatar className="h-10 w-10 ring-2 ring-primary/20 group-hover:ring-primary/50 transition-all">
              <AvatarImage src={user.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-xs">
                {user.display_name?.slice(0, 2).toUpperCase() || '??'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">
                {user.display_name || 'Usuário'}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                  Nv. {user.level || 1}
                </Badge>
                <span className="flex items-center gap-0.5">
                  <Trophy className="h-3 w-3" />
                  {user.total_challenges_completed || 0}
                </span>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 hover:bg-primary hover:text-primary-foreground transition-all"
              onClick={() => sendFriendRequest(user.id, user.display_name || 'Usuário')}
              disabled={pendingRequests.has(user.id)}
            >
              {pendingRequests.has(user.id) ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
