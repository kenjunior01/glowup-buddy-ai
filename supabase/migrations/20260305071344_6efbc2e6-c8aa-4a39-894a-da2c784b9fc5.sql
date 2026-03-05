
-- Daily Quests table
CREATE TABLE public.daily_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  quest_text TEXT NOT NULL,
  quest_type TEXT NOT NULL DEFAULT 'custom',
  pillar TEXT,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  quest_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_quests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quests" ON public.daily_quests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own quests" ON public.daily_quests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own quests" ON public.daily_quests FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own quests" ON public.daily_quests FOR DELETE USING (auth.uid() = user_id);

-- Transformation Scores table
CREATE TABLE public.transformation_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  score INTEGER NOT NULL DEFAULT 0,
  previous_score INTEGER NOT NULL DEFAULT 0,
  quests_completed_total INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.transformation_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own score" ON public.transformation_scores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own score" ON public.transformation_scores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own score" ON public.transformation_scores FOR UPDATE USING (auth.uid() = user_id);
