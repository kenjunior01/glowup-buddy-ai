import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Medal, Award, Zap } from 'lucide-react';

interface Leader {
  id: string;
  name: string;
  avatar_url: string | null;
  challenges_completed: number;
}

export function ChallengeLeaderboard() {
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaders();
  }, []);

  const fetchLeaders = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, name, display_name, avatar_url, total_challenges_completed')
        .order('total_challenges_completed', { ascending: false, nullsFirst: false })
        .limit(5);

      if (data) {
        setLeaders(data.map(p => ({
          id: p.id,
          name: p.display_name || p.name || 'Usuário',
          avatar_url: p.avatar_url,
          challenges_completed: p.total_challenges_completed || 0
        })));
      }
    } catch (error) {
      console.error('Error fetching leaders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Trophy className="w-4 h-4 text-yellow-500" />;
      case 1: return <Medal className="w-4 h-4 text-gray-400" />;
      case 2: return <Award className="w-4 h-4 text-orange-500" />;
      default: return <span className="text-xs font-bold text-muted-foreground">{index + 1}</span>;
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-3">
          <div className="h-5 bg-muted rounded w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-6 h-6 bg-muted rounded" />
              <div className="w-8 h-8 rounded-full bg-muted" />
              <div className="flex-1 h-4 bg-muted rounded" />
              <div className="w-8 h-4 bg-muted rounded" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          Campeões de Desafios
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {leaders.map((leader, index) => (
          <div
            key={leader.id}
            className={`flex items-center gap-3 p-2 rounded-lg transition-all animate-fade-in ${
              index === 0 ? 'bg-yellow-500/10 border border-yellow-500/20' :
              index === 1 ? 'bg-gray-500/10 border border-gray-500/20' :
              index === 2 ? 'bg-orange-500/10 border border-orange-500/20' :
              'hover:bg-muted/50'
            }`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="w-6 flex items-center justify-center">
              {getRankIcon(index)}
            </div>
            <Avatar className="w-8 h-8">
              <AvatarImage src={leader.avatar_url || undefined} />
              <AvatarFallback className="text-xs">
                {leader.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{leader.name}</p>
            </div>
            <div className="flex items-center gap-1 text-sm font-bold text-primary">
              <Trophy className="w-3 h-3" />
              {leader.challenges_completed}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
