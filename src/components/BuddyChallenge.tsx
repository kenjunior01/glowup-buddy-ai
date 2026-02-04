import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useCelebration } from '@/components/CelebrationSystem';
import { 
  Users, Trophy, Target, Clock, CheckCircle2, 
  XCircle, Loader2, UserPlus, Sparkles, Heart
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BuddyChallengeProps {
  userId: string;
  onChallengeCreated?: () => void;
}

interface Friend {
  id: string;
  display_name: string;
  avatar_url: string;
  level: number;
}

interface BuddyChallengeData {
  id: string;
  title: string;
  description: string;
  buddy_id: string;
  buddy_accepted: boolean;
  buddy_completed: boolean;
  status: string;
  reward_points: number;
  expires_at: string;
  buddy_profile?: {
    display_name: string;
    avatar_url: string;
  };
}

export default function BuddyChallenge({ userId, onChallengeCreated }: BuddyChallengeProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [buddyChallenges, setBuddyChallenges] = useState<BuddyChallengeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { toast } = useToast();
  const { celebrate } = useCelebration();

  // Form state
  const [selectedBuddy, setSelectedBuddy] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rewardPoints, setRewardPoints] = useState('200');
  const [expiresDays, setExpiresDays] = useState('7');

  useEffect(() => {
    fetchFriends();
    fetchBuddyChallenges();
  }, [userId]);

  const fetchFriends = async () => {
    try {
      const { data: friendships, error } = await supabase
        .from('friendships')
        .select('friend_id')
        .eq('user_id', userId)
        .eq('status', 'accepted');

      if (error) throw error;

      if (friendships && friendships.length > 0) {
        const friendIds = friendships.map(f => f.friend_id);
        
        const { data: profiles } = await supabase
          .rpc('get_leaderboard', { limit_count: 100 });

        if (profiles) {
          const friendProfiles = profiles.filter((p: any) => friendIds.includes(p.id));
          setFriends(friendProfiles);
        }
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  const fetchBuddyChallenges = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('is_buddy_challenge', true)
        .or(`creator_id.eq.${userId},buddy_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch buddy profiles
      if (data && data.length > 0) {
        const buddyIds = data.map(c => c.buddy_id).filter(Boolean);
        const uniqueBuddyIds = [...new Set(buddyIds)];
        
        if (uniqueBuddyIds.length > 0) {
          const { data: profiles } = await supabase
            .rpc('get_leaderboard', { limit_count: 100 });
          
          const profileMap = new Map(profiles?.map((p: any) => [p.id, p]) || []);
          
          const enrichedChallenges = data.map(challenge => ({
            ...challenge,
            buddy_profile: profileMap.get(challenge.buddy_id)
          }));
          
          setBuddyChallenges(enrichedChallenges as BuddyChallengeData[]);
        } else {
          setBuddyChallenges(data as BuddyChallengeData[]);
        }
      }
    } catch (error) {
      console.error('Error fetching buddy challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBuddyChallenge = async () => {
    if (!selectedBuddy || !title.trim() || !description.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos",
        variant: "destructive"
      });
      return;
    }

    setCreating(true);
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(expiresDays));

      const { error } = await supabase
        .from('challenges')
        .insert({
          creator_id: userId,
          target_user_id: selectedBuddy,
          buddy_id: selectedBuddy,
          is_buddy_challenge: true,
          buddy_accepted: false,
          buddy_completed: false,
          title: title.trim(),
          description: description.trim(),
          challenge_type: 'buddy',
          reward_points: parseInt(rewardPoints),
          expires_at: expiresAt.toISOString(),
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Desafio em Dupla Criado! 👥",
        description: "Aguardando seu parceiro aceitar",
        className: "gradient-success text-white"
      });

      setShowCreateDialog(false);
      setTitle('');
      setDescription('');
      setSelectedBuddy('');
      fetchBuddyChallenges();
      onChallengeCreated?.();
    } catch (error) {
      console.error('Error creating buddy challenge:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o desafio",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  const handleAcceptBuddyChallenge = async (challengeId: string) => {
    try {
      const { error } = await supabase
        .from('challenges')
        .update({ 
          buddy_accepted: true,
          status: 'active'
        })
        .eq('id', challengeId);

      if (error) throw error;

      toast({
        title: "Desafio Aceito! 🎯",
        description: "Vocês dois estão agora no desafio juntos!",
        className: "gradient-success text-white"
      });

      fetchBuddyChallenges();
    } catch (error) {
      console.error('Error accepting challenge:', error);
      toast({
        title: "Erro",
        description: "Não foi possível aceitar o desafio",
        variant: "destructive"
      });
    }
  };

  const handleCompleteBuddyPart = async (challengeId: string, isBuddy: boolean) => {
    try {
      const updateField = isBuddy ? 'buddy_completed' : 'status';
      const updateValue = isBuddy ? true : 'completed';

      const { data: challenge } = await supabase
        .from('challenges')
        .select('buddy_completed, status, title, reward_points')
        .eq('id', challengeId)
        .single();

      const { error } = await supabase
        .from('challenges')
        .update({ [updateField]: updateValue })
        .eq('id', challengeId);

      if (error) throw error;

      // Check if both completed
      if ((isBuddy && challenge?.status === 'completed') || 
          (!isBuddy && challenge?.buddy_completed)) {
        // Trigger buddy celebration!
        celebrate({
          type: 'buddy_win',
          title: 'DUPLA CAMPEÃ!',
          subtitle: challenge?.title || 'Vocês conseguiram juntos!',
          points: (challenge?.reward_points || 100) * 2
        });
      } else {
        toast({
          title: "Sua parte está feita! ✅",
          description: "Aguardando seu parceiro completar também",
        });
      }

      fetchBuddyChallenges();
    } catch (error) {
      console.error('Error completing challenge part:', error);
    }
  };

  const activeChallenges = buddyChallenges.filter(c => 
    c.status === 'active' && c.buddy_accepted
  );
  const pendingChallenges = buddyChallenges.filter(c => 
    c.status === 'pending' && !c.buddy_accepted
  );

  return (
    <Card className="overflow-hidden border-pink-500/20">
      <CardHeader className="pb-3 bg-gradient-to-r from-pink-500/10 to-purple-500/10">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="w-5 h-5 text-pink-500" />
            Desafios em Dupla
          </CardTitle>
          <Button
            size="sm"
            onClick={() => setShowCreateDialog(true)}
            className="bg-pink-500 hover:bg-pink-600 text-white"
          >
            <UserPlus className="w-4 h-4 mr-1" />
            Novo
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Complete desafios junto com seus amigos!
        </p>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
          </div>
        ) : (
          <>
            {/* Pending Challenges */}
            {pendingChallenges.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4 text-yellow-500" />
                  Aguardando Resposta
                </h4>
                {pendingChallenges.map(challenge => (
                  <div key={challenge.id} className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{challenge.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{challenge.description}</p>
                      </div>
                      {challenge.buddy_id === userId && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAcceptBuddyChallenge(challenge.id)}
                            className="border-green-500 text-green-600 hover:bg-green-500/10"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-[10px]">
                        {challenge.reward_points} pontos cada
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Active Challenges */}
            {activeChallenges.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Target className="w-4 h-4 text-green-500" />
                  Desafios Ativos
                </h4>
                {activeChallenges.map(challenge => {
                  const isBuddy = challenge.buddy_id === userId;
                  const myCompleted = isBuddy ? challenge.buddy_completed : challenge.status === 'completed';
                  const partnerCompleted = isBuddy ? challenge.status === 'completed' : challenge.buddy_completed;
                  const progress = (myCompleted ? 50 : 0) + (partnerCompleted ? 50 : 0);

                  return (
                    <div key={challenge.id} className="p-3 bg-muted/50 rounded-lg border">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{challenge.title}</p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{challenge.description}</p>
                        </div>
                        {challenge.buddy_profile && (
                          <Avatar className="w-8 h-8 border-2 border-pink-500">
                            <AvatarImage src={challenge.buddy_profile.avatar_url} />
                            <AvatarFallback>{challenge.buddy_profile.display_name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                      
                      <div className="mt-3 space-y-2">
                        <Progress value={progress} className="h-2" />
                        <div className="flex justify-between text-[10px]">
                          <span className={myCompleted ? 'text-green-500' : 'text-muted-foreground'}>
                            {myCompleted ? '✅ Você completou' : '⏳ Sua vez'}
                          </span>
                          <span className={partnerCompleted ? 'text-green-500' : 'text-muted-foreground'}>
                            {partnerCompleted ? '✅ Parceiro completou' : '⏳ Aguardando parceiro'}
                          </span>
                        </div>
                      </div>

                      {!myCompleted && (
                        <Button
                          size="sm"
                          onClick={() => handleCompleteBuddyPart(challenge.id, isBuddy)}
                          className="w-full mt-3 bg-green-500 hover:bg-green-600 text-white"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Marcar como Completo
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Empty State */}
            {buddyChallenges.length === 0 && (
              <div className="text-center py-8">
                <Heart className="w-12 h-12 mx-auto text-pink-500/50 mb-3" />
                <p className="text-sm font-medium">Nenhum desafio em dupla</p>
                <p className="text-xs text-muted-foreground">Crie um desafio com um amigo!</p>
              </div>
            )}
          </>
        )}
      </CardContent>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-pink-500" />
              Criar Desafio em Dupla
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            {/* Select Buddy */}
            <div className="space-y-2">
              <Label>Escolha seu Parceiro</Label>
              {friends.length > 0 ? (
                <Select value={selectedBuddy} onValueChange={setSelectedBuddy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um amigo" />
                  </SelectTrigger>
                  <SelectContent>
                    {friends.map(friend => (
                      <SelectItem key={friend.id} value={friend.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={friend.avatar_url} />
                            <AvatarFallback>{friend.display_name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span>{friend.display_name}</span>
                          <Badge variant="secondary" className="text-[10px]">Nv {friend.level}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                  Adicione amigos primeiro para criar desafios em dupla
                </p>
              )}
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label>Título do Desafio</Label>
              <Input
                placeholder="Ex: Meditar 10 min por dia juntos"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                placeholder="Descreva o desafio..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            {/* Points and Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Pontos (cada)</Label>
                <Select value={rewardPoints} onValueChange={setRewardPoints}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="100">100 pts</SelectItem>
                    <SelectItem value="200">200 pts</SelectItem>
                    <SelectItem value="300">300 pts</SelectItem>
                    <SelectItem value="500">500 pts</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Duração</Label>
                <Select value={expiresDays} onValueChange={setExpiresDays}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 dias</SelectItem>
                    <SelectItem value="7">7 dias</SelectItem>
                    <SelectItem value="14">14 dias</SelectItem>
                    <SelectItem value="30">30 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={handleCreateBuddyChallenge}
              disabled={creating || !selectedBuddy || !title.trim() || friends.length === 0}
              className="w-full bg-pink-500 hover:bg-pink-600"
            >
              {creating ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Criar Desafio em Dupla
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
