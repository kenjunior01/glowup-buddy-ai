import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Flame, Target, Zap, Users } from 'lucide-react';

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
      <Card className="animate-pulse">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-accent" />
            Desafios em Alta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-10 bg-muted rounded" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (challenges.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-accent" />
            Desafios em Alta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground text-sm">
            <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
            Nenhum desafio ativo
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-accent/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-accent" />
          Desafios em Alta
          <Flame className="h-4 w-4 text-orange-500 animate-pulse" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {challenges.map((challenge, index) => (
          <div 
            key={challenge.id} 
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              index === 0 ? 'bg-yellow-500 text-white' :
              index === 1 ? 'bg-gray-400 text-white' :
              index === 2 ? 'bg-amber-700 text-white' :
              'bg-muted text-muted-foreground'
            }`}>
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                {challenge.title}
              </p>
            </div>
            <Badge variant="secondary" className="text-[10px] gap-1">
              <Zap className="h-3 w-3" />
              {challenge.reward_points || 0}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
