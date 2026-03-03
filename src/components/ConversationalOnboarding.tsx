import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Sparkles, Send, Check, ArrowRight, X } from 'lucide-react';

interface ConversationalOnboardingProps {
  userId: string;
  onComplete: () => void;
}

type MessageRole = 'assistant' | 'user';

interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  options?: string[];
  multiSelect?: boolean;
}

interface OnboardingData {
  pillars: string[];
  objectives: string[];
  preferredTime: string;
  intensity: string;
  motivation: string;
}

const STEPS = [
  {
    id: 'welcome',
    message: '✨ Olá! Eu sou a IA do GlowUp. Estou aqui para criar sua jornada de transformação personalizada. Vamos começar?',
    options: ['Bora! 🚀', 'Me conte mais'],
  },
  {
    id: 'pillars',
    message: 'Ótimo! Quais áreas da sua vida você quer transformar? Pode escolher mais de uma:',
    options: ['❤️ Saúde', '✨ Estética', '⚡ Produtividade', '🧠 Mentalidade'],
    multiSelect: true,
  },
  {
    id: 'objectives',
    message: 'Perfeito! Agora me conta: qual é o seu principal objetivo? Pode escrever com suas palavras 😊',
  },
  {
    id: 'time',
    message: 'Entendi! E qual seu melhor horário para se dedicar às atividades?',
    options: ['🌅 Manhã', '☀️ Tarde', '🌙 Noite'],
  },
  {
    id: 'intensity',
    message: 'Qual nível de intensidade você prefere?',
    options: ['🌱 Leve — começar devagar', '🌿 Moderado — ritmo equilibrado', '🔥 Intenso — transformação rápida'],
  },
  {
    id: 'motivation',
    message: 'Última pergunta: o que te motiva a mudar? Me conta um pouco sobre seu "porquê" 💪',
  },
];

const pillarMap: Record<string, string> = {
  '❤️ Saúde': 'saude',
  '✨ Estética': 'estetica',
  '⚡ Produtividade': 'produtividade',
  '🧠 Mentalidade': 'mentalidade',
};

const timeMap: Record<string, string> = {
  '🌅 Manhã': 'morning',
  '☀️ Tarde': 'afternoon',
  '🌙 Noite': 'evening',
};

const intensityMap: Record<string, string> = {
  '🌱 Leve — começar devagar': 'light',
  '🌿 Moderado — ritmo equilibrado': 'moderate',
  '🔥 Intenso — transformação rápida': 'intense',
};

export default function ConversationalOnboarding({ userId, onComplete }: ConversationalOnboardingProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    pillars: [],
    objectives: [],
    preferredTime: '',
    intensity: '',
    motivation: '',
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Start the conversation
    const timer = setTimeout(() => {
      addAssistantMessage(STEPS[0]);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const addAssistantMessage = (step: typeof STEPS[0]) => {
    setMessages(prev => [...prev, {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: step.message,
      options: step.options,
      multiSelect: step.multiSelect,
    }]);
  };

  const addUserMessage = (content: string) => {
    setMessages(prev => [...prev, {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
    }]);
  };

  const processAnswer = (answer: string, stepId: string) => {
    switch (stepId) {
      case 'welcome':
        if (answer === 'Me conte mais') {
          setMessages(prev => [...prev, {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: 'O GlowUp usa IA para criar planos personalizados de transformação pessoal. Vamos definir seus objetivos, preferências e criar um plano sob medida para você. Tudo com gamificação para te manter motivado! 🎮',
          }]);
          setTimeout(() => addAssistantMessage(STEPS[1]), 1000);
          setCurrentStep(1);
        } else {
          advanceStep();
        }
        break;
      case 'pillars':
        setData(prev => ({ ...prev, pillars: selectedOptions.map(o => pillarMap[o] || o) }));
        setSelectedOptions([]);
        advanceStep();
        break;
      case 'objectives':
        setData(prev => ({ ...prev, objectives: [...prev.objectives, answer] }));
        advanceStep();
        break;
      case 'time':
        setData(prev => ({ ...prev, preferredTime: timeMap[answer] || answer }));
        advanceStep();
        break;
      case 'intensity':
        setData(prev => ({ ...prev, intensity: intensityMap[answer] || answer }));
        advanceStep();
        break;
      case 'motivation':
        setData(prev => ({ ...prev, motivation: answer }));
        finishOnboarding({ ...data, motivation: answer });
        break;
    }
  };

  const advanceStep = () => {
    const nextStep = currentStep + 1;
    if (nextStep < STEPS.length) {
      setCurrentStep(nextStep);
      setTimeout(() => addAssistantMessage(STEPS[nextStep]), 600);
    }
  };

  const handleOptionClick = (option: string) => {
    const step = STEPS[currentStep];
    if (step.multiSelect) {
      setSelectedOptions(prev =>
        prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option]
      );
    } else {
      addUserMessage(option);
      processAnswer(option, step.id);
    }
  };

  const handleMultiSelectConfirm = () => {
    if (selectedOptions.length === 0) return;
    const answer = selectedOptions.join(', ');
    addUserMessage(answer);
    processAnswer(answer, STEPS[currentStep].id);
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;
    const answer = inputValue.trim();
    setInputValue('');
    addUserMessage(answer);
    processAnswer(answer, STEPS[currentStep].id);
  };

  const finishOnboarding = async (finalData: OnboardingData) => {
    setSaving(true);
    // Show a "creating plan" message
    setMessages(prev => [...prev, {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: '🎉 Incrível! Estou criando seu plano personalizado agora...',
    }]);

    try {
      const pillars = finalData.pillars.length > 0 ? finalData.pillars : ['saude'];
      
      await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          selected_pillars: pillars,
          onboarding_preferences: {
            preferredTime: finalData.preferredTime,
            intensity: finalData.intensity,
            motivation: finalData.motivation,
            objectives: finalData.objectives,
          },
        })
        .eq('id', userId);

      // Create initial goals
      const validObjectives = finalData.objectives.filter(o => o.trim());
      if (validObjectives.length > 0) {
        await supabase.from('goals').insert(
          validObjectives.map(obj => ({
            user_id: userId,
            goal_description: obj,
            goal_type: pillars[0] || 'general',
            status: 'active',
          }))
        );
      }

      // Generate AI plan
      try {
        await supabase.functions.invoke('generate-plans', {
          body: { userId, pillars },
        });
      } catch {}

      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: '✅ Tudo pronto! Seu plano de transformação está criado. Bem-vindo ao GlowUp! 🌟',
        }]);

        setTimeout(() => {
          toast({
            title: '🎉 Bem-vindo ao GlowUp!',
            description: 'Sua jornada de transformação começa agora!',
          });
          onComplete();
        }, 1500);
      }, 1500);
    } catch (error) {
      console.error('Error:', error);
      toast({ title: 'Erro ao salvar', description: 'Tente novamente.', variant: 'destructive' });
      setSaving(false);
    }
  };

  const currentStepDef = STEPS[currentStep];
  const showInput = currentStepDef && !currentStepDef.options;
  const showOptions = currentStepDef?.options && !currentStepDef.multiSelect;
  const showMultiSelect = currentStepDef?.multiSelect;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'var(--gradient-hero)' }}>
      {/* Mesh overlay */}
      <div className="absolute inset-0 gradient-mesh opacity-60" />

      <div className="relative w-full max-w-lg bg-card rounded-3xl shadow-cyber border border-primary/20 overflow-hidden flex flex-col" style={{ maxHeight: '90vh' }}>
        {/* Header */}
        <div className="gradient-primary px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-sm">GlowUp AI</h2>
              <p className="text-white/70 text-[10px]">Criando sua jornada...</p>
            </div>
          </div>
          {/* Step indicator */}
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300",
                  i <= currentStep ? "bg-white" : "bg-white/30"
                )}
              />
            ))}
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ minHeight: '300px' }}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex animate-fade-in",
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                  msg.role === 'user'
                    ? "gradient-primary text-white rounded-br-md"
                    : "bg-muted text-foreground rounded-bl-md"
                )}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {/* Options */}
          {showOptions && (
            <div className="flex flex-wrap gap-2 animate-fade-in pl-2">
              {currentStepDef.options!.map((option) => (
                <button
                  key={option}
                  onClick={() => handleOptionClick(option)}
                  className="px-4 py-2 rounded-full border border-primary/30 text-sm font-medium text-foreground hover:bg-primary/10 hover:border-primary/50 transition-all tap-scale"
                >
                  {option}
                </button>
              ))}
            </div>
          )}

          {/* Multi-select */}
          {showMultiSelect && (
            <div className="space-y-2 animate-fade-in pl-2">
              <div className="flex flex-wrap gap-2">
                {currentStepDef.options!.map((option) => {
                  const selected = selectedOptions.includes(option);
                  return (
                    <button
                      key={option}
                      onClick={() => handleOptionClick(option)}
                      className={cn(
                        "px-4 py-2 rounded-full border text-sm font-medium transition-all tap-scale",
                        selected
                          ? "border-primary bg-primary/20 text-primary"
                          : "border-border text-foreground hover:border-primary/50"
                      )}
                    >
                      {selected && <Check className="w-3 h-3 inline mr-1" />}
                      {option}
                    </button>
                  );
                })}
              </div>
              {selectedOptions.length > 0 && (
                <Button
                  onClick={handleMultiSelectConfirm}
                  size="sm"
                  className="gradient-primary text-white gap-1"
                >
                  Confirmar ({selectedOptions.length})
                  <ArrowRight className="w-3 h-3" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Input area */}
        {showInput && (
          <div className="px-4 pb-4 pt-2 border-t border-border/40">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Digite sua resposta..."
                className="flex-1 rounded-xl bg-muted border-0 focus-visible:ring-primary/30"
                disabled={saving}
                autoFocus
              />
              <Button
                onClick={handleSend}
                size="icon"
                disabled={!inputValue.trim() || saving}
                className="gradient-primary text-white rounded-xl w-10 h-10 tap-scale"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
