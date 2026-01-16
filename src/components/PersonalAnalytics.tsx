import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Target, Flame, Trophy, Brain, 
  Calendar, Sparkles, RefreshCw, ChevronRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import LoadingSpinner from './LoadingSpinner';

interface PersonalAnalyticsProps {
  userId: string;
}

interface WeeklyData {
  day: string;
  challenges: number;
  points: number;
  journalEntries: number;
}

interface PillarData {
  name: string;
  value: number;
  color: string;
}

const PILLAR_COLORS: Record<string, string> = {
  'saude': '#10B981',
  'estetica': '#F472B6',
  'produtividade': '#3B82F6',
  'mentalidade': '#8B5CF6'
};

const PILLAR_NAMES: Record<string, string> = {
  'saude': 'Saúde',
  'estetica': 'Estética',
  'produtividade': 'Produtividade',
  'mentalidade': 'Mentalidade'
};

export default function PersonalAnalytics({ userId }: PersonalAnalyticsProps) {
  const [loading, setLoading] = useState(true);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [pillarData, setPillarData] = useState<PillarData[]>([]);
  const [stats, setStats] = useState({
    totalChallenges: 0,
    totalPoints: 0,
    currentStreak: 0,
    longestStreak: 0,
    journalEntries: 0,
    weeklyGrowth: 0
  });
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [period, setPeriod] = useState<'week' | 'month'>('week');

  useEffect(() => {
    if (userId) {
      fetchAnalyticsData();
    }
  }, [userId, period]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const startDate = period === 'week' 
        ? new Date(now.setDate(now.getDate() - 7))
        : new Date(now.setDate(now.getDate() - 30));

      // Fetch challenges completed
      const { data: challenges } = await supabase
        .from('challenges')
        .select('*')
        .eq('creator_id', userId)
        .eq('status', 'completed')
        .gte('completed_at', startDate.toISOString());

      // Fetch journal entries
      const { data: journals } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString());

      // Fetch streak data
      const { data: streak } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Fetch profile for points
      const { data: profile } = await supabase
        .from('profiles')
        .select('pontos, level, total_challenges_completed')
        .eq('id', userId)
        .single();

      // Process weekly data
      const days = period === 'week' ? 7 : 30;
      const dailyData: WeeklyData[] = [];
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayStr = date.toLocaleDateString('pt-BR', { weekday: 'short' });
        const dateStr = date.toISOString().split('T')[0];
        
        const dayJournals = journals?.filter(j => 
          j.created_at.split('T')[0] === dateStr
        ).length || 0;
        
        const dayChallenges = challenges?.filter(c => 
          c.completed_at?.split('T')[0] === dateStr
        ).length || 0;

        dailyData.push({
          day: period === 'week' ? dayStr : date.getDate().toString(),
          challenges: dayChallenges,
          points: dayChallenges * 50, // Approximate points per challenge
          journalEntries: dayJournals
        });
      }

      setWeeklyData(dailyData);

      // Process pillar data from journal entries
      const pillarCounts: Record<string, number> = {};
      journals?.forEach(j => {
        if (j.pillar) {
          pillarCounts[j.pillar] = (pillarCounts[j.pillar] || 0) + 1;
        }
      });

      const processedPillarData = Object.entries(pillarCounts).map(([key, value]) => ({
        name: PILLAR_NAMES[key] || key,
        value,
        color: PILLAR_COLORS[key] || '#6B7280'
      }));

      setPillarData(processedPillarData.length > 0 ? processedPillarData : [
        { name: 'Saúde', value: 1, color: PILLAR_COLORS.saude },
        { name: 'Produtividade', value: 1, color: PILLAR_COLORS.produtividade }
      ]);

      // Calculate stats
      const previousPeriodChallenges = challenges?.filter(c => {
        const completedDate = new Date(c.completed_at);
        const midPoint = new Date();
        midPoint.setDate(midPoint.getDate() - (days / 2));
        return completedDate < midPoint;
      }).length || 0;

      const currentPeriodChallenges = (challenges?.length || 0) - previousPeriodChallenges;
      const growth = previousPeriodChallenges > 0 
        ? ((currentPeriodChallenges - previousPeriodChallenges) / previousPeriodChallenges) * 100 
        : currentPeriodChallenges > 0 ? 100 : 0;

      setStats({
        totalChallenges: profile?.total_challenges_completed || 0,
        totalPoints: profile?.pontos || 0,
        currentStreak: streak?.current_streak || 0,
        longestStreak: streak?.longest_streak || 0,
        journalEntries: journals?.length || 0,
        weeklyGrowth: Math.round(growth)
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Erro ao carregar analytics');
    } finally {
      setLoading(false);
    }
  };

  const generateAiInsights = async () => {
    setLoadingInsights(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-insights', {
        body: {
          stats,
          weeklyData,
          pillarData
        }
      });

      if (error) throw error;

      if (data?.insights) {
        setAiInsights(data.insights);
        toast.success('Insights gerados com sucesso!');
      }
    } catch (error: any) {
      console.error('Error generating insights:', error);
      // Fallback insights if AI fails
      setAiInsights([
        `Você completou ${stats.totalChallenges} desafios no total. Continue assim!`,
        stats.currentStreak > 0 
          ? `Sua sequência atual de ${stats.currentStreak} dias é impressionante!` 
          : 'Comece uma nova sequência hoje para manter a consistência.',
        stats.weeklyGrowth > 0 
          ? `Crescimento de ${stats.weeklyGrowth}% em relação ao período anterior. Excelente progresso!`
          : 'Tente aumentar sua consistência para ver melhores resultados.',
        pillarData.length > 0 
          ? `Foco principal em ${pillarData[0]?.name}. Considere equilibrar outros pilares.`
          : 'Registre suas atividades em diferentes pilares para acompanhar melhor.'
      ]);
    } finally {
      setLoadingInsights(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner text="Carregando analytics..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-primary" />
          Analytics Pessoal
        </h2>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as 'week' | 'month')}>
          <TabsList>
            <TabsTrigger value="week">7 dias</TabsTrigger>
            <TabsTrigger value="month">30 dias</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pontos Totais</p>
                <p className="text-2xl font-bold text-primary">{stats.totalPoints.toLocaleString()}</p>
              </div>
              <Trophy className="w-8 h-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sequência</p>
                <p className="text-2xl font-bold text-orange-500">{stats.currentStreak} dias</p>
              </div>
              <Flame className="w-8 h-8 text-orange-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Desafios</p>
                <p className="text-2xl font-bold text-green-500">{stats.totalChallenges}</p>
              </div>
              <Target className="w-8 h-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Crescimento</p>
                <div className="flex items-center gap-1">
                  <p className="text-2xl font-bold text-purple-500">{stats.weeklyGrowth}%</p>
                  {stats.weeklyGrowth >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                </div>
              </div>
              <Calendar className="w-8 h-8 text-purple-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Atividade Diária</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))' 
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="challenges" 
                  stackId="1"
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary))" 
                  fillOpacity={0.3}
                  name="Desafios"
                />
                <Area 
                  type="monotone" 
                  dataKey="journalEntries" 
                  stackId="1"
                  stroke="#8B5CF6" 
                  fill="#8B5CF6" 
                  fillOpacity={0.3}
                  name="Reflexões"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pillar Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribuição por Pilar</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pillarData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pillarData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))' 
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {pillarData.map((entry, index) => (
                <div key={index} className="flex items-center gap-1">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-xs text-muted-foreground">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Points Progress Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Progresso de Pontos</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))' 
                }} 
              />
              <Line 
                type="monotone" 
                dataKey="points" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))' }}
                name="Pontos"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card className="bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Insights com IA
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={generateAiInsights}
              disabled={loadingInsights}
            >
              {loadingInsights ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  Gerar Insights
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {aiInsights.length > 0 ? (
            <div className="space-y-3">
              {aiInsights.map((insight, index) => (
                <div 
                  key={index} 
                  className="flex items-start gap-3 p-3 bg-background/50 rounded-lg"
                >
                  <ChevronRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">{insight}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Brain className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Clique em "Gerar Insights" para receber análises personalizadas
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}