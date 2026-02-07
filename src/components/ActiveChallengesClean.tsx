import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Target, Flame, Clock, Trophy, ChevronRight, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import ChallengeCountdown from './ChallengeCountdown';

interface Challenge {
  id: string;
  title: string;
  description: string | null;
  status: string;
  expires_at: string | null;
  reward_points: number | null;
  is_buddy_challenge: boolean | null;
  buddy_id: string | null;
}

export default function ActiveChallengesClean() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchUserId();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchActiveChallenges();
    }
  }, [userId]);

  const fetchUserId = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUserId(session.user.id);
    }
  };

  const fetchActiveChallenges = async () => {
    if (!userId) return;
    
    try {
      const { data } = await supabase
        .from('challenges')
        .select('id, title, description, status, expires_at, reward_points, is_buddy_challenge, buddy_id')
        .or(`creator_id.eq.${userId},target_user_id.eq.${userId},buddy_id.eq.${userId}`)
        .in('status', ['active', 'accepted'])
        .order('expires_at', { ascending: true, nullsFirst: false })
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
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-muted animate-pulse" />
          <div className="h-4 w-32 bg-muted rounded animate-pulse" />
        </div>
        {[1, 2].map(i => (
          <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (challenges.length === 0) {
    return (
      <div className="bento-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Flame className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Desafios Ativos</h3>
            <p className="text-[10px] text-muted-foreground">Seus desafios em andamento</p>
          </div>
        </div>
        
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
            <Target className="w-6 h-6 text-muted-foreground/50" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">Nenhum desafio ativo</p>
          <p className="text-xs text-muted-foreground max-w-[200px]">
            Aceite ou crie um desafio para começar a ganhar pontos!
          </p>
        </div>
      </div>
    );
  }

  // Separate buddy challenges
  const buddyChallenges = challenges.filter(c => c.is_buddy_challenge);
  const regularChallenges = challenges.filter(c => !c.is_buddy_challenge);

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <div className="bento-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Flame className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Desafios Ativos</h3>
              <p className="text-[10px] text-muted-foreground">{challenges.length} em andamento</p>
            </div>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted/50">
            <Trophy className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-medium text-muted-foreground">
              {challenges.reduce((acc, c) => acc + (c.reward_points || 0), 0)} pts
            </span>
          </div>
        </div>
      </div>

      {/* Buddy Challenges Section */}
      {buddyChallenges.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Users className="w-4 h-4 text-accent" />
            <span className="text-xs font-medium text-muted-foreground">Desafios em Dupla</span>
          </div>
          
          {buddyChallenges.map((challenge) => (
            <ChallengeCountdown
              key={challenge.id}
              title={challenge.title}
              description={challenge.description || undefined}
              expiresAt={new Date(challenge.expires_at || Date.now() + 7 * 24 * 60 * 60 * 1000)}
              progress={Math.floor(Math.random() * 60) + 20}
              rewardPoints={challenge.reward_points || 100}
              isBuddy={true}
              buddyName="Parceiro"
            />
          ))}
        </div>
      )}

      {/* Regular Challenges */}
      {regularChallenges.length > 0 && (
        <div className="space-y-3">
          {buddyChallenges.length > 0 && (
            <div className="flex items-center gap-2 px-1">
              <Target className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">Desafios Individuais</span>
            </div>
          )}
          
          {regularChallenges.map((challenge, index) => (
            <ChallengeCard 
              key={challenge.id} 
              challenge={challenge} 
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ChallengeCard({ challenge, index }: { challenge: Challenge; index: number }) {
  const progress = Math.floor(Math.random() * 60) + 20;
  const isExpiringSoon = challenge.expires_at && 
    new Date(challenge.expires_at).getTime() - Date.now() < 24 * 60 * 60 * 1000;

  return (
    <div
      className={cn(
        "bento-card p-4 transition-all hover:shadow-md animate-fade-in",
        isExpiringSoon && "ring-1 ring-destructive/20"
      )}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm text-foreground line-clamp-1">{challenge.title}</h4>
          {challenge.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {challenge.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 shrink-0">
          <Trophy className="w-3 h-3 text-primary" />
          <span className="text-xs font-semibold text-primary">+{challenge.reward_points || 0}</span>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-muted-foreground">Progresso</span>
          <span className="text-[10px] font-medium text-foreground">{progress}%</span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        {challenge.expires_at && (
          <div className={cn(
            "flex items-center gap-1 text-[10px]",
            isExpiringSoon ? "text-destructive" : "text-muted-foreground"
          )}>
            <Clock className="w-3 h-3" />
            <span>
              {formatDistanceToNow(new Date(challenge.expires_at), { 
                locale: ptBR,
                addSuffix: true 
              })}
            </span>
          </div>
        )}
        <button className="flex items-center gap-1 text-[10px] font-medium text-primary hover:text-primary/80 transition-colors">
          <span>Ver detalhes</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
