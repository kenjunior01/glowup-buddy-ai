-- Recreate function with proper search_path (without dropping)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public;

-- Add missing columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_challenges_completed INTEGER DEFAULT 0;

-- Add missing columns to challenges
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS challenger_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS reward_points INTEGER DEFAULT 0;

-- Add missing columns to messages
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;

-- Add missing columns to goals
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS goal_type TEXT DEFAULT 'custom';

-- Add missing columns to plans
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS plan_type TEXT;
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT FALSE;

-- Add missing columns to progress
ALTER TABLE public.progress ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES public.plans(id) ON DELETE CASCADE;
ALTER TABLE public.progress ADD COLUMN IF NOT EXISTS progress_notes TEXT;
ALTER TABLE public.progress ADD COLUMN IF NOT EXISTS completion_rate INTEGER DEFAULT 0;
ALTER TABLE public.progress ADD COLUMN IF NOT EXISTS completed_tasks INTEGER DEFAULT 0;