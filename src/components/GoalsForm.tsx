import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Target } from "lucide-react";
import OnboardingHelper from "./OnboardingHelper";

interface Goal {
  id: string;
  goal_type: string;
  goal_description: string;
  target_date: string | null;
}

interface GoalsFormProps {
  userId: string;
}

const goalTypes = [
  { value: "saude", label: "Saúde", color: "bg-green-500" },
  { value: "estetica", label: "Estética", color: "bg-pink-500" },
  { value: "produtividade", label: "Produtividade", color: "bg-blue-500" },
  { value: "mentalidade", label: "Mentalidade", color: "bg-purple-500" },
  { value: "estilo_vida", label: "Estilo de Vida", color: "bg-orange-500" },
];

const GoalsForm = ({ userId }: GoalsFormProps) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);
  const [newGoal, setNewGoal] = useState({
    type: "",
    description: "",
    targetDate: "",
  });

  useEffect(() => {
    fetchGoals();
  }, [userId]);

  const fetchGoals = async () => {
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching goals:", error);
      toast({
        title: "Erro ao carregar objetivos",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setGoals(data || []);
    }
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
      toast({
        title: "Erro ao adicionar objetivo",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Objetivo adicionado!",
        description: "Seu novo objetivo foi salvo com sucesso.",
      });
      setNewGoal({ type: "", description: "", targetDate: "" });
      fetchGoals();
    }

    setLoading(false);
  };

  const handleDeleteGoal = async (goalId: string) => {
    const { error } = await supabase
      .from("goals")
      .delete()
      .eq("id", goalId);

    if (error) {
      toast({
        title: "Erro ao remover objetivo",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Objetivo removido!",
        description: "O objetivo foi removido com sucesso.",
      });
      fetchGoals();
    }
  };

  const getGoalTypeLabel = (type: string) => {
    const goalType = goalTypes.find(gt => gt.value === type);
    return goalType ? goalType.label : type;
  };

  const getGoalTypeColor = (type: string) => {
    const goalType = goalTypes.find(gt => gt.value === type);
    return goalType ? goalType.color : "bg-gray-500";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Adicionar Novo Objetivo</span>
          </CardTitle>
          <CardDescription>
            Defina seus objetivos para que a IA possa criar planos personalizados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddGoal} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="goal-type">Área de Foco</Label>
                <Select
                  value={newGoal.type}
                  onValueChange={(value) => setNewGoal({ ...newGoal, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma área" />
                  </SelectTrigger>
                  <SelectContent>
                    {goalTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="target-date">Data Alvo (opcional)</Label>
                <Input
                  id="target-date"
                  type="date"
                  value={newGoal.targetDate}
                  onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal-description">Descrição do Objetivo</Label>
              <Textarea
                id="goal-description"
                placeholder="Ex: Perder 5kg, desenvolver uma rotina de exercícios, melhorar minha autoestima..."
                value={newGoal.description}
                onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                required
              />
            </div>
            <Button type="submit" disabled={loading}>
              <Plus className="h-4 w-4 mr-2" />
              {loading ? "Adicionando..." : "Adicionar Objetivo"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Seus Objetivos</h3>
        {goals.length === 0 ? (
          <OnboardingHelper userId={userId} onComplete={fetchGoals} />
        ) : (
          <div className="grid gap-4">
            {goals.map((goal) => (
              <Card key={goal.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge className={`${getGoalTypeColor(goal.goal_type)} text-white`}>
                          {getGoalTypeLabel(goal.goal_type)}
                        </Badge>
                        {goal.target_date && (
                          <Badge variant="outline">
                            Meta: {new Date(goal.target_date).toLocaleDateString('pt-BR')}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{goal.goal_description}</p>
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GoalsForm;