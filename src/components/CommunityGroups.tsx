import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Users, 
  Plus, 
  Search, 
  Crown, 
  UserPlus,
  MessageSquare,
  TrendingUp,
  Target,
  Calendar
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Group {
  id: string;
  name: string;
  description: string;
  category: 'fitness' | 'mindfulness' | 'career' | 'social' | 'learning';
  members_count: number;
  creator_id: string;
  creator_name: string;
  is_private: boolean;
  created_at: string;
  user_is_member: boolean;
  latest_activity?: string;
}

interface CommunityGroupsProps {
  userId: string;
  userName: string;
}

export const CommunityGroups = ({ userId, userName }: CommunityGroupsProps) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    category: 'fitness' as Group['category'],
    is_private: false
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      
      // Simulate groups data (in real app, fetch from groups table)
      const mockGroups: Group[] = [
        {
          id: '1',
          name: 'Fitness Motivation',
          description: 'Grupo para compartilhar rotinas de exercício e motivação',
          category: 'fitness',
          members_count: 48,
          creator_id: 'user1',
          creator_name: 'Ana Silva',
          is_private: false,
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          user_is_member: false,
          latest_activity: '2 horas atrás'
        },
        {
          id: '2',
          name: 'Mindfulness & Bem-estar',
          description: 'Práticas de mindfulness e autocuidado',
          category: 'mindfulness',
          members_count: 32,
          creator_id: 'user2',
          creator_name: 'Carlos Santos',
          is_private: false,
          created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          user_is_member: true,
          latest_activity: '1 hora atrás'
        },
        {
          id: '3',
          name: 'Desenvolvimento Profissional',
          description: 'Dicas de carreira e desenvolvimento pessoal',
          category: 'career',
          members_count: 67,
          creator_id: 'user3',
          creator_name: 'Maria Costa',
          is_private: false,
          created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          user_is_member: true,
          latest_activity: '30 minutos atrás'
        },
        {
          id: '4',
          name: 'Aprendizado Contínuo',
          description: 'Compartilhe livros, cursos e conhecimentos',
          category: 'learning',
          members_count: 25,
          creator_id: 'user4',
          creator_name: 'João Oliveira',
          is_private: false,
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          user_is_member: false,
          latest_activity: '4 horas atrás'
        }
      ];

      setGroups(mockGroups);
      setMyGroups(mockGroups.filter(g => g.user_is_member));
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const createGroup = async () => {
    if (!newGroup.name.trim()) return;

    try {
      // Moderar o conteúdo antes de criar o grupo
      const contentToModerate = `${newGroup.name}\n${newGroup.description}`;
      const { data: moderation } = await supabase.functions.invoke('moderate-content', {
        body: {
          content: contentToModerate,
          type: 'group'
        }
      });

      if (moderation && !moderation.safe) {
        toast({
          title: "⚠️ Conteúdo inadequado",
          description: moderation.reason || "Por favor, revise o nome e descrição do grupo.",
          variant: "destructive",
        });
        return;
      }

      const group: Group = {
        id: `group_${Date.now()}`,
        name: newGroup.name,
        description: newGroup.description,
        category: newGroup.category,
        members_count: 1,
        creator_id: userId,
        creator_name: userName,
        is_private: newGroup.is_private,
        created_at: new Date().toISOString(),
        user_is_member: true,
        latest_activity: 'Agora'
      };

      // In real app, save to database
      setGroups(prev => [group, ...prev]);
      setMyGroups(prev => [group, ...prev]);
      setNewGroup({ name: '', description: '', category: 'fitness', is_private: false });
      setIsCreating(false);

      toast({
        title: "✅ Grupo criado!",
        description: `${newGroup.name} foi criado com sucesso.`,
      });
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o grupo.",
        variant: "destructive",
      });
    }
  };

  const joinGroup = async (groupId: string) => {
    setGroups(prev => prev.map(group =>
      group.id === groupId
        ? {
            ...group,
            user_is_member: true,
            members_count: group.members_count + 1
          }
        : group
    ));

    const group = groups.find(g => g.id === groupId);
    if (group) {
      setMyGroups(prev => [...prev, { ...group, user_is_member: true }]);
    }

    toast({
      title: "Grupo adicionado!",
      description: "Você agora faz parte do grupo.",
    });
  };

  const leaveGroup = async (groupId: string) => {
    setGroups(prev => prev.map(group =>
      group.id === groupId
        ? {
            ...group,
            user_is_member: false,
            members_count: Math.max(group.members_count - 1, 0)
          }
        : group
    ));

    setMyGroups(prev => prev.filter(group => group.id !== groupId));

    toast({
      title: "Grupo removido",
      description: "Você saiu do grupo.",
    });
  };

  const getCategoryIcon = (category: Group['category']) => {
    switch (category) {
      case 'fitness': return TrendingUp;
      case 'mindfulness': return Target;
      case 'career': return Crown;
      case 'learning': return MessageSquare;
      default: return Users;
    }
  };

  const getCategoryColor = (category: Group['category']) => {
    switch (category) {
      case 'fitness': return 'bg-red-500';
      case 'mindfulness': return 'bg-green-500';
      case 'career': return 'bg-blue-500';
      case 'learning': return 'bg-purple-500';
      case 'social': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryLabel = (category: Group['category']) => {
    switch (category) {
      case 'fitness': return 'Fitness';
      case 'mindfulness': return 'Bem-estar';
      case 'career': return 'Carreira';
      case 'learning': return 'Aprendizado';
      case 'social': return 'Social';
      default: return 'Geral';
    }
  };

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Comunidades
            </CardTitle>
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-1" />
                  Criar Grupo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo Grupo</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Input
                      value={newGroup.name}
                      onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nome do grupo"
                    />
                  </div>
                  <div>
                    <Textarea
                      value={newGroup.description}
                      onChange={(e) => setNewGroup(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descrição do grupo"
                      className="min-h-[80px]"
                    />
                  </div>
                  <div>
                    <select
                      value={newGroup.category}
                      onChange={(e) => setNewGroup(prev => ({ ...prev, category: e.target.value as Group['category'] }))}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="fitness">Fitness</option>
                      <option value="mindfulness">Bem-estar</option>
                      <option value="career">Carreira</option>
                      <option value="learning">Aprendizado</option>
                      <option value="social">Social</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="private"
                      checked={newGroup.is_private}
                      onChange={(e) => setNewGroup(prev => ({ ...prev, is_private: e.target.checked }))}
                    />
                    <label htmlFor="private" className="text-sm">Grupo privado</label>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button onClick={createGroup} className="flex-1">
                      Criar Grupo
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsCreating(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="explore" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="explore">Explorar</TabsTrigger>
              <TabsTrigger value="mygroups">Meus Grupos ({myGroups.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="explore" className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar grupos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredGroups.map((group) => {
                  const Icon = getCategoryIcon(group.category);
                  
                  return (
                    <Card key={group.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full ${getCategoryColor(group.category)} text-white`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div>
                                <h4 className="font-medium">{group.name}</h4>
                                <Badge variant="secondary" className="text-xs mt-1">
                                  {getCategoryLabel(group.category)}
                                </Badge>
                              </div>
                            </div>
                            {group.creator_id === userId && (
                              <Crown className="w-4 h-4 text-yellow-500" />
                            )}
                          </div>

                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {group.description}
                          </p>

                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{group.members_count} membros</span>
                            <span>Atividade: {group.latest_activity}</span>
                          </div>

                          <div className="flex gap-2">
                            {group.user_is_member ? (
                              <>
                                <Button size="sm" variant="outline" className="flex-1">
                                  <MessageSquare className="w-4 h-4 mr-1" />
                                  Abrir
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => leaveGroup(group.id)}
                                >
                                  Sair
                                </Button>
                              </>
                            ) : (
                              <Button 
                                size="sm" 
                                className="flex-1"
                                onClick={() => joinGroup(group.id)}
                              >
                                <UserPlus className="w-4 h-4 mr-1" />
                                Participar
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="mygroups" className="space-y-4">
              {myGroups.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Você ainda não participa de nenhum grupo</p>
                  <p className="text-sm">Explore os grupos disponíveis ou crie o seu próprio!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myGroups.map((group) => {
                    const Icon = getCategoryIcon(group.category);
                    
                    return (
                      <Card key={group.id} className="border-primary/20">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full ${getCategoryColor(group.category)} text-white`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium">{group.name}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="secondary" className="text-xs">
                                    {getCategoryLabel(group.category)}
                                  </Badge>
                                  {group.creator_id === userId && (
                                    <Badge variant="default" className="text-xs">
                                      <Crown className="w-3 h-3 mr-1" />
                                      Criador
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>

                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {group.description}
                            </p>

                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{group.members_count} membros</span>
                              <span>Atividade: {group.latest_activity}</span>
                            </div>

                            <Button size="sm" className="w-full">
                              <MessageSquare className="w-4 h-4 mr-1" />
                              Abrir Conversa
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};