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
    const { userId, goals, profile } = await req.json();

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get DeepSeek API key from environment
    const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');
    if (!deepseekApiKey) {
      throw new Error('DeepSeek API key not configured');
    }

    // Prepare data for AI prompt
    const goalsText = goals.map((goal: any) => 
      `${goal.goal_type}: ${goal.goal_description}${goal.target_date ? ` (meta: ${goal.target_date})` : ''}`
    ).join('\n');

    const userProfile = `
Nome: ${profile?.name || 'Usuário'}
Idade: ${profile?.age || 'Não informado'}
`;

    // Generate plans using DeepSeek AI
    const plans = await generatePlansWithAI(deepseekApiKey, userProfile, goalsText);

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
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('plan_type', plan.type);

      // Insert new plan
      return supabaseClient
        .from('plans')
        .insert({
          user_id: userId,
          plan_type: plan.type,
          content: plan.content,
          start_date: new Date().toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          is_active: true
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
  const prompt = `
Com base no perfil do usuário e seus objetivos, gere planos de transformação pessoal (Glow Up) estruturados em JSON.

PERFIL DO USUÁRIO:
${userProfile}

OBJETIVOS:
${goalsText}

INSTRUÇÕES:
- Gere 3 planos: diário, semanal e mensal
- Cada plano deve ter atividades práticas e alcançáveis
- As atividades devem ser específicas para os objetivos mencionados
- Use uma linguagem motivadora e positiva
- Considere a idade e perfil do usuário

FORMATO DE RESPOSTA (JSON):
{
  "daily": ["atividade 1", "atividade 2", "atividade 3"],
  "weekly": ["atividade 1", "atividade 2", "atividade 3"],
  "monthly": ["atividade 1", "atividade 2", "atividade 3"]
}

Responda APENAS com o JSON, sem comentários adicionais.
`;

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'Você é um especialista em transformação pessoal e coaching de vida. Crie planos de Glow Up personalizados e motivadores.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    }),
  });

  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.statusText}`);
  }

  const data = await response.json();
  const aiResponse = data.choices[0].message.content;
  
  try {
    const planContent = JSON.parse(aiResponse);
    
    return [
      { type: 'daily', content: planContent.daily },
      { type: 'weekly', content: planContent.weekly },
      { type: 'monthly', content: planContent.monthly }
    ];
  } catch (parseError) {
    // Fallback if AI doesn't return valid JSON
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
