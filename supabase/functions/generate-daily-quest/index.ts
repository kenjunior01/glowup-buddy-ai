import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Unauthorized");

    const userId = userData.user.id;

    // Get user profile
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("name, display_name, age, ocupacao, selected_pillars, mentalidade, rotina")
      .eq("id", userId)
      .single();

    // Get recent quests to avoid repetition
    const { data: recentQuests } = await supabaseClient
      .from("daily_quests")
      .select("quest_text")
      .eq("user_id", userId)
      .order("quest_date", { ascending: false })
      .limit(7);

    const recentTexts = (recentQuests || []).map((q: any) => q.quest_text).join(", ");
    const pillars = (profile?.selected_pillars || ["corpo", "mente", "aparência"]).join(", ");
    const userName = profile?.display_name || profile?.name || "usuário";

    const systemPrompt = `Você é o coach de transformação pessoal do GlowUp. Gere UMA quest diária prática, específica e realizável em um dia.

Regras:
- Máximo 60 caracteres
- Sempre inclua 1 emoji no final
- Deve ser ação concreta (verbo no infinitivo ou imperativo)
- Nunca repita quests recentes
- Alterne entre os pilares do usuário
- Dificuldade: realizável mas desafiadora
- Tom: motivador, direto, masculino

Exemplos bons:
- "Treino de 30 min sem desculpas 💪"
- "Beber 3L de água hoje 💧"  
- "Ler 20 páginas antes de dormir 📖"
- "Skincare completo manhã e noite ✨"
- "Zero redes sociais por 2 horas 📵"`;

    const userPrompt = `Usuário: ${userName}, ${profile?.age || "?"} anos, ${profile?.ocupacao || "não informado"}.
Pilares: ${pillars}.
Rotina: ${profile?.rotina || "não informada"}.
Mentalidade: ${profile?.mentalidade || "não informada"}.
Quests recentes (NÃO repetir): ${recentTexts || "nenhuma"}.

Gere 1 quest para hoje. Responda APENAS com o texto da quest (com emoji), nada mais.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again later" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI error:", response.status, errText);
      throw new Error("AI gateway error");
    }

    const aiData = await response.json();
    const questText = aiData.choices?.[0]?.message?.content?.trim() || "Treino de 30 min sem desculpas 💪";

    // Determine pillar from quest content
    const pillarMap: Record<string, string> = {
      treino: "corpo", água: "corpo", flexões: "corpo", corrida: "corpo", caminhada: "corpo",
      ler: "mente", meditar: "mente", estudar: "mente", escrever: "mente", gratidão: "mente",
      skincare: "aparência", postura: "aparência", roupa: "aparência",
      dormir: "corpo", tela: "mente", social: "mente",
    };
    let detectedPillar = "geral";
    const lowerQuest = questText.toLowerCase();
    for (const [keyword, pillar] of Object.entries(pillarMap)) {
      if (lowerQuest.includes(keyword)) { detectedPillar = pillar; break; }
    }

    // Insert quest
    const today = new Date().toISOString().split("T")[0];
    const { data: quest, error: insertError } = await supabaseClient
      .from("daily_quests")
      .insert({
        user_id: userId,
        quest_text: questText,
        quest_type: "ai_generated",
        pillar: detectedPillar,
        quest_date: today,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return new Response(JSON.stringify({ quest }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-daily-quest error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
