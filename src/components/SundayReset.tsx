import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, Calendar, Trophy, Flame, Target, 
  ChevronRight, Sparkles, TrendingUp, Star,
  CheckCircle2, XCircle, RefreshCw
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, subWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SundayResetProps {
  userId: string;
}

interface WeeklyStats {
  tasksCompleted: number;
  challengesCompleted: number;
  pointsEarned: number;
  streakDays: number;
  moodAverage: number;
  goalsAchieved: number;
}

export default function SundayReset({ userId }: SundayResetProps) {
  const [loading, setLoading] = useState(true);
  const [generatingInsights, setGeneratingInsights] = useState(false);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null);
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [nextWeekGoals, setNextWeekGoals] = useState<string[]>([]);
  const [highlights, setHighlights] = useState<string[]>([]);
  const { toast } = useToast();

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 0 });
  const isSunday = new Date().getDay() === 0;

  useEffect(() => {
    fetchWeeklySummary();
  }, [userId]);

  const fetchWeeklySummary = async () => {
    setLoading(true);
    try {
      const weekStartStr = format(weekStart, 'yyyy-MM-dd');
      const weekEndStr = format(weekEnd, 'yyyy-MM-dd');

      // Check for existing summary
      const { data: existingSummary } = await supabase
        .from('weekly_summaries')
        .select('*')
        .eq('user_id', userId)
        .eq('week_start', weekStartStr)
        .single();

      if (existingSummary) {
        setWeeklyStats({
          tasksCompleted: existingSummary.tasks_completed,
          challengesCompleted: existingSummary.challenges_completed,
          pointsEarned: existingSummary.points_earned,
          streakDays: existingSummary.streak_days,
          moodAverage: existingSummary.mood_average || 0,
          goalsAchieved: 0
        });
        setAiInsights(existingSummary.ai_insights);
        setHighlights((existingSummary.highlights as string[]) || []);
        setNextWeekGoals((existingSummary.next_week_goals as string[]) || []);
      } else {
        // Calculate stats from this week
        await calculateWeeklyStats(weekStartStr, weekEndStr);
      }
    } catch (error) {
      console.error('Error fetching weekly summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateWeeklyStats = async (weekStartStr: string, weekEndStr: string) => {
    try {
      // Get challenges completed this week
      const { count: challengesCount } = await supabase
        .from('challenges')
        .select('*', { count: 'exact', head: true })
        .eq('target_user_id', userId)
        .eq('status', 'completed')
        .gte('completed_at', weekStartStr)
        .lte('completed_at', weekEndStr);

      // Get mood logs
      const { data: moodLogs } = await supabase
        .from('mood_logs')
        .select('mood_score')
        .eq('user_id', userId)
        .gte('date', weekStartStr)
        .lte('date', weekEndStr);

      const moodAvg = moodLogs && moodLogs.length > 0
        ? moodLogs.reduce((sum, m) => sum + m.mood_score, 0) / moodLogs.length
        : 0;

      // Get streak info
      const { data: streak } = await supabase
        .from('streaks')
        .select('current_streak')
        .eq('user_id', userId)
        .single();

      // Get profile points
      const { data: profile } = await supabase
        .from('profiles')
        .select('pontos')
        .eq('id', userId)
        .single();

      // Get goals achieved
      const { count: goalsCount } = await supabase
        .from('goals')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('updated_at', weekStartStr)
        .lte('updated_at', weekEndStr);

      const stats: WeeklyStats = {
        tasksCompleted: (challengesCount || 0) * 3, // Approximate
        challengesCompleted: challengesCount || 0,
        pointsEarned: Math.floor((profile?.pontos || 0) * 0.1), // Approximate weekly
        streakDays: streak?.current_streak || 0,
        moodAverage: Math.round(moodAvg * 10) / 10,
        goalsAchieved: goalsCount || 0
      };

      setWeeklyStats(stats);
    } catch (error) {
      console.error('Error calculating stats:', error);
    }
  };

  const generateWeeklyInsights = async () => {
    if (!weeklyStats) return;

    setGeneratingInsights(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-weekly-summary', {
        body: { 
          userId,
          weeklyStats,
          weekStart: format(weekStart, 'yyyy-MM-dd'),
          weekEnd: format(weekEnd, 'yyyy-MM-dd')
        }
      });

      if (error) throw error;

      if (data) {
        setAiInsights(data.insights);
        setHighlights(data.highlights || []);
        setNextWeekGoals(data.nextWeekGoals || []);

        // Save the summary
        const weekStartStr = format(weekStart, 'yyyy-MM-dd');
        const weekEndStr = format(weekEnd, 'yyyy-MM-dd');

        await supabase
          .from('weekly_summaries')
          .upsert({
            user_id: userId,
            week_start: weekStartStr,
            week_end: weekEndStr,
            tasks_completed: weeklyStats.tasksCompleted,
            challenges_completed: weeklyStats.challengesCompleted,
            points_earned: weeklyStats.pointsEarned,
            streak_days: weeklyStats.streakDays,
            mood_average: weeklyStats.moodAverage,
            ai_insights: data.insights,
            highlights: data.highlights,
            next_week_goals: data.nextWeekGoals
          }, {
            onConflict: 'user_id,week_start'
          });

        toast({
          title: "Resumo gerado! 📊",
          description: "Seu Sunday Reset está pronto",
          className: "gradient-success text-white"
        });
      }
    } catch (error) {
      console.error('Error generating insights:', error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar os insights",
        variant: "destructive"
      });
    } finally {
      setGeneratingInsights(false);
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="h-32 bg-muted rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-purple-500/20">
      <CardHeader className="pb-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="w-5 h-5 text-purple-500" />
            Sunday Reset
          </CardTitle>
          {isSunday && (
            <Badge className="bg-purple-500/20 text-purple-600 border-purple-500/30">
              Hoje é domingo!
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {format(weekStart, "dd 'de' MMMM", { locale: ptBR })} - {format(weekEnd, "dd 'de' MMMM", { locale: ptBR })}
        </p>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Weekly Stats Grid */}
        {weeklyStats && (
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-xl bg-green-500/10">
              <Trophy className="w-5 h-5 mx-auto text-green-600 mb-1" />
              <p className="text-xl font-bold text-green-600">{weeklyStats.challengesCompleted}</p>
              <p className="text-[10px] text-muted-foreground">Desafios</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-orange-500/10">
              <Flame className="w-5 h-5 mx-auto text-orange-600 mb-1" />
              <p className="text-xl font-bold text-orange-600">{weeklyStats.streakDays}</p>
              <p className="text-[10px] text-muted-foreground">Dias de Streak</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-primary/10">
              <Star className="w-5 h-5 mx-auto text-primary mb-1" />
              <p className="text-xl font-bold text-primary">{weeklyStats.goalsAchieved}</p>
              <p className="text-[10px] text-muted-foreground">Metas</p>
            </div>
          </div>
        )}

        {/* Mood Progress */}
        {weeklyStats && weeklyStats.moodAverage > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Humor Médio</span>
              <span className="font-medium">{weeklyStats.moodAverage}/5</span>
            </div>
            <Progress value={(weeklyStats.moodAverage / 5) * 100} className="h-2" />
          </div>
        )}

        {/* Generate Insights Button */}
        {!aiInsights && (
          <Button
            onClick={generateWeeklyInsights}
            disabled={generatingInsights}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            {generatingInsights ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Gerando Resumo...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Gerar Resumo Semanal
              </>
            )}
          </Button>
        )}

        {/* AI Insights */}
        {aiInsights && (
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-purple-600 mb-1">Análise da Semana</p>
                  <p className="text-sm text-muted-foreground">{aiInsights}</p>
                </div>
              </div>
            </div>

            {/* Highlights */}
            {highlights.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  Destaques da Semana
                </h4>
                <div className="space-y-1">
                  {highlights.map((highlight, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Next Week Goals */}
            {nextWeekGoals.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  Foco da Próxima Semana
                </h4>
                <div className="space-y-1">
                  {nextWeekGoals.map((goal, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <ChevronRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{goal}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Regenerate Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={generateWeeklyInsights}
              disabled={generatingInsights}
              className="w-full"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${generatingInsights ? 'animate-spin' : ''}`} />
              Atualizar Resumo
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
