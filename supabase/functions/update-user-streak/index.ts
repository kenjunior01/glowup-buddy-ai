import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const updateStreakSchema = z.object({
  activityType: z.enum(['check_in', 'mission_complete', 'challenge_complete', 'goal_progress']).optional(),
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

    const body = await req.json().catch(() => ({}));

    // Validate input with Zod (optional body)
    const validationResult = updateStreakSchema.safeParse(body);
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

    const today = new Date().toISOString().split('T')[0];

    // Fetch current streak
    const { data: streak, error: fetchError } = await supabaseClient
      .from('streaks')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching streak:', fetchError);
      throw fetchError;
    }

    let newStreak;

    if (!streak) {
      // Create new streak
      const { data: created, error: createError } = await supabaseClient
        .from('streaks')
        .insert({
          user_id: user.id,
          current_streak: 1,
          longest_streak: 1,
          last_activity_date: today
        })
        .select()
        .single();

      if (createError) throw createError;
      newStreak = created;
      console.log('Created new streak for user:', user.id);
    } else {
      const lastActivity = streak.last_activity_date;
      const lastDate = new Date(lastActivity);
      const todayDate = new Date(today);
      const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

      let currentStreak = streak.current_streak || 0;
      let longestStreak = streak.longest_streak || 0;

      if (diffDays === 0) {
        // Already updated today, no change
        newStreak = streak;
      } else if (diffDays === 1) {
        // Consecutive day - increment streak
        currentStreak += 1;
        longestStreak = Math.max(longestStreak, currentStreak);

        const { data: updated, error: updateError } = await supabaseClient
          .from('streaks')
          .update({
            current_streak: currentStreak,
            longest_streak: longestStreak,
            last_activity_date: today
          })
          .eq('id', streak.id)
          .select()
          .single();

        if (updateError) throw updateError;
        newStreak = updated;
        console.log('Streak incremented for user:', user.id, 'New streak:', currentStreak);
      } else {
        // Streak broken - reset to 1
        const { data: updated, error: updateError } = await supabaseClient
          .from('streaks')
          .update({
            current_streak: 1,
            last_activity_date: today
          })
          .eq('id', streak.id)
          .select()
          .single();

        if (updateError) throw updateError;
        newStreak = updated;
        console.log('Streak reset for user:', user.id);
      }
    }

    return new Response(JSON.stringify({ 
      streak: newStreak,
      message: newStreak.current_streak > 1 
        ? `🔥 ${newStreak.current_streak} dias consecutivos!` 
        : 'Sequência iniciada!'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating streak:', error);
    return new Response(JSON.stringify({ error: 'An error occurred while updating streak' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
