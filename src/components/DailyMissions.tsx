import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Zap, Target, Users, MessageSquare, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DailyMission {
  id: string;
  title: string;
  description: string;
  icon: any;
  target: number;
  current: number;
  completed: boolean;
  reward_points: number;
  type: 'streak' | 'social' | 'challenge' | 'profile' | 'chat';
  action_required?: string;
}

interface DailyMissionsProps {
  userId: string;
}

export const DailyMissions = ({ userId }: DailyMissionsProps) => {
  const [missions, setMissions] = useState<DailyMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAI, setLoadingAI] = useState(false);
  const { toast } = useToast();

  const missionTemplates: Omit<DailyMission, 'id' | 'current' | 'completed'>[] = [
    {
      title: 'Check-in Diário',
      description: 'Faça seu check-in diário para manter a sequência',
      icon: Zap,
      target: 1,
      reward_points: 20,
      type: 'streak',
      action_required: 'checkin'
    },
    {
      title: 'Conectar com Amigos',
      description: 'Envie uma mensagem para um amigo',
      icon: MessageSquare,
      target: 1,
      reward_points: 15,
      type: 'chat'
    },
    {
      title: 'Desafio do Dia',
      description: 'Complete um desafio hoje',
      icon: Target,
      target: 1,
      reward_points: 30,
      type: 'challenge'
    },
    {
      title: 'Perfil Atualizado',
      description: 'Atualize alguma informação do seu perfil',
      icon: Users,
      target: 1,
      reward_points: 10,
      type: 'profile'
    },
    {
      title: 'Social Ativo',
      description: 'Adicione um novo amigo',
      icon: Users,
      target: 1,
      reward_points: 25,
      type: 'social'
    }
  ];

  useEffect(() => {
    initializeDailyMissions();
  }, [userId]);

  const initializeDailyMissions = async () => {
    try {
      // Check if user already has missions for today
      const today = new Date().toISOString().split('T')[0];
      
      // For now, we'll create missions dynamically
      // In a real app, you'd store this in a database
      const userMissions: DailyMission[] = missionTemplates.map((template, index) => ({
        ...template,
        id: `mission_${today}_${index}`,
        current: 0,
        completed: false
      }));

      // Check progress for each mission type
      await checkMissionProgress(userMissions);
      setMissions(userMissions);
    } catch (error) {
      console.error('Error initializing missions:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkMissionProgress = async (missions: DailyMission[]) => {
    const today = new Date().toISOString().split('T')[0];
    
    // Check streak mission (daily check-in)
    const { data: streakData } = await supabase
      .from('streaks')
      .select('last_activity_date')
      .eq('user_id', userId)
      .single();
    
    if (streakData?.last_activity_date === today) {
      updateMissionProgress('streak', 1, missions);
    }

    // Check chat missions (messages sent today)
    const { data: messagesData } = await supabase
      .from('messages')
      .select('id')
      .eq('sender_id', userId)
      .gte('created_at', `${today}T00:00:00`)
      .lt('created_at', `${today}T23:59:59`);
    
    updateMissionProgress('chat', messagesData?.length || 0, missions);

    // Check challenge missions (challenges completed today)
    const { data: challengesData } = await supabase
      .from('challenges')
      .select('id')
      .eq('challenger_id', userId)
      .eq('status', 'completed')
      .gte('completed_at', `${today}T00:00:00`)
      .lt('completed_at', `${today}T23:59:59`);
    
    updateMissionProgress('challenge', challengesData?.length || 0, missions);

    // Check social missions (friend requests sent today)
    const { data: friendsData } = await supabase
      .from('friendships')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', `${today}T00:00:00`)
      .lt('created_at', `${today}T23:59:59`);
    
    updateMissionProgress('social', friendsData?.length || 0, missions);

    // Check profile missions (profile updated today)
    const { data: profileData } = await supabase
      .from('profiles')
      .select('updated_at')
      .eq('id', userId)
      .single();
    
    if (profileData?.updated_at?.startsWith(today)) {
      updateMissionProgress('profile', 1, missions);
    }
  };

  const updateMissionProgress = (type: string, current: number, missions: DailyMission[]) => {
    const mission = missions.find(m => m.type === type);
    if (mission) {
      mission.current = Math.min(current, mission.target);
      mission.completed = mission.current >= mission.target;
    }
  };

  const completeMission = async (mission: DailyMission) => {
    if (mission.completed) return;

    try {
      // Award points to user
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('pontos, experience_points')
        .eq('id', userId)
        .single();

      const { error } = await supabase
        .from('profiles')
        .update({
          pontos: (currentProfile?.pontos || 0) + mission.reward_points,
          experience_points: (currentProfile?.experience_points || 0) + mission.reward_points
        })
        .eq('id', userId);

      if (!error) {
        // Update mission as completed
        const updatedMissions = missions.map(m => 
          m.id === mission.id 
            ? { ...m, completed: true, current: m.target }
            : m
        );
        setMissions(updatedMissions);

        toast({
          title: "🎯 Missão Completada!",
          description: `${mission.title} concluída! +${mission.reward_points} pontos`,
        });
      }
    } catch (error) {
      console.error('Error completing mission:', error);
      toast({
        title: "Erro",
        description: "Não foi possível completar a missão.",
        variant: "destructive",
      });
    }
  };

  const handleQuickAction = async (mission: DailyMission) => {
    if (mission.action_required === 'checkin') {
      try {
        const { error } = await supabase.functions.invoke('update-user-streak', {
          body: {}
        });
        
        if (!error) {
          completeMission(mission);
        }
      } catch (error) {
        console.error('Error with check-in:', error);
      }
    }
  };

  const getAISuggestions = async () => {
    setLoadingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-missions', {
        body: { userId }
      });

      if (error) throw error;

      if (data?.missions && data.missions.length > 0) {
        const aiMissions = data.missions.map((m: any, index: number) => ({
          id: `ai_mission_${Date.now()}_${index}`,
          title: m.title,
          description: m.description,
          icon: Award,
          target: 1,
          current: 0,
          completed: false,
          reward_points: m.points || 20,
          type: m.type || 'challenge'
        }));

        setMissions(prev => [...aiMissions, ...prev]);
        
        toast({
          title: "✨ Missões IA Geradas!",
          description: `${data.missions.length} novas missões personalizadas adicionadas`,
        });
      }
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      toast({
        title: "Erro",
        description: "Não foi possível obter sugestões da IA.",
        variant: "destructive",
      });
    } finally {
      setLoadingAI(false);
    }
  };

  const completedCount = missions.filter(m => m.completed).length;
  const totalRewards = missions.reduce((sum, m) => sum + (m.completed ? m.reward_points : 0), 0);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Missões Diárias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            Carregando missões...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Missões Diárias ({completedCount}/{missions.length})
            </CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
              <span>Pontos ganhos hoje: {totalRewards}</span>
              <Badge variant={completedCount === missions.length ? "default" : "secondary"}>
                {completedCount === missions.length ? "Todas completas! 🎉" : "Em progresso"}
              </Badge>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={getAISuggestions}
            disabled={loadingAI}
            className="gap-2"
          >
            <Zap className="w-4 h-4" />
            {loadingAI ? 'Gerando...' : 'Sugestões IA'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {missions.map((mission) => {
            const Icon = mission.icon;
            const progress = (mission.current / mission.target) * 100;
            
            return (
              <div
                key={mission.id}
                className={`p-4 rounded-lg border transition-all ${
                  mission.completed 
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 dark:from-green-900/20 dark:to-emerald-900/20' 
                    : 'bg-muted/30 border-border hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`p-2 rounded-full ${
                      mission.completed 
                        ? 'bg-green-500 text-white' 
                        : 'bg-primary/10 text-primary'
                    }`}>
                      {mission.completed ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h4 className={`font-medium ${
                        mission.completed ? 'text-green-700 dark:text-green-300' : ''
                      }`}>
                        {mission.title}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {mission.description}
                      </p>
                      
                      {!mission.completed && (
                        <div className="mt-2 space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>{mission.current}/{mission.target}</span>
                            <span className="text-primary">+{mission.reward_points} pts</span>
                          </div>
                          <Progress value={progress} className="h-1" />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {mission.completed ? (
                      <Badge variant="default" className="text-xs">
                        +{mission.reward_points} pts
                      </Badge>
                    ) : (
                      <>
                        {mission.action_required && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleQuickAction(mission)}
                          >
                            {mission.action_required === 'checkin' && 'Check-in'}
                          </Button>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {mission.reward_points} pts
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};