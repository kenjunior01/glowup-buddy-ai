import { useState, useEffect } from 'react';
import { Search, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  name: string;
  avatar_url?: string;
  level?: number;
  pontos?: number;
}

interface UserSearchProps {
  onChallengeUser?: (userId: string, userName: string) => void;
}

export const UserSearch = ({ onChallengeUser }: UserSearchProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchUsers();
    } else {
      setUsers([]);
    }
  }, [searchTerm, currentUserId]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const searchUsers = async () => {
    if (!currentUserId) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, avatar_url, level, pontos')
      .neq('id', currentUserId)
      .ilike('name', `%${searchTerm}%`)
      .limit(10);

    if (error) {
      console.error('Error searching users:', error);
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  const sendFriendRequest = async (friendId: string, friendName: string) => {
    const { error } = await supabase
      .from('friendships')
      .insert({
        user_id: currentUserId,
        friend_id: friendId,
        status: 'pending'
      });

    if (error) {
      if (error.code === '23505') { // Unique violation
        toast({
          title: "Pedido já enviado",
          description: "Você já enviou um pedido de amizade para este usuário.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível enviar o pedido de amizade.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Pedido enviado!",
        description: `Pedido de amizade enviado para ${friendName}.`,
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Buscar usuários por nome..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading && (
        <div className="text-center py-4 text-muted-foreground">
          Buscando usuários...
        </div>
      )}

      <div className="space-y-3">
        {users.map((user) => (
          <Card key={user.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback>
                      {user.name?.slice(0, 2).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user.name || 'Usuário'}</p>
                    <p className="text-sm text-muted-foreground">
                      Nível {user.level || 1} • {user.pontos || 0} pontos
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => sendFriendRequest(user.id, user.name || 'Usuário')}
                  >
                    <UserPlus className="w-4 h-4 mr-1" />
                    Adicionar
                  </Button>
                  {onChallengeUser && (
                    <Button
                      size="sm"
                      onClick={() => onChallengeUser(user.id, user.name || 'Usuário')}
                    >
                      Desafiar
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {searchTerm.length >= 2 && users.length === 0 && !loading && (
        <div className="text-center py-8 text-muted-foreground">
          <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum usuário encontrado para "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
};