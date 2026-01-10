import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import ChallengeFriends from "./ChallengeFriends";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Calendar, Sparkles, RefreshCw, Trophy, Target, Zap, Star, CheckCircle2, Clock, Trash2 } from "lucide-react";
import EmptyState from "./EmptyState";
import { cn } from "@/lib/utils";

interface Plan {
  id: string;
  plan_type: string;
  content: any;
  start_date: string;
  end_date: string;
  active: boolean;
  completed?: boolean;
}

interface PlansViewProps {
  userId: string;
  onDataChange?: () => void;
}

const PlansView = ({ userId, onDataChange }: PlansViewProps) => {
  const [friends, setFriends] = useState<any[]>([]);

  useEffect(() => {
    // Buscar amigos do usuário
    const fetchFriends = async () => {
      const { data, error } = await supabase
        .from("friendships")
        .select("*, profiles:friend_id(name, id)")
        .eq("user_id", userId)
        .eq("status", "accepted");
      if (!error && data) {
        setFriends(data.map((f: any) => f.profiles));
      }
    };
    fetchFriends();
  }, [userId]);
  const [deletingPlan, setDeletingPlan] = useState<string | null>(null);

  const handleDeletePlan = async (planId: string) => {
    if (!window.confirm("Tem certeza que deseja deletar este plano? Esta ação não pode ser desfeita.")) return;
    setDeletingPlan(planId);
    const { error } = await supabase
      .from("plans")
      .delete()
      .eq("id", planId);
    if (error) {
      toast({ title: "Erro ao deletar plano", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Plano deletado!", description: "O plano foi removido com sucesso." });
      fetchPlans();
      onDataChange?.();
    }
    setDeletingPlan(null);
  };
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingPlans, setGeneratingPlans] = useState(false);
  const [updatingPlan, setUpdatingPlan] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, [userId]);

  const fetchPlans = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("plans")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching plans:", error);
      toast({
        title: "Erro ao carregar planos",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setPlans(data || []);
    }
    setLoading(false);
  };

  // Marcar plano como concluído
  const handleCompletePlan = async (plan: Plan, completed: boolean) => {
    setUpdatingPlan(plan.id);
    // Atualiza status do plano
    const { error: planError } = await supabase
      .from("plans")
      .update({ completed, active: !completed })
      .eq("id", plan.id);

    // Registra no histórico de progresso e atualiza pontos/conquistas
    if (completed) {
      const { error: progressError } = await supabase
        .from("progress")
        .insert({
          user_id: userId,
          plan_id: plan.id,
          progress_notes: "Plano concluído!",
          completion_rate: 100,
          completed_tasks: plan.content,
        });
      if (progressError) {
        toast({
          title: "Erro ao registrar progresso",
          description: progressError.message,
          variant: "destructive",
        });
      }

      // Atualiza pontos e conquista no perfil
      // Busca perfil atual
      const { data: profile } = await supabase
        .from("profiles")
        .select("pontos, conquistas")
        .eq("id", userId)
        .single();
      let pontos = (profile?.pontos ?? 0) + 100; // 100 pontos por plano concluído
      let conquistas = Array.isArray(profile?.conquistas) ? profile.conquistas : [];
      // Adiciona conquista se não tiver
      if (!conquistas.includes("first-plan")) {
        conquistas.push("first-plan");
      }
      await supabase
        .from("profiles")
        .update({ pontos, conquistas })
        .eq("id", userId);
    }

    if (planError) {
      toast({
        title: "Erro ao atualizar plano",
        description: planError.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: completed ? "Plano marcado como concluído!" : "Plano reativado!",
        description: completed ? "Parabéns por concluir seu plano!" : "Plano está ativo novamente.",
      });
      fetchPlans();
      onDataChange?.();
    }
    setUpdatingPlan(null);
  };

  const generatePlans = async () => {
    setGeneratingPlans(true);

    // Buscar objetivos do usuário
    const { data: goals, error: goalsError } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", userId);

    if (goalsError) {
      toast({
        title: "Erro ao buscar objetivos",
        description: "Você precisa definir objetivos primeiro.",
        variant: "destructive",
      });
      setGeneratingPlans(false);
      return;
    }

    if (!goals || goals.length === 0) {
      toast({
        title: "Nenhum objetivo encontrado",
        description: "Adicione pelo menos um objetivo antes de gerar planos.",
        variant: "destructive",
      });
      setGeneratingPlans(false);
      return;
    }

    // Bloquear geração duplicada por período
    const now = new Date();
    const periodTypes = ["daily", "weekly", "monthly"];
    for (const type of periodTypes) {
      // Busca plano do mesmo tipo e período
      const { data: periodPlans } = await supabase
        .from("plans")
        .select("*")
        .eq("user_id", userId)
        .eq("plan_type", type)
        .order("created_at", { ascending: false });
      if (periodPlans && periodPlans.length > 0) {
        const lastPlan = periodPlans[0];
        const endDate = new Date(lastPlan.end_date);
        if (now <= endDate && lastPlan.active) {
          toast({
            title: `Plano ${getPlanTypeLabel(type)} já gerado`,
            description: `Você já possui um plano ${getPlanTypeLabel(type)} ativo até ${formatDate(lastPlan.end_date)}.`,
            variant: "destructive",
          });
          setGeneratingPlans(false);
          return;
        }
      }
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    try {
      // Call our Edge Function to generate plans
      const { data, error } = await supabase.functions.invoke('generate-plans', {
        body: {
          userId,
          goals,
          profile
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Planos gerados com sucesso!",
        description: "Seus novos planos personalizados estão prontos.",
      });
      fetchPlans();
      onDataChange?.();
    } catch (error: any) {
      console.error("Error generating plans:", error);
      toast({
        title: "Erro ao gerar planos",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    }

    setGeneratingPlans(false);
  };

  const getPlanTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      daily: "Diário",
      weekly: "Semanal",
      monthly: "Mensal"
    };
    return labels[type] || type;
  };

  const getPlanTypeEmoji = (type: string) => {
    const emojis: { [key: string]: string } = {
      daily: "☀️",
      weekly: "📅",
      monthly: "🗓️"
    };
    return emojis[type] || "📋";
  };

  const getPlanTypeGradient = (type: string) => {
    const gradients: { [key: string]: string } = {
      daily: "from-emerald-400 via-green-500 to-teal-500",
      weekly: "from-blue-400 via-indigo-500 to-purple-500",
      monthly: "from-purple-400 via-pink-500 to-rose-500"
    };
    return gradients[type] || "from-gray-400 to-gray-500";
  };

  const getPlanTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      daily: "bg-gradient-to-r from-emerald-500 to-teal-500",
      weekly: "bg-gradient-to-r from-blue-500 to-indigo-500",
      monthly: "bg-gradient-to-r from-purple-500 to-pink-500"
    };
    return colors[type] || "bg-gray-500";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const taskEmojis = ["✅", "🎯", "💪", "🚀", "⭐", "🔥", "💡", "🏆"];

  const renderPlanContent = (content: any, planType: string) => {
    let parsedContent = content;
    if (typeof content === 'string') {
      try {
        parsedContent = JSON.parse(content);
      } catch {
        return <p className="text-base text-muted-foreground">{content}</p>;
      }
    }

    if (Array.isArray(parsedContent)) {
      return (
        <ul className="space-y-3">
          {parsedContent.map((task, index) => (
            <li 
              key={index} 
              className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-muted/50 to-transparent hover:from-muted transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <Checkbox 
                id={`task-${index}`} 
                className="mt-0.5 h-5 w-5 rounded-full border-2 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-primary data-[state=checked]:to-accent"
              />
              <label 
                htmlFor={`task-${index}`} 
                className="text-base cursor-pointer flex-1 leading-relaxed"
              >
                <span className="mr-2">{taskEmojis[index % taskEmojis.length]}</span>
                {task}
              </label>
            </li>
          ))}
        </ul>
      );
    }

    if (typeof parsedContent === 'object' && parsedContent !== null) {
      const sectionEmojis: { [key: string]: string } = {
        manha: "🌅",
        tarde: "☀️",
        noite: "🌙",
        morning: "🌅",
        afternoon: "☀️",
        evening: "🌙",
        exercicio: "💪",
        estudo: "📚",
        trabalho: "💼",
        saude: "❤️",
        lazer: "🎮"
      };

      return (
        <div className="space-y-5">
          {Object.entries(parsedContent).map(([key, tasks]: [string, any], sectionIndex) => (
            <div 
              key={key} 
              className="animate-fade-in"
              style={{ animationDelay: `${sectionIndex * 100}ms` }}
            >
              <h4 className="font-bold text-base mb-3 flex items-center gap-2 capitalize">
                <span className="text-xl">{sectionEmojis[key.toLowerCase()] || "📌"}</span>
                {key}
              </h4>
              {Array.isArray(tasks) ? (
                <ul className="space-y-2 ml-2">
                  {tasks.map((task, index) => (
                    <li 
                      key={index} 
                      className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-muted/40 to-transparent hover:from-muted/60 transition-all duration-300"
                    >
                      <Checkbox 
                        id={`${key}-task-${index}`} 
                        className="mt-0.5 h-5 w-5 rounded-full border-2"
                      />
                      <label 
                        htmlFor={`${key}-task-${index}`} 
                        className="text-base cursor-pointer flex-1 leading-relaxed"
                      >
                        <span className="mr-2">{taskEmojis[index % taskEmojis.length]}</span>
                        {task}
                      </label>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-base text-muted-foreground ml-6">{tasks}</p>
              )}
            </div>
          ))}
        </div>
      );
    }

    return <p className="text-base text-muted-foreground">{String(parsedContent)}</p>;
  };

  // Separar planos ativos, concluídos e históricos
  const activePlans = plans.filter((p) => !p.completed && p.active);
  const completedPlans = plans.filter((p) => !!p.completed);
  const historicalPlans = plans.filter((p) => !p.active && !p.completed);

  return (
    <div className="space-y-6 pb-24">
      {/* Header Section com Gradiente */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-accent/10 to-secondary/20 p-5 border border-primary/20 animate-fade-in">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/30 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-accent/30 to-transparent rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg animate-pulse-glow">
              <Target className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                Seus Planos ✨
              </h3>
              <p className="text-sm text-muted-foreground">
                Gerados por IA com base nos seus objetivos 🎯
              </p>
            </div>
          </div>
          
          {/* Stats Pills */}
          <div className="flex flex-wrap gap-2 mt-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
              <Zap className="h-3.5 w-3.5" />
              {activePlans.length} ativos
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-400 text-sm font-medium">
              <Trophy className="h-3.5 w-3.5" />
              {completedPlans.length} concluídos
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button 
          onClick={generatePlans} 
          disabled={generatingPlans}
          className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] hover:bg-[length:100%_100%] transition-all duration-500 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
        >
          {generatingPlans ? (
            <>
              <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
              ✨ Gerando magia...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5 mr-2" />
              🚀 Gerar Novos Planos
            </>
          )}
        </Button>
        <Button 
          variant={showCompleted ? "default" : "outline"} 
          onClick={() => setShowCompleted((v) => !v)}
          className={cn(
            "h-12 px-6 text-base font-medium transition-all duration-300",
            showCompleted 
              ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600" 
              : "hover:bg-muted/50"
          )}
        >
          {showCompleted ? (
            <>🎯 Ver Ativos</>
          ) : (
            <>🏆 Ver Concluídos</>
          )}
        </Button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-muted animate-spin border-t-primary" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary animate-pulse" />
            </div>
          </div>
          <p className="text-muted-foreground animate-pulse">Carregando seus planos... ✨</p>
        </div>
      ) : (showCompleted ? (
        /* Completed Plans View */
        completedPlans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="text-6xl mb-4 animate-bounce">🏆</div>
            <h4 className="text-xl font-bold mb-2">Nenhum plano concluído</h4>
            <p className="text-muted-foreground text-base">
              Complete algum plano para celebrar aqui! 🎉
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {completedPlans.map((plan, index) => (
              <Card 
                key={plan.id} 
                className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-muted/50 to-muted/20 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Completed Badge */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  Concluído ✅
                </div>
                
                <CardHeader className="pb-2">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "p-2.5 rounded-xl bg-gradient-to-br shadow-lg opacity-70",
                      getPlanTypeGradient(plan.plan_type)
                    )}>
                      <span className="text-xl">{getPlanTypeEmoji(plan.plan_type)}</span>
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                        Plano {getPlanTypeLabel(plan.plan_type)}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1.5 text-sm mt-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDate(plan.start_date)} - {formatDate(plan.end_date)}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-3">
                  <div className="opacity-70">
                    {renderPlanContent(plan.content, plan.plan_type)}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDeletePlan(plan.id)} 
                    disabled={deletingPlan === plan.id}
                    className="mt-4 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4 mr-1.5" />
                    {deletingPlan === plan.id ? "Deletando..." : "Remover"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : (
        /* Active Plans View */
        activePlans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="text-7xl mb-4 animate-float">🎯</div>
            <h4 className="text-xl font-bold mb-2">Crie seu primeiro plano!</h4>
            <p className="text-muted-foreground text-base mb-6">
              Nossa IA vai criar planos personalizados baseados nos seus objetivos 🚀
            </p>
            <Button 
              onClick={generatePlans}
              className="h-12 px-6 text-base font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              ✨ Gerar Primeiros Planos
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            {activePlans.map((plan, index) => (
              <Card 
                key={plan.id} 
                className="relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 animate-fade-in hover:scale-[1.01]"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Gradient Background */}
                <div className={cn(
                  "absolute inset-0 opacity-10 bg-gradient-to-br",
                  getPlanTypeGradient(plan.plan_type)
                )} />
                
                {/* Top Accent Line */}
                <div className={cn(
                  "absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r",
                  getPlanTypeGradient(plan.plan_type)
                )} />
                
                <CardHeader className="relative pb-3 pt-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "p-3 rounded-xl bg-gradient-to-br shadow-lg animate-pulse-glow",
                        getPlanTypeGradient(plan.plan_type)
                      )}>
                        <span className="text-2xl">{getPlanTypeEmoji(plan.plan_type)}</span>
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                          Plano {getPlanTypeLabel(plan.plan_type)}
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1.5 text-sm mt-1">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDate(plan.start_date)} - {formatDate(plan.end_date)}
                        </CardDescription>
                      </div>
                    </div>
                    
                    {/* Type Badge */}
                    <Badge className={cn(
                      "text-white font-semibold px-3 py-1 text-sm shadow-md",
                      getPlanTypeColor(plan.plan_type)
                    )}>
                      {getPlanTypeEmoji(plan.plan_type)} {getPlanTypeLabel(plan.plan_type)}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="relative pt-0 pb-5">
                  {renderPlanContent(plan.content, plan.plan_type)}
                  
                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-3 mt-6 pt-4 border-t border-border/50">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCompletePlan(plan, true)}
                      disabled={updatingPlan === plan.id}
                      className="flex-1 sm:flex-none h-10 px-4 font-medium bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:from-emerald-500/20 hover:to-teal-500/20"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1.5" />
                      {updatingPlan === plan.id ? "Salvando..." : "✅ Concluir"}
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeletePlan(plan.id)} 
                      disabled={deletingPlan === plan.id}
                      className="h-10 px-4 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4 mr-1.5" />
                      {deletingPlan === plan.id ? "..." : "Remover"}
                    </Button>
                  </div>
                  
                  {/* Challenge Friends */}
                  <div className="mt-4">
                    <ChallengeFriends planId={plan.id} friends={friends} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ))}
      {/* Historical Plans Section */}
      {historicalPlans.length > 0 && !showCompleted && (
        <div className="mt-8 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">📚</span>
            <h4 className="font-bold text-lg">Histórico</h4>
            <Badge variant="secondary" className="ml-auto">
              {historicalPlans.length} planos
            </Badge>
          </div>
          <div className="space-y-3">
            {historicalPlans.map((plan, index) => (
              <Card 
                key={plan.id} 
                className="bg-muted/30 border-dashed animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardHeader className="py-3 px-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getPlanTypeEmoji(plan.plan_type)}</span>
                      <div>
                        <CardTitle className="text-sm font-medium">
                          Plano {getPlanTypeLabel(plan.plan_type)}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {formatDate(plan.start_date)} - {formatDate(plan.end_date)}
                        </CardDescription>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={async () => {
                        await supabase
                          .from("plans")
                          .update({ active: true })
                          .eq("id", plan.id);
                        toast({ title: "Plano reativado! 🎉", description: "Plano movido para ativos." });
                        fetchPlans();
                    }}>
                      Reativar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {renderPlanContent(plan.content, plan.plan_type)}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlansView;