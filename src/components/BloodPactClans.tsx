import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Users, Skull, Plus, Shield, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';

export default function BloodPactClans() {
  const [clans, setClans] = useState<any[]>([]);
  const [myClan, setMyClan] = useState<any>(null);
  const [clanMembers, setClanMembers] = useState<any[]>([]);
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newClan, setNewClan] = useState({ name: '', emoji: '⚔️' });
  const [failedMembers, setFailedMembers] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => { fetchClans(); }, []);

  const fetchClans = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      setUserId(session.user.id);

      // Check if user is in a clan
      const { data: membership } = await supabase
        .from('clan_members')
        .select('*, clans(*)')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (membership) {
        setMyClan(membership.clans);

        // Fetch clan members
        const { data: members } = await supabase
          .from('clan_members')
          .select('*')
          .eq('clan_id', (membership.clans as any).id);

        if (members) {
          const today = new Date().toISOString().split('T')[0];
          const enriched = await Promise.all(members.map(async m => {
            const { data: profile } = await supabase.rpc('get_public_profile', { profile_id: m.user_id });
            const failed = m.last_quest_date !== today && m.last_quest_date !== null;
            return {
              ...m,
              display_name: profile?.[0]?.display_name || 'Guerreiro',
              avatar_url: profile?.[0]?.avatar_url,
              failed_today: failed,
            };
          }));
          setClanMembers(enriched);
          setFailedMembers(enriched.filter(m => m.failed_today).map(m => m.display_name));
        }
      } else {
        // Fetch available clans
        const { data: allClans } = await supabase
          .from('clans')
          .select('*')
          .order('member_count', { ascending: false })
          .limit(10);
        setClans(allClans || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const createClan = async () => {
    if (!newClan.name) return;
    const { data, error } = await supabase
      .from('clans')
      .insert({ name: newClan.name, icon_emoji: newClan.emoji, leader_id: userId })
      .select()
      .single();

    if (error || !data) {
      toast({ title: 'Erro', description: 'Falha ao criar clã.', variant: 'destructive' });
      return;
    }

    await supabase.from('clan_members').insert({
      clan_id: data.id,
      user_id: userId,
      role: 'leader',
    });

    toast({ title: '⚔️ Clã Criado!', description: `${newClan.name} está pronto para a guerra.` });
    setShowCreate(false);
    fetchClans();
  };

  const joinClan = async (clanId: string) => {
    const { error } = await supabase.from('clan_members').insert({
      clan_id: clanId,
      user_id: userId,
    });

    if (error) {
      toast({ title: 'Erro', description: 'Falha ao entrar no clã.', variant: 'destructive' });
      return;
    }

    await supabase.from('clans').update({
      member_count: (clans.find(c => c.id === clanId)?.member_count || 0) + 1,
    }).eq('id', clanId);

    toast({ title: '🩸 Pacto Selado!', description: 'Você agora faz parte do clã. Não decepcione.' });
    fetchClans();
  };

  if (loading) {
    return <div className="rounded-2xl bg-card border border-border p-6 animate-pulse"><div className="h-20 bg-muted rounded" /></div>;
  }

  // In a clan
  if (myClan) {
    const completedCount = clanMembers.filter(m => !m.failed_today).length;
    const healthPercent = Math.round((completedCount / Math.max(clanMembers.length, 1)) * 100);

    return (
      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        {/* Clan Header */}
        <div className="bg-gradient-to-r from-gray-900 to-red-900 p-5">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{myClan.icon_emoji}</span>
            <div>
              <h3 className="text-white font-bold text-lg">{myClan.name}</h3>
              <p className="text-white/60 text-xs">{myClan.member_count} guerreiros · Pacto de Sangue</p>
            </div>
          </div>
        </div>

        {/* Clan Health */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Saúde do Clã</span>
            <span className={cn("text-xs font-bold", healthPercent >= 80 ? "text-green-500" : healthPercent >= 50 ? "text-yellow-500" : "text-destructive")}>
              {healthPercent}%
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                healthPercent >= 80 ? "bg-green-500" : healthPercent >= 50 ? "bg-yellow-500" : "bg-destructive"
              )}
              style={{ width: `${healthPercent}%` }}
            />
          </div>
          {failedMembers.length > 0 && (
            <div className="flex items-start gap-2 mt-3 p-2.5 rounded-xl bg-destructive/10">
              <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-xs text-destructive">
                <strong>{failedMembers.join(', ')}</strong> {failedMembers.length === 1 ? 'falhou' : 'falharam'} na quest de hoje. Todo o clã perde XP bônus!
              </p>
            </div>
          )}
        </div>

        {/* Members */}
        <div className="divide-y divide-border">
          {clanMembers.map(member => (
            <div key={member.id} className={cn(
              "flex items-center gap-3 px-4 py-3",
              member.failed_today && "bg-destructive/5"
            )}>
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                {member.avatar_url ? (
                  <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Users className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{member.display_name}</p>
                <p className="text-[10px] text-muted-foreground">{member.role === 'leader' ? '👑 Líder' : '⚔️ Membro'}</p>
              </div>
              {member.failed_today ? (
                <span className="flex items-center gap-1 text-xs text-destructive font-bold">
                  <Skull className="w-3.5 h-3.5" /> Falhou
                </span>
              ) : (
                <span className="text-xs text-green-500 font-bold">✓ Ativo</span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // No clan - show available clans
  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden">
      <div className="bg-gradient-to-r from-gray-900 to-red-900 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skull className="w-7 h-7 text-white" />
            <div>
              <h3 className="text-white font-bold text-lg">Pacto de Sangue</h3>
              <p className="text-white/70 text-xs">Entre num clã. Falhe, e todos pagam.</p>
            </div>
          </div>
          <Button onClick={() => setShowCreate(!showCreate)} size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0">
            <Plus className="w-4 h-4 mr-1" /> Criar
          </Button>
        </div>
      </div>

      {showCreate && (
        <div className="p-4 border-b border-border space-y-3 bg-muted/30">
          <div className="flex gap-2">
            <input
              className="w-12 px-2 py-2 rounded-xl bg-background border border-border text-center text-lg"
              value={newClan.emoji}
              onChange={e => setNewClan(prev => ({ ...prev, emoji: e.target.value }))}
            />
            <input
              className="flex-1 px-3 py-2 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground"
              placeholder="Nome do clã..."
              value={newClan.name}
              onChange={e => setNewClan(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <Button onClick={createClan} disabled={!newClan.name} className="w-full">
            Criar Clã ⚔️
          </Button>
        </div>
      )}

      <div className="divide-y divide-border">
        {clans.map(clan => (
          <div key={clan.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
            <span className="text-2xl">{clan.icon_emoji}</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{clan.name}</p>
              <p className="text-xs text-muted-foreground">{clan.member_count}/{clan.max_members} guerreiros</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => joinClan(clan.id)} disabled={clan.member_count >= clan.max_members}>
              Entrar
            </Button>
          </div>
        ))}
        {clans.length === 0 && (
          <div className="p-8 text-center">
            <Shield className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum clã disponível. Crie o primeiro!</p>
          </div>
        )}
      </div>
    </div>
  );
}
