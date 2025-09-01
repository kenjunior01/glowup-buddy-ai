import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle, Sparkles, Target, Calendar, TrendingUp, ArrowRight } from "lucide-react";

interface Step {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
}

interface WelcomeGuideProps {
  onStepAction: (stepId: string) => void;
  completedSteps: string[];
}

const WelcomeGuide = ({ onStepAction, completedSteps }: WelcomeGuideProps) => {
  const steps: Step[] = [
    {
      id: "goals",
      title: "Defina seus objetivos",
      description: "Comece definindo suas metas de transformação pessoal",
      icon: <Target className="h-5 w-5" />,
      completed: completedSteps.includes("goals")
    },
    {
      id: "plans",
      title: "Gere seus planos",
      description: "Use IA para criar planos personalizados baseados em seus objetivos",
      icon: <Calendar className="h-5 w-5" />,
      completed: completedSteps.includes("plans")
    },
    {
      id: "progress",
      title: "Acompanhe seu progresso",
      description: "Monitore seu desenvolvimento e celebre suas conquistas",
      icon: <TrendingUp className="h-5 w-5" />,
      completed: completedSteps.includes("progress")
    }
  ];

  const completedCount = completedSteps.length;
  const progressPercentage = (completedCount / steps.length) * 100;

  return (
    <Card className="gradient-primary border-primary/20 shadow-glow">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <CardTitle className="text-gradient">
            Bem-vindo ao GlowUp Planner AI
          </CardTitle>
        </div>
        <CardDescription>
          Siga estes passos para começar sua jornada de transformação
        </CardDescription>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Progresso inicial</span>
            <Badge variant="secondary">
              {completedCount}/{steps.length} concluídos
            </Badge>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className="flex items-center justify-between p-4 rounded-lg border bg-background/50 hover:bg-background/80 transition-colors"
          >
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                {step.completed ? (
                  <CheckCircle className="h-5 w-5 text-primary" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-primary">
                  {step.icon}
                </div>
                <div>
                  <h4 className="font-medium text-foreground">
                    {step.title}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
            {!step.completed && (
              <Button
                onClick={() => onStepAction(step.id)}
                size="sm"
                className="ml-4"
              >
                Iniciar
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default WelcomeGuide;