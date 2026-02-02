import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Brain, Zap, Heart } from 'lucide-react';

interface MoodTrackerProps {
  userId: string;
  onMoodLogged?: () => void;
}

const MOOD_OPTIONS = [
  { score: 1, label: 'Exausto', emoji: '😫', color: 'bg-red-500/20 text-red-600 border-red-500/30' },
  { score: 2, label: 'Cansado', emoji: '😔', color: 'bg-orange-500/20 text-orange-600 border-orange-500/30' },
  { score: 3, label: 'Neutro', emoji: '😐', color: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30' },
  { score: 4, label: 'Bem', emoji: '😊', color: 'bg-green-500/20 text-green-600 border-green-500/30' },
  { score: 5, label: 'Ótimo', emoji: '🤩', color: 'bg-primary/20 text-primary border-primary/30' },
];

const ENERGY_OPTIONS = [
  { level: 1, label: 'Muito baixa', icon: '🔋' },
  { level: 2, label: 'Baixa', icon: '🪫' },
  { level: 3, label: 'Normal', icon: '⚡' },
  { level: 4, label: 'Alta', icon: '💪' },
  { level: 5, label: 'Máxima', icon: '🚀' },
];

export default function MoodTracker({ userId, onMoodLogged }: MoodTrackerProps) {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [selectedEnergy, setSelectedEnergy] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [todayMood, setTodayMood] = useState<any>(null);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTodayMood();
  }, [userId]);

  const fetchTodayMood = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('mood_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    if (data && !error) {
      setTodayMood(data);
      setSelectedMood(data.mood_score);
      setSelectedEnergy(data.energy_level);
    }
  };

  const handleLogMood = async () => {
    if (selectedMood === null) {
      toast({
        title: "Selecione seu humor",
        description: "Como você está se sentindo hoje?",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const moodLabel = MOOD_OPTIONS.find(m => m.score === selectedMood)?.label || '';
      const today = new Date().toISOString().split('T')[0];

      if (todayMood) {
        await supabase
          .from('mood_logs')
          .update({
            mood_score: selectedMood,
            mood_label: moodLabel,
            energy_level: selectedEnergy,
            notes: notes || null
          })
          .eq('id', todayMood.id);
      } else {
        await supabase
          .from('mood_logs')
          .insert({
            user_id: userId,
            mood_score: selectedMood,
            mood_label: moodLabel,
            energy_level: selectedEnergy,
            notes: notes || null,
            date: today
          });
      }

      toast({
        title: "Humor registrado! 🎯",
        description: "Seus planos serão ajustados com base no seu humor",
        className: "gradient-success text-white"
      });

      setTodayMood({ mood_score: selectedMood, energy_level: selectedEnergy });
      onMoodLogged?.();
      
      // Get AI suggestion based on mood
      getAISuggestion(selectedMood, selectedEnergy);
    } catch (error) {
      console.error('Error logging mood:', error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar seu humor",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getAISuggestion = async (mood: number, energy: number | null) => {
    setLoadingSuggestion(true);
    try {
      const { data, error } = await supabase.functions.invoke('mood-based-planning', {
        body: { mood, energy, userId }
      });

      if (data?.suggestion) {
        setAiSuggestion(data.suggestion);
      }
    } catch (error) {
      console.error('Error getting AI suggestion:', error);
    } finally {
      setLoadingSuggestion(false);
    }
  };

  return (
    <Card className="overflow-hidden border-primary/20">
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/10 to-accent/10">
        <CardTitle className="flex items-center gap-2 text-base">
          <Brain className="w-5 h-5 text-primary" />
          Como você está hoje?
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Ajustamos seus planos com base no seu humor e energia
        </p>
      </CardHeader>
      
      <CardContent className="pt-4 space-y-4">
        {/* Mood Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Heart className="w-4 h-4 text-pink-500" />
            Humor
          </label>
          <div className="flex gap-2 flex-wrap">
            {MOOD_OPTIONS.map((mood) => (
              <button
                key={mood.score}
                onClick={() => setSelectedMood(mood.score)}
                className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all tap-scale ${
                  selectedMood === mood.score 
                    ? mood.color + ' scale-105' 
                    : 'bg-muted/30 border-transparent hover:border-muted'
                }`}
              >
                <span className="text-2xl">{mood.emoji}</span>
                <span className="text-[10px] font-medium mt-1">{mood.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Energy Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            Energia
          </label>
          <div className="flex gap-2">
            {ENERGY_OPTIONS.map((energy) => (
              <button
                key={energy.level}
                onClick={() => setSelectedEnergy(energy.level)}
                className={`flex-1 flex flex-col items-center p-2 rounded-lg border transition-all ${
                  selectedEnergy === energy.level 
                    ? 'bg-primary/20 border-primary/50 text-primary' 
                    : 'bg-muted/30 border-transparent hover:border-muted'
                }`}
              >
                <span className="text-lg">{energy.icon}</span>
                <span className="text-[9px] font-medium">{energy.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Notas (opcional)</label>
          <Textarea
            placeholder="Como você está se sentindo? Algum motivo específico?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="text-sm"
          />
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleLogMood}
          disabled={loading || selectedMood === null}
          className="w-full gradient-primary"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Sparkles className="w-4 h-4 mr-2" />
          )}
          {todayMood ? 'Atualizar Humor' : 'Registrar Humor'}
        </Button>

        {/* AI Suggestion */}
        {loadingSuggestion && (
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Analisando e ajustando seus planos...</span>
          </div>
        )}

        {aiSuggestion && (
          <div className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl border border-primary/20">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-primary mb-1">Sugestão da IA</p>
                <p className="text-sm text-muted-foreground">{aiSuggestion}</p>
              </div>
            </div>
          </div>
        )}

        {/* Today's Mood Status */}
        {todayMood && !loadingSuggestion && !aiSuggestion && (
          <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
            <span className="text-xl">{MOOD_OPTIONS.find(m => m.score === todayMood.mood_score)?.emoji}</span>
            <div>
              <p className="text-sm font-medium text-green-600">Humor de hoje registrado!</p>
              <p className="text-xs text-muted-foreground">Seus planos foram ajustados</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
