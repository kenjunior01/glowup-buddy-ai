import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Chat from '@/components/Chat';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Users, Search, Bot, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Friend {
  id: string;
  name: string;
  avatar_url?: string;
  last_message?: string;
  unread_count?: number;
  last_seen?: string;
  isAI?: boolean;
}

export default function ChatPage() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchFriends();
    }
  }, [currentUserId]);

  const getCurrentUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setCurrentUserId(session.user.id);
    }
  };

  const fetchFriends = async () => {
    try {
      // Simplify the query to avoid relationship issues
      const { data } = await supabase
        .from('friendships')
        .select('*')
        .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`)
        .eq('status', 'accepted');

      if (data) {
        // Get unique friend IDs
        const friendIds = data.map(friendship => 
          friendship.user_id === currentUserId ? friendship.friend_id : friendship.user_id
        );

        // Fetch friend profiles separately
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, avatar_url')
          .in('id', friendIds);

        if (profiles) {
          const friendsList = profiles.map(profile => ({
            id: profile.id,
            name: profile.name || 'Usuário',
            avatar_url: profile.avatar_url,
            last_message: 'Clique para conversar',
            unread_count: 0,
            last_seen: 'Online'
          }));
          
          setFriends(friendsList);
        }
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFriends = friends.filter(friend =>
    friend.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border mobile-safe">
        <div className="p-4">
          <h1 className="text-2xl font-bold text-gradient flex items-center gap-2">
            <MessageCircle className="w-6 h-6" />
            Conversas
          </h1>
          <p className="text-sm text-muted-foreground">
            {selectedFriend ? `Conversando com ${selectedFriend.name}` : 'Escolha um amigo para conversar'}
          </p>
        </div>
      </div>

      <div className="flex h-[calc(100vh-140px)]">
        {/* Friends List */}
        <div className="w-full md:w-1/3 border-r border-border p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar conversas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando conversas...
            </div>
          ) : filteredFriends.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">Nenhuma conversa</h3>
                <p className="text-sm text-muted-foreground">
                  Adicione amigos para começar a conversar!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {/* AI Assistant Button */}
              <Button
                variant={selectedFriend?.id === 'ai-assistant' ? "secondary" : "ghost"}
                className="w-full justify-start p-3 h-auto bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/30 dark:hover:to-pink-900/30"
                onClick={() => setSelectedFriend({
                  id: 'ai-assistant',
                  name: 'Assistente IA GlowUp',
                  last_message: 'Seu coach pessoal motivacional',
                  isAI: true
                })}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">Assistente IA GlowUp</p>
                      <Badge variant="secondary" className="text-xs gap-1">
                        <Sparkles className="w-3 h-3" />
                        IA
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Seu coach pessoal motivacional
                    </p>
                  </div>
                </div>
              </Button>

              {/* Friends List */}
              {filteredFriends.map((friend) => (
                <Button
                  key={friend.id}
                  variant={selectedFriend?.id === friend.id ? "secondary" : "ghost"}
                  className="w-full justify-start p-3 h-auto"
                  onClick={() => setSelectedFriend(friend)}
                >
                  <div className="flex items-center gap-3 w-full">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={friend.avatar_url} />
                      <AvatarFallback>
                        {friend.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{friend.name}</p>
                        {friend.unread_count && friend.unread_count > 0 && (
                          <Badge variant="destructive" className="h-5 w-5 p-0 text-xs">
                            {friend.unread_count}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {friend.last_message}
                      </p>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div className="hidden md:block w-2/3">
          {selectedFriend ? (
            <Chat 
              friendId={selectedFriend.id}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Selecione uma conversa</h3>
                <p className="text-muted-foreground">
                  Escolha um amigo na lista para começar a conversar
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Chat View */}
      {selectedFriend && (
        <div className="md:hidden fixed inset-0 bg-background z-50 pt-16">
          <div className="border-b border-border p-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFriend(null)}
              >
                ← Voltar
              </Button>
              <Avatar className="w-8 h-8">
                <AvatarImage src={selectedFriend.avatar_url} />
                <AvatarFallback>
                  {selectedFriend.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{selectedFriend.name}</p>
                <p className="text-xs text-muted-foreground">{selectedFriend.last_seen}</p>
              </div>
            </div>
          </div>
          <Chat 
            friendId={selectedFriend.id}
          />
        </div>
      )}
    </div>
  );
}