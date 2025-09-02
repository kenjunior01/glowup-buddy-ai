import React, { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Tables } from '../integrations/supabase/types';
import { Button } from './ui/button';

export default function Chat({ friendId }: { friendId: string }) {
  const [messages, setMessages] = useState<Tables<'messages'>[]>([]);
  const [input, setInput] = useState('');
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    // Buscar usuário logado
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) setUserId(session.user.id);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (!userId || !friendId) return;
    // Buscar mensagens entre usuários
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .or(`sender_id.eq.${friendId},receiver_id.eq.${friendId}`)
        .order('sent_at', { ascending: true });
      setMessages(data as Tables<'messages'>[] || []);
    };
    fetchMessages();
  }, [userId, friendId]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    await supabase
      .from('messages')
      .insert({ sender_id: userId, receiver_id: friendId, content: input });
    setInput("");
    // Atualiza mensagens
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .or(`sender_id.eq.${friendId},receiver_id.eq.${friendId}`)
      .order('sent_at', { ascending: true });
    setMessages(data as Tables<'messages'>[] || []);
  };

  return (
    <div>
      <h2 className="font-bold mb-2">Chat</h2>
      <div className="mb-2 max-h-64 overflow-y-auto border p-2 rounded">
        {messages.map((msg, idx) => (
          <div key={idx} className={msg.sender_id === userId ? "text-right" : "text-left"}>
            <span className="inline-block px-2 py-1 rounded bg-gray-100 mb-1">{msg.content}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input className="border rounded px-2 py-1 flex-1" value={input} onChange={e => setInput(e.target.value)} />
        <Button onClick={sendMessage}>Enviar</Button>
      </div>
    </div>
  );
}
