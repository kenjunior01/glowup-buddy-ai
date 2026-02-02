import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, weeklyStats, weekStart, weekEnd } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, selected_pillars, level')
      .eq('id', userId)
      .single();

    // Get mood logs for the week
    const { data: moodLogs } = await supabase
      .from('mood_logs')
      .select('mood_score, mood_label, created_at')
      .eq('user_id', userId)
      .gte('date', weekStart)
      .lte('date', weekEnd)
      .order('created_at', { ascending: false });

    const systemPrompt = `Você é um coach de produtividade e bem-estar do app GlowUp.
Sua tarefa é criar um resumo semanal motivador e construtivo.
Seja positivo, específico e orientado para ação.
Use emojis moderadamente.
Responda APENAS em JSON válido com esta estrutura:
{
  "insights": "Uma análise de 2-3 frases sobre a semana",
  "highlights": ["destaque 1", "destaque 2", "destaque 3"],
  "nextWeekGoals": ["meta 1", "meta 2", "meta 3"]
}`;

    const userPrompt = `Gere o Sunday Reset para ${profile?.name || 'o usuário'} (Nível ${profile?.level || 1}).

Estatísticas da Semana (${weekStart} a ${weekEnd}):
- Desafios completados: ${weeklyStats.challengesCompleted}
- Dias de streak: ${weeklyStats.streakDays}
- Metas alcançadas: ${weeklyStats.goalsAchieved}
- Humor médio: ${weeklyStats.moodAverage}/5
- Pilares de foco: ${profile?.selected_pillars?.join(', ') || 'geral'}

${moodLogs && moodLogs.length > 0 ? `
Registros de humor da semana:
${moodLogs.map(m => `- ${m.mood_label} (${m.mood_score}/5)`).join('\n')}
` : ''}

Crie um resumo que:
1. Celebre as conquistas (mesmo pequenas)
2. Identifique padrões de humor/produtividade
3. Sugira 3 metas práticas para a próxima semana baseadas nos pilares`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 500,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify(getFallbackSummary(weeklyStats)),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify(getFallbackSummary(weeklyStats)),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Parse JSON from response
    let parsedContent;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedContent = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch {
      parsedContent = getFallbackSummary(weeklyStats);
    }

    return new Response(
      JSON.stringify(parsedContent),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-weekly-summary:", error);
    return new Response(
      JSON.stringify({
        insights: "Uma semana de aprendizado e crescimento. Continue sua jornada! 🌟",
        highlights: ["Manteve consistência", "Fez check-ins", "Participou de desafios"],
        nextWeekGoals: ["Manter streak ativo", "Completar 2 desafios", "Registrar humor diário"],
        error: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getFallbackSummary(stats: any) {
  const insights = stats.challengesCompleted > 0 
    ? `Você completou ${stats.challengesCompleted} desafio(s) esta semana! Continue assim! 💪`
    : "Uma semana de preparação. A próxima será ainda melhor! 🚀";
  
  const highlights = [];
  if (stats.streakDays > 0) highlights.push(`Manteve ${stats.streakDays} dias de streak`);
  if (stats.challengesCompleted > 0) highlights.push(`Completou ${stats.challengesCompleted} desafio(s)`);
  if (stats.goalsAchieved > 0) highlights.push(`Alcançou ${stats.goalsAchieved} meta(s)`);
  if (highlights.length === 0) highlights.push("Começou sua jornada no GlowUp");

  return {
    insights,
    highlights,
    nextWeekGoals: [
      "Fazer check-in diário",
      "Completar pelo menos 1 desafio",
      "Registrar seu humor todos os dias"
    ]
  };
}
