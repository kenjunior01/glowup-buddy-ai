import React, { useState } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { useToast } from '../hooks/use-toast';
import { Loader2, Trophy, Clock, Target, Sparkles } from 'lucide-react';

interface ChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId?: string;
  targetUserName?: string;
}

export default function ChallengeModal({ 
  isOpen, 
  onClose, 
  targetUserId, 
  targetUserName 
}: ChallengeModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [challengeType, setChallengeType] = useState('daily');
  const [rewardPoints, setRewardPoints] = useState(100);
  const [expiresDays, setExpiresDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const { toast } = useToast();

  const challengeTypes = [
    { value: 'daily', label: 'Diário', icon: '📅' },
    { value: 'fitness', label: 'Exercícios', icon: '💪' },
    { value: 'learning', label: 'Aprendizado', icon: '📚' },
    { value: 'habit', label: 'Hábito', icon: '⚡' },
    { value: 'social', label: 'Social', icon: '👥' },
    { value: 'creative', label: 'Criativo', icon: '🎨' },
  ];

  const pointsOptions = [
    { value: 50, label: '50 pontos - Fácil' },
    { value: 100, label: '100 pontos - Médio' },
    { value: 200, label: '200 pontos - Difícil' },
    { value: 500, label: '500 pontos - Extremo' },
  ];

  const handleCreateChallenge = async () => {
    if (!targetUserId || !title.trim() || !description.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o título e descrição do desafio",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresDays);
      
      const { data, error } = await supabase.functions.invoke('create-user-challenge', {
        body: {
          challengeData: {
            challenger_id: targetUserId,
            title: title.trim(),
            description: description.trim(),
            challenge_type: challengeType,
            reward_points: rewardPoints,
            expires_at: expiresAt.toISOString()
          }
        }
      });

      if (error) {
        console.error('Error creating challenge:', error);
        toast({
          title: "Erro ao criar desafio",
          description: error.message || "Não foi possível criar o desafio",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Desafio criado! 🎯",
        description: `Desafio "${title}" enviado para ${targetUserName}`,
        className: "gradient-success text-white"
      });

      // Reset form and close modal
      setTitle('');
      setDescription('');
      setChallengeType('daily');
      setRewardPoints(100);
      setExpiresDays(7);
      onClose();

    } catch (error) {
      console.error('Error in handleCreateChallenge:', error);
      toast({
        title: "Erro inesperado",
        description: "Tente novamente em alguns instantes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateWithAI = async () => {
    if (!targetUserId) {
      toast({
        title: "Erro",
        description: "Selecione um usuário primeiro",
        variant: "destructive"
      });
      return;
    }

    setGeneratingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-smart-challenge', {
        body: { targetUserId }
      });

      if (error) throw error;

      if (data?.challenge) {
        setTitle(data.challenge.title);
        setDescription(data.challenge.description);
        setChallengeType(data.challenge.challengeType);
        setRewardPoints(Number(data.challenge.rewardPoints));
        setExpiresDays(Number(data.challenge.expiresDays));

        toast({
          title: "✨ Desafio gerado!",
          description: "Desafio personalizado criado pela IA",
          className: "gradient-primary text-white"
        });
      }
    } catch (error) {
      console.error('Error generating challenge:', error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o desafio com IA",
        variant: "destructive"
      });
    } finally {
      setGeneratingAI(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="post-card max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-primary" />
              <span>Criar Desafio</span>
            </div>
            {targetUserId && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateWithAI}
                disabled={generatingAI}
                className="text-xs h-8"
              >
                {generatingAI ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 mr-1" />
                    Gerar com IA
                  </>
                )}
              </Button>
            )}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Desafie <span className="font-semibold text-primary">{targetUserName}</span> para uma atividade!
          </p>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="title">
              Título do Desafio <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Ex: Fazer 30 flexões por dia"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={50}
            />
            <div className="text-xs text-muted-foreground text-right">
              {title.length}/50
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Descrição <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Descreva os detalhes do desafio..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
              rows={3}
            />
            <div className="text-xs text-muted-foreground text-right">
              {description.length}/200
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={challengeType} onValueChange={setChallengeType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {challengeTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <span className="flex items-center space-x-2">
                        <span>{type.icon}</span>
                        <span>{type.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Pontuação</Label>
              <Select 
                value={rewardPoints.toString()} 
                onValueChange={(value) => setRewardPoints(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pointsOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Prazo (dias)</Label>
            <Select 
              value={expiresDays.toString()} 
              onValueChange={(value) => setExpiresDays(Number(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 dia - Sprint</SelectItem>
                <SelectItem value="3">3 dias - Curto</SelectItem>
                <SelectItem value="7">7 dias - Padrão</SelectItem>
                <SelectItem value="14">14 dias - Longo</SelectItem>
                <SelectItem value="30">30 dias - Maratona</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-secondary/30 p-3 rounded-lg">
            <div className="flex items-center space-x-2 text-sm">
              <Target className="w-4 h-4 text-primary" />
              <span className="font-medium">Resumo do Desafio</span>
            </div>
            <div className="mt-2 text-xs text-muted-foreground space-y-1">
              <div>• <strong>{rewardPoints} pontos</strong> por completar</div>
              <div>• Expira em <strong>{expiresDays} dias</strong></div>
              <div>• Categoria: <strong>{challengeTypes.find(t => t.value === challengeType)?.label}</strong></div>
            </div>
          </div>

          <div className="flex space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateChallenge}
              className="flex-1 social-button"
              disabled={loading || !title.trim() || !description.trim()}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Trophy className="w-4 h-4 mr-2" />
              )}
              {loading ? 'Criando...' : 'Criar Desafio'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}