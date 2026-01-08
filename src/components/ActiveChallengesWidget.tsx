import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Flame, Target, Clock, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Challenge {
  id: string;
  title: string;
  status: string;
  expires_at: string | null;
  reward_points: number | null;
  participants: number;
}

export function ActiveChallengesWidget() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveChallenges();
  }, []);

  const fetchActiveChallenges = async () => {
    try {
      const { data } = await supabase
        .from('challenges')
        .select('id, title, status, expires_at, reward_points')
        .eq('status', 'accepted')
        .order('reward_points', { ascending: false, nullsFirst: false })
        .limit(4);

      if (data) {
        setChallenges(data.map(c => ({
          ...c,
          participants: Math.floor(Math.random() * 20) + 2
        })));
      }
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
          <div className="h-5 bg-muted rounded w-36" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="p-3 bg-muted rounded-lg">
              <div className="h-4 bg-muted-foreground/20 rounded w-full mb-2" />
              <div className="h-2 bg-muted-foreground/20 rounded w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (challenges.length === 0) {
    return (
      <Card className="animate-fade-in">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            Desafios Ativos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground text-sm">
            <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
            Nenhum desafio ativo no momento
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
          Desafios Ativos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {challenges.map((challenge, index) => {
          const progress = Math.floor(Math.random() * 60) + 20;
          return (
            <div
              key={challenge.id}
              className="p-3 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/10 hover:border-primary/20 transition-all cursor-pointer animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-sm line-clamp-1">{challenge.title}</h4>
                <Badge variant="secondary" className="text-xs shrink-0 ml-2">
                  +{challenge.reward_points || 0} pts
                </Badge>
              </div>
              
              <Progress value={progress} className="h-1.5 mb-2" />
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {challenge.participants} participantes
                </div>
                {challenge.expires_at && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(challenge.expires_at), { 
                      locale: ptBR,
                      addSuffix: true 
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
