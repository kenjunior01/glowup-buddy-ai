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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { challengeId, userMessage, conversationHistory } = await req.json();

    if (!challengeId) {
      return new Response(JSON.stringify({ error: 'Challenge ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Challenge Coach request for challenge:', challengeId);

    // Fetch challenge details
    const { data: challenge, error: challengeError } = await supabaseClient
      .from('challenges')
      .select('*, creator:profiles!challenges_creator_id_fkey(name), challenger:profiles!challenges_challenger_id_fkey(name)')
      .eq('id', challengeId)
      .single();

    if (challengeError) {
      console.error('Error fetching challenge:', challengeError);
      return new Response(JSON.stringify({ error: 'Failed to fetch challenge' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('name, level, pontos, total_challenges_completed')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return new Response(JSON.stringify({ error: 'Failed to fetch user profile' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const agentRouterApiKey = Deno.env.get('AGENTROUTER_API_KEY');
    if (!agentRouterApiKey) {
      console.error('AGENTROUTER_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'AI service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate time remaining
    const now = new Date();
    const expiresAt = new Date(challenge.expires_at);
    const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const acceptedAt = challenge.accepted_at ? new Date(challenge.accepted_at) : null;
    const daysActive = acceptedAt ? Math.floor((now.getTime() - acceptedAt.getTime()) / (1000 * 60 * 60 * 24)) : 0;

    const systemPrompt = `Você é um Coach Virtual motivacional e experiente, especializado em ajudar pessoas a completarem seus desafios pessoais.

INFORMAÇÕES DO DESAFIO:
- Título: ${challenge.title}
- Descrição: ${challenge.description}
- Tipo: ${challenge.challenge_type}
- Status: ${challenge.status}
- Pontos de recompensa: ${challenge.reward_points}
- Dias restantes: ${daysRemaining}
- Dias ativo: ${daysActive}
- Criado por: ${challenge.creator?.name || 'Desconhecido'}
- Desafiado: ${challenge.challenger?.name || 'Desconhecido'}

PERFIL DO USUÁRIO:
- Nome: ${profile.name}
- Nível: ${profile.level}
- Pontos totais: ${profile.pontos}
- Desafios completados: ${profile.total_challenges_completed}

SUA FUNÇÃO:
1. Motivar o usuário a completar o desafio
2. Dar dicas práticas e estratégias específicas
3. Responder dúvidas sobre como alcançar o objetivo
4. Alertar sobre prazos quando apropriado
5. Celebrar pequenas vitórias e progressos
6. Ser empático mas direto quando necessário

REGRAS:
- Mantenha respostas entre 50-150 palavras
- Use emojis de forma moderada
- Seja encorajador mas realista
- Dê conselhos acionáveis, não genéricos
- Adapte tom ao tipo de desafio (fitness, saúde, produtividade, etc)
- Se usuário perguntar sobre desistir, encoraje mas respeite autonomia
- Nunca sugira trapacear ou enganar o sistema`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []),
    ];

    if (userMessage) {
      messages.push({ role: 'user', content: userMessage });
    }

    console.log('Calling AgentRouter API for coach assistant...');

    const aiResponse = await fetch('https://agentrouter.org/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${agentRouterApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AgentRouter API error:', aiResponse.status, errorText);
      return new Response(JSON.stringify({ error: 'AI service error', details: errorText }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResponse.json();
    console.log('AI Response received');

    const coachMessage = aiData.choices?.[0]?.message?.content;
    if (!coachMessage) {
      console.error('No content in AI response');
      return new Response(JSON.stringify({ error: 'No content generated' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      message: coachMessage,
      challengeInfo: {
        daysRemaining,
        daysActive,
        status: challenge.status
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in challenge-coach-assistant:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
