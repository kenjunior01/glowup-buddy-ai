import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SkeletonMessage } from '@/components/SkeletonCard';

interface ChatProps {
  friendId: string;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
}

const Chat: React.FC<ChatProps> = ({ friendId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId && friendId) {
      fetchMessages();
      
      // Set up real-time subscription for new messages
      const channel = supabase
        .channel('messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `or(and(sender_id.eq.${currentUserId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${currentUserId}))`,
          },
          (payload) => {
            const newMessage = payload.new as Message;
            setMessages(prev => [...prev, newMessage]);
            scrollToBottom();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentUserId, friendId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const fetchMessages = async () => {
    if (!currentUserId) return;

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${currentUserId})`)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
    } else {
      setMessages(data || []);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUserId || loading) return;

    setLoading(true);
    
    const { error } = await supabase
      .from('messages')
      .insert({
        sender_id: currentUserId,
        receiver_id: friendId,
        content: newMessage.trim()
      });

    if (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem.",
        variant: "destructive",
      });
    } else {
      setNewMessage('');
      scrollToBottom();
    }
    
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <ScrollArea className="h-[400px] p-4 border rounded-lg">
        <div className="space-y-3">
          {messages.map((message) => {
            const isOwn = message.sender_id === currentUserId;
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[70%] p-3 rounded-lg ${
                  isOwn 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-secondary'
                }`}>
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="flex gap-2">
        <Input
          placeholder="Digite sua mensagem..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          disabled={loading}
        />
        <Button onClick={sendMessage} disabled={!newMessage.trim() || loading}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default Chat;