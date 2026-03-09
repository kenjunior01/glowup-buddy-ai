import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Shield, TrendingUp, TrendingDown, Crown, Coins } from 'lucide-react';

const LEAGUE_TIERS = [
  { id: 'bronze', label: 'Bronze', color: 'from-amber-700 to-amber-900', emoji: '🥉', textColor: 'text-amber-600' },
  { id: 'silver', label: 'Prata', color: 'from-gray-300 to-gray-500', emoji: '🥈', textColor: 'text-gray-500' },
  { id: 'gold', label: 'Ouro', color: 'from-yellow-400 to-amber-500', emoji: '🥇', textColor: 'text-yellow-500' },
  { id: 'diamond', label: 'Diamante', color: 'from-cyan-300 to-blue-500', emoji: '💎', textColor: 'text-cyan-400' },
  { id: 'immortal', label: 'Imortal', color: 'from-purple-500 to-red-500', emoji: '👑', textColor: 'text-purple-400' },
];

export default function IronLeagues() {
  const [myLeague, setMyLeague] = useState<any>(null);
  const [leagueMembers, setLeagueMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState('');

  useEffect(() => {
    fetchLeague();
  }, []);

  const fetchLeague = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      setCurrentUserId(session.user.id);
      const uid = session.user.id;

      const weekStart = getWeekStart();

      // Get or create league entry
      let { data: league } = await supabase
        .from('leagues')
        .select('*')
        .eq('user_id', uid)
        .eq('week_start', weekStart)
        .maybeSingle();

      if (!league) {
        // Assign to a group
        const { count } = await supabase
          .from('leagues')
          .select('*', { count: 'exact', head: true })
          .eq('week_start', weekStart)
          .eq('league_tier', 'bronze');

        const groupNum = Math.floor((count || 0) / 30);

        const { data: newLeague } = await supabase
          .from('leagues')
          .insert({
            user_id: uid,
            league_tier: 'bronze',
            league_group: groupNum,
            week_start: weekStart,
            weekly_points: 0,
          })
          .select()
          .single();

        league = newLeague;
      }

      setMyLeague(league);

      // Fetch group members
      if (league) {
        const { data: members } = await supabase
          .from('leagues')
          .select('*')
          .eq('week_start', weekStart)
          .eq('league_tier', league.league_tier)
          .eq('league_group', league.league_group)
          .order('weekly_points', { ascending: false })
          .limit(30);

        // Enrich with profile names
        if (members && members.length > 0) {
          const enriched = await Promise.all(
            members.map(async (m, i) => {
              const { data } = await supabase.rpc('get_public_profile', { profile_id: m.user_id });
              return {
                ...m,
                position: i + 1,
                display_name: data?.[0]?.display_name || `Guerreiro #${i + 1}`,
                avatar_url: data?.[0]?.avatar_url,
              };
            })
          );
          setLeagueMembers(enriched);
        }
      }
    } catch (e) {
      console.error('League fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const getWeekStart = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(now.setDate(diff)).toISOString().split('T')[0];
  };

  if (loading) {
    return (
      <div className="rounded-2xl bg-card border border-border p-6 animate-pulse">
        <div className="h-6 w-32 bg-muted rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted rounded-xl" />)}
        </div>
      </div>
    );
  }

  const currentTier = LEAGUE_TIERS.find(t => t.id === myLeague?.league_tier) || LEAGUE_TIERS[0];
  const myPosition = leagueMembers.findIndex(m => m.user_id === currentUserId) + 1;
  const totalMembers = leagueMembers.length;
  const isPromotionZone = myPosition <= 5;
  const isDemotionZone = myPosition > totalMembers - 5 && totalMembers >= 10;

  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden">
      {/* League Header */}
      <div className={cn("bg-gradient-to-r p-5", currentTier.color)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{currentTier.emoji}</span>
            <div>
              <h3 className="text-white font-bold text-lg">Liga {currentTier.label}</h3>
              <p className="text-white/70 text-xs">Grupo #{(myLeague?.league_group || 0) + 1} · {totalMembers} guerreiros</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white/60 text-xs">Sua posição</p>
            <p className="text-white text-2xl font-bold font-mono">#{myPosition}</p>
          </div>
        </div>
      </div>

      {/* Zone Indicator */}
      {(isPromotionZone || isDemotionZone) && (
        <div className={cn(
          "flex items-center gap-2 px-4 py-2 text-xs font-bold",
          isPromotionZone ? "bg-green-500/10 text-green-500" : "bg-destructive/10 text-destructive"
        )}>
          {isPromotionZone ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          {isPromotionZone ? '🔥 Zona de Promoção! Mantenha a posição para subir.' : '⚠️ Zona de Rebaixamento! Complete quests para subir.'}
        </div>
      )}

      {/* Rankings */}
      <div className="p-4 space-y-1.5 max-h-80 overflow-y-auto">
        {leagueMembers.map((member, i) => {
          const isMe = member.user_id === currentUserId;
          const inPromo = i < 5;
          const inDemo = i >= totalMembers - 5 && totalMembers >= 10;

          return (
            <div
              key={member.id}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all",
                isMe && "bg-primary/10 border border-primary/30 scale-[1.02]",
                !isMe && inPromo && "bg-green-500/5",
                !isMe && inDemo && "bg-destructive/5",
                !isMe && !inPromo && !inDemo && "hover:bg-muted/50"
              )}
            >
              <span className={cn(
                "w-7 text-center text-sm font-bold font-mono",
                i === 0 ? "text-yellow-500" : i === 1 ? "text-gray-400" : i === 2 ? "text-amber-600" : "text-muted-foreground"
              )}>
                {i === 0 ? '👑' : `${i + 1}`}
              </span>

              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                {member.avatar_url ? (
                  <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Shield className="w-4 h-4 text-muted-foreground" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-medium truncate",
                  isMe ? "text-primary font-bold" : "text-foreground"
                )}>
                  {member.display_name} {isMe && '(Você)'}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-yellow-500" />
                <span className="text-sm font-bold font-mono text-foreground">
                  {member.weekly_points}
                </span>
              </div>
            </div>
          );
        })}

        {leagueMembers.length === 0 && (
          <div className="text-center py-8">
            <Shield className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Complete quests para ganhar pontos na liga!</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border px-4 py-3 flex items-center justify-between bg-muted/30">
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Top 5 sobem</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive" /> Bottom 5 descem</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Coins className="w-3 h-3 text-yellow-500" />
          <span>{myLeague?.weekly_points || 0} pts</span>
        </div>
      </div>
    </div>
  );
}
