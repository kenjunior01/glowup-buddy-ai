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

const generateChallengeSchema = z.object({
  targetUserId: z.string().uuid('Invalid target user ID'),
});

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
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

    const body = await req.json();

    // Validate input with Zod
    const validationResult = generateChallengeSchema.safeParse(body);
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error.errors);
      return new Response(JSON.stringify({ 
        error: 'Validation failed', 
        details: validationResult.error.errors.map(e => e.message) 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { targetUserId } = validationResult.data;

    console.log('Generating smart challenge for user:', targetUserId);

    // Fetch target user profile
    const { data: targetProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('name, level, pontos, total_challenges_completed')
      .eq('id', targetUserId)
      .single();

    if (profileError) {
      console.error('Error fetching target profile:', profileError);
      return new Response(JSON.stringify({ error: 'Failed to fetch user profile' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch recent challenges of target user
    const { data: recentChallenges } = await supabaseClient
      .from('challenges')
      .select('challenge_type, status, title')
      .eq('challenger_id', targetUserId)
      .order('created_at', { ascending: false })
      .limit(5);

    const agentRouterApiKey = Deno.env.get('AGENTROUTER_API_KEY');
    if (!agentRouterApiKey) {
      console.error('AGENTROUTER_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'AI service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build context for AI
    const challengeHistory = recentChallenges?.length > 0
      ? recentChallenges.map(c => `${c.challenge_type}: "${c.title}" (${c.status})`).join(', ')
      : 'Nenhum desafio anterior';

    const systemPrompt = `Você é um gerador de desafios personalizados para uma plataforma de desenvolvimento pessoal.
Crie um desafio envolvente e motivacional baseado no perfil do usuário.

REGRAS IMPORTANTES:
1. O título deve ter entre 10-50 caracteres, ser direto e motivacional
2. A descrição deve ter entre 50-200 caracteres, explicando claramente o objetivo
3. Escolha um tipo apropriado: fitness, saúde, produtividade, aprendizado, criatividade, social
4. Defina pontos de recompensa entre 50-500 baseado na dificuldade
5. Sugira prazo em dias (7, 14, 21 ou 30 dias)
6. Considere o nível e histórico do usuário para ajustar a dificuldade
7. Evite repetir desafios recentes do usuário`;

    const userPrompt = `Perfil do usuário alvo:
- Nome: ${targetProfile.name}
- Nível: ${targetProfile.level}
- Pontos totais: ${targetProfile.pontos}
- Desafios completados: ${targetProfile.total_challenges_completed}
- Desafios recentes: ${challengeHistory}

Gere um desafio personalizado e retorne APENAS um JSON válido com esta estrutura exata:
{
  "title": "título do desafio",
  "description": "descrição clara e motivacional",
  "challenge_type": "fitness|saúde|produtividade|aprendizado|criatividade|social",
  "reward_points": 100,
  "expires_days": 14
}`;

    console.log('Calling AgentRouter API...');

    const aiResponse = await fetch('https://agentrouter.org/v1/chat/completions', {
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
        temperature: 0.8,
        max_tokens: 300,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AgentRouter API error:', aiResponse.status, errorText);
      return new Response(JSON.stringify({ error: 'AI service temporarily unavailable' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResponse.json();
    console.log('AI Response received');

    const generatedText = aiData.choices?.[0]?.message?.content;
    if (!generatedText) {
      console.error('No content in AI response');
      return new Response(JSON.stringify({ error: 'No content generated' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse the generated challenge
    let challengeData;
    try {
      // Try to extract JSON from the response (in case AI adds extra text)
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : generatedText;
      challengeData = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError, generatedText);
      return new Response(JSON.stringify({ error: 'Invalid AI response format' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate generated data
    if (!challengeData.title || !challengeData.description || !challengeData.challenge_type) {
      console.error('Invalid challenge data:', challengeData);
      return new Response(JSON.stringify({ error: 'Incomplete challenge data' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Generated challenge successfully');

    return new Response(JSON.stringify({ 
      challenge: {
        title: challengeData.title,
        description: challengeData.description,
        challengeType: challengeData.challenge_type,
        rewardPoints: challengeData.reward_points || 100,
        expiresDays: challengeData.expires_days || 14
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-smart-challenge:', error);
    return new Response(JSON.stringify({ error: 'An error occurred while generating the challenge' }), {
      status: 500,
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  }
});