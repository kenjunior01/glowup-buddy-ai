import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Clock, CheckCircle, XCircle, User, Calendar, Target, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ChallengeCoach from '@/components/ChallengeCoach';

interface Challenge {
  id: string;
  title: string;
  description: string;
  status: string;
  challenge_type: string;
  reward_points: number;
  expires_at: string;
  created_at: string;
  accepted_at?: string;
  completed_at?: string;
  creator: { name: string; level: number };
  challenger: { name: string; level: number };
}

export default function MyChallenges() {
  const [receivedChallenges, setReceivedChallenges] = useState<Challenge[]>([]);
  const [sentChallenges, setSentChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [completingChallenge, setCompletingChallenge] = useState<string>('');
  const [evidenceDescription, setEvidenceDescription] = useState('');
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      setCurrentUserId(session.user.id);

      // Fetch challenges received by current user
      const { data: received, error: receivedError } = await supabase
        .from('challenges')
        .select('*')
        .eq('challenger_id', session.user.id)
        .order('created_at', { ascending: false });

      // Fetch challenges sent by current user
      const { data: sent, error: sentError } = await supabase
        .from('challenges')
        .select('*')
        .eq('creator_id', session.user.id)
        .order('created_at', { ascending: false });

      if (receivedError || sentError) {
        console.error('Error fetching challenges:', receivedError || sentError);
        return;
      }

      // Fetch user profiles for all challenges
      const allChallenges = [...(received || []), ...(sent || [])];
      const userIds = [...new Set([
        ...allChallenges.map(c => c.creator_id),
        ...allChallenges.map(c => c.challenger_id)
      ])];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, level')
        .in('id', userIds);

      const profilesMap = (profiles || []).reduce((acc: any, profile) => {
        acc[profile.id] = profile;
        return acc;
      }, {});

      // Add profile data to challenges
      const enrichChallenges = (challenges: any[]) => 
        challenges.map(challenge => ({
          ...challenge,
          creator: profilesMap[challenge.creator_id] || { name: 'Usuário', level: 1 },
          challenger: profilesMap[challenge.challenger_id] || { name: 'Usuário', level: 1 }
        }));

      setReceivedChallenges(enrichChallenges(received || []));
      setSentChallenges(enrichChallenges(sent || []));
    } catch (error) {
      console.error('Error fetching challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const acceptChallenge = async (challengeId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('accept-challenge', {
        body: { challengeId }
      });

      if (error) {
        toast({
          title: "Erro ao aceitar desafio",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      if (data) {
        toast({
          title: "Desafio aceito! 🎯",
          description: "Você pode começar agora! Boa sorte!",
          className: "gradient-success text-white"
        });
        fetchChallenges();
      }
    } catch (error) {
      console.error('Error accepting challenge:', error);
    }
  };

  const completeChallenge = async () => {
    if (!selectedChallenge) return;

    setCompletingChallenge(selectedChallenge.id);
    try {
      const { data, error } = await supabase.functions.invoke('complete-challenge', {
        body: { challengeId: selectedChallenge.id }
      });

      if (error) {
        toast({
          title: "Erro ao completar desafio",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      if (data) {
        toast({
          title: "Parabéns! 🏆",
          description: `Você completou o desafio e ganhou ${selectedChallenge.reward_points} pontos!`,
          className: "gradient-success text-white"
        });
        
        setShowCompleteModal(false);
        setSelectedChallenge(null);
        setEvidenceDescription('');
        fetchChallenges();
      }
    } catch (error) {
      console.error('Error completing challenge:', error);
    } finally {
      setCompletingChallenge('');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning/10 text-warning border-warning/20';
      case 'accepted': return 'bg-info/10 text-info border-info/20';
      case 'active': return 'bg-info/10 text-info border-info/20';
      case 'completed': return 'bg-success/10 text-success border-success/20';
      case 'expired': return 'bg-muted/50 text-muted-foreground border-muted';
      default: return 'bg-muted/50 text-muted-foreground border-muted';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'accepted': return <Target className="w-4 h-4" />;
      case 'active': return <Target className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'expired': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatTimeRemaining = (expiresAt: string) => {
    const expiry = new Date(expiresAt);
    const now = new Date();
    const diffInHours = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours <= 0) return 'Expirado';
    if (diffInHours < 24) return `${diffInHours}h restantes`;
    const days = Math.ceil(diffInHours / 24);
    return `${days} dias restantes`;
  };

  const ChallengeCard = ({ challenge, isReceived = true }: { challenge: Challenge; isReceived?: boolean }) => (
    <Card className="post-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 gradient-primary rounded-full flex items-center justify-center">
              {challenge.challenge_type === 'fitness' ? '💪' :
               challenge.challenge_type === 'learning' ? '📚' :
               challenge.challenge_type === 'habit' ? '⚡' :
               challenge.challenge_type === 'social' ? '👥' :
               challenge.challenge_type === 'creative' ? '🎨' : '📅'}
            </div>
            <div>
              <CardTitle className="text-base">{challenge.title}</CardTitle>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <User className="w-3 h-3" />
                <span>
                  {isReceived 
                    ? `De: ${challenge.creator?.name || 'Usuário'}`
                    : `Para: ${challenge.challenger?.name || 'Usuário'}`
                  }
                </span>
              </div>
            </div>
          </div>
          
          <Badge className={`text-xs px-2 py-1 ${getStatusColor(challenge.status)}`}>
            {getStatusIcon(challenge.status)}
            <span className="ml-1 capitalize">{challenge.status}</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{challenge.description}</p>
        
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="flex items-center space-x-1">
            <Trophy className="w-3 h-3 text-warning" />
            <span>{challenge.reward_points} pontos</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="w-3 h-3 text-info" />
            <span>{formatTimeRemaining(challenge.expires_at)}</span>
          </div>
        </div>

        {isReceived && challenge.status === 'pending' && (
          <Button
            onClick={() => acceptChallenge(challenge.id)}
            className="w-full social-button"
            size="sm"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Aceitar Desafio
          </Button>
        )}

        {isReceived && (challenge.status === 'accepted' || challenge.status === 'active') && (
          <div className="space-y-3">
            <ChallengeCoach 
              challengeId={challenge.id}
              challengeTitle={challenge.title}
            />
            <Button
              onClick={() => {
                setSelectedChallenge(challenge);
                setShowCompleteModal(true);
              }}
              className="w-full gradient-success text-white hover:opacity-90"
              size="sm"
            >
              <Trophy className="w-4 h-4 mr-2" />
              Marcar como Concluído
            </Button>
          </div>
        )}

        {challenge.status === 'completed' && (
          <div className="bg-success/10 border border-success/20 rounded-lg p-3 text-center">
            <Trophy className="w-5 h-5 mx-auto mb-1 text-success" />
            <p className="text-xs text-success font-medium">
              Desafio Concluído! 
              {challenge.completed_at && (
                <span className="block opacity-75">
                  {new Date(challenge.completed_at).toLocaleDateString()}
                </span>
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-pulse-soft">
          <Trophy className="w-8 h-8 text-primary" />
        </div>
        <span className="ml-2 text-muted-foreground">Carregando desafios...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Trophy className="w-6 h-6 text-primary" />
        <h2 className="text-xl font-bold">Meus Desafios</h2>
      </div>

      <Tabs defaultValue="received" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="received" className="flex items-center space-x-2">
            <Target className="w-4 h-4" />
            <span>Recebidos ({receivedChallenges.length})</span>
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex items-center space-x-2">
            <Zap className="w-4 h-4" />
            <span>Enviados ({sentChallenges.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="space-y-4">
          {receivedChallenges.length === 0 ? (
            <div className="post-card p-8 text-center">
              <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold mb-2">Nenhum desafio recebido</h3>
              <p className="text-muted-foreground text-sm">
                Quando alguém te desafiar, aparecerá aqui!
              </p>
            </div>
          ) : (
            receivedChallenges.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} isReceived={true} />
            ))
          )}
        </TabsContent>

        <TabsContent value="sent" className="space-y-4">
          {sentChallenges.length === 0 ? (
            <div className="post-card p-8 text-center">
              <Zap className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold mb-2">Nenhum desafio enviado</h3>
              <p className="text-muted-foreground text-sm">
                Desafie outros usuários para vê-los aqui!
              </p>
            </div>
          ) : (
            sentChallenges.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} isReceived={false} />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Complete Challenge Modal */}
      <Dialog open={showCompleteModal} onOpenChange={setShowCompleteModal}>
        <DialogContent className="post-card max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-success" />
              <span>Concluir Desafio</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedChallenge && (
            <div className="space-y-4 pt-4">
              <div className="bg-secondary/30 p-3 rounded-lg">
                <h4 className="font-medium text-sm">{selectedChallenge.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedChallenge.description}
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Conte como foi! (opcional)
                </label>
                <Textarea
                  value={evidenceDescription}
                  onChange={(e) => setEvidenceDescription(e.target.value)}
                  placeholder="Descreva como você completou o desafio..."
                  rows={3}
                />
              </div>
              
              <div className="bg-success/10 border border-success/20 p-3 rounded-lg text-center">
                <Trophy className="w-6 h-6 mx-auto mb-2 text-success" />
                <p className="text-sm font-medium text-success">
                  Você ganhará {selectedChallenge.reward_points} pontos!
                </p>
              </div>
              
              <div className="flex space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCompleteModal(false)}
                  className="flex-1"
                  disabled={completingChallenge === selectedChallenge.id}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={completeChallenge}
                  className="flex-1 gradient-success text-white hover:opacity-90"
                  disabled={completingChallenge === selectedChallenge.id}
                >
                  {completingChallenge === selectedChallenge.id ? (
                    <>
                      <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                      Concluindo...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Concluir
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}