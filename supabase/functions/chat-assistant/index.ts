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
const chatSchema = z.object({
  message: z.string().min(1).max(2000),
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
    const validationResult = chatSchema.safeParse(body);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ error: 'Dados inválidos', details: validationResult.error.issues }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { message, userId: requestedUserId } = validationResult.data;

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

    // Buscar perfil e progresso do usuário
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    const { data: goals } = await supabaseClient
      .from('goals')
      .select('*')
      .eq('user_id', userId);

    const systemPrompt = `Você é um assistente virtual motivacional especializado em Glow Up e transformação pessoal.

CONTEXTO DO USUÁRIO:
- Nome: ${profile?.name || 'Usuário'}
- Pontos: ${profile?.pontos || 0}
- Nível: ${profile?.level || 1}
- Objetivos: ${goals?.length || 0} metas definidas

Sua missão é:
- Motivar e encorajar o usuário
- Dar dicas práticas de Glow Up
- Responder perguntas sobre o app
- Sugerir próximos passos baseado no progresso
- Usar linguagem positiva e empática
- Ser conciso mas carinhoso

Responda de forma natural e conversacional.`;

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
          { role: 'user', content: message }
        ],
        max_tokens: 500,
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
    const aiMessage = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ message: aiMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in chat-assistant function:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred while processing your message' }),
      { 
        status: 500,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }
      }
    );
  }
});