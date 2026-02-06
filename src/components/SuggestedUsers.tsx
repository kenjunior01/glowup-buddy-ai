import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { UserPlus, Loader2 } from 'lucide-react';
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

      const { data: friendships } = await supabase
        .from('friendships')
        .select('friend_id')
        .eq('user_id', session.user.id);

      const friendIds = friendships?.map(f => f.friend_id) || [];
      friendIds.push(session.user.id);

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
      <div className="bento-card p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Sugestões</h3>
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 bg-muted rounded w-20 animate-pulse" />
              <div className="h-2.5 bg-muted rounded w-14 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (users.length === 0) return null;

  return (
    <div className="bento-card p-4 space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Sugestões</h3>
      <div className="space-y-2.5">
        {users.map((user) => (
          <div key={user.id} className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                {user.display_name?.slice(0, 2).toUpperCase() || '??'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-foreground truncate">
                {user.display_name || 'Usuário'}
              </p>
              <p className="text-[10px] text-muted-foreground">
                Nv. {user.level || 1} • {user.total_challenges_completed || 0} desafios
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
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
      </div>
    </div>
  );
}
