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
const missionsSchema = z.object({
  userId: z.string().uuid().optional(), // Optional, will use authenticated user ID
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
    const validationResult = missionsSchema.safeParse(body);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ error: 'Dados inválidos', details: validationResult.error.issues }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { userId: requestedUserId } = validationResult.data;

    // 3. VALIDAÇÃO DE AUTORIZAÇÃO - userId deve ser o mesmo do usuário autenticado
    if (requestedUserId && requestedUserId !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Acesso negado' }),
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const userId = user.id;

    const agentRouterApiKey = Deno.env.get('AGENTROUTER_API_KEY');
    if (!agentRouterApiKey) {
      throw new Error('AgentRouter API key not configured');
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
          { role: 'user', content: 'Gere missões personalizadas para hoje' }
        ],
        max_tokens: 800,
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
      JSON.stringify({ error: 'An error occurred while suggesting missions' }),
      { 
        status: 500,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }
      }
    );
  }
});