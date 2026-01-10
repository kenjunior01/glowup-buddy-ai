import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Target, Sparkles, TrendingUp, Calendar, Lightbulb, RefreshCw } from "lucide-react";
import EmptyState from "./EmptyState";

interface Goal {
  id: string;
  goal_type: string;
  goal_description: string;
  target_date: string | null;
  status: string;
  created_at: string;
}

interface GoalsWithAIProps {
  userId: string;
  onDataChange?: () => void;
}

const goalTypes = [
  { value: "saude", label: "Saúde", color: "bg-green-500", icon: "💪" },
  { value: "estetica", label: "Estética", color: "bg-pink-500", icon: "✨" },
  { value: "produtividade", label: "Produtividade", color: "bg-blue-500", icon: "🚀" },
  { value: "mentalidade", label: "Mentalidade", color: "bg-purple-500", icon: "🧠" },
  { value: "estilo_vida", label: "Estilo de Vida", color: "bg-orange-500", icon: "🌟" },
];

const aiSuggestions = [
  { type: "saude", text: "Fazer 30 minutos de exercício por dia", icon: "💪" },
  { type: "saude", text: "Beber 2 litros de água diariamente", icon: "💧" },
  { type: "estetica", text: "Criar uma rotina de skincare", icon: "🧴" },
  { type: "produtividade", text: "Acordar às 6h todos os dias", icon: "⏰" },
  { type: "mentalidade", text: "Praticar meditação por 10 minutos", icon: "🧘" },
  { type: "estilo_vida", text: "Ler 1 livro por mês", icon: "📚" },
];

export default function GoalsWithAI({ userId, onDataChange }: GoalsWithAIProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingPlans, setGeneratingPlans] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newGoal, setNewGoal] = useState({
    type: "",
    description: "",
    targetDate: "",
  });
  const [plansCount, setPlansCount] = useState(0);

  useEffect(() => {
    fetchGoals();
    fetchPlansCount();
  }, [userId]);

  const fetchGoals = async () => {
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error) setGoals(data || []);
  };

  const fetchPlansCount = async () => {
    const { count } = await supabase
      .from("plans")
      .select("*", { count: 'exact', head: true })
      .eq("user_id", userId)
      .eq("active", true);
    setPlansCount(count || 0);
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.type || !newGoal.description) return;

    setLoading(true);
    const { error } = await supabase.from("goals").insert({
      user_id: userId,
      goal_type: newGoal.type,
      goal_description: newGoal.description,
      target_date: newGoal.targetDate || null,
    });

    if (error) {
      toast({ title: "Erro ao adicionar objetivo", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Objetivo adicionado!", description: "Agora gere planos personalizados com IA." });
      setNewGoal({ type: "", description: "", targetDate: "" });
      setShowForm(false);
      fetchGoals();
      onDataChange?.();
    }
    setLoading(false);
  };

  const handleQuickAdd = async (suggestion: typeof aiSuggestions[0]) => {
    setLoading(true);
    const { error } = await supabase.from("goals").insert({
      user_id: userId,
      goal_type: suggestion.type,
      goal_description: suggestion.text,
    });

    if (!error) {
      toast({ title: "Objetivo adicionado!", description: suggestion.text });
      fetchGoals();
      onDataChange?.();
    }
    setLoading(false);
  };

  const handleDeleteGoal = async (goalId: string) => {
    const { error } = await supabase.from("goals").delete().eq("id", goalId);
    if (!error) {
      toast({ title: "Objetivo removido" });
      fetchGoals();
      onDataChange?.();
    }
  };

  const generatePlans = async () => {
    if (goals.length === 0) {
      toast({ title: "Adicione objetivos primeiro", variant: "destructive" });
      return;
    }

    setGeneratingPlans(true);
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      const { data, error } = await supabase.functions.invoke('generate-plans', {
        body: { userId, goals, profile }
      });

      if (error) {
        console.error("Edge function error:", error);
        throw new Error(error.message || "Erro ao chamar função de geração de planos");
      }

      // Check if the response indicates an error
      if (data?.error) {
        throw new Error(data.error);
      }

      toast({ title: "Planos gerados com sucesso!", description: "Veja seus novos planos personalizados." });
      fetchPlansCount();
      onDataChange?.();
    } catch (error: any) {
      console.error("Error generating plans:", error);
      const errorMessage = error?.message || "Erro desconhecido ao gerar planos";
      toast({ 
        title: "Erro ao gerar planos", 
        description: errorMessage, 
        variant: "destructive" 
      });
    }
    setGeneratingPlans(false);
  };

  const getGoalTypeConfig = (type: string) => {
    return goalTypes.find(gt => gt.value === type) || goalTypes[0];
  };

  const calculateProgress = () => {
    if (goals.length === 0) return 0;
    const completed = goals.filter(g => g.status === 'completed').length;
    return Math.round((completed / goals.length) * 100);
  };

  const getDaysUntil = (dateString: string | null) => {
    if (!dateString) return null;
    const target = new Date(dateString);
    const now = new Date();
    const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="space-y-4">
      {/* Stats Header - Compact for mobile */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-card rounded-xl p-3 text-center border border-border/50">
          <span className="text-lg">🎯</span>
          <p className="text-lg font-bold">{goals.length}</p>
          <p className="text-[10px] text-muted-foreground">Objetivos</p>
        </div>
        <div className="bg-card rounded-xl p-3 text-center border border-border/50">
          <span className="text-lg">📅</span>
          <p className="text-lg font-bold">{plansCount}</p>
          <p className="text-[10px] text-muted-foreground">Planos</p>
        </div>
        <div className="bg-card rounded-xl p-3 text-center border border-border/50">
          <span className="text-lg">📈</span>
          <p className="text-lg font-bold">{calculateProgress()}%</p>
          <p className="text-[10px] text-muted-foreground">Progresso</p>
        </div>
        <button
          onClick={generatePlans}
          disabled={generatingPlans || goals.length === 0}
          className="bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl p-3 text-center border border-primary/30 tap-scale disabled:opacity-50"
        >
          {generatingPlans ? (
            <RefreshCw className="w-5 h-5 mx-auto animate-spin text-primary" />
          ) : (
            <span className="text-lg">✨</span>
          )}
          <p className="text-[10px] font-medium mt-1">{generatingPlans ? 'Gerando...' : 'Gerar IA'}</p>
        </button>
      </div>

      {/* Quick Add Suggestions - Compact */}
      {goals.length < 3 && (
        <div className="bg-card rounded-xl p-3 border border-border/50">
          <p className="text-xs font-medium flex items-center gap-1 mb-2">
            <span>💡</span> Sugestões Rápidas
          </p>
          <div className="flex flex-wrap gap-1.5">
            {aiSuggestions.slice(0, 3).map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleQuickAdd(suggestion)}
                disabled={loading}
                className="text-[11px] px-2.5 py-1.5 rounded-full bg-muted/50 hover:bg-muted tap-scale disabled:opacity-50"
              >
                {suggestion.icon} {suggestion.text.slice(0, 25)}...
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add Goal Form */}
      {showForm ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Novo Objetivo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddGoal} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Área de Foco</Label>
                  <Select value={newGoal.type} onValueChange={(v) => setNewGoal({ ...newGoal, type: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {goalTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <span className="flex items-center gap-2">
                            <span>{type.icon}</span>
                            {type.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Data Alvo (opcional)</Label>
                  <Input
                    type="date"
                    value={newGoal.targetDate}
                    onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  placeholder="Ex: Perder 5kg, desenvolver uma rotina de exercícios..."
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Button onClick={() => setShowForm(true)} className="w-full" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Novo Objetivo
        </Button>
      )}

      {/* Goals List */}
      <div className="space-y-4">
        <h3 className="font-semibold flex items-center justify-between">
          Seus Objetivos
          {goals.length > 0 && (
            <Badge variant="outline">{goals.length} objetivo{goals.length !== 1 ? 's' : ''}</Badge>
          )}
        </h3>
        
        {goals.length === 0 ? (
          <EmptyState
            icon={<Target className="w-16 h-16" />}
            title="Nenhum objetivo definido"
            description="Adicione objetivos para que a IA crie planos personalizados para você!"
            actionLabel="Adicionar Primeiro Objetivo"
            onAction={() => setShowForm(true)}
          />
        ) : (
          <div className="grid gap-4">
            {goals.map((goal) => {
              const config = getGoalTypeConfig(goal.goal_type);
              const daysUntil = getDaysUntil(goal.target_date);
              
              return (
                <Card key={goal.id} className="overflow-hidden">
                  <div className={`h-1 ${config.color}`} />
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{config.icon}</span>
                          <Badge className={`${config.color} text-white`}>
                            {config.label}
                          </Badge>
                          {daysUntil !== null && (
                            <Badge variant={daysUntil < 7 ? "destructive" : "outline"}>
                              {daysUntil > 0 ? `${daysUntil} dias restantes` : 'Prazo vencido'}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm">{goal.goal_description}</p>
                        {goal.target_date && (
                          <p className="text-xs text-muted-foreground mt-2">
                            <Calendar className="w-3 h-3 inline mr-1" />
                            Meta: {new Date(goal.target_date).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* CTA to generate plans */}
      {goals.length > 0 && plansCount === 0 && (
        <Card className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 border-primary/20">
          <CardContent className="p-6 text-center">
            <Sparkles className="w-12 h-12 mx-auto text-primary mb-4" />
            <h3 className="font-bold text-lg mb-2">Pronto para transformar seus objetivos em ação?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Nossa IA vai criar planos diários, semanais e mensais personalizados para você!
            </p>
            <Button onClick={generatePlans} disabled={generatingPlans} size="lg">
              {generatingPlans ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Gerar Planos com IA
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
