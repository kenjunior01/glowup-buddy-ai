import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Target, TrendingUp, Brain } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 to-secondary/20">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              GlowUp Planner AI
            </h1>
          </div>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Sua transformação pessoal com o poder da Inteligência Artificial. 
            Planos personalizados para saúde, estética, produtividade e bem-estar.
          </p>
          <Button 
            onClick={() => navigate("/auth")}
            size="lg" 
            className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
          >
            Começar Minha Transformação
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center p-6 rounded-lg bg-background/50 backdrop-blur-sm border">
            <Target className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Objetivos Personalizados</h3>
            <p className="text-muted-foreground">
              Defina suas metas e receba planos adaptados ao seu perfil e rotina
            </p>
          </div>
          <div className="text-center p-6 rounded-lg bg-background/50 backdrop-blur-sm border">
            <Brain className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">IA Inteligente</h3>
            <p className="text-muted-foreground">
              Algoritmos avançados criam planos únicos baseados em suas necessidades
            </p>
          </div>
          <div className="text-center p-6 rounded-lg bg-background/50 backdrop-blur-sm border">
            <TrendingUp className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Progresso Contínuo</h3>
            <p className="text-muted-foreground">
              Acompanhe sua evolução e ajuste seus planos automaticamente
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
