import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target, Users, Trophy, ShoppingBag, Sparkles, ArrowRight, X } from "lucide-react";

interface OnboardingStep {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: string;
  route?: string;
}

interface OnboardingTourProps {
  onComplete: () => void;
  onSkip: () => void;
}

const steps: OnboardingStep[] = [
  {
    icon: <Sparkles className="h-12 w-12 text-primary" />,
    title: "Bem-vindo ao GlowUp Planner AI! 🎉",
    description: "Sua jornada de transformação pessoal começa agora. Vou te guiar pelos principais recursos para você começar a evoluir.",
  },
  {
    icon: <Target className="h-12 w-12 text-primary" />,
    title: "Defina seus Objetivos",
    description: "No Dashboard, você pode definir metas de vida, saúde, carreira e relacionamentos. A IA vai gerar planos personalizados para você!",
    action: "Ir para Dashboard",
    route: "/dashboard",
  },
  {
    icon: <Trophy className="h-12 w-12 text-primary" />,
    title: "Complete Desafios",
    description: "Participe de desafios diários e semanais, ganhe pontos, suba de nível e desbloqueie conquistas especiais!",
    action: "Ver Desafios",
    route: "/challenges",
  },
  {
    icon: <Users className="h-12 w-12 text-primary" />,
    title: "Conecte-se com a Comunidade",
    description: "Faça amigos, desafie outros usuários e compartilhe seu progresso na aba Social. Juntos somos mais fortes!",
    action: "Explorar Social",
    route: "/social",
  },
  {
    icon: <ShoppingBag className="h-12 w-12 text-primary" />,
    title: "Marketplace de Conhecimento",
    description: "Explore cursos, e-books e mentorias criados pela comunidade. Ou crie e venda seu próprio conteúdo!",
    action: "Ver Marketplace",
    route: "/marketplace",
  },
];

export const OnboardingTour = ({ onComplete, onSkip }: OnboardingTourProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const progress = ((currentStep + 1) / steps.length) * 100;
  const step = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleAction = () => {
    if (step.route) {
      navigate(step.route);
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md animate-scale-in shadow-large">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2"
            onClick={onSkip}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="flex flex-col items-center gap-4 pt-4">
            <div className="p-4 rounded-full bg-primary/10 animate-bounce-in">
              {step.icon}
            </div>
            <CardTitle className="text-center text-xl">{step.title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">{step.description}</p>
          <div className="mt-6">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Passo {currentStep + 1} de {steps.length}
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          {step.action && step.route ? (
            <>
              <Button variant="outline" className="flex-1" onClick={handleNext}>
                Pular
              </Button>
              <Button className="flex-1 gradient-primary" onClick={handleAction}>
                {step.action}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button className="w-full gradient-primary" onClick={handleNext}>
              {currentStep < steps.length - 1 ? "Próximo" : "Começar!"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};
