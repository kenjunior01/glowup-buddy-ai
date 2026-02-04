import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useCelebration } from '@/components/CelebrationSystem';
import { 
  Flame, Snowflake, Shield, Trophy, 
  AlertTriangle, Loader2, Gift, Sparkles 
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface StreakProtectionProps {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  todayCompleted: boolean;
  onCheckIn?: () => void;
  onStreakUpdate?: () => void;
}

export default function StreakProtection({
  userId,
  currentStreak,
  longestStreak,
  todayCompleted,
  onCheckIn,
  onStreakUpdate
}: StreakProtectionProps) {
  const [freezeTokens, setFreezeTokens] = useState(0);
  const [freezeTokensUsed, setFreezeTokensUsed] = useState(0);
  const [lastFreezeDate, setLastFreezeDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showFreezeDialog, setShowFreezeDialog] = useState(false);
  const { toast } = useToast();
  const { celebrate } = useCelebration();

  useEffect(() => {
    fetchStreakData();
  }, [userId]);

  const fetchStreakData = async () => {
    const { data, error } = await supabase
      .from('streaks')
      .select('freeze_tokens, freeze_tokens_used, last_freeze_date')
      .eq('user_id', userId)
      .single();

    if (data && !error) {
      setFreezeTokens(data.freeze_tokens || 0);
      setFreezeTokensUsed(data.freeze_tokens_used || 0);
      setLastFreezeDate(data.last_freeze_date);
    }
  };

  const handleUseFreeze = async () => {
    if (freezeTokens <= 0) {
      toast({
        title: "Sem Gelos",
        description: "Você não tem gelos disponíveis para proteger sua sequência",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Check if already used freeze today
      if (lastFreezeDate === today) {
        toast({
          title: "Gelo já usado",
          description: "Você já usou um gelo hoje",
          variant: "destructive"
        });
        return;
      }

      // Update streak with freeze protection
      const { error } = await supabase
        .from('streaks')
        .update({
          freeze_tokens: freezeTokens - 1,
          freeze_tokens_used: freezeTokensUsed + 1,
          last_freeze_date: today,
          last_activity_date: today // Keep streak alive
        })
        .eq('user_id', userId);

      if (error) throw error;

      setFreezeTokens(prev => prev - 1);
      setFreezeTokensUsed(prev => prev + 1);
      setLastFreezeDate(today);

      toast({
        title: "Sequência Protegida! ❄️",
        description: `Sua sequência de ${currentStreak} dias está segura!`,
        className: "bg-cyan-500 text-white"
      });

      setShowFreezeDialog(false);
      onStreakUpdate?.();
    } catch (error) {
      console.error('Error using freeze:', error);
      toast({
        title: "Erro",
        description: "Não foi possível usar o gelo",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const earnFreezeToken = async () => {
    // Check if user earned a new freeze (every 7-day streak milestone)
    if (currentStreak > 0 && currentStreak % 7 === 0) {
      const { error } = await supabase
        .from('streaks')
        .update({ freeze_tokens: freezeTokens + 1 })
        .eq('user_id', userId);

      if (!error) {
        setFreezeTokens(prev => prev + 1);
        
        // Celebrate streak milestone!
        celebrate({
          type: 'streak',
          value: currentStreak,
          title: 'SEQUÊNCIA INCRÍVEL!',
          subtitle: `${currentStreak} dias seguidos + 1 gelo de bônus!`,
          points: currentStreak * 10
        });
      }
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const canUseFreeze = !todayCompleted && freezeTokens > 0 && lastFreezeDate !== today;
  const streakInDanger = !todayCompleted && currentStreak > 0;

  return (
    <Card className="overflow-hidden border-orange-500/20">
      <CardHeader className="pb-3 bg-gradient-to-r from-orange-500/10 to-red-500/10">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Flame className="w-5 h-5 text-orange-500" />
            Sua Sequência
          </CardTitle>
          
          {/* Freeze Tokens Badge */}
          <Badge className="bg-cyan-500/20 text-cyan-600 border-cyan-500/30 flex items-center gap-1">
            <Snowflake className="w-3 h-3" />
            {freezeTokens} Gelos
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Streak Display */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/10">
            <Flame className="w-8 h-8 mx-auto text-orange-500 mb-2" />
            <p className="text-3xl font-bold text-gradient">{currentStreak}</p>
            <p className="text-xs text-muted-foreground">Sequência Atual</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-muted/50">
            <Trophy className="w-8 h-8 mx-auto text-yellow-500 mb-2" />
            <p className="text-3xl font-bold text-yellow-500">{longestStreak}</p>
            <p className="text-xs text-muted-foreground">Melhor Sequência</p>
          </div>
        </div>

        {/* Streak Progress to next freeze */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Próximo gelo em</span>
            <span className="font-medium">{7 - (currentStreak % 7)} dias</span>
          </div>
          <Progress value={((currentStreak % 7) / 7) * 100} className="h-2" />
        </div>

        {/* Status & Actions */}
        {todayCompleted ? (
          <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/20 text-center">
            <Shield className="w-8 h-8 mx-auto text-green-500 mb-2" />
            <p className="font-medium text-green-600">Check-in Completo!</p>
            <p className="text-xs text-muted-foreground">Sua sequência está segura</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Warning if streak in danger */}
            {streakInDanger && (
              <div className="p-3 bg-orange-500/10 rounded-xl border border-orange-500/20 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-orange-600">Sequência em risco!</p>
                  <p className="text-xs text-muted-foreground">Faça check-in ou use um gelo</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button 
                onClick={onCheckIn}
                className="flex-1 gradient-primary"
              >
                <Flame className="w-4 h-4 mr-2" />
                Check-in Diário
              </Button>
              
              <Dialog open={showFreezeDialog} onOpenChange={setShowFreezeDialog}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline"
                    disabled={!canUseFreeze}
                    className="border-cyan-500/30 text-cyan-600 hover:bg-cyan-500/10"
                  >
                    <Snowflake className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Snowflake className="w-5 h-5 text-cyan-500" />
                      Usar Freeze Streak?
                    </DialogTitle>
                    <DialogDescription>
                      Você tem <strong>{freezeTokens} gelos</strong> disponíveis. 
                      Usar um gelo vai proteger sua sequência de {currentStreak} dias por hoje.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 pt-4">
                    <div className="p-4 bg-cyan-500/10 rounded-xl text-center">
                      <Snowflake className="w-12 h-12 mx-auto text-cyan-500 mb-2" />
                      <p className="font-medium">Proteger Sequência</p>
                      <p className="text-sm text-muted-foreground">
                        Sua sequência de {currentStreak} dias será mantida
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowFreezeDialog(false)}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleUseFreeze}
                        disabled={loading}
                        className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white"
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Snowflake className="w-4 h-4 mr-2" />
                        )}
                        Usar Gelo
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        )}

        {/* Freeze tokens info */}
        <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
          <div className="flex items-center gap-2 mb-1">
            <Gift className="w-3 h-3" />
            <span className="font-medium">Como ganhar gelos:</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 ml-1">
            <li>Complete 7 dias de sequência (+1 gelo)</li>
            <li>Alcance marcos de nível</li>
            <li>Complete desafios especiais</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
