import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import MobileBottomNav from '@/components/MobileBottomNav';
import { Flame, Trophy, Calendar, TrendingUp, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

export default function Progress() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [streak, setStreak] = useState({ current: 0, longest: 0 });
  const [score, setScore] = useState({ score: 0, total: 0 });
  const [recentQuests, setRecentQuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const uid = session.user.id;

      const [streakRes, scoreRes, questsRes] = await Promise.all([
        supabase.from('streaks').select('current_streak, longest_streak').eq('user_id', uid).maybeSingle(),
        supabase.from('transformation_scores').select('*').eq('user_id', uid).maybeSingle(),
        supabase.from('daily_quests').select('*').eq('user_id', uid).order('quest_date', { ascending: false }).limit(14),
      ]);

      setStreak({
        current: streakRes.data?.current_streak || 0,
        longest: streakRes.data?.longest_streak || 0,
      });
      setScore({
        score: scoreRes.data?.score || 0,
        total: scoreRes.data?.quests_completed_total || 0,
      });
      setRecentQuests(questsRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-primary/20 animate-pulse" />
      </div>
    );
  }

  const completedCount = recentQuests.filter(q => q.completed).length;
  const last7 = recentQuests.slice(0, 7);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-16 z-30 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="flex items-center gap-3 px-4 py-3">
          {!isMobile && (
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <h1 className="text-lg font-bold text-foreground">Meu Progresso</h1>
        </div>
      </div>

      <div className={cn("px-4 py-6 space-y-6", !isMobile && "max-w-lg mx-auto")}>
        {/* Transformation Score - Hero */}
        <div className="rounded-3xl bg-card border border-border p-6 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Transformation Score</p>
          <div className="relative w-32 h-32 mx-auto mb-4">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
              <circle
                cx="60" cy="60" r="54" fill="none"
                stroke="url(#scoreGrad)" strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${score.score * 3.39} 339.292`}
                className="transition-all duration-1000"
              />
              <defs>
                <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="100%" stopColor="hsl(var(--accent))" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-bold text-foreground">{score.score}</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{score.total} quests completadas no total</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl bg-orange-500/10 border border-orange-500/20 p-5 text-center">
            <Flame className="w-6 h-6 text-orange-500 mx-auto mb-2" />
            <p className="text-3xl font-bold font-mono text-foreground">{streak.current}</p>
            <p className="text-xs text-muted-foreground mt-1">Streak Atual</p>
          </div>
          <div className="rounded-2xl bg-primary/10 border border-primary/20 p-5 text-center">
            <Trophy className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-3xl font-bold font-mono text-foreground">{streak.longest}</p>
            <p className="text-xs text-muted-foreground mt-1">Maior Streak</p>
          </div>
        </div>

        {/* Last 7 Days */}
        <div className="rounded-2xl bg-card border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Últimos 7 dias</p>
            <span className="ml-auto text-xs text-muted-foreground">{completedCount}/{Math.min(recentQuests.length, 7)}</span>
          </div>
          <div className="flex gap-2 justify-between">
            {Array.from({ length: 7 }).map((_, i) => {
              const quest = last7[6 - i];
              const completed = quest?.completed;
              const dayLabel = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
              const dayIndex = new Date(Date.now() - (6 - i) * 86400000).getDay();

              return (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                    completed
                      ? "bg-green-500 text-white"
                      : quest
                        ? "bg-destructive/20 text-destructive"
                        : "bg-muted text-muted-foreground"
                  )}>
                    {completed ? '✓' : quest ? '✗' : '·'}
                  </div>
                  <span className="text-[10px] text-muted-foreground">{dayLabel[dayIndex]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Milestones */}
        <div className="rounded-2xl bg-card border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Milestones</p>
          </div>
          <div className="space-y-3">
            {[
              { days: 7, label: '7 dias de streak', emoji: '🔥' },
              { days: 30, label: '30 dias de streak', emoji: '⚡' },
              { days: 100, label: '100 dias de streak', emoji: '🏆' },
            ].map(m => (
              <div key={m.days} className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center text-lg",
                  streak.longest >= m.days ? "bg-primary/10" : "bg-muted opacity-40"
                )}>
                  {m.emoji}
                </div>
                <div className="flex-1">
                  <p className={cn(
                    "text-sm font-medium",
                    streak.longest >= m.days ? "text-foreground" : "text-muted-foreground"
                  )}>{m.label}</p>
                </div>
                {streak.longest >= m.days && (
                  <span className="text-xs text-green-500 font-bold">✓ Conquistado</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <MobileBottomNav />
    </div>
  );
}
