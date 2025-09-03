import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, MessageCircle, Trophy, Plus, Search, Crown, Flame, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Chat from './Chat';

interface Friend {
  id: string;
  name: string;
  level: number;
  pontos: number;
  current_streak: number;
  avatar_url?: string;
  status: string;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  creator_name: string;
  reward_points: number;
  expires_at: string;
  status: string;
  challenge_type: string;
}

interface User {
  id: string;
  name: string;
  level: number;
  pontos: number;
}

const SocialFeed = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<Friend[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedChat, setSelectedChat] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchAllData();
    }
  }, [currentUserId]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchFriends(),
      fetchFriendRequests(),
      fetchChallenges(),
      fetchUsers()
    ]);
    setLoading(false);
  };

  const fetchFriends = async () => {
    if (!currentUserId) return;

    const { data, error } = await supabase
      .from('friendships')
      .select(`
        friend_id,
        profiles!friendships_friend_id_fkey (
          id, name, level, pontos, avatar_url
        )
      `)
      .eq('user_id', currentUserId)
      .eq('status', 'accepted');

    if (!error && data) {
      const friendsData = await Promise.all(
        data.map(async (friendship: any) => {
          const profile = friendship.profiles;
          
          // Get streak data
          const { data: streakData } = await supabase
            .from('streaks')
            .select('current_streak')
            .eq('user_id', profile.id)
            .single();

          return {
            id: profile.id,
            name: profile.name || 'Usuário',
            level: profile.level || 1,
            pontos: profile.pontos || 0,
            current_streak: streakData?.current_streak || 0,
            avatar_url: profile.avatar_url,
            status: 'accepted'
          };
        })
      );
      
      setFriends(friendsData);
    }
  };

  const fetchFriendRequests = async () => {
    if (!currentUserId) return;

    const { data, error } = await supabase
      .from('friendships')
      .select(`
        id,
        user_id,
        profiles!friendships_user_id_fkey (
          id, name, level, pontos, avatar_url
        )
      `)
      .eq('friend_id', currentUserId)
      .eq('status', 'pending');

    if (!error && data) {
      const requestsData = data.map((request: any) => ({
        id: request.profiles.id,
        name: request.profiles.name || 'Usuário',
        level: request.profiles.level || 1,
        pontos: request.profiles.pontos || 0,
        current_streak: 0,
        avatar_url: request.profiles.avatar_url,
        status: 'pending'
      }));
      
      setFriendRequests(requestsData);
    }
  };

  const fetchChallenges = async () => {
    if (!currentUserId) return;

    const { data, error } = await supabase
      .from('challenges')
      .select(`
        *,
        profiles!challenges_creator_id_fkey (name)
      `)
      .eq('challenger_id', currentUserId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (!error && data) {
      const challengesData = data.map((challenge: any) => ({
        id: challenge.id,
        title: challenge.title,
        description: challenge.description,
        creator_name: challenge.profiles.name || 'Usuário',
        reward_points: challenge.reward_points,
        expires_at: challenge.expires_at,
        status: challenge.status,
        challenge_type: challenge.challenge_type
      }));
      
      setChallenges(challengesData);
    }
  };

  const fetchUsers = async () => {
    if (!currentUserId) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, level, pontos')
      .neq('id', currentUserId)
      .order('pontos', { ascending: false })
      .limit(20);

    if (!error && data) {
      setUsers(data.map(user => ({
        id: user.id,
        name: user.name || 'Usuário',
        level: user.level || 1,
        pontos: user.pontos || 0
      })));
    }
  };

  const sendFriendRequest = async (friendId: string) => {
    if (!currentUserId) return;

    const { error } = await supabase
      .from('friendships')
      .insert({
        user_id: currentUserId,
        friend_id: friendId,
        status: 'pending'
      });

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível enviar solicitação de amizade.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Enviado! 🤝",
        description: "Solicitação de amizade enviada!",
      });
      fetchUsers();
    }
  };

  const acceptFriendRequest = async (friendId: string) => {
    if (!currentUserId) return;

    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('user_id', friendId)
      .eq('friend_id', currentUserId);

    if (!error) {
      // Create reverse friendship for both users to see each other
      await supabase
        .from('friendships')
        .insert({
          user_id: currentUserId,
          friend_id: friendId,
          status: 'accepted'
        });

      toast({
        title: "Aceito! 🎉",
        description: "Agora vocês são amigos!",
      });
      
      fetchAllData();
    }
  };

  const acceptChallenge = async (challengeId: string) => {
    const { error } = await supabase
      .from('challenges')
      .update({ status: 'accepted' })
      .eq('id', challengeId);

    if (!error) {
      toast({
        title: "Desafio Aceito! 🔥",
        description: "Boa sorte no seu desafio!",
      });
      fetchChallenges();
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (selectedChat) {
    return (
      <Chat
        friendId={selectedChat.id}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Social Hub</h2>
        <p className="text-muted-foreground">Conecte-se, desafie e evolua junto com seus amigos!</p>
      </div>

      <Tabs defaultValue="friends" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="friends" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Amigos
          </TabsTrigger>
          <TabsTrigger value="challenges" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Desafios
          </TabsTrigger>
          <TabsTrigger value="discover" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Descobrir
          </TabsTrigger>
          <TabsTrigger value="ranking" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Ranking
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="space-y-4">
          {/* Friend Requests */}
          {friendRequests.length > 0 && (
            <Card>
              <CardHeader>
                <h3 className="font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Solicitações de Amizade ({friendRequests.length})
                </h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {friendRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={request.avatar_url} />
                          <AvatarFallback>{request.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{request.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Level {request.level} • {request.pontos} pontos
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => acceptFriendRequest(request.id)}
                        size="sm"
                        className="hover-scale"
                      >
                        Aceitar
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Friends List */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold">Meus Amigos ({friends.length})</h3>
            </CardHeader>
            <CardContent>
              {friends.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">Você ainda não tem amigos conectados</p>
                  <Button variant="outline" onClick={() => {}}>
                    Encontrar Amigos
                  </Button>
                </div>
              ) : (
                <div className="grid gap-3">
                  {friends.map((friend) => (
                    <div key={friend.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={friend.avatar_url} />
                          <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium flex items-center gap-2">
                            {friend.name}
                            {friend.current_streak > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                <Flame className="h-3 w-3 mr-1" />
                                {friend.current_streak}
                              </Badge>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Level {friend.level} • {friend.pontos} pontos
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedChat({ id: friend.id, name: friend.name })}
                        className="hover-scale"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="challenges" className="space-y-4">
          <Card>
            <CardHeader>
              <h3 className="font-semibold">Desafios Recebidos ({challenges.length})</h3>
            </CardHeader>
            <CardContent>
              {challenges.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhum desafio pendente</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {challenges.map((challenge) => (
                    <div key={challenge.id} className="p-4 border rounded-lg bg-card">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold">{challenge.title}</h4>
                          <p className="text-sm text-muted-foreground">de {challenge.creator_name}</p>
                        </div>
                        <Badge variant="outline" className="bg-primary/10">
                          {challenge.reward_points} pontos
                        </Badge>
                      </div>
                      <p className="text-sm mb-3">{challenge.description}</p>
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-muted-foreground">
                          Expira em {new Date(challenge.expires_at).toLocaleDateString('pt-BR')}
                        </p>
                        <Button
                          onClick={() => acceptChallenge(challenge.id)}
                          size="sm"
                          className="hover-scale"
                        >
                          Aceitar Desafio
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discover" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex gap-2">
                <Input
                  placeholder="Buscar usuários..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
                <Button variant="outline" size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Level {user.level} • {user.pontos} pontos
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => sendFriendRequest(user.id)}
                        size="sm"
                        variant="outline"
                        className="hover-scale"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Adicionar
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ranking" className="space-y-4">
          <Card>
            <CardHeader>
              <h3 className="font-semibold flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-500" />
                Ranking Global
              </h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {users.slice(0, 10).map((user, index) => (
                  <div key={user.id} className="flex items-center gap-4 p-3 bg-secondary/30 rounded-lg">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                      {index < 3 ? (
                        <Crown className={`h-4 w-4 ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : 'text-amber-600'}`} />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <Avatar>
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">Level {user.level}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{user.pontos}</p>
                      <p className="text-xs text-muted-foreground">pontos</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SocialFeed;