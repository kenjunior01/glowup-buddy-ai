import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Camera, 
  Heart, 
  MessageCircle, 
  Share2, 
  Clock,
  Zap,
  Trophy,
  Target,
  Sparkles,
  Loader2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Story {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  content: string;
  type: 'progress' | 'achievement' | 'challenge' | 'milestone';
  image_url?: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  liked_by_user: boolean;
}

interface StoriesSystemProps {
  userId: string;
  userName: string;
  userAvatar?: string;
}

export const StoriesSystem = ({ userId, userName, userAvatar }: StoriesSystemProps) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [generatingCaption, setGeneratingCaption] = useState(false);
  const [suggestedCaptions, setSuggestedCaptions] = useState<string[]>([]);
  const [newStory, setNewStory] = useState({
    content: '',
    type: 'progress' as Story['type']
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      setLoading(true);
      
      // Simulate stories data (in real app, fetch from posts/stories table)
      const mockStories: Story[] = [
        {
          id: '1',
          user_id: 'user1',
          user_name: 'Ana Silva',
          user_avatar: '',
          content: 'Completei minha sequência de 7 dias! 🔥 Cada dia fica mais fácil manter a consistência.',
          type: 'achievement',
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          likes_count: 12,
          comments_count: 3,
          liked_by_user: false
        },
        {
          id: '2',
          user_id: 'user2',
          user_name: 'Carlos Santos',
          user_avatar: '',
          content: 'Desafio aceito! Vamos ver quem consegue mais pontos esta semana 💪',
          type: 'challenge',
          created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          likes_count: 8,
          comments_count: 5,
          liked_by_user: true
        },
        {
          id: '3',
          user_id: 'user3',
          user_name: 'Maria Costa',
          user_avatar: '',
          content: 'Primeiro mês no GlowUp concluído! 30 dias de transformação e muitas conquistas 🏆',
          type: 'milestone',
          created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          likes_count: 25,
          comments_count: 8,
          liked_by_user: false
        }
      ];

      setStories(mockStories);
    } catch (error) {
      console.error('Error fetching stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateCaption = async () => {
    try {
      setGeneratingCaption(true);
      
      const { data, error } = await supabase.functions.invoke('generate-caption', {
        body: {
          storyType: newStory.type,
          userContext: newStory.content || null
        }
      });

      if (error) throw error;

      if (data?.captions) {
        setSuggestedCaptions(data.captions);
        toast({
          title: "✨ Legendas geradas!",
          description: "Escolha uma das sugestões ou continue editando.",
        });
      }
    } catch (error) {
      console.error('Error generating caption:', error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar legendas. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setGeneratingCaption(false);
    }
  };

  const createStory = async () => {
    if (!newStory.content.trim()) return;

    try {
      // Moderar conteúdo antes de publicar
      const { data: moderation } = await supabase.functions.invoke('moderate-content', {
        body: {
          content: newStory.content,
          type: 'story'
        }
      });

      if (moderation && !moderation.safe) {
        toast({
          title: "⚠️ Conteúdo inadequado",
          description: moderation.reason || "Por favor, revise seu conteúdo.",
          variant: "destructive",
        });
        return;
      }

      const story: Story = {
        id: `story_${Date.now()}`,
        user_id: userId,
        user_name: userName,
        user_avatar: userAvatar,
        content: newStory.content,
        type: newStory.type,
        created_at: new Date().toISOString(),
        likes_count: 0,
        comments_count: 0,
        liked_by_user: false
      };

      // In real app, save to database
      setStories(prev => [story, ...prev]);
      setNewStory({ content: '', type: 'progress' });
      setSuggestedCaptions([]);
      setIsCreating(false);

      toast({
        title: "Story publicado!",
        description: "Sua história foi compartilhada com a comunidade.",
      });
    } catch (error) {
      console.error('Error creating story:', error);
      toast({
        title: "Erro",
        description: "Não foi possível publicar o story.",
        variant: "destructive",
      });
    }
  };

  const likeStory = async (storyId: string) => {
    setStories(prev => prev.map(story => 
      story.id === storyId
        ? {
            ...story,
            liked_by_user: !story.liked_by_user,
            likes_count: story.liked_by_user 
              ? story.likes_count - 1 
              : story.likes_count + 1
          }
        : story
    ));

    // In real app, update in database
  };

  const getStoryIcon = (type: Story['type']) => {
    switch (type) {
      case 'achievement': return Trophy;
      case 'challenge': return Zap;
      case 'milestone': return Target;
      default: return Clock;
    }
  };

  const getStoryColor = (type: Story['type']) => {
    switch (type) {
      case 'achievement': return 'text-yellow-500';
      case 'challenge': return 'text-purple-500';
      case 'milestone': return 'text-green-500';
      default: return 'text-blue-500';
    }
  };

  const getStoryLabel = (type: Story['type']) => {
    switch (type) {
      case 'achievement': return 'Conquista';
      case 'challenge': return 'Desafio';
      case 'milestone': return 'Marco';
      default: return 'Progresso';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Stories da Comunidade
            </CardTitle>
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Criar Story
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Compartilhar Story</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <select
                      value={newStory.type}
                      onChange={(e) => setNewStory(prev => ({ ...prev, type: e.target.value as Story['type'] }))}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="progress">Progresso</option>
                      <option value="achievement">Conquista</option>
                      <option value="challenge">Desafio</option>
                      <option value="milestone">Marco Importante</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Textarea
                        value={newStory.content}
                        onChange={(e) => setNewStory(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="Compartilhe sua jornada, conquistas ou desafios..."
                        className="min-h-[100px]"
                      />
                    </div>
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={generateCaption}
                      disabled={generatingCaption}
                      className="w-full"
                    >
                      {generatingCaption ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Gerando legendas...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Gerar legendas com IA
                        </>
                      )}
                    </Button>

                    {suggestedCaptions.length > 0 && (
                      <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium">Sugestões de legendas:</p>
                        {suggestedCaptions.map((caption, index) => (
                          <Button
                            key={index}
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-left h-auto py-2 px-3"
                            onClick={() => setNewStory(prev => ({ ...prev, content: caption }))}
                          >
                            <span className="text-sm">{caption}</span>
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button onClick={createStory} className="flex-1" disabled={!newStory.content.trim()}>
                      Publicar Story
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsCreating(false);
                        setSuggestedCaptions([]);
                      }}
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
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-muted rounded-full"></div>
                    <div className="space-y-1">
                      <div className="h-4 bg-muted rounded w-24"></div>
                      <div className="h-3 bg-muted rounded w-16"></div>
                    </div>
                  </div>
                  <div className="h-20 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {stories.map((story) => {
                const Icon = getStoryIcon(story.type);
                
                return (
                  <div key={story.id} className="border rounded-lg p-4 space-y-3">
                    {/* User Header */}
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={story.user_avatar} />
                        <AvatarFallback>
                          {story.user_name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{story.user_name}</h4>
                          <Badge variant="secondary" className="text-xs">
                            <Icon className={`w-3 h-3 mr-1 ${getStoryColor(story.type)}`} />
                            {getStoryLabel(story.type)}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatTime(story.created_at)} atrás
                        </p>
                      </div>
                    </div>

                    {/* Story Content */}
                    <div className="pl-13">
                      <p className="text-sm leading-relaxed">{story.content}</p>
                    </div>

                    {/* Story Image */}
                    {story.image_url && (
                      <div className="pl-13">
                        <img
                          src={story.image_url}
                          alt="Story"
                          className="rounded-lg max-h-60 w-full object-cover"
                        />
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-4 pl-13 pt-2 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => likeStory(story.id)}
                        className={story.liked_by_user ? 'text-red-500' : ''}
                      >
                        <Heart className={`w-4 h-4 mr-1 ${story.liked_by_user ? 'fill-current' : ''}`} />
                        {story.likes_count}
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MessageCircle className="w-4 h-4 mr-1" />
                        {story.comments_count}
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};