import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, ArrowLeft, Bot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SkeletonMessage } from '@/components/SkeletonCard';
import { Badge } from '@/components/ui/badge';

interface ChatProps {
  friendId: string | 'ai-assistant';
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
    
    // Check if chatting with AI assistant
    if (friendId === 'ai-assistant') {
      try {
        // Add user message to chat
        const userMsg: Message = {
          id: `temp_${Date.now()}`,
          sender_id: currentUserId,
          receiver_id: 'ai-assistant',
          content: newMessage.trim(),
          created_at: new Date().toISOString(),
          read_at: null
        };
        setMessages(prev => [...prev, userMsg]);
        setNewMessage('');

        // Call AI assistant
        const { data, error } = await supabase.functions.invoke('chat-assistant', {
          body: { message: newMessage.trim(), userId: currentUserId }
        });

        if (error) throw error;

        // Add AI response to chat
        const aiMsg: Message = {
          id: `ai_${Date.now()}`,
          sender_id: 'ai-assistant',
          receiver_id: currentUserId,
          content: data.message,
          created_at: new Date().toISOString(),
          read_at: null
        };
        setMessages(prev => [...prev, aiMsg]);
        
      } catch (error) {
        console.error('Error with AI assistant:', error);
        toast({
          title: "Erro",
          description: "Não foi possível conversar com o assistente.",
          variant: "destructive",
        });
      }
    } else {
      // Regular message to friend
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
    }
    
    setLoading(false);
  };

  const isAIChat = friendId === 'ai-assistant';

  return (
    <div className="space-y-4">
      {isAIChat && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800">
          <Bot className="w-5 h-5 text-purple-600" />
          <div className="flex-1">
            <p className="text-sm font-medium">Assistente IA GlowUp</p>
            <p className="text-xs text-muted-foreground">Seu coach pessoal motivacional</p>
          </div>
          <Badge variant="secondary" className="text-xs">Powered by Gemini</Badge>
        </div>
      )}
      <ScrollArea className="h-[400px] p-4 border rounded-lg">
        <div className="space-y-3">
          {messages.map((message) => {
            const isOwn = message.sender_id === currentUserId;
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start gap-2 max-w-[80%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                  {!isOwn && message.sender_id === 'ai-assistant' && (
                    <div className="p-2 rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className={`p-3 rounded-lg ${
                    isOwn 
                      ? 'bg-primary text-primary-foreground' 
                      : message.sender_id === 'ai-assistant'
                        ? 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 border border-purple-200 dark:border-purple-800'
                        : 'bg-secondary'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
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