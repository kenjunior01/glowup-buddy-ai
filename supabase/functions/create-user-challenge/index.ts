import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const challengeSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Title must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  target_user_id: z.string().uuid('Invalid target user ID'),
  reward_points: z.number().min(10, 'Minimum reward is 10 points').max(1000, 'Maximum reward is 1000 points').optional().default(100),
  expires_at: z.string().datetime().optional(),
  challenge_type: z.enum(['fitness', 'saúde', 'produtividade', 'aprendizado', 'criatividade', 'social', 'custom']).optional().default('custom'),
});

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

    const body = await req.json();
    const { challengeData } = body;

    // Validate input with Zod
    const validationResult = challengeSchema.safeParse(challengeData);
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

    const validatedData = validationResult.data;

    const { data, error } = await supabaseClient
      .from('challenges')
      .insert({
        title: validatedData.title,
        description: validatedData.description,
        target_user_id: validatedData.target_user_id,
        reward_points: validatedData.reward_points,
        expires_at: validatedData.expires_at,
        challenge_type: validatedData.challenge_type,
        creator_id: user.id,
        challenger_id: validatedData.target_user_id,
      })
      .select()
      .single();

    if (error) throw error;

    console.log('Challenge created successfully:', data.id);

    return new Response(JSON.stringify({ data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating challenge:', error);
    return new Response(JSON.stringify({ error: 'An error occurred while creating the challenge' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
