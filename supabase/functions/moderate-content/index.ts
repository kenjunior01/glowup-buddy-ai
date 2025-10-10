import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, type } = await req.json();

    const agentRouterApiKey = Deno.env.get('AGENTROUTER_API_KEY');
    if (!agentRouterApiKey) {
      throw new Error('AgentRouter API key not configured');
    }

    const systemPrompt = `Você é um moderador de conteúdo especializado em comunidades de desenvolvimento pessoal e Glow Up.

Analise o conteúdo e retorne um JSON com:
- "safe": true/false (se o conteúdo é apropriado)
- "sentiment": "positive"/"neutral"/"negative" (sentimento geral)
- "tags": array de 2-3 tags relevantes
- "reason": breve explicação (só se não for safe)

Considere inapropriado:
- Linguagem ofensiva ou agressiva
- Spam ou propaganda excessiva
- Conteúdo adulto
- Incitação ao ódio

Responda APENAS com JSON válido.`;

    const response = await fetch('https://agentrouter.org/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${agentRouterApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Tipo: ${type}\n\nConteúdo:\n${content}` }
        ],
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AgentRouter AI error:', errorText);
      
      if (response.status === 429) {
        throw new Error('Limite de requisições atingido.');
      } else if (response.status === 402) {
        throw new Error('Créditos insuficientes.');
      }
      throw new Error(`AI Gateway error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : aiResponse;
      const moderation = JSON.parse(jsonString);
      
      return new Response(
        JSON.stringify(moderation),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      return new Response(
        JSON.stringify({ 
          safe: true, 
          sentiment: 'neutral', 
          tags: ['geral'],
          reason: '' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in moderate-content function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
