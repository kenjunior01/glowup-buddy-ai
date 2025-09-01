import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Sparkles, Target, TrendingUp, CheckCircle } from "lucide-react";

interface OnboardingHelperProps {
  userId: string;
  onComplete?: () => void;
}

const OnboardingHelper = ({ userId, onComplete }: OnboardingHelperProps) => {
  const [loading, setLoading] = useState(false);

  const exampleGoals = [
    {
      goal_type: "saude",
      goal_description: "Desenvolver uma rotina de exercícios regulares, fazendo pelo menos 30 minutos de atividade física 4x por semana",
      target_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 90 days from now
    },
    {
      goal_type: "estetica",
      goal_description: "Melhorar minha autoestima e confiança, desenvolvendo uma skincare routine e cuidando melhor da minha aparência",
      target_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 60 days from now
    },
    {
      goal_type: "mentalidade",
      goal_description: "Praticar mindfulness e reduzir o estresse, dedicando 15 minutos por dia para meditação ou reflexão",
      target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days from now
    }
  ];

  const addExampleGoals = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("goals")
        .insert(exampleGoals.map(goal => ({
          user_id: userId,
          ...goal
        })));

      if (error) throw error;

      toast({
        title: "Objetivos exemplo adicionados!",
        description: "Agora você pode gerar seus primeiros planos personalizados.",
      });

      onComplete?.();
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar objetivos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const goalTypeLabels = {
    saude: "Saúde",
    estetica: "Estética", 
    mentalidade: "Mentalidade"
  };

  const goalTypeColors = {
    saude: "bg-green-500",
    estetica: "bg-pink-500",
    mentalidade: "bg-purple-500"
  };

  return (
    <Card className="border-dashed border-2">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-primary/10 p-4">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
        </div>
        <CardTitle className="text-xl">Bem-vindo ao GlowUp Planner!</CardTitle>
        <CardDescription>
          Para começar sua jornada de transformação, que tal adicionar alguns objetivos exemplo?
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h4 className="font-medium flex items-center space-x-2">
            <Target className="h-4 w-4" />
            <span>Objetivos que adicionaremos:</span>
          </h4>
          <div className="grid gap-3">
            {exampleGoals.map((goal, index) => (
              <div key={index} className="p-3 bg-muted rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Badge className={`${goalTypeColors[goal.goal_type as keyof typeof goalTypeColors]} text-white text-xs`}>
                    {goalTypeLabels[goal.goal_type as keyof typeof goalTypeLabels]}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Meta: {new Date(goal.target_date).toLocaleDateString('pt-BR')}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{goal.goal_description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col space-y-4">
          <Button onClick={addExampleGoals} disabled={loading} size="lg" className="w-full">
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Adicionando objetivos...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Adicionar Objetivos Exemplo
              </>
            )}
          </Button>
          
          <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Target className="h-3 w-3" />
              <span>3 objetivos</span>
            </div>
            <div className="flex items-center space-x-1">
              <Sparkles className="h-3 w-3" />
              <span>IA personalizada</span>
            </div>
            <div className="flex items-center space-x-1">
              <TrendingUp className="h-3 w-3" />
              <span>Progresso rastreado</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OnboardingHelper;