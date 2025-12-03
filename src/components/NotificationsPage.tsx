import { useState, useEffect } from 'react';
import { Bell, Check, Trash2, Users, Trophy, Target, MessageSquare, Zap, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import EmptyState from './EmptyState';

interface Notification {
  id: string;
  title: string;
  message: string;
  created_at: string;
  read: boolean;
  type: string | null;
}

const notificationTypes = {
  friend_request: { icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  challenge: { icon: Trophy, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  achievement: { icon: Zap, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  goal: { icon: Target, color: 'text-green-500', bg: 'bg-green-500/10' },
  message: { icon: MessageSquare, color: 'text-pink-500', bg: 'bg-pink-500/10' },
  system: { icon: Bell, color: 'text-muted-foreground', bg: 'bg-muted' },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchNotifications();
      const channel = supabase
        .channel('notifications-page')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        }, () => fetchNotifications())
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [userId]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setUserId(user.id);
  };

  const fetchNotifications = async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error) setNotifications(data || []);
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    fetchNotifications();
  };

  const markAllAsRead = async () => {
    await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false);
    toast({ title: 'Todas notificações marcadas como lidas' });
    fetchNotifications();
  };

  const deleteNotification = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    toast({ title: 'Notificação removida' });
    fetchNotifications();
  };

  const deleteAllRead = async () => {
    await supabase.from('notifications').delete().eq('user_id', userId).eq('read', true);
    toast({ title: 'Notificações lidas removidas' });
    fetchNotifications();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    if (diffInMinutes < 1) return 'Agora';
    if (diffInMinutes < 60) return `${diffInMinutes}m atrás`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h atrás`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  const getTypeConfig = (type: string | null) => {
    return notificationTypes[type as keyof typeof notificationTypes] || notificationTypes.system;
  };

  const unreadNotifications = notifications.filter(n => !n.read);
  const readNotifications = notifications.filter(n => n.read);

  const renderNotification = (notification: Notification) => {
    const config = getTypeConfig(notification.type);
    const Icon = config.icon;

    return (
      <Card key={notification.id} className={`transition-all ${!notification.read ? 'border-primary/50 shadow-md' : 'opacity-70'}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-full ${config.bg}`}>
              <Icon className={`w-5 h-5 ${config.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-semibold text-sm truncate">{notification.title}</h4>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatTime(notification.created_at)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
              <div className="flex items-center gap-2 mt-3">
                {!notification.read && (
                  <Button size="sm" variant="outline" onClick={() => markAsRead(notification.id)}>
                    <Check className="w-4 h-4 mr-1" /> Marcar como lida
                  </Button>
                )}
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteNotification(notification.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {!notification.read && (
              <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="w-6 h-6" />
            Notificações
          </h2>
          <p className="text-sm text-muted-foreground">
            {unreadNotifications.length} não lidas
          </p>
        </div>
        <div className="flex gap-2">
          {unreadNotifications.length > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <CheckCircle className="w-4 h-4 mr-1" /> Marcar todas
            </Button>
          )}
          {readNotifications.length > 0 && (
            <Button variant="ghost" size="sm" onClick={deleteAllRead}>
              <Trash2 className="w-4 h-4 mr-1" /> Limpar lidas
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">
            Todas
            {notifications.length > 0 && <Badge variant="secondary" className="ml-2">{notifications.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="unread">
            Não lidas
            {unreadNotifications.length > 0 && <Badge className="ml-2">{unreadNotifications.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="read">Lidas</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3 mt-4">
          {notifications.length === 0 ? (
            <EmptyState
              icon={<Bell className="w-16 h-16" />}
              title="Nenhuma notificação"
              description="Você receberá notificações sobre desafios, conquistas e interações aqui."
            />
          ) : (
            notifications.map(renderNotification)
          )}
        </TabsContent>

        <TabsContent value="unread" className="space-y-3 mt-4">
          {unreadNotifications.length === 0 ? (
            <EmptyState
              icon={<CheckCircle className="w-16 h-16" />}
              title="Tudo em dia!"
              description="Você não tem notificações não lidas."
            />
          ) : (
            unreadNotifications.map(renderNotification)
          )}
        </TabsContent>

        <TabsContent value="read" className="space-y-3 mt-4">
          {readNotifications.length === 0 ? (
            <EmptyState
              icon={<Bell className="w-16 h-16" />}
              title="Nenhuma notificação lida"
              description="Suas notificações lidas aparecerão aqui."
            />
          ) : (
            readNotifications.map(renderNotification)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
