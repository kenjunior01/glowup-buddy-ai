import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import MobileBottomNav from '@/components/MobileBottomNav';
import ConversationalOnboarding from '@/components/ConversationalOnboarding';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Check, Flame, ChevronRight, Sparkles, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Confetti } from '@/components/Confetti';

export default function Dashboard() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quest, setQuest] = useState<any>(null);
  const [streak, setStreak] = useState({ current: 0, longest: 0 });
  const [transformationScore, setTransformationScore] = useState(0);
  const [completing, setCompleting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [questCompleted, setQuestCompleted] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const uid = session.user.id;

      // Parallel fetches
      const [profileRes, streakRes, questRes, scoreRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', uid).single(),
        supabase.from('streaks').select('current_streak, longest_streak').eq('user_id', uid).single(),
        supabase.from('daily_quests').select('*').eq('user_id', uid).eq('quest_date', new Date().toISOString().split('T')[0]).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('transformation_scores').select('*').eq('user_id', uid).maybeSingle(),
      ]);

      const profile = profileRes.data || {};
      if (!(profile as any)?.onboarding_completed) {
        setShowOnboarding(true);
      }

      setUser({ ...session.user, profile });
      setStreak({
        current: streakRes.data?.current_streak || 0,
        longest: streakRes.data?.longest_streak || 0,
      });

      if (questRes.data) {
        setQuest(questRes.data);
        setQuestCompleted(questRes.data.completed);
      } else {
        // Generate a quest
        await generateQuest(uid, (profile as any)?.selected_pillars);
      }

      setTransformationScore(scoreRes.data?.score || 0);
    } catch (e) {
      console.error('Dashboard fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const generateQuest = async (userId: string, pillars?: string[]) => {
    const questBank = [
      { text: '30 minutos de treino matinal 💪', type: 'fitness', pillar: 'corpo' },
      { text: 'Meditar por 10 minutos em silêncio 🧘', type: 'mindfulness', pillar: 'mente' },
      { text: 'Ler 20 páginas de um livro 📖', type: 'knowledge', pillar: 'mente' },
      { text: 'Beber 2 litros de água hoje 💧', type: 'health', pillar: 'corpo' },
      { text: 'Fazer skincare completo manhã e noite ✨', type: 'skincare', pillar: 'aparência' },
      { text: 'Caminhar 30 min ao ar livre 🌿', type: 'fitness', pillar: 'corpo' },
      { text: 'Escrever 3 coisas pelas quais é grato 🙏', type: 'mindfulness', pillar: 'mente' },
      { text: 'Dormir antes das 23h hoje 🌙', type: 'health', pillar: 'corpo' },
      { text: 'Fazer 50 flexões ao longo do dia 🔥', type: 'fitness', pillar: 'corpo' },
      { text: 'Zero telas 1h antes de dormir 📵', type: 'discipline', pillar: 'mente' },
      { text: 'Tomar banho gelado de 2 minutos 🧊', type: 'discipline', pillar: 'corpo' },
      { text: 'Organizar seu quarto/mesa de trabalho 🧹', type: 'discipline', pillar: 'ambiente' },
      { text: 'Praticar postura correta o dia todo 🏛️', type: 'posture', pillar: 'aparência' },
      { text: 'Estudar algo novo por 30 minutos 🎓', type: 'knowledge', pillar: 'mente' },
    ];

    const todayQuest = questBank[Math.floor(Math.random() * questBank.length)];

    const { data, error } = await supabase.from('daily_quests').insert({
      user_id: userId,
      quest_text: todayQuest.text,
      quest_type: todayQuest.type,
      pillar: todayQuest.pillar,
      quest_date: new Date().toISOString().split('T')[0],
    }).select().single();

    if (data) {
      setQuest(data);
      setQuestCompleted(false);
    }
  };

  const completeQuest = async () => {
    if (!quest || completing || questCompleted) return;
    setCompleting(true);

    try {
      // Vibrate
      if (navigator.vibrate) navigator.vibrate([50, 30, 100]);

      // Mark quest complete
      await supabase.from('daily_quests').update({
        completed: true,
        completed_at: new Date().toISOString(),
      }).eq('id', quest.id);

      // Update streak
      await supabase.functions.invoke('update-user-streak', { body: {} });

      // Update transformation score
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: currentScore } = await supabase
          .from('transformation_scores')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();

        const newTotal = (currentScore?.quests_completed_total || 0) + 1;
        const newScore = Math.min(100, Math.floor(newTotal * 1.5));

        if (currentScore) {
          await supabase.from('transformation_scores').update({
            score: newScore,
            previous_score: currentScore.score,
            quests_completed_total: newTotal,
            updated_at: new Date().toISOString(),
          }).eq('user_id', session.user.id);
        } else {
          await supabase.from('transformation_scores').insert({
            user_id: session.user.id,
            score: newScore,
            previous_score: 0,
            quests_completed_total: newTotal,
          });
        }

        setTransformationScore(newScore);
      }

      // Show celebration
      setQuestCompleted(true);
      setShowConfetti(true);
      setStreak(prev => ({ ...prev, current: prev.current + 1 }));

      setTimeout(() => setShowConfetti(false), 4000);
    } catch (e) {
      console.error('Error completing quest:', e);
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 animate-pulse flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-primary/40" />
          </div>
          <p className="text-sm text-muted-foreground">Preparando sua quest...</p>
        </div>
      </div>
    );
  }

  const scorePercent = transformationScore;
  const userName = (user?.profile as any)?.display_name || (user?.profile as any)?.name || 'Guerreiro';

  return (
    <div className="min-h-screen bg-background pb-24">
      {showConfetti && <Confetti isActive={showConfetti} />}

      {/* Onboarding */}
      {showOnboarding && user?.id && (
        <ConversationalOnboarding
          userId={user.id}
          onComplete={() => {
            setShowOnboarding(false);
            fetchAll();
          }}
        />
      )}

      {/* ===== SINGLE SCREEN: Today's Quest ===== */}
      <div className={cn(
        "flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] px-6 py-8",
        !isMobile && "max-w-lg mx-auto"
      )}>
        {/* Streak Badge */}
        <div className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-full mb-8 transition-all duration-500",
          streak.current > 0
            ? "bg-orange-500/10 text-orange-500"
            : "bg-muted text-muted-foreground"
        )}>
          <Flame className={cn("w-5 h-5", streak.current > 0 && "animate-pulse")} />
          <span className="text-lg font-bold font-mono tracking-wider">{streak.current}</span>
          <span className="text-sm font-medium">dias de streak</span>
        </div>

        {/* Quest Card */}
        <div className={cn(
          "w-full rounded-3xl p-8 text-center transition-all duration-700 relative overflow-hidden",
          questCompleted
            ? "bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-2 border-green-500/30"
            : "bg-card border border-border shadow-lg"
        )}>
          {/* Glow effect */}
          {!questCompleted && (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
          )}

          <div className="relative z-10">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium mb-2">
              {questCompleted ? '✅ Quest Completa!' : "🎯 Quest de Hoje"}
            </p>

            <h2 className={cn(
              "text-2xl font-bold leading-tight mb-8 transition-all",
              questCompleted ? "text-green-600 dark:text-green-400" : "text-foreground"
            )}>
              {quest?.quest_text || 'Carregando...'}
            </h2>

            {/* Complete Button */}
            {!questCompleted ? (
              <Button
                onClick={completeQuest}
                disabled={completing}
                size="lg"
                className={cn(
                  "w-full h-14 rounded-2xl text-lg font-bold tracking-wide transition-all duration-300",
                  "bg-[var(--gradient-primary)] bg-gradient-to-r from-primary to-purple-500",
                  "hover:shadow-[var(--shadow-glow)] hover:scale-[1.02]",
                  "active:scale-95",
                  completing && "opacity-70"
                )}
              >
                {completing ? (
                  <span className="animate-pulse">Completando...</span>
                ) : (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    COMPLETAR QUEST
                  </>
                )}
              </Button>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center animate-bounce">
                  <Trophy className="w-8 h-8 text-green-500" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Volte amanhã às 8h para a próxima quest!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Transformation Score */}
        <div className="w-full mt-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Transformação</span>
            <span className="text-sm font-bold text-foreground">{scorePercent}%</span>
          </div>
          <div className="w-full h-3 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-1000 ease-out"
              style={{ width: `${scorePercent}%` }}
            />
          </div>
        </div>

        {/* Quick Links */}
        <div className="w-full mt-8 space-y-3">
          <button
            onClick={() => navigate('/progress')}
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-card border border-border/50 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">📊</span>
              <span className="text-sm font-medium text-foreground">Ver meu progresso</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>

          <button
            onClick={() => navigate('/premium')}
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">💎</span>
              <span className="text-sm font-medium text-primary">Desbloquear quests ilimitadas</span>
            </div>
            <ChevronRight className="w-4 h-4 text-primary/60" />
          </button>
        </div>
      </div>

      {/* Bottom Nav */}
      <MobileBottomNav />
    </div>
  );
}
