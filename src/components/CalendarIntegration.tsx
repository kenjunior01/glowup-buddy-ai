import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CalendarDays, 
  Plus, 
  Clock, 
  Target, 
  CheckCircle2,
  AlertCircle 
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: Date;
  type: 'goal' | 'challenge' | 'reminder' | 'milestone';
  completed: boolean;
  user_id: string;
}

interface CalendarIntegrationProps {
  userId: string;
}

export const CalendarIntegration = ({ userId }: CalendarIntegrationProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    type: 'reminder' as CalendarEvent['type']
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchEvents();
  }, [userId]);

  const fetchEvents = async () => {
    try {
      // Fetch goals with target dates
      const { data: goals } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .not('target_date', 'is', null);

      // Fetch challenges with expiration dates
      const { data: challenges } = await supabase
        .from('challenges')
        .select('*')
        .or(`creator_id.eq.${userId},challenger_id.eq.${userId}`)
        .not('expires_at', 'is', null);

      const calendarEvents: CalendarEvent[] = [];

      // Convert goals to events
      if (goals) {
        goals.forEach(goal => {
          if (goal.target_date) {
            calendarEvents.push({
              id: `goal_${goal.id}`,
              title: `Meta: ${goal.goal_description}`,
              date: new Date(goal.target_date),
              type: 'goal',
              completed: false,
              user_id: userId
            });
          }
        });
      }

      // Convert challenges to events
      if (challenges) {
        challenges.forEach(challenge => {
          if (challenge.expires_at) {
            calendarEvents.push({
              id: `challenge_${challenge.id}`,
              title: `Desafio: ${challenge.title}`,
              description: challenge.description,
              date: new Date(challenge.expires_at),
              type: 'challenge',
              completed: challenge.status === 'completed',
              user_id: userId
            });
          }
        });
      }

      setEvents(calendarEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const addEvent = async () => {
    if (!newEvent.title || !selectedDate) return;

    try {
      const event: CalendarEvent = {
        id: `custom_${Date.now()}`,
        title: newEvent.title,
        description: newEvent.description,
        date: selectedDate,
        type: newEvent.type,
        completed: false,
        user_id: userId
      };

      // In a real app, you'd store custom events in a separate table
      // For now, we'll just add to local state
      setEvents(prev => [...prev, event]);

      setNewEvent({ title: '', description: '', type: 'reminder' });
      setIsAddingEvent(false);

      toast({
        title: "Evento adicionado!",
        description: `${newEvent.title} foi adicionado ao calendário.`,
      });
    } catch (error) {
      console.error('Error adding event:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o evento.",
        variant: "destructive",
      });
    }
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const getSelectedDateEvents = () => {
    if (!selectedDate) return [];
    return getEventsForDate(selectedDate);
  };

  const getEventIcon = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'goal': return Target;
      case 'challenge': return AlertCircle;
      case 'milestone': return CheckCircle2;
      default: return Clock;
    }
  };

  const getEventColor = (type: CalendarEvent['type'], completed: boolean) => {
    if (completed) return 'bg-green-500';
    
    switch (type) {
      case 'goal': return 'bg-blue-500';
      case 'challenge': return 'bg-purple-500';
      case 'milestone': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isDateWithEvents = (date: Date) => {
    return getEventsForDate(date).length > 0;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5" />
            Calendário de Metas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border"
            modifiers={{
              hasEvents: (date) => isDateWithEvents(date)
            }}
            modifiersStyles={{
              hasEvents: {
                backgroundColor: 'hsl(var(--primary))',
                color: 'hsl(var(--primary-foreground))',
                fontWeight: 'bold'
              }
            }}
          />
        </CardContent>
      </Card>

      {/* Events List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {selectedDate ? formatDate(selectedDate) : 'Selecione uma data'}
            </CardTitle>
            <Dialog open={isAddingEvent} onOpenChange={setIsAddingEvent}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo Evento</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Título</Label>
                    <Input
                      id="title"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Digite o título do evento"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={newEvent.description}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descreva o evento (opcional)"
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Tipo</Label>
                    <select
                      id="type"
                      value={newEvent.type}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, type: e.target.value as CalendarEvent['type'] }))}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="reminder">Lembrete</option>
                      <option value="milestone">Marco Importante</option>
                      <option value="goal">Meta Personalizada</option>
                    </select>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button onClick={addEvent} className="flex-1">
                      Adicionar Evento
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsAddingEvent(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {getSelectedDateEvents().length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarDays className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum evento nesta data</p>
                <p className="text-sm">Clique em "Adicionar" para criar um evento</p>
              </div>
            ) : (
              getSelectedDateEvents().map((event) => {
                const Icon = getEventIcon(event.type);
                
                return (
                  <div
                    key={event.id}
                    className="flex items-center gap-3 p-3 border rounded-lg"
                  >
                    <div className={`p-2 rounded-full ${getEventColor(event.type, event.completed)} text-white`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-medium ${event.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {event.title}
                      </h4>
                      {event.description && (
                        <p className="text-sm text-muted-foreground">
                          {event.description}
                        </p>
                      )}
                    </div>
                    <Badge 
                      variant={event.completed ? "default" : "secondary"}
                      className="capitalize"
                    >
                      {event.type}
                    </Badge>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};