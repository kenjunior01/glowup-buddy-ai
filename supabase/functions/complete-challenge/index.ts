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

    const { challengeId } = await req.json();

    const { data: challenge, error: challengeError } = await supabaseClient
      .from('challenges')
      .update({ status: 'completed' })
      .eq('id', challengeId)
      .eq('challenger_id', user.id)
      .select()
      .single();

    if (challengeError) throw challengeError;

    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('pontos, experience_points, total_challenges_completed')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;

    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({
        pontos: (profile.pontos || 0) + (challenge.reward_points || 0),
        experience_points: (profile.experience_points || 0) + (challenge.reward_points || 0),
        total_challenges_completed: (profile.total_challenges_completed || 0) + 1,
      })
      .eq('id', user.id);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ data: challenge }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error completing challenge:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
