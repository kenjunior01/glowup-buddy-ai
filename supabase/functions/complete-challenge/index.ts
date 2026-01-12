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

const completeChallengeSchema = z.object({
  challengeId: z.string().uuid('Invalid challenge ID'),
  completionNotes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
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
    const validationResult = completeChallengeSchema.safeParse(body);
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

    const { challengeId } = validationResult.data;

    // Update challenge status
    const { data: challenge, error: challengeError } = await supabaseClient
      .from('challenges')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', challengeId)
      .eq('challenger_id', user.id)
      .select()
      .single();

    if (challengeError) throw challengeError;

    // Fetch user profile to update points
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('pontos, experience_points, total_challenges_completed')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
    } else {
      // Update user profile with rewards
      const rewardPoints = challenge.reward_points || 100;
      const experienceGain = Math.round(rewardPoints * 0.5);

      await supabaseClient
        .from('profiles')
        .update({
          pontos: (profile.pontos || 0) + rewardPoints,
          experience_points: (profile.experience_points || 0) + experienceGain,
          total_challenges_completed: (profile.total_challenges_completed || 0) + 1
        })
        .eq('id', user.id);

      console.log(`User ${user.id} rewarded: ${rewardPoints} points, ${experienceGain} XP`);
    }

    console.log('Challenge completed:', challengeId);

    return new Response(JSON.stringify({ data: challenge }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error completing challenge:', error);
    return new Response(JSON.stringify({ error: 'An error occurred while completing the challenge' }), {
      status: 500,
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  }
});