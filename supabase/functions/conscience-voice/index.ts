import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Gather context
    const today = new Date().toISOString().split('T')[0];
    const [questRes, streakRes, leagueRes, clanMemberRes] = await Promise.all([
      supabase.from('daily_quests').select('*').eq('user_id', user.id).eq('quest_date', today).maybeSingle(),
      supabase.from('streaks').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('leagues').select('*').eq('user_id', user.id).order('week_start', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('clan_members').select('*, clans(name)').eq('user_id', user.id).maybeSingle(),
    ]);

    const questDone = questRes.data?.completed ?? false;
    const streak = streakRes.data?.current_streak ?? 0;
    const leagueTier = leagueRes.data?.league_tier ?? 'bronze';
    const leaguePosition = leagueRes.data?.position_in_group ?? 0;
    const clanName = (clanMemberRes.data?.clans as any)?.name;
    const hour = new Date().getHours();

    // Generate passive-aggressive message based on context
    let message = '';
    let severity: 'mild' | 'medium' | 'aggressive' = 'mild';

    if (questDone) {
      // Completed - praise with competitive edge
      const praises = [
        `Quest feita. Mas seus rivais na Liga ${leagueTier.charAt(0).toUpperCase() + leagueTier.slice(1)} já estão na frente. Não relaxe.`,
        `Bom. Mas "bom" não sobe de liga. Amanhã, faça mais rápido.`,
        `✓ Feito. ${streak} dias de streak. Quebre agora e perca tudo que construiu.`,
      ];
      message = praises[Math.floor(Math.random() * praises.length)];
      severity = 'mild';
    } else if (hour >= 20) {
      // Late evening, not done - maximum pressure
      severity = 'aggressive';
      const aggressive = [
        `São ${hour}h. Sua quest ainda não foi feita. Seus rivais na Liga de ${leagueTier.charAt(0).toUpperCase() + leagueTier.slice(1)} já completaram as deles. Vai aceitar o rebaixamento?`,
        `${streak} dias de streak. Tudo isso vai pro lixo se você não agir AGORA. O relógio está contra você.`,
        clanName ? `Seu clã "${clanName}" está esperando. Não seja o elo fraco que derruba todos.` : `Todos os seus rivais já completaram. Você é o último. Move.`,
        `O rebaixamento é em ${7 - new Date().getDay()} dias. Cada quest perdida é um passo pra baixo. Aja.`,
      ];
      message = aggressive[Math.floor(Math.random() * aggressive.length)];
    } else if (hour >= 15) {
      // Afternoon reminder
      severity = 'medium';
      const afternoon = [
        `Metade do dia já passou. Sua quest de hoje ainda está pendente. Seus competidores não estão esperando.`,
        `Posição #${leaguePosition || '?'} na liga. Quer cair mais? Continue procrastinando.`,
        clanName ? `O clã "${clanName}" depende de você. Não aparecer é trair todos.` : `Cada hora que passa, mais difícil fica. Comece agora.`,
      ];
      message = afternoon[Math.floor(Math.random() * afternoon.length)];
    } else {
      // Morning/early - motivational with edge
      severity = 'mild';
      const morning = [
        `Nova quest disponível. ${streak > 0 ? `${streak} dias de streak em jogo.` : 'Hora de começar algo.'} Não desperdice o dia.`,
        `Os guerreiros da Liga ${leagueTier.charAt(0).toUpperCase() + leagueTier.slice(1)} já estão se movendo. E você?`,
      ];
      message = morning[Math.floor(Math.random() * morning.length)];
    }

    return new Response(JSON.stringify({ message, severity, questDone, streak, leagueTier }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (e) {
    console.error('Conscience voice error:', e);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
