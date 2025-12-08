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
  userId: z.string().uuid().optional(),
  goals: z.array(z.object({
    goal_type: z.string(),
    goal_description: z.string(),
    target_date: z.string().optional().nullable(),
  })),
  profile: z.object({
    name: z.string().optional().nullable(),
    age: z.number().optional().nullable(),
    ocupacao: z.string().optional().nullable(),
    rotina: z.string().optional().nullable(),
    mentalidade: z.string().optional().nullable(),
  }).optional().nullable(),
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
        JSON.stringify({ error: 'Não autorizado. Faça login novamente.' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // 2. VALIDAÇÃO DE INPUT
    const body = await req.json();
    console.log('Received body:', JSON.stringify(body, null, 2));
    
    const validationResult = plansSchema.safeParse(body);
    
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error.issues);
      return new Response(
        JSON.stringify({ error: 'Dados inválidos', details: validationResult.error.issues }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { userId: requestedUserId, goals, profile } = validationResult.data;

    // 3. VALIDAÇÃO DE AUTORIZAÇÃO
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

    // 4. CHECK FOR LOVABLE API KEY
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API de IA não configurada. Contate o suporte.' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Prepare data for AI prompt
    const goalsText = goals.map((goal: any) => 
      `- ${goal.goal_type}: ${goal.goal_description}${goal.target_date ? ` (meta: ${goal.target_date})` : ''}`
    ).join('\n');

    const userProfile = `
Nome: ${profile?.name || 'Usuário'}
Idade: ${profile?.age || 'Não informado'}
Ocupação: ${profile?.ocupacao || 'Não informado'}
Rotina: ${profile?.rotina || 'Não informado'}
Mentalidade: ${profile?.mentalidade || 'Não informado'}
`;

    console.log('Generating plans for user:', userId);
    console.log('Goals:', goalsText);

    // Generate plans using Lovable AI
    const plans = await generatePlansWithAI(lovableApiKey, userProfile, goalsText);

    console.log('Generated plans:', JSON.stringify(plans, null, 2));

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
      const { error: insertError } = await supabaseClient
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

      if (insertError) {
        console.error('Error inserting plan:', insertError);
        throw insertError;
      }
    });

    await Promise.all(planPromises);

    console.log('Plans saved successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'Planos gerados com sucesso!' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-plans function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro ao gerar planos. Tente novamente.' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function generatePlansWithAI(apiKey: string, userProfile: string, goalsText: string) {
  const systemPrompt = `Você é um especialista em transformação pessoal e coaching de vida chamado GlowUp Coach. Sua missão é criar planos de Glow Up personalizados, práticos e motivadores.

INSTRUÇÕES IMPORTANTES:
- Gere 3 planos: diário, semanal e mensal
- Cada plano deve ter entre 3 a 5 atividades práticas e alcançáveis
- As atividades devem ser ESPECÍFICAS para os objetivos do usuário
- Use linguagem motivadora, positiva e empática
- Considere o perfil, idade, ocupação e rotina do usuário
- Atividades devem ser realistas e mensuráveis

FORMATO DE RESPOSTA - Responda APENAS com JSON válido:
{
  "daily": ["atividade 1", "atividade 2", "atividade 3"],
  "weekly": ["atividade 1", "atividade 2", "atividade 3"],
  "monthly": ["atividade 1", "atividade 2", "atividade 3"]
}`;

  const userPrompt = `Crie planos de transformação pessoal personalizados para este usuário:

PERFIL DO USUÁRIO:
${userProfile}

OBJETIVOS DO USUÁRIO:
${goalsText}

Gere um plano diário (para fazer todo dia), um plano semanal (tarefas da semana) e um plano mensal (metas do mês). Responda APENAS com o JSON.`;

  try {
    console.log('Calling Lovable AI Gateway...');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error response:', response.status, errorText);
      
      if (response.status === 429) {
        throw new Error('Limite de requisições atingido. Tente novamente em alguns minutos.');
      } else if (response.status === 402) {
        throw new Error('Créditos de IA insuficientes. Adicione créditos no workspace Lovable.');
      } else {
        throw new Error(`Erro na API de IA: ${response.status}`);
      }
    }

    const data = await response.json();
    console.log('AI response received:', JSON.stringify(data, null, 2));
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid AI response structure:', data);
      throw new Error('Resposta inválida da IA');
    }
    
    const aiResponse = data.choices[0].message.content;
    console.log('AI content:', aiResponse);
    
    // Parse JSON from response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in response:', aiResponse);
      throw new Error('Formato de resposta inválido');
    }
    
    const jsonString = jsonMatch[0];
    const planContent = JSON.parse(jsonString);
    
    // Validate structure
    if (!planContent.daily || !planContent.weekly || !planContent.monthly) {
      console.error('Missing plan types in response:', planContent);
      throw new Error('Estrutura de planos incompleta');
    }
    
    return [
      { type: 'daily', content: planContent.daily },
      { type: 'weekly', content: planContent.weekly },
      { type: 'monthly', content: planContent.monthly }
    ];
    
  } catch (error) {
    console.error('Error calling AI, using fallback plans:', error);
    
    // Return default plans as fallback
    return [
      { 
        type: 'daily', 
        content: [
          "🌅 Acordar e fazer 5 minutos de alongamento",
          "💧 Beber 2 litros de água ao longo do dia",
          "📝 Revisar seus objetivos por 5 minutos",
          "🧘 Praticar 10 minutos de respiração consciente antes de dormir"
        ]
      },
      { 
        type: 'weekly', 
        content: [
          "🏃 Fazer 3 sessões de exercício físico de 30 minutos",
          "📚 Dedicar 2 horas para desenvolvimento pessoal",
          "👥 Conectar com um amigo ou familiar",
          "🎯 Revisar progresso e ajustar metas"
        ]
      },
      { 
        type: 'monthly', 
        content: [
          "📊 Avaliar progresso dos últimos 30 dias",
          "🎯 Definir uma meta desafiadora para o próximo mês",
          "🎉 Celebrar suas conquistas do mês",
          "💡 Aprender uma nova habilidade relacionada aos seus objetivos"
        ]
      }
    ];
  }
}
