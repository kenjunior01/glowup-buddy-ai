import React, { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import PostCard from './PostCard';
import { Button } from './ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

export default function RealSocialFeed() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCurrentUser();
    fetchSocialPosts();
  }, []);

  const fetchCurrentUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      setCurrentUser({ ...session.user, profile });
    }
  };

  const fetchSocialPosts = async () => {
    try {
      // Fetch completed challenges to show as achievements
      const { data: challenges, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching challenges:', error);
        return;
      }

      if (challenges && challenges.length > 0) {
        // Fetch user profiles for the challenges
        const challengerIds = [...new Set(challenges.map(c => c.challenger_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, level')
          .in('id', challengerIds);

        const profilesMap = (profiles || []).reduce((acc: any, profile) => {
          acc[profile.id] = profile;
          return acc;
        }, {});

        const challengePosts = challenges.map(challenge => {
          const challenger = profilesMap[challenge.challenger_id] || { name: 'Usuário', level: 1 };
          return {
            id: challenge.id,
            user: {
              name: challenger.name || 'Usuário',
              level: challenger.level || 1
            },
            type: 'achievement',
            content: `Completei o desafio: ${challenge.title}! 🎉`,
            timestamp: formatTimeAgo(challenge.completed_at),
            likes: Math.floor(Math.random() * 50) + 5,
            comments: Math.floor(Math.random() * 15) + 1,
            achievement: {
              title: challenge.title,
              points: challenge.reward_points,
              icon: '🏆'
            }
          };
        });

        setPosts(challengePosts);
      }
    } catch (error) {
      console.error('Error fetching social posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}min atrás`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h atrás`;
    return `${Math.floor(diffInMinutes / 1440)} dias atrás`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="ml-2 text-muted-foreground">Carregando feed...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Feed da Comunidade</h2>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={fetchSocialPosts}
          className="text-primary"
        >
          <Plus className="w-4 h-4 mr-1" />
          Atualizar
        </Button>
      </div>

      {posts.length === 0 ? (
        <div className="post-card p-8 text-center">
          <div className="text-4xl mb-4">🎯</div>
          <h3 className="font-semibold mb-2">Feed vazio</h3>
          <p className="text-muted-foreground text-sm">
            Complete desafios ou faça check-ins para ver atividades aparecerem aqui!
          </p>
        </div>
      ) : (
        posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))
      )}
    </div>
  );
}