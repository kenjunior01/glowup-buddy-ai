import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { getRandomMission } from "@/lib/missions";
import { toast } from "@/hooks/use-toast";
import { TrendingUp, Plus, Calendar } from "lucide-react";
import EmptyState from "./EmptyState";

interface ProgressEntry {
  id: string;
  plan_id: string;
  progress_notes: string;
  completion_rate: number;
  completed_tasks: any;
  updated_at: string;
  plans: {
    plan_type: string;
    content: any;
  };
}

interface ProgressTrackerProps {
  userId: string;
  onDataChange?: () => void;
}

const ProgressTracker = ({ userId, onDataChange }: ProgressTrackerProps) => {
  const [weeklyMission, setWeeklyMission] = useState<any>(null);
  const [progressEntries, setProgressEntries] = useState<ProgressEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [newProgress, setNewProgress] = useState({
    planId: "",
    notes: "",
    completionRate: 0,
  });

  useEffect(() => {
    fetchProgress();
    setWeeklyMission(getRandomMission());
  }, [userId]);

  const fetchProgress = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("progress")
      .select(`
        *,
        plans (
          plan_type,
          content
        )
      `)
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching progress:", error);
      toast({
        title: "Erro ao carregar progresso",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setProgressEntries(data || []);
    }
    setLoading(false);
  };

  const updateProgress = async (planId: string, notes: string, completionRate: number) => {
    const { data: existingProgress } = await supabase
      .from("progress")
      .select("*")
      .eq("user_id", userId)
      .eq("plan_id", planId)
      .single();

    const progressData = {
      user_id: userId,
      plan_id: planId,
      progress_notes: notes,
      completion_rate: completionRate,
      completed_tasks: [],
    };

    let error;
    if (existingProgress) {
      const { error: updateError } = await supabase
        .from("progress")
        .update(progressData)
        .eq("id", existingProgress.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from("progress")
        .insert(progressData);
      error = insertError;
    }

    if (error) {
      toast({
        title: "Erro ao atualizar progresso",
        description: error.message,
        variant: "destructive",
      });
    } else {
      // Feedback motivacional
      let feedbackMsg = "Ótimo trabalho! Continue evoluindo!";
      if (completionRate === 100) {
        feedbackMsg = "Parabéns! Você concluiu seu plano! Medalha de conquista desbloqueada! 🏅";
      } else if (completionRate >= 80) {
        feedbackMsg = "Você está quase lá! Mantenha o ritmo!";
      } else if (completionRate >= 40) {
        feedbackMsg = "Bom progresso! Tente avançar mais um pouco.";
      } else {
        feedbackMsg = "Todo começo é difícil, mas você consegue!";
      }
      toast({
        title: "Progresso atualizado!",
        description: feedbackMsg,
      });
      fetchProgress();
      onDataChange?.();
      setNewProgress({ planId: "", notes: "", completionRate: 0 });
    }
  };

  const getPlanTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      daily: "Diário",
      weekly: "Semanal",
      monthly: "Mensal"
    };
    return labels[type] || type;
  };

  const getPlanTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      daily: "bg-green-500",
      weekly: "bg-blue-500",
      monthly: "bg-purple-500"
    };
    return colors[type] || "bg-gray-500";
  };

  const getProgressColor = (rate: number) => {
    if (rate >= 80) return "bg-green-500";
    if (rate >= 60) return "bg-yellow-500";
    if (rate >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateOverallProgress = () => {
    if (progressEntries.length === 0) return 0;
    const total = progressEntries.reduce((sum, entry) => sum + entry.completion_rate, 0);
    return Math.round(total / progressEntries.length);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Resumo do Progresso</span>
          </CardTitle>
          <CardDescription>
            Visão geral do seu desenvolvimento nos últimos planos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Progresso Geral</span>
              <span className="text-sm text-muted-foreground">{calculateOverallProgress()}%</span>
            </div>
            <Progress value={calculateOverallProgress()} className="w-full" />
            {/* Missão semanal surpresa */}
            {weeklyMission && (
              <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
                <div className="font-bold text-blue-700 mb-1">Missão da Semana:</div>
                <div className="text-blue-900 font-medium">{weeklyMission.title}</div>
                <div className="text-sm text-blue-800 mb-2">{weeklyMission.description}</div>
                <div className="text-xs text-blue-600">Recompensa: {weeklyMission.reward}</div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {progressEntries.filter(p => p.completion_rate >= 80).length}
                </div>
                <div className="text-sm text-muted-foreground">Planos Concluídos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {progressEntries.filter(p => p.completion_rate >= 40 && p.completion_rate < 80).length}
                </div>
                <div className="text-sm text-muted-foreground">Em Progresso</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {progressEntries.filter(p => p.completion_rate < 40).length}
                </div>
                <div className="text-sm text-muted-foreground">Precisam Atenção</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Histórico de Progresso</h3>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : progressEntries.length === 0 ? (
          <EmptyState
            icon={<TrendingUp className="h-16 w-16" />}
            title="Nenhum progresso registrado"
            description="Complete alguns planos na aba 'Meus Planos' para ver seu desenvolvimento aqui!"
          />
        ) : (
          <div className="grid gap-4">
            {progressEntries.map((entry) => (
              <Card key={entry.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <Badge className={`${getPlanTypeColor(entry.plans.plan_type)} text-white`}>
                          {getPlanTypeLabel(entry.plans.plan_type)}
                        </Badge>
                        <span className="text-lg">Plano {getPlanTypeLabel(entry.plans.plan_type)}</span>
                      </CardTitle>
                      <CardDescription className="flex items-center space-x-2 mt-1">
                        <Calendar className="h-4 w-4" />
                        <span>Atualizado em {formatDate(entry.updated_at)}</span>
                      </CardDescription>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`${getProgressColor(entry.completion_rate)} text-white border-none`}
                    >
                      {entry.completion_rate}% completo
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Progresso</span>
                        <span className="text-sm text-muted-foreground">{entry.completion_rate}%</span>
                      </div>
                      <Progress value={entry.completion_rate} className="w-full" />
                    </div>
                    
                    {entry.progress_notes && (
                      <div>
                        <h4 className="font-medium mb-2">Notas de Progresso</h4>
                        <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                          {entry.progress_notes}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressTracker;