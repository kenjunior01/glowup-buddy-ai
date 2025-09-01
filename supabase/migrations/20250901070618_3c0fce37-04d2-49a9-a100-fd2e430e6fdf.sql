-- Ensure all tables have proper constraints and indexes
-- This migration will only add missing elements

-- Add indexes for better performance (only if they don't exist)
DO $$ 
BEGIN 
  -- Index for goals by user_id
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_goals_user_id') THEN
    CREATE INDEX idx_goals_user_id ON public.goals(user_id);
  END IF;
  
  -- Index for plans by user_id
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_plans_user_id') THEN
    CREATE INDEX idx_plans_user_id ON public.plans(user_id);
  END IF;
  
  -- Index for progress by user_id
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_progress_user_id') THEN
    CREATE INDEX idx_progress_user_id ON public.progress(user_id);
  END IF;
  
  -- Index for progress by plan_id
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_progress_plan_id') THEN
    CREATE INDEX idx_progress_plan_id ON public.progress(plan_id);
  END IF;
END $$;