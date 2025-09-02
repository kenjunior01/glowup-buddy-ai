import React, { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Tables } from '../integrations/supabase/types';
import { Button } from './ui/button';

export default function ChallengeFriends({ planId, friends }: { planId: string, friends: any[] }) {
  const [selected, setSelected] = useState<string>('');
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    // Buscar usuário logado
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) setUserId(session.user.id);
    };
    getUser();
  }, []);

  const challengeFriend = async () => {
    if (!selected || !userId) return;
    await supabase
      .from('challenges')
      .insert({ plan_id: planId, challenger_id: userId, challenged_id: selected, status: 'pending' });
    alert("Desafio enviado!");
  };

  return (
    <div className="mt-2">
      <h3 className="font-semibold">Desafiar amigo neste plano</h3>
      <select className="border rounded px-2 py-1" value={selected} onChange={e => setSelected(e.target.value)}>
        <option value="">Selecione um amigo</option>
        {friends.map(f => (
          <option key={f.id} value={f.id}>{f.name}</option>
        ))}
      </select>
      <Button className="ml-2" onClick={challengeFriend} disabled={!selected}>Desafiar</Button>
    </div>
  );
}
