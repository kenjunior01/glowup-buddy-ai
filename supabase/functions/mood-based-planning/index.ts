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
    const { mood, energy, userId } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user profile and recent activity
    const { data: profile } = await supabase
      .from('profiles')
      .select('selected_pillars, name')
      .eq('id', userId)
      .single();

    const moodLabels: Record<number, string> = {
      1: 'muito exausto',
      2: 'cansado',
      3: 'neutro',
      4: 'bem',
      5: 'ótimo e energizado'
    };

    const energyLabels: Record<number, string> = {
      1: 'muito baixa',
      2: 'baixa',
      3: 'normal',
      4: 'alta',
      5: 'máxima'
    };

    const moodLabel = moodLabels[mood] || 'neutro';
    const energyLabel = energy ? energyLabels[energy] : 'normal';
    const pillars = profile?.selected_pillars?.join(', ') || 'produtividade, saúde';

    const systemPrompt = `Você é um assistente de bem-estar empático e motivacional do app GlowUp. 
Seu papel é ajudar usuários a ter o melhor dia possível baseado em como estão se sentindo.
Seja breve (máximo 2 frases), positivo e prático.
Nunca critique o usuário por estar se sentindo mal.
Sugira atividades leves quando o humor/energia estiver baixo.`;

    const userPrompt = `O usuário ${profile?.name || ''} está se sentindo ${moodLabel} com energia ${energyLabel}.
Os pilares de foco são: ${pillars}.

Dê uma sugestão personalizada e motivadora para o dia de hoje, ajustando a intensidade das atividades com base no humor e energia.
Se o humor for baixo (1-2), sugira atividades leves e de autocuidado.
Se o humor for alto (4-5), sugira atividades mais desafiadoras.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 150,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            suggestion: getMoodFallback(mood, energy),
            error: "rate_limited" 
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ 
            suggestion: getMoodFallback(mood, energy),
            error: "insufficient_credits" 
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const suggestion = data.choices?.[0]?.message?.content || getMoodFallback(mood, energy);

    return new Response(
      JSON.stringify({ suggestion }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in mood-based-planning:", error);
    return new Response(
      JSON.stringify({ 
        suggestion: "Cuide de si hoje. Lembre-se: cada pequeno passo conta! 💪",
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getMoodFallback(mood: number, energy: number | null): string {
  if (mood <= 2) {
    return "Hoje é um dia para cuidar de você. Que tal uma caminhada leve ou 5 minutos de respiração? Pequenos passos fazem diferença. 💙";
  } else if (mood === 3) {
    return "Um dia equilibrado te espera! Escolha uma tarefa importante e faça uma pausa revigorante. Você consegue! ⚡";
  } else {
    return "Sua energia está alta! Aproveite para enfrentar aquele desafio que você vinha adiando. Hoje é seu dia de brilhar! 🌟";
  }
}
