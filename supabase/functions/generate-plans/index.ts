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

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 1000;

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string, 
  options: RequestInit, 
  retries = MAX_RETRIES
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      // Don't retry on client errors (except rate limiting)
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        return response;
      }
      
      // Retry on rate limiting with exponential backoff
      if (response.status === 429) {
        if (attempt < retries) {
          const delay = INITIAL_DELAY_MS * Math.pow(2, attempt);
          console.log(`Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${retries})`);
          await sleep(delay);
          continue;
        }
      }
      
      // Retry on server errors
      if (response.status >= 500 && attempt < retries) {
        const delay = INITIAL_DELAY_MS * Math.pow(2, attempt);
        console.log(`Server error ${response.status}, retrying in ${delay}ms (attempt ${attempt + 1}/${retries})`);
        await sleep(delay);
        continue;
      }
      
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < retries) {
        const delay = INITIAL_DELAY_MS * Math.pow(2, attempt);
        console.log(`Network error, retrying in ${delay}ms (attempt ${attempt + 1}/${retries}):`, error);
        await sleep(delay);
      }
    }
  }
  
  throw lastError || new Error("Failed after all retries");
}

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
        JSON.stringify({ 
          error: 'Não autorizado. Faça login novamente.',
          code: 'AUTH_ERROR'
        }),
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
        JSON.stringify({ 
          error: 'Dados inválidos. Verifique seus objetivos e tente novamente.',
          code: 'VALIDATION_ERROR',
          details: validationResult.error.issues 
        }),
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
        JSON.stringify({ 
          error: 'Acesso negado',
          code: 'FORBIDDEN'
        }),
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
        JSON.stringify({ 
          error: 'Serviço de IA temporariamente indisponível. Tente novamente em alguns minutos.',
          code: 'AI_NOT_CONFIGURED'
        }),
        { 
          status: 503,
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

    // Generate plans using Lovable AI with retry logic
    const plans = await generatePlansWithAI(lovableApiKey, userProfile, goalsText);

    console.log('Generated plans:', JSON.stringify(plans, null, 2));

    // Save plans to database
    console.log('Saving plans to database...');
    
    for (const plan of plans) {
      const endDate = new Date();
      if (plan.type === 'daily') {
        endDate.setDate(endDate.getDate() + 1);
      } else if (plan.type === 'weekly') {
        endDate.setDate(endDate.getDate() + 7);
      } else if (plan.type === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      }

      // Deactivate old plans of the same type
      const { error: updateError } = await supabaseClient
        .from('plans')
        .update({ active: false })
        .eq('user_id', userId)
        .eq('plan_type', plan.type)
        .eq('active', true);

      if (updateError) {
        console.error('Error deactivating old plans:', updateError);
      }

      // Ensure content is properly formatted as JSON
      const contentToSave = Array.isArray(plan.content) ? plan.content : [plan.content];
      
      // Insert new plan
      const { data: insertedPlan, error: insertError } = await supabaseClient
        .from('plans')
        .insert({
          user_id: userId,
          plan_type: plan.type,
          content: JSON.stringify(contentToSave),
          title: `Plano ${plan.type === 'daily' ? 'Diário' : plan.type === 'weekly' ? 'Semanal' : 'Mensal'}`,
          start_date: new Date().toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          active: true,
          completed: false
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting plan:', insertError);
        throw new Error(`Erro ao salvar plano ${plan.type}: ${insertError.message}`);
      }
      
      console.log('Inserted plan:', insertedPlan?.id);
    }

    console.log('Plans saved successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Planos gerados com sucesso!',
        plans_count: plans.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-plans function:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    const isRetryable = errorMessage.includes('rate') || errorMessage.includes('timeout') || errorMessage.includes('network');
    
    return new Response(
      JSON.stringify({ 
        error: isRetryable 
          ? 'Serviço temporariamente ocupado. Tente novamente em alguns segundos.'
          : 'Erro ao gerar planos. Verifique seus objetivos e tente novamente.',
        code: 'GENERATION_ERROR',
        retryable: isRetryable
      }),
      { 
        status: isRetryable ? 503 : 500,
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
- Inclua emojis para tornar mais visual`;

  const userPrompt = `Crie planos de transformação pessoal personalizados para este usuário:

PERFIL DO USUÁRIO:
${userProfile}

OBJETIVOS DO USUÁRIO:
${goalsText}

Gere um plano diário (para fazer todo dia), um plano semanal (tarefas da semana) e um plano mensal (metas do mês).`;

  try {
    console.log('Calling Lovable AI Gateway with retry logic...');
    
    const response = await fetchWithRetry('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
        tools: [
          {
            type: "function",
            function: {
              name: "create_plans",
              description: "Cria planos de transformação pessoal",
              parameters: {
                type: "object",
                properties: {
                  daily: {
                    type: "array",
                    items: { type: "string" },
                    description: "Lista de atividades diárias"
                  },
                  weekly: {
                    type: "array",
                    items: { type: "string" },
                    description: "Lista de atividades semanais"
                  },
                  monthly: {
                    type: "array",
                    items: { type: "string" },
                    description: "Lista de metas mensais"
                  }
                },
                required: ["daily", "weekly", "monthly"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "create_plans" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error response:', response.status, errorText);
      
      if (response.status === 429) {
        throw new Error('Limite de requisições atingido. Aguarde alguns minutos e tente novamente.');
      } else if (response.status === 402) {
        throw new Error('Créditos de IA insuficientes. Adicione créditos no workspace Lovable.');
      } else {
        throw new Error(`Erro na API de IA: ${response.status}`);
      }
    }

    const data = await response.json();
    console.log('AI response received');
    
    // Extract from tool call
    let planContent = null;
    
    if (data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments) {
      try {
        planContent = JSON.parse(data.choices[0].message.tool_calls[0].function.arguments);
      } catch (e) {
        console.error('Error parsing tool call arguments:', e);
      }
    }
    
    // Fallback to content parsing if tool call didn't work
    if (!planContent && data.choices?.[0]?.message?.content) {
      const aiResponse = data.choices[0].message.content;
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          planContent = JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.error('Error parsing content JSON:', e);
        }
      }
    }
    
    // Validate structure
    if (planContent?.daily && planContent?.weekly && planContent?.monthly) {
      return [
        { type: 'daily', content: planContent.daily },
        { type: 'weekly', content: planContent.weekly },
        { type: 'monthly', content: planContent.monthly }
      ];
    }
    
    console.error('Invalid plan structure, using fallback');
    throw new Error('Estrutura de planos incompleta');
    
  } catch (error) {
    console.error('Error calling AI, using fallback plans:', error);
    
    // Return enhanced default plans as fallback
    return [
      { 
        type: 'daily', 
        content: [
          "🌅 Acordar e fazer 5 minutos de alongamento para começar o dia",
          "💧 Beber pelo menos 2 litros de água ao longo do dia",
          "📝 Revisar seus objetivos por 5 minutos pela manhã",
          "🚶 Caminhar por 15 minutos durante o dia",
          "🧘 Praticar 10 minutos de respiração consciente antes de dormir"
        ]
      },
      { 
        type: 'weekly', 
        content: [
          "🏃 Fazer 3 sessões de exercício físico de 30 minutos",
          "📚 Dedicar 2 horas para desenvolvimento pessoal ou leitura",
          "👥 Conectar com um amigo ou familiar importante",
          "🎯 Revisar seu progresso semanal e ajustar metas",
          "🧹 Organizar seu espaço de trabalho ou casa"
        ]
      },
      { 
        type: 'monthly', 
        content: [
          "📊 Avaliar seu progresso dos últimos 30 dias",
          "🎯 Definir uma meta desafiadora para o próximo mês",
          "🎉 Celebrar suas conquistas, por menores que sejam",
          "💡 Aprender uma nova habilidade relacionada aos seus objetivos",
          "🔄 Ajustar sua rotina baseado no que funcionou e o que não funcionou"
        ]
      }
    ];
  }
}