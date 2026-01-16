import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  BookOpen, Plus, Send, Smile, Meh, Frown, 
  Heart, Sparkles, Brain, Zap, Calendar,
  Trash2, Edit2, X, Check
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface JournalEntryData {
  id: string;
  content: string;
  mood_score: number | null;
  tags: string[];
  pillar: string | null;
  created_at: string;
  ai_analysis: string | null;
}

interface JournalEntryProps {
  userId: string;
}

const moodOptions = [
  { score: 1, emoji: '😢', label: 'Muito triste', color: 'text-red-500' },
  { score: 2, emoji: '😔', label: 'Triste', color: 'text-orange-500' },
  { score: 3, emoji: '😐', label: 'Neutro', color: 'text-yellow-500' },
  { score: 4, emoji: '😊', label: 'Feliz', color: 'text-green-500' },
  { score: 5, emoji: '🤩', label: 'Muito feliz', color: 'text-emerald-500' },
];

const pillarOptions = [
  { id: 'saude', name: 'Saúde', emoji: '❤️', icon: Heart },
  { id: 'estetica', name: 'Estética', emoji: '✨', icon: Sparkles },
  { id: 'produtividade', name: 'Produtividade', emoji: '⚡', icon: Zap },
  { id: 'mentalidade', name: 'Mentalidade', emoji: '🧠', icon: Brain },
];

const promptSuggestions = [
  "Como você se sentiu hoje?",
  "O que você conquistou hoje?",
  "Pelo que você é grato?",
  "O que aprendeu de novo?",
  "Qual foi seu maior desafio?",
];

export default function JournalEntry({ userId }: JournalEntryProps) {
  const { toast } = useToast();
  const [entries, setEntries] = useState<JournalEntryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isWriting, setIsWriting] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // New entry state
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [selectedPillar, setSelectedPillar] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchEntries();
  }, [userId]);

  const fetchEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error fetching journal entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!content.trim()) {
      toast({ title: "Escreva algo antes de salvar", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        // Update existing entry
        const { error } = await supabase
          .from('journal_entries')
          .update({
            content,
            mood_score: selectedMood,
            pillar: selectedPillar,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingId);

        if (error) throw error;
        toast({ title: "✏️ Entrada atualizada!" });
      } else {
        // Create new entry
        const { error } = await supabase
          .from('journal_entries')
          .insert({
            user_id: userId,
            content,
            mood_score: selectedMood,
            pillar: selectedPillar,
            tags: []
          });

        if (error) throw error;
        toast({ title: "📝 Reflexão salva!" });
      }

      setContent('');
      setSelectedMood(null);
      setSelectedPillar(null);
      setEditingId(null);
      setIsWriting(false);
      fetchEntries();
    } catch (error) {
      console.error('Error saving journal entry:', error);
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setEntries(prev => prev.filter(e => e.id !== id));
      toast({ title: "🗑️ Entrada removida" });
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast({ title: "Erro ao remover", variant: "destructive" });
    }
  };

  const handleEdit = (entry: JournalEntryData) => {
    setContent(entry.content);
    setSelectedMood(entry.mood_score);
    setSelectedPillar(entry.pillar);
    setEditingId(entry.id);
    setIsWriting(true);
  };

  const cancelEdit = () => {
    setContent('');
    setSelectedMood(null);
    setSelectedPillar(null);
    setEditingId(null);
    setIsWriting(false);
  };

  // Calculate streak
  const today = new Date().toDateString();
  const hasEntryToday = entries.some(e => new Date(e.created_at).toDateString() === today);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Diário de Reflexões
            </CardTitle>
            <CardDescription>
              Registre sua jornada de transformação
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {hasEntryToday && (
              <Badge variant="secondary" className="bg-green-500/20 text-green-600">
                ✅ Registrado hoje
              </Badge>
            )}
            {!isWriting && (
              <Button size="sm" onClick={() => setIsWriting(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Nova Entrada
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Writing Mode */}
        {isWriting && (
          <div className="space-y-4 p-4 rounded-xl bg-muted/30 border animate-fade-in">
            {/* Prompt suggestions */}
            <div className="flex gap-2 flex-wrap">
              {promptSuggestions.slice(0, 3).map((prompt, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary/10 transition-colors text-xs"
                  onClick={() => setContent(prompt + "\n\n")}
                >
                  💡 {prompt}
                </Badge>
              ))}
            </div>

            {/* Content */}
            <Textarea
              placeholder="Como foi seu dia? O que você está sentindo?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[120px] resize-none"
            />

            {/* Mood Selection */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Como você está se sentindo?</p>
              <div className="flex gap-2 justify-center">
                {moodOptions.map((mood) => (
                  <button
                    key={mood.score}
                    onClick={() => setSelectedMood(mood.score)}
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all",
                      selectedMood === mood.score
                        ? "bg-primary/20 scale-125 ring-2 ring-primary"
                        : "hover:bg-muted hover:scale-110"
                    )}
                    title={mood.label}
                  >
                    {mood.emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Pillar Selection */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Relacionado a qual pilar?</p>
              <div className="flex gap-2 flex-wrap">
                {pillarOptions.map((pillar) => (
                  <Badge
                    key={pillar.id}
                    variant={selectedPillar === pillar.id ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setSelectedPillar(selectedPillar === pillar.id ? null : pillar.id)}
                  >
                    {pillar.emoji} {pillar.name}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={cancelEdit}>
                <X className="w-4 h-4 mr-1" />
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving || !content.trim()}>
                {saving ? (
                  "Salvando..."
                ) : editingId ? (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Atualizar
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-1" />
                    Salvar
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Entries List */}
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando reflexões...
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Nenhuma reflexão ainda</p>
            <p className="text-sm text-muted-foreground">
              Comece a registrar sua jornada! 📝
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {entries.map((entry) => {
                const mood = moodOptions.find(m => m.score === entry.mood_score);
                const pillar = pillarOptions.find(p => p.id === entry.pillar);
                
                return (
                  <div
                    key={entry.id}
                    className="p-4 rounded-xl border bg-card hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(entry.created_at), "d 'de' MMMM, HH:mm", { locale: ptBR })}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleEdit(entry)}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => handleDelete(entry.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    <p className="text-sm whitespace-pre-wrap">{entry.content}</p>

                    <div className="flex items-center gap-2 mt-3">
                      {mood && (
                        <span className="text-lg" title={mood.label}>{mood.emoji}</span>
                      )}
                      {pillar && (
                        <Badge variant="secondary" className="text-xs">
                          {pillar.emoji} {pillar.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
