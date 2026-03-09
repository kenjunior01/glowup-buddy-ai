import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Swords, Coins, Clock, Check, X, Send } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';

export default function BloodDuels() {
  const [duels, setDuels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newDuel, setNewDuel] = useState({ quest: '', stake: 10 });
  const [opponentSearch, setOpponentSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedOpponent, setSelectedOpponent] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => { fetchDuels(); }, []);

  const fetchDuels = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      setUserId(session.user.id);

      const { data } = await supabase
        .from('duels')
        .select('*')
        .or(`challenger_id.eq.${session.user.id},opponent_id.eq.${session.user.id}`)
        .order('created_at', { ascending: false })
        .limit(20);

      // Enrich with names
      if (data) {
        const enriched = await Promise.all(data.map(async d => {
          const otherId = d.challenger_id === session.user.id ? d.opponent_id : d.challenger_id;
          const { data: profile } = await supabase.rpc('get_public_profile', { profile_id: otherId });
          return { ...d, opponent_name: profile?.[0]?.display_name || 'Guerreiro' };
        }));
        setDuels(enriched);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (query: string) => {
    setOpponentSearch(query);
    if (query.length < 2) { setSearchResults([]); return; }
    const { data } = await supabase.rpc('get_leaderboard', { limit_count: 50 });
    if (data) {
      setSearchResults(data.filter((u: any) => 
        u.id !== userId && u.display_name?.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5));
    }
  };

  const createDuel = async () => {
    if (!selectedOpponent || !newDuel.quest) return;
    
    const { error } = await supabase.from('duels').insert({
      challenger_id: userId,
      opponent_id: selectedOpponent.id,
      quest_text: newDuel.quest,
      stake_coins: newDuel.stake,
      status: 'pending',
    });

    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível criar o duelo.', variant: 'destructive' });
      return;
    }

    toast({ title: '⚔️ Duelo Enviado!', description: `${selectedOpponent.display_name} foi desafiado.` });
    setShowCreate(false);
    setNewDuel({ quest: '', stake: 10 });
    setSelectedOpponent(null);
    fetchDuels();
  };

  const acceptDuel = async (duelId: string) => {
    await supabase.from('duels').update({ status: 'active' }).eq('id', duelId);
    toast({ title: '🔥 Duelo Aceito!', description: 'O combate começou. Você tem 24h.' });
    fetchDuels();
  };

  const completeDuel = async (duelId: string) => {
    const duel = duels.find(d => d.id === duelId);
    if (!duel) return;

    const isChallenger = duel.challenger_id === userId;
    const updateField = isChallenger ? 'challenger_completed' : 'opponent_completed';
    
    await supabase.from('duels').update({ [updateField]: true }).eq('id', duelId);
    
    toast({ title: '✅ Prova Enviada!', description: 'Aguardando o oponente completar.' });
    fetchDuels();
  };

  const getStatusBadge = (duel: any) => {
    if (duel.status === 'pending') return { label: 'Pendente', class: 'bg-yellow-500/10 text-yellow-500' };
    if (duel.status === 'active') return { label: 'Em combate', class: 'bg-destructive/10 text-destructive' };
    if (duel.status === 'completed') return { label: duel.winner_id === userId ? 'Vitória!' : 'Derrota', class: duel.winner_id === userId ? 'bg-green-500/10 text-green-500' : 'bg-destructive/10 text-destructive' };
    return { label: duel.status, class: 'bg-muted text-muted-foreground' };
  };

  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Swords className="w-7 h-7 text-white" />
            <div>
              <h3 className="text-white font-bold text-lg">Duelos de Sangue</h3>
              <p className="text-white/70 text-xs">Desafie rivais. Aposte tudo.</p>
            </div>
          </div>
          <Button
            onClick={() => setShowCreate(!showCreate)}
            size="sm"
            className="bg-white/20 hover:bg-white/30 text-white border-0"
          >
            <Swords className="w-4 h-4 mr-1" /> Desafiar
          </Button>
        </div>
      </div>

      {/* Create Duel */}
      {showCreate && (
        <div className="p-4 border-b border-border bg-muted/30 space-y-3">
          <input
            className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground"
            placeholder="Buscar oponente..."
            value={opponentSearch}
            onChange={e => searchUsers(e.target.value)}
          />
          {searchResults.length > 0 && (
            <div className="space-y-1">
              {searchResults.map((u: any) => (
                <button
                  key={u.id}
                  onClick={() => { setSelectedOpponent(u); setSearchResults([]); setOpponentSearch(u.display_name); }}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors",
                    selectedOpponent?.id === u.id ? "bg-primary/10 text-primary" : "hover:bg-muted"
                  )}
                >
                  <span className="font-medium text-foreground">{u.display_name}</span>
                  <span className="text-xs text-muted-foreground ml-auto">Lv.{u.level}</span>
                </button>
              ))}
            </div>
          )}

          <input
            className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground"
            placeholder="Quest do duelo (ex: 5km de corrida)"
            value={newDuel.quest}
            onChange={e => setNewDuel(prev => ({ ...prev, quest: e.target.value }))}
          />

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <Coins className="w-4 h-4 text-yellow-500" />
              <input
                type="number"
                min={5}
                max={500}
                className="w-20 px-2 py-1.5 rounded-lg bg-background border border-border text-sm font-mono text-foreground"
                value={newDuel.stake}
                onChange={e => setNewDuel(prev => ({ ...prev, stake: parseInt(e.target.value) || 10 }))}
              />
              <span className="text-xs text-muted-foreground">GlowCoins</span>
            </div>
            <Button onClick={createDuel} disabled={!selectedOpponent || !newDuel.quest} size="sm">
              <Send className="w-4 h-4 mr-1" /> Enviar
            </Button>
          </div>
        </div>
      )}

      {/* Duels List */}
      <div className="divide-y divide-border">
        {duels.map(duel => {
          const status = getStatusBadge(duel);
          const isChallenger = duel.challenger_id === userId;
          const isPending = duel.status === 'pending' && !isChallenger;
          const isActive = duel.status === 'active';
          const myCompleted = isChallenger ? duel.challenger_completed : duel.opponent_completed;

          return (
            <div key={duel.id} className="p-4 hover:bg-muted/30 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold", status.class)}>
                      {status.label}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-yellow-500">
                      <Coins className="w-3 h-3" />
                      <span className="font-mono">{duel.stake_coins}</span>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-foreground truncate">{duel.quest_text}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    vs {duel.opponent_name}
                  </p>
                </div>

                <div className="flex gap-1.5">
                  {isPending && (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => acceptDuel(duel.id)} className="text-green-500 hover:text-green-600 hover:bg-green-500/10">
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10">
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  {isActive && !myCompleted && (
                    <Button size="sm" onClick={() => completeDuel(duel.id)} className="text-xs">
                      Completei ✓
                    </Button>
                  )}
                  {isActive && myCompleted && (
                    <span className="text-xs text-green-500 font-bold px-2 py-1">✓ Feito</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {duels.length === 0 && !loading && (
          <div className="p-8 text-center">
            <Swords className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum duelo ainda. Desafie alguém!</p>
          </div>
        )}
      </div>
    </div>
  );
}
