import React, { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Users, UserPlus, Trophy, Zap } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface User {
  id: string;
  name: string;
  level: number;
  pontos: number;
  avatar_url?: string;
  total_challenges_completed: number;
}

interface UsersListProps {
  onChallengeUser?: (userId: string, userName: string) => void;
}

export default function UsersList({ onChallengeUser }: UsersListProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      setCurrentUserId(session.user.id);

      const { data: usersData, error } = await supabase
        .from('profiles')
        .select('id, name, level, pontos, avatar_url, total_challenges_completed')
        .neq('id', session.user.id)
        .order('pontos', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        return;
      }

      setUsers(usersData || []);
    } catch (error) {
      console.error('Error in fetchUsers:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (friendId: string, friendName: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .insert({
          user_id: currentUserId,
          friend_id: friendId,
          status: 'pending'
        });

      if (error) {
        console.error('Error sending friend request:', error);
        toast({
          title: "Erro",
          description: "Não foi possível enviar a solicitação de amizade",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Solicitação enviada!",
        description: `Solicitação de amizade enviada para ${friendName}`,
        className: "gradient-success text-white"
      });
    } catch (error) {
      console.error('Error in sendFriendRequest:', error);
    }
  };

  const handleChallengeUser = (userId: string, userName: string) => {
    if (onChallengeUser) {
      onChallengeUser(userId, userName);
    } else {
      toast({
        title: "Desafio enviado!",
        description: `Desafio enviado para ${userName}`,
        className: "gradient-primary text-white"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="ml-2 text-muted-foreground">Carregando usuários...</span>
      </div>
    );
  }

  return (
    <div className="post-card p-4 space-y-4">
      <div className="flex items-center space-x-2">
        <Users className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Comunidade GlowUp</h3>
        <Badge variant="secondary" className="text-xs">
          {users.length} usuários
        </Badge>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">👥</div>
          <p className="text-muted-foreground text-sm">
            Nenhum outro usuário encontrado ainda.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <div 
              key={user.id}
              className="flex items-center space-x-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-all duration-200"
            >
              <Avatar className="w-12 h-12">
                <AvatarImage src={user.avatar_url} alt={user.name} />
                <AvatarFallback className="text-sm font-semibold gradient-primary text-white">
                  {user.name?.slice(0, 2).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className="font-semibold text-sm">{user.name || 'Usuário'}</h4>
                  <Badge variant="outline" className="text-xs">
                    Nv. {user.level || 1}
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Zap className="w-3 h-3" />
                    <span>{user.pontos || 0} pontos</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Trophy className="w-3 h-3" />
                    <span>{user.total_challenges_completed || 0} desafios</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col space-y-2">
                <Button
                  size="sm"
                  onClick={() => handleChallengeUser(user.id, user.name)}
                  className="social-button text-xs px-3 py-1 h-7"
                >
                  Desafiar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => sendFriendRequest(user.id, user.name)}
                  className="text-xs px-3 py-1 h-7"
                >
                  <UserPlus className="w-3 h-3 mr-1" />
                  Adicionar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}