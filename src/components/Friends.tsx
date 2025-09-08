import React, { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useToast } from '../hooks/use-toast';
import { Tables } from '../integrations/supabase/types';
import { Button } from './ui/button';

type SimpleProfile = {
  id: string;
  name: string | null;
};

export default function Friends() {
  const [users, setUsers] = useState<SimpleProfile[]>([]);
  const [friends, setFriends] = useState<SimpleProfile[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [userId, setUserId] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    // Buscar usuário logado
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) setUserId(session.user.id);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (!userId) return;
    // Buscar todos usuários (exceto o próprio)
    const fetchUsers = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, name")
        .neq("id", userId);
      setUsers(data || []);
    };
    // Buscar amigos
    const fetchFriends = async () => {
      const { data } = await supabase
        .from('friendships')
        .select('*, profiles:friend_id(name, id)')
        .eq('user_id', userId)
        .eq('status', 'accepted');
      setFriends(data ? data.map((f: any) => f.profiles as SimpleProfile) : []);
    };
    // Buscar pedidos recebidos
    const fetchRequests = async () => {
      const { data } = await supabase
        .from('friendships')
        .select('*, profiles:user_id(name, id)')
        .eq('friend_id', userId)
        .eq('status', 'pending');
      setRequests(data || []);
    };
    fetchUsers();
    fetchFriends();
    fetchRequests();
  }, [userId]);

  const sendFriendRequest = async (friendId: string) => {
    await supabase
      .from('friendships')
      .insert({ user_id: userId, friend_id: friendId, status: 'pending' });
    toast({
      title: "Pedido enviado!",
      description: "Pedido de amizade enviado com sucesso.",
    });
  };

  const acceptFriendRequest = async (requestId: string) => {
    await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', requestId);
    toast({
      title: "Amizade aceita!",
      description: "Vocês agora são amigos no GlowUp.",
    });
    // Refresh data
    if (userId) {
      const fetchFriends = async () => {
        const { data } = await supabase
          .from('friendships')
          .select('*, profiles:friend_id(name, id)')
          .eq('user_id', userId)
          .eq('status', 'accepted');
        setFriends(data ? data.map((f: any) => f.profiles as SimpleProfile) : []);
      };
      const fetchRequests = async () => {
        const { data } = await supabase
          .from('friendships')
          .select('*, profiles:user_id(name, id)')
          .eq('friend_id', userId)
          .eq('status', 'pending');
        setRequests(data || []);
      };
      fetchFriends();
      fetchRequests();
    }
  };

  const rejectFriendRequest = async (requestId: string) => {
    await supabase
      .from('friendships')
      .delete()
      .eq('id', requestId);
    toast({
      title: "Pedido recusado",
      description: "Pedido de amizade recusado.",
    });
    // Refresh requests
    if (userId) {
      const fetchRequests = async () => {
        const { data } = await supabase
          .from('friendships')
          .select('*, profiles:user_id(name, id)')
          .eq('friend_id', userId)
          .eq('status', 'pending');
        setRequests(data || []);
      };
      fetchRequests();
    }
  };

  return (
    <div>
      <h2 className="font-bold mb-2">Amigos</h2>
      <div className="mb-4">
        <h3 className="font-semibold">Adicionar amigo</h3>
        <ul>
          {users.map(u => (
            <li key={u.id} className="flex items-center gap-2">
              <span>{u.name}</span>
              <Button size="sm" onClick={() => sendFriendRequest(u.id)}>Solicitar amizade</Button>
            </li>
          ))}
        </ul>
      </div>
      <div className="mb-4">
        <h3 className="font-semibold">Pedidos recebidos</h3>
        <ul>
          {requests.map(r => (
            <li key={r.id} className="flex items-center gap-2">
              <span>{r.profiles?.name}</span>
              <Button size="sm" onClick={() => acceptFriendRequest(r.id)}>Aceitar</Button>
              <Button size="sm" variant="outline" onClick={() => rejectFriendRequest(r.id)}>Recusar</Button>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="font-semibold">Meus amigos</h3>
        <ul>
          {friends.map(f => (
            <li key={f.id}>{f.name}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
