import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { UserPlus, UserCheck, UserX, Users, Search, Trophy, Zap, Clock } from 'lucide-react';
import EmptyState from './EmptyState';

interface Profile {
  id: string;
  name: string | null;
  avatar_url: string | null;
  pontos: number;
  level: number;
}

interface FriendRequest {
  id: string;
  user_id: string;
  friend_id: string;
  status: string;
  created_at: string;
  profiles: Profile;
}

interface FriendsSystemProps {
  userId: string;
}

export default function FriendsSystem({ userId }: FriendsSystemProps) {
  const [friends, setFriends] = useState<Profile[]>([]);
  const [pendingReceived, setPendingReceived] = useState<FriendRequest[]>([]);
  const [pendingSent, setPendingSent] = useState<FriendRequest[]>([]);
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      fetchAllData();
    }
  }, [userId]);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([fetchFriends(), fetchPendingRequests(), fetchAllUsers()]);
    setLoading(false);
  };

  const fetchFriends = async () => {
    // Friends where I'm user_id
    const { data: friends1 } = await supabase
      .from('friendships')
      .select('friend_id')
      .eq('user_id', userId)
      .eq('status', 'accepted');

    // Friends where I'm friend_id
    const { data: friends2 } = await supabase
      .from('friendships')
      .select('user_id')
      .eq('friend_id', userId)
      .eq('status', 'accepted');

    const friendIds = [
      ...(friends1?.map(f => f.friend_id) || []),
      ...(friends2?.map(f => f.user_id) || []),
    ];

    if (friendIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, avatar_url, pontos, level')
        .in('id', friendIds);
      setFriends(profiles || []);
    } else {
      setFriends([]);
    }
  };

  const fetchPendingRequests = async () => {
    // Requests I received
    const { data: received } = await supabase
      .from('friendships')
      .select('id, user_id, friend_id, status, created_at')
      .eq('friend_id', userId)
      .eq('status', 'pending');

    if (received && received.length > 0) {
      const senderIds = received.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, avatar_url, pontos, level')
        .in('id', senderIds);
      
      const receivedWithProfiles = received.map(r => ({
        ...r,
        profiles: profiles?.find(p => p.id === r.user_id) || { id: r.user_id, name: null, avatar_url: null, pontos: 0, level: 1 }
      })) as FriendRequest[];
      setPendingReceived(receivedWithProfiles);
    } else {
      setPendingReceived([]);
    }

    // Requests I sent
    const { data: sent } = await supabase
      .from('friendships')
      .select('id, user_id, friend_id, status, created_at')
      .eq('user_id', userId)
      .eq('status', 'pending');

    if (sent && sent.length > 0) {
      const receiverIds = sent.map(s => s.friend_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, avatar_url, pontos, level')
        .in('id', receiverIds);
      
      const sentWithProfiles = sent.map(s => ({
        ...s,
        profiles: profiles?.find(p => p.id === s.friend_id) || { id: s.friend_id, name: null, avatar_url: null, pontos: 0, level: 1 }
      })) as FriendRequest[];
      setPendingSent(sentWithProfiles);
    } else {
      setPendingSent([]);
    }
  };

  const fetchAllUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, name, avatar_url, pontos, level')
      .neq('id', userId)
      .order('pontos', { ascending: false })
      .limit(50);
    setAllUsers(data || []);
  };

  const sendFriendRequest = async (friendId: string) => {
    const { error } = await supabase.from('friendships').insert({
      user_id: userId,
      friend_id: friendId,
      status: 'pending',
    });

    if (error) {
      if (error.code === '23505') {
        toast({ title: 'Pedido já enviado', description: 'Você já enviou um pedido para este usuário.', variant: 'destructive' });
      } else {
        toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      }
    } else {
      toast({ title: 'Pedido enviado!', description: 'Aguardando aceitação.' });
      // Create notification for the friend
      await supabase.from('notifications').insert({
        user_id: friendId,
        title: 'Novo pedido de amizade',
        message: 'Alguém quer ser seu amigo no GlowUp!',
        type: 'friend_request',
      });
      fetchAllData();
    }
  };

  const acceptRequest = async (requestId: string, senderId: string) => {
    await supabase.from('friendships').update({ status: 'accepted' }).eq('id', requestId);
    // Notify sender
    await supabase.from('notifications').insert({
      user_id: senderId,
      title: 'Pedido aceito!',
      message: 'Seu pedido de amizade foi aceito. Vocês agora são amigos!',
      type: 'friend_request',
    });
    toast({ title: 'Amizade aceita!', description: 'Vocês agora são amigos no GlowUp.' });
    fetchAllData();
  };

  const rejectRequest = async (requestId: string) => {
    await supabase.from('friendships').delete().eq('id', requestId);
    toast({ title: 'Pedido recusado' });
    fetchAllData();
  };

  const cancelRequest = async (requestId: string) => {
    await supabase.from('friendships').delete().eq('id', requestId);
    toast({ title: 'Pedido cancelado' });
    fetchAllData();
  };

  const removeFriend = async (friendId: string) => {
    // Delete from both directions
    await supabase.from('friendships').delete().or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`);
    toast({ title: 'Amizade removida' });
    fetchAllData();
  };

  const getRelationship = (targetId: string) => {
    if (friends.some(f => f.id === targetId)) return 'friend';
    if (pendingSent.some(p => p.profiles.id === targetId)) return 'pending_sent';
    if (pendingReceived.some(p => p.profiles.id === targetId)) return 'pending_received';
    return 'none';
  };

  const filteredUsers = allUsers.filter(user => {
    const matchesSearch = !searchQuery || user.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffInDays === 0) return 'Hoje';
    if (diffInDays === 1) return 'Ontem';
    if (diffInDays < 7) return `${diffInDays} dias atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  const renderUserCard = (user: Profile, relationship: string, requestId?: string) => (
    <Card key={user.id} className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Avatar className="w-12 h-12 border-2 border-primary/20">
            <AvatarImage src={user.avatar_url || ''} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {user.name?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold truncate">{user.name || 'Usuário'}</h4>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Trophy className="w-3 h-3" />
              <span>{user.pontos || 0} pts</span>
              <Zap className="w-3 h-3 ml-2" />
              <span>Nível {user.level || 1}</span>
            </div>
          </div>
          <div className="flex gap-2">
            {relationship === 'none' && (
              <Button size="sm" onClick={() => sendFriendRequest(user.id)}>
                <UserPlus className="w-4 h-4 mr-1" /> Adicionar
              </Button>
            )}
            {relationship === 'pending_sent' && (
              <Button size="sm" variant="outline" disabled>
                <Clock className="w-4 h-4 mr-1" /> Pendente
              </Button>
            )}
            {relationship === 'pending_received' && requestId && (
              <>
                <Button size="sm" onClick={() => acceptRequest(requestId, user.id)}>
                  <UserCheck className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => rejectRequest(requestId)}>
                  <UserX className="w-4 h-4" />
                </Button>
              </>
            )}
            {relationship === 'friend' && (
              <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                <UserCheck className="w-3 h-3 mr-1" /> Amigos
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6" />
          Amigos
        </h2>
        <p className="text-sm text-muted-foreground">
          {friends.length} amigos • {pendingReceived.length} pedidos pendentes
        </p>
      </div>

      <Tabs defaultValue="friends" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="friends">
            Amigos
            {friends.length > 0 && <Badge variant="secondary" className="ml-1">{friends.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="requests">
            Pedidos
            {pendingReceived.length > 0 && <Badge className="ml-1">{pendingReceived.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="sent">Enviados</TabsTrigger>
          <TabsTrigger value="discover">Descobrir</TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="space-y-3 mt-4">
          {friends.length === 0 ? (
            <EmptyState
              icon={<Users className="w-16 h-16" />}
              title="Nenhum amigo ainda"
              description="Adicione amigos para competir em desafios e acompanhar o progresso juntos!"
            />
          ) : (
            friends.map(friend => renderUserCard(friend, 'friend'))
          )}
        </TabsContent>

        <TabsContent value="requests" className="space-y-3 mt-4">
          {pendingReceived.length === 0 ? (
            <EmptyState
              icon={<UserPlus className="w-16 h-16" />}
              title="Nenhum pedido pendente"
              description="Quando alguém enviar um pedido de amizade, ele aparecerá aqui."
            />
          ) : (
            pendingReceived.map(request => (
              <Card key={request.id} className="border-primary/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={request.profiles.avatar_url || ''} />
                      <AvatarFallback>{request.profiles.name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="font-semibold">{request.profiles.name || 'Usuário'}</h4>
                      <p className="text-sm text-muted-foreground">{formatTime(request.created_at)}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => acceptRequest(request.id, request.profiles.id)}>
                        <UserCheck className="w-4 h-4 mr-1" /> Aceitar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => rejectRequest(request.id)}>
                        <UserX className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="sent" className="space-y-3 mt-4">
          {pendingSent.length === 0 ? (
            <EmptyState
              icon={<Clock className="w-16 h-16" />}
              title="Nenhum pedido enviado"
              description="Pedidos de amizade que você enviou aparecerão aqui."
            />
          ) : (
            pendingSent.map(request => (
              <Card key={request.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={request.profiles.avatar_url || ''} />
                      <AvatarFallback>{request.profiles.name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="font-semibold">{request.profiles.name || 'Usuário'}</h4>
                      <p className="text-sm text-muted-foreground">Enviado {formatTime(request.created_at)}</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => cancelRequest(request.id)}>
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="discover" className="space-y-4 mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuários..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="space-y-3">
            {filteredUsers.length === 0 ? (
              <EmptyState
                icon={<Search className="w-16 h-16" />}
                title="Nenhum usuário encontrado"
                description="Tente buscar por outro nome."
              />
            ) : (
              filteredUsers.map(user => {
                const rel = getRelationship(user.id);
                const request = pendingReceived.find(r => r.profiles.id === user.id);
                return renderUserCard(user, rel, request?.id);
              })
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
