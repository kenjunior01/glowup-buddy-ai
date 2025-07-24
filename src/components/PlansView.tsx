import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Calendar, Sparkles, RefreshCw } from "lucide-react";

interface Plan {
  id: string;
  plan_type: string;
  content: any;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface PlansViewProps {
  userId: string;
}

const PlansView = ({ userId }: PlansViewProps) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingPlans, setGeneratingPlans] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, [userId]);

  const fetchPlans = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("plans")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
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

  const generatePlans = async () => {
    setGeneratingPlans(true);
    
    // First, get user's goals
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

  const getPlanTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      daily: "bg-green-500",
      weekly: "bg-blue-500",
      monthly: "bg-purple-500"
    };
    return colors[type] || "bg-gray-500";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const renderPlanContent = (content: any) => {
    if (Array.isArray(content)) {
      return (
        <ul className="space-y-2">
          {content.map((task, index) => (
            <li key={index} className="flex items-center space-x-2">
              <Checkbox id={`task-${index}`} />
              <label 
                htmlFor={`task-${index}`} 
                className="text-sm cursor-pointer flex-1"
              >
                {task}
              </label>
            </li>
          ))}
        </ul>
      );
    }

    if (typeof content === 'object' && content !== null) {
      return (
        <div className="space-y-4">
          {Object.entries(content).map(([key, tasks]: [string, any]) => (
            <div key={key}>
              <h4 className="font-medium mb-2 capitalize">{key}</h4>
              {Array.isArray(tasks) ? (
                <ul className="space-y-2 ml-4">
                  {tasks.map((task, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <Checkbox id={`${key}-task-${index}`} />
                      <label 
                        htmlFor={`${key}-task-${index}`} 
                        className="text-sm cursor-pointer flex-1"
                      >
                        {task}
                      </label>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground ml-4">{tasks}</p>
              )}
            </div>
          ))}
        </div>
      );
    }

    return <p className="text-sm text-muted-foreground">{content}</p>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Seus Planos Ativos</h3>
          <p className="text-sm text-muted-foreground">
            Planos personalizados gerados por IA com base nos seus objetivos
          </p>
        </div>
        <Button onClick={generatePlans} disabled={generatingPlans}>
          {generatingPlans ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Gerar Novos Planos
            </>
          )}
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : plans.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="mb-2">Nenhum plano ativo encontrado.</p>
            <p>Clique em "Gerar Novos Planos" para começar!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {plans.map((plan) => (
            <Card key={plan.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Badge className={`${getPlanTypeColor(plan.plan_type)} text-white`}>
                        {getPlanTypeLabel(plan.plan_type)}
                      </Badge>
                      <span>Plano {getPlanTypeLabel(plan.plan_type)}</span>
                    </CardTitle>
                    <CardDescription>
                      {formatDate(plan.start_date)} - {formatDate(plan.end_date)}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {renderPlanContent(plan.content)}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlansView;