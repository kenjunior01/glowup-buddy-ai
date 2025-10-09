import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('Lovable API key not configured');
    }

    // Buscar histórico do usuário
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    const { data: goals } = await supabaseClient
      .from('goals')
      .select('*')
      .eq('user_id', userId);

    const { data: recentProgress } = await supabaseClient
      .from('progress')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    const systemPrompt = `Você é um especialista em gamificação e Glow Up. Sugira missões diárias personalizadas.

PERFIL DO USUÁRIO:
- Nível: ${profile?.level || 1}
- Pontos: ${profile?.pontos || 0}
- Objetivos: ${goals?.length || 0}
- Progresso recente: ${recentProgress?.length || 0}

Baseado no comportamento do usuário, sugira 3 missões DIFERENTES das padrão:
- Devem ser específicas e alcançáveis hoje
- Devem estar alinhadas aos objetivos do usuário
- Devem ser motivadoras e criativas
- Incluir recompensa em pontos (10-50 pontos)

Responda APENAS com JSON:
{
  "missions": [
    {
      "title": "Título curto",
      "description": "Descrição clara",
      "icon": "emoji apropriado",
      "points": 20,
      "type": "categoria"
    }
  ]
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Gere missões personalizadas para hoje' }
        ],
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', errorText);
      
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
      const suggestions = JSON.parse(jsonString);
      
      return new Response(
        JSON.stringify(suggestions),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      throw new Error('Falha ao processar sugestões');
    }

  } catch (error) {
    console.error('Error in suggest-missions function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
