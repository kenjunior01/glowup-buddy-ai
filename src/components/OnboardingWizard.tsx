import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Sparkles, Heart, Dumbbell, Brain, Zap, 
  ChevronRight, ChevronLeft, Check, Target,
  Clock, Sun, Moon, Coffee
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingWizardProps {
  userId: string;
  onComplete: () => void;
}

const pillars = [
  { id: 'saude', name: 'Saúde', icon: Heart, emoji: '❤️', color: 'from-red-500 to-pink-500', description: 'Alimentação, exercícios e bem-estar físico' },
  { id: 'estetica', name: 'Estética', icon: Sparkles, emoji: '✨', color: 'from-purple-500 to-pink-500', description: 'Cuidados pessoais e autoestima' },
  { id: 'produtividade', name: 'Produtividade', icon: Zap, emoji: '⚡', color: 'from-yellow-500 to-orange-500', description: 'Foco, organização e eficiência' },
  { id: 'mentalidade', name: 'Mentalidade', icon: Brain, emoji: '🧠', color: 'from-blue-500 to-indigo-500', description: 'Mindset, meditação e crescimento pessoal' },
];

const timePreferences = [
  { id: 'morning', name: 'Manhã', icon: Sun, emoji: '🌅', description: '5h - 12h' },
  { id: 'afternoon', name: 'Tarde', icon: Coffee, emoji: '☀️', description: '12h - 18h' },
  { id: 'evening', name: 'Noite', icon: Moon, emoji: '🌙', description: '18h - 23h' },
];

const intensityLevels = [
  { id: 'light', name: 'Leve', emoji: '🌱', description: 'Começar devagar' },
  { id: 'moderate', name: 'Moderado', emoji: '🌿', description: 'Ritmo equilibrado' },
  { id: 'intense', name: 'Intenso', emoji: '🔥', description: 'Transformação rápida' },
];

export default function OnboardingWizard({ userId, onComplete }: OnboardingWizardProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedPillars, setSelectedPillars] = useState<string[]>([]);
  const [objectives, setObjectives] = useState<string[]>(['', '', '']);
  const [preferences, setPreferences] = useState({
    preferredTime: '',
    intensity: '',
    motivation: ''
  });

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const togglePillar = (pillarId: string) => {
    setSelectedPillars(prev => 
      prev.includes(pillarId) 
        ? prev.filter(p => p !== pillarId)
        : [...prev, pillarId]
    );
  };

  const handleObjectiveChange = (index: number, value: string) => {
    const newObjectives = [...objectives];
    newObjectives[index] = value;
    setObjectives(newObjectives);
  };

  const handleComplete = async () => {
    if (selectedPillars.length === 0) {
      toast({ title: "Selecione pelo menos um pilar", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Update profile with onboarding data
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          selected_pillars: selectedPillars,
          onboarding_preferences: {
            preferredTime: preferences.preferredTime,
            intensity: preferences.intensity,
            motivation: preferences.motivation,
            objectives: objectives.filter(o => o.trim() !== '')
          }
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      // Create initial goals from objectives
      const validObjectives = objectives.filter(o => o.trim() !== '');
      if (validObjectives.length > 0) {
        const goalsToInsert = validObjectives.map(obj => ({
          user_id: userId,
          goal_description: obj,
          goal_type: selectedPillars[0] || 'general',
          status: 'active'
        }));

        await supabase.from('goals').insert(goalsToInsert);
      }

      // Generate first AI plan
      try {
        await supabase.functions.invoke('generate-plans', {
          body: { userId, pillars: selectedPillars }
        });
      } catch (planError) {
        console.log('Plan generation will happen later');
      }

      toast({
        title: "🎉 Bem-vindo ao GlowUp!",
        description: "Sua jornada de transformação começa agora!"
      });

      onComplete();
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast({ 
        title: "Erro ao salvar",
        description: "Tente novamente",
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto shadow-2xl border-primary/20">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">Bem-vindo ao GlowUp! ✨</CardTitle>
          <CardDescription>
            Vamos personalizar sua jornada de transformação
          </CardDescription>
          <Progress value={progress} className="mt-4" />
          <p className="text-xs text-muted-foreground mt-2">
            Passo {step} de {totalSteps}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step 1: Select Pillars */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="text-center">
                <h3 className="text-lg font-semibold">Escolha seus pilares de foco</h3>
                <p className="text-sm text-muted-foreground">
                  Selecione as áreas que você quer transformar
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {pillars.map((pillar) => {
                  const Icon = pillar.icon;
                  const isSelected = selectedPillars.includes(pillar.id);
                  return (
                    <button
                      key={pillar.id}
                      onClick={() => togglePillar(pillar.id)}
                      className={cn(
                        "relative p-4 rounded-xl border-2 transition-all duration-300 text-left",
                        isSelected 
                          ? "border-primary bg-primary/10 shadow-lg" 
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                      )}
                    >
                      {isSelected && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div className={cn(
                        "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center mb-2",
                        pillar.color
                      )}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <p className="font-medium">{pillar.emoji} {pillar.name}</p>
                      <p className="text-xs text-muted-foreground">{pillar.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Define Objectives */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="text-center">
                <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Defina seus objetivos
                </h3>
                <p className="text-sm text-muted-foreground">
                  O que você quer conquistar? (pelo menos 1)
                </p>
              </div>
              <div className="space-y-3">
                {objectives.map((obj, index) => (
                  <div key={index} className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">
                      {index === 0 ? '🎯' : index === 1 ? '⭐' : '💫'}
                    </span>
                    <Input
                      placeholder={
                        index === 0 ? "Ex: Emagrecer 5kg em 3 meses" :
                        index === 1 ? "Ex: Meditar 10 min por dia" :
                        "Ex: Ler 2 livros por mês"
                      }
                      value={obj}
                      onChange={(e) => handleObjectiveChange(index, e.target.value)}
                      className="pl-10"
                    />
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                <p className="text-xs text-muted-foreground w-full text-center mb-2">Sugestões rápidas:</p>
                {['Perder peso', 'Ganhar músculo', 'Dormir melhor', 'Ser mais produtivo', 'Meditar diariamente'].map(suggestion => (
                  <Badge
                    key={suggestion}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary/10 transition-colors"
                    onClick={() => {
                      const emptyIndex = objectives.findIndex(o => o === '');
                      if (emptyIndex !== -1) {
                        handleObjectiveChange(emptyIndex, suggestion);
                      }
                    }}
                  >
                    {suggestion}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Preferences */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center">
                <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Suas preferências
                </h3>
                <p className="text-sm text-muted-foreground">
                  Personalize sua experiência
                </p>
              </div>

              {/* Time Preference */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Melhor horário para atividades:</p>
                <div className="grid grid-cols-3 gap-2">
                  {timePreferences.map((time) => {
                    const Icon = time.icon;
                    const isSelected = preferences.preferredTime === time.id;
                    return (
                      <button
                        key={time.id}
                        onClick={() => setPreferences(p => ({ ...p, preferredTime: time.id }))}
                        className={cn(
                          "p-3 rounded-lg border transition-all text-center",
                          isSelected 
                            ? "border-primary bg-primary/10" 
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <span className="text-2xl">{time.emoji}</span>
                        <p className="text-sm font-medium">{time.name}</p>
                        <p className="text-xs text-muted-foreground">{time.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Intensity */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Nível de intensidade:</p>
                <div className="grid grid-cols-3 gap-2">
                  {intensityLevels.map((level) => {
                    const isSelected = preferences.intensity === level.id;
                    return (
                      <button
                        key={level.id}
                        onClick={() => setPreferences(p => ({ ...p, intensity: level.id }))}
                        className={cn(
                          "p-3 rounded-lg border transition-all text-center",
                          isSelected 
                            ? "border-primary bg-primary/10" 
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <span className="text-2xl">{level.emoji}</span>
                        <p className="text-sm font-medium">{level.name}</p>
                        <p className="text-xs text-muted-foreground">{level.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Motivation */}
          {step === 4 && (
            <div className="space-y-4 animate-fade-in">
              <div className="text-center">
                <h3 className="text-lg font-semibold">Quase lá! 🚀</h3>
                <p className="text-sm text-muted-foreground">
                  O que te motiva a mudar?
                </p>
              </div>
              <Textarea
                placeholder="Ex: Quero me sentir mais confiante, ter mais energia para brincar com meus filhos, alcançar meu melhor potencial..."
                value={preferences.motivation}
                onChange={(e) => setPreferences(p => ({ ...p, motivation: e.target.value }))}
                className="min-h-[120px]"
              />
              
              {/* Summary */}
              <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                <p className="text-sm font-medium">📋 Resumo da sua jornada:</p>
                <div className="flex flex-wrap gap-1">
                  {selectedPillars.map(p => {
                    const pillar = pillars.find(pi => pi.id === p);
                    return pillar ? (
                      <Badge key={p} variant="secondary">{pillar.emoji} {pillar.name}</Badge>
                    ) : null;
                  })}
                </div>
                {objectives.filter(o => o).length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    🎯 {objectives.filter(o => o).length} objetivo(s) definido(s)
                  </p>
                )}
                {preferences.preferredTime && (
                  <p className="text-xs text-muted-foreground">
                    ⏰ Preferência: {timePreferences.find(t => t.id === preferences.preferredTime)?.name}
                  </p>
                )}
                {preferences.intensity && (
                  <p className="text-xs text-muted-foreground">
                    💪 Intensidade: {intensityLevels.find(l => l.id === preferences.intensity)?.name}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            <Button
              variant="ghost"
              onClick={() => setStep(s => s - 1)}
              disabled={step === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Voltar
            </Button>
            
            {step < totalSteps ? (
              <Button
                onClick={() => setStep(s => s + 1)}
                disabled={step === 1 && selectedPillars.length === 0}
              >
                Próximo
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={loading || selectedPillars.length === 0}
                className="gradient-primary"
              >
                {loading ? (
                  <>Criando seu plano...</>
                ) : (
                  <>
                    Começar Transformação
                    <Sparkles className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
