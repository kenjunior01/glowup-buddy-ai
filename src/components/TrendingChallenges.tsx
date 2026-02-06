import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Target, Zap } from 'lucide-react';

interface Challenge {
  id: string;
  title: string;
  reward_points: number | null;
  status: string | null;
}

export default function TrendingChallenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrendingChallenges();
  }, []);

  const fetchTrendingChallenges = async () => {
    try {
      const { data } = await supabase
        .from('challenges')
        .select('id, title, reward_points, status')
        .eq('status', 'active')
        .order('reward_points', { ascending: false })
        .limit(5);

      setChallenges(data || []);
    } catch (error) {
      console.error('Error fetching challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bento-card p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Desafios em Alta</h3>
        {[1, 2, 3].map(i => (
          <div key={i} className="h-10 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (challenges.length === 0) {
    return (
      <div className="bento-card p-4">
        <h3 className="text-sm font-semibold text-foreground mb-4">Desafios em Alta</h3>
        <div className="text-center py-4">
          <Target className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
          <p className="text-xs text-muted-foreground">Nenhum desafio ativo</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bento-card p-4 space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Desafios em Alta</h3>
      <div className="space-y-2">
        {challenges.map((challenge, index) => (
          <div 
            key={challenge.id} 
            className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
              index === 0 ? 'bg-primary/20 text-primary' :
              index === 1 ? 'bg-muted text-muted-foreground' :
              index === 2 ? 'bg-accent/20 text-accent' :
              'bg-muted/50 text-muted-foreground'
            }`}>
              {index + 1}
            </div>
            <p className="flex-1 text-sm font-medium text-foreground truncate">
              {challenge.title}
            </p>
            <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
              <Zap className="h-3 w-3" />
              {challenge.reward_points || 0}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
