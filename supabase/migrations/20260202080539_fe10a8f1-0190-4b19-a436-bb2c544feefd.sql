-- Add freeze tokens to streaks table for streak protection
ALTER TABLE public.streaks 
ADD COLUMN IF NOT EXISTS freeze_tokens integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS freeze_tokens_used integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_freeze_date date;

-- Add buddy challenge columns to challenges table
ALTER TABLE public.challenges
ADD COLUMN IF NOT EXISTS is_buddy_challenge boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS buddy_id uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS buddy_accepted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS buddy_completed boolean DEFAULT false;

-- Create mood_logs table for mood-based planning
CREATE TABLE IF NOT EXISTS public.mood_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  mood_score integer NOT NULL CHECK (mood_score >= 1 AND mood_score <= 5),
  mood_label text NOT NULL,
  energy_level integer CHECK (energy_level >= 1 AND energy_level <= 5),
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  date date DEFAULT CURRENT_DATE
);

-- Enable RLS on mood_logs
ALTER TABLE public.mood_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for mood_logs
CREATE POLICY "Users can view own mood logs"
  ON public.mood_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own mood logs"
  ON public.mood_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mood logs"
  ON public.mood_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own mood logs"
  ON public.mood_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Create weekly_summaries table for Sunday Reset
CREATE TABLE IF NOT EXISTS public.weekly_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  week_start date NOT NULL,
  week_end date NOT NULL,
  tasks_completed integer DEFAULT 0,
  challenges_completed integer DEFAULT 0,
  points_earned integer DEFAULT 0,
  streak_days integer DEFAULT 0,
  mood_average numeric(3,2),
  ai_insights text,
  highlights jsonb DEFAULT '[]'::jsonb,
  next_week_goals jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on weekly_summaries
ALTER TABLE public.weekly_summaries ENABLE ROW LEVEL SECURITY;

-- RLS policies for weekly_summaries
CREATE POLICY "Users can view own weekly summaries"
  ON public.weekly_summaries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own weekly summaries"
  ON public.weekly_summaries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weekly summaries"
  ON public.weekly_summaries FOR UPDATE
  USING (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_mood_logs_user_date ON public.mood_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_weekly_summaries_user_week ON public.weekly_summaries(user_id, week_start);