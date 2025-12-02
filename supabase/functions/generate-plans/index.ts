import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const plansSchema = z.object({
  userId: z.string().uuid().optional(), // Optional, will use authenticated user ID
  goals: z.array(z.object({
    goal_type: z.string(),
    goal_description: z.string(),
    target_date: z.string().optional(),
  })),
  profile: z.object({
    name: z.string().optional(),
    age: z.number().optional(),
  }).optional(),
});

serve(async (req) => {
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
    const validationResult = plansSchema.safeParse(body);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ error: 'Dados inválidos', details: validationResult.error.issues }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { userId: requestedUserId, goals, profile } = validationResult.data;

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

    // Prepare data for AI prompt
    const goalsText = goals.map((goal: any) => 
      `${goal.goal_type}: ${goal.goal_description}${goal.target_date ? ` (meta: ${goal.target_date})` : ''}`
    ).join('\n');

    const userProfile = `
Nome: ${profile?.name || 'Usuário'}
Idade: ${profile?.age || 'Não informado'}
`;

    // Generate plans using AI
    const plans = await generatePlansWithAI(agentRouterApiKey, userProfile, goalsText);

    // Save plans to database
    const planPromises = plans.map(async (plan: any) => {
      const endDate = new Date();
      if (plan.type === 'daily') {
        endDate.setDate(endDate.getDate() + 1);
      } else if (plan.type === 'weekly') {
        endDate.setDate(endDate.getDate() + 7);
      } else if (plan.type === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      }

      // Deactivate old plans of the same type
      await supabaseClient
        .from('plans')
        .update({ active: false })
        .eq('user_id', userId)
        .eq('plan_type', plan.type);

      // Insert new plan
      return supabaseClient
        .from('plans')
        .insert({
          user_id: userId,
          plan_type: plan.type,
          content: plan.content,
          title: `Plano ${plan.type === 'daily' ? 'Diário' : plan.type === 'weekly' ? 'Semanal' : 'Mensal'}`,
          start_date: new Date().toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          active: true
        });
    });

    await Promise.all(planPromises);

    return new Response(
      JSON.stringify({ success: true, message: 'Planos gerados com sucesso!' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-plans function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function generatePlansWithAI(apiKey: string, userProfile: string, goalsText: string) {
  const systemPrompt = `Você é um especialista em transformação pessoal e coaching de vida. Crie planos de Glow Up personalizados e motivadores.

INSTRUÇÕES:
- Gere 3 planos: diário, semanal e mensal
- Cada plano deve ter atividades práticas e alcançáveis
- As atividades devem ser específicas para os objetivos mencionados
- Use uma linguagem motivadora e positiva
- Considere a idade e perfil do usuário
- Responda APENAS com JSON válido no formato especificado`;

  const userPrompt = `Com base no perfil do usuário e seus objetivos, gere planos de transformação pessoal estruturados.

PERFIL DO USUÁRIO:
${userProfile}

OBJETIVOS:
${goalsText}

FORMATO DE RESPOSTA (JSON):
{
  "daily": ["atividade 1", "atividade 2", "atividade 3"],
  "weekly": ["atividade 1", "atividade 2", "atividade 3"],
  "monthly": ["atividade 1", "atividade 2", "atividade 3"]
}`;

  try {
    const response = await fetch('https://agentrouter.org/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AgentRouter AI error response:', errorText);
      
      if (response.status === 429) {
        throw new Error('Limite de requisições atingido. Tente novamente em alguns minutos.');
      } else if (response.status === 402) {
        throw new Error('Créditos insuficientes. Adicione créditos em Settings → Workspace → Usage.');
      } else {
        throw new Error(`AI Gateway error: ${response.statusText}`);
      }
    }

    const data = await response.json();
    console.log('AI response:', JSON.stringify(data, null, 2));
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Resposta inválida da API');
    }
    
    const aiResponse = data.choices[0].message.content;
    
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : aiResponse;
      const planContent = JSON.parse(jsonString);
      
      return [
        { type: 'daily', content: planContent.daily },
        { type: 'weekly', content: planContent.weekly },
        { type: 'monthly', content: planContent.monthly }
      ];
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      console.error('AI Response:', aiResponse);
      throw parseError;
    }
  } catch (error) {
    console.error('Error calling AI:', error);
    
    return [
      { 
        type: 'daily', 
        content: [
          "Beber 2 litros de água",
          "Fazer 30 minutos de exercício",
          "Praticar gratidão (3 coisas boas do dia)"
        ]
      },
      { 
        type: 'weekly', 
        content: [
          "Planejar refeições saudáveis da semana",
          "Fazer uma atividade que te dê prazer",
          "Revisar e ajustar seus objetivos"
        ]
      },
      { 
        type: 'monthly', 
        content: [
          "Avaliar progresso dos últimos 30 dias",
          "Definir uma nova meta desafiadora",
          "Celebrar suas conquistas do mês"
        ]
      }
    ];
  }
}
