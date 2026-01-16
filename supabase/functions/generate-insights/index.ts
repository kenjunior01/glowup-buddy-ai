import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { stats, weeklyData, pillarData } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const prompt = `Analise os seguintes dados de progresso de um usuário em um app de desenvolvimento pessoal e gere 4 insights curtos e motivacionais em português brasileiro:

Estatísticas:
- Total de pontos: ${stats.totalPoints}
- Desafios completados: ${stats.totalChallenges}
- Sequência atual: ${stats.currentStreak} dias
- Maior sequência: ${stats.longestStreak} dias
- Entradas no diário: ${stats.journalEntries}
- Crescimento semanal: ${stats.weeklyGrowth}%

Pilares de foco: ${pillarData.map((p: any) => `${p.name}: ${p.value}`).join(', ')}

Atividade recente: ${weeklyData.slice(-3).map((d: any) => `${d.day}: ${d.challenges} desafios, ${d.journalEntries} reflexões`).join('; ')}

Gere exatamente 4 insights personalizados, curtos (máximo 2 frases cada) e motivacionais. Foque em padrões, conquistas e sugestões de melhoria.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "Você é um coach de desenvolvimento pessoal especializado em análise de dados e motivação. Sempre responda em português brasileiro de forma encorajadora e prática."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "provide_insights",
              description: "Retorna 4 insights personalizados baseados nos dados do usuário",
              parameters: {
                type: "object",
                properties: {
                  insights: {
                    type: "array",
                    items: {
                      type: "string",
                      description: "Um insight curto e motivacional"
                    },
                    minItems: 4,
                    maxItems: 4
                  }
                },
                required: ["insights"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "provide_insights" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Por favor, adicione créditos." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract insights from tool call response
    let insights: string[] = [];
    
    if (data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments) {
      const args = JSON.parse(data.choices[0].message.tool_calls[0].function.arguments);
      insights = args.insights || [];
    } else if (data.choices?.[0]?.message?.content) {
      // Fallback: parse from content if tool call didn't work
      const content = data.choices[0].message.content;
      insights = content.split('\n').filter((line: string) => line.trim()).slice(0, 4);
    }

    return new Response(
      JSON.stringify({ insights }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating insights:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});