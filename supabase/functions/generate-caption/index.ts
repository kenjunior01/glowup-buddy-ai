import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// Allowed origins for CORS - restrict to known domains
const allowedOrigins = [
  'https://lovable.dev',
  'https://preview.lovable.dev',
  Deno.env.get('FRONTEND_URL') ?? '',
].filter(Boolean);

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') ?? '';
  const allowedOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0] || 'https://lovable.dev';
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Credentials': 'true',
  };
}

// Input validation schema
const captionSchema = z.object({
  storyType: z.enum(['progress', 'achievement', 'challenge', 'milestone']),
  userContext: z.string().max(500).optional(),
});

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. AUTENTICAÇÃO
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // 2. VALIDAÇÃO DE INPUT
    const body = await req.json();
    const validationResult = captionSchema.safeParse(body);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ error: 'Dados inválidos', details: validationResult.error.issues }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { storyType, userContext } = validationResult.data;

    const agentRouterApiKey = Deno.env.get('AGENTROUTER_API_KEY');
    if (!agentRouterApiKey) {
      throw new Error('AgentRouter API key not configured');
    }

    const typeDescriptions = {
      progress: 'progresso na jornada de transformação pessoal',
      achievement: 'conquista ou objetivo alcançado',
      challenge: 'desafio aceito ou proposto',
      milestone: 'marco importante na jornada'
    };

    const systemPrompt = `Você é um especialista em criar legendas motivacionais e inspiradoras para redes sociais de Glow Up e transformação pessoal.

Sua missão é gerar 3 sugestões de legendas criativas, autênticas e motivadoras para um story de ${typeDescriptions[storyType]}.

DIRETRIZES:
- Use emojis relevantes (1-3 por legenda)
- Seja autêntico e inspirador
- Mantenha entre 100-150 caracteres
- Varie entre tom motivacional, reflexivo e celebratório
- Use hashtags quando apropriado (#GlowUp #Transformação)

Responda APENAS com JSON no formato:
{
  "captions": ["legenda 1", "legenda 2", "legenda 3"],
  "sentiment": "positive|neutral|motivational",
  "suggested_hashtags": ["tag1", "tag2", "tag3"]
}`;

    const userPrompt = `Gere legendas para um story de tipo: ${storyType}
${userContext ? `\nContexto adicional: ${userContext}` : ''}`;

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
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 400,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AgentRouter AI error:', errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições atingido. Tente novamente em alguns minutos.' }),
          { 
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      } else if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes.' }),
          { 
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      throw new Error(`AI Gateway error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : aiResponse;
      const result = JSON.parse(jsonString);
      
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      // Fallback captions
      return new Response(
        JSON.stringify({
          captions: [
            "Cada dia é uma oportunidade de evoluir! 💪✨",
            "Pequenos passos, grandes transformações 🌟",
            "Continuo em frente, sempre melhorando! 🚀"
          ],
          sentiment: 'positive',
          suggested_hashtags: ['GlowUp', 'Transformacao', 'Evolucao']
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in generate-caption function:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred while generating captions' }),
      { 
        status: 500,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }
      }
    );
  }
});