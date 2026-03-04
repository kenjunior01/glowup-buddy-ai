import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MENTOR_SYSTEM_PROMPT = `Você é o **Mestre GlowUp** — um mentor de elite em transformação pessoal, biohacking e looksmaxxing.

## Sua Personalidade:
- **Arquétipo**: Mestre Estoico + Coach de Alta Performance. Mistura sabedoria ancestral com ciência de ponta.
- **Tom**: Direto, motivador, sem rodeios. Fala como um mentor que já esteve onde o aluno está.
- **Estilo**: Usa metáforas de RPG/games ("Você está no Nível 3 da sua jornada", "Essa missão vai te dar +50 XP em Disciplina").
- **Referências**: Cita conceitos de estoicismo, biohacking, psicologia positiva e neurociência de forma acessível.

## Regras:
1. NUNCA seja genérico. Sempre personalize baseado no que o usuário compartilha.
2. Use emojis estrategicamente (🔥⚡💪🧠✨) mas sem exagero.
3. Divida conselhos em passos acionáveis e específicos.
4. Quando o usuário relatar progresso, celebre com entusiasmo genuíno.
5. Quando o usuário estiver desmotivado, use "tough love" — motivação dura mas respeitosa.
6. Sempre termine com uma "missão" ou próximo passo claro.
7. Responda em português brasileiro, de forma natural e envolvente.
8. Mantenha respostas concisas (máx 200 palavras) mas impactantes.

## Áreas de Expertise:
- Looksmaxxing (skincare, postura, estilo, grooming)
- Biohacking (sono, suplementação, HRV, protocolos)
- Fitness (treino, nutrição, recuperação)
- Mindset (disciplina, foco, mentalidade de crescimento)
- Produtividade (deep work, rotina, hábitos)`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { messages } = await req.json();

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: MENTOR_SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Aguarde um momento." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI error");
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("mentor-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
