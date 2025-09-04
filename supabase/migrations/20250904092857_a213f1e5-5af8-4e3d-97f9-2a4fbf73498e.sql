-- Update profiles table RLS policies to allow users to see each other
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Users can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);

-- Update challenges table structure and policies
ALTER TABLE public.challenges 
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS evidence_url TEXT,
ADD COLUMN IF NOT EXISTS evidence_description TEXT;

-- Update challenge policies to allow users to see challenges they're involved in
DROP POLICY IF EXISTS "Users can view their challenges" ON public.challenges;

CREATE POLICY "Users can view relevant challenges" 
ON public.challenges 
FOR SELECT 
TO authenticated
USING ((auth.uid() = creator_id) OR (auth.uid() = challenger_id));

-- Allow users to update challenges they're involved in
CREATE POLICY "Users can update challenges they're involved in" 
ON public.challenges 
FOR UPDATE 
TO authenticated
USING ((auth.uid() = creator_id) OR (auth.uid() = challenger_id));

-- Create notifications for challenge interactions
INSERT INTO public.notifications (user_id, title, message, type, action_url)
SELECT 
  challenger_id,
  'Novo Desafio!',
  'Você recebeu um desafio de ' || (SELECT name FROM profiles WHERE id = creator_id),
  'challenge',
  '/challenges'
FROM public.challenges 
WHERE status = 'pending' 
AND challenger_id != creator_id
ON CONFLICT DO NOTHING;

-- Function to accept challenge
CREATE OR REPLACE FUNCTION public.accept_challenge(challenge_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  challenge_record RECORD;
BEGIN
  -- Get challenge details
  SELECT * INTO challenge_record 
  FROM public.challenges 
  WHERE id = challenge_id 
  AND challenger_id = auth.uid()
  AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Accept challenge
  UPDATE public.challenges 
  SET 
    status = 'active',
    accepted_at = NOW(),
    updated_at = NOW()
  WHERE id = challenge_id;
  
  -- Notify creator
  INSERT INTO public.notifications (user_id, title, message, type, action_url)
  VALUES (
    challenge_record.creator_id,
    'Desafio Aceito!',
    (SELECT name FROM profiles WHERE id = auth.uid()) || ' aceitou seu desafio!',
    'challenge',
    '/challenges'
  );
  
  RETURN TRUE;
END;
$$;

-- Function to complete challenge
CREATE OR REPLACE FUNCTION public.complete_challenge(
  challenge_id UUID,
  evidence_url TEXT DEFAULT NULL,
  evidence_description TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  challenge_record RECORD;
  points_awarded INTEGER;
BEGIN
  -- Get challenge details
  SELECT * INTO challenge_record 
  FROM public.challenges 
  WHERE id = challenge_id 
  AND challenger_id = auth.uid()
  AND status = 'active';
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Complete challenge
  UPDATE public.challenges 
  SET 
    status = 'completed',
    completed_at = NOW(),
    evidence_url = complete_challenge.evidence_url,
    evidence_description = complete_challenge.evidence_description,
    updated_at = NOW()
  WHERE id = challenge_id;
  
  -- Award points to challenger
  points_awarded := challenge_record.reward_points;
  
  UPDATE public.profiles 
  SET 
    pontos = COALESCE(pontos, 0) + points_awarded,
    experience_points = COALESCE(experience_points, 0) + points_awarded,
    total_challenges_completed = COALESCE(total_challenges_completed, 0) + 1
  WHERE id = auth.uid();
  
  -- Award bonus points to creator for successful challenge
  UPDATE public.profiles 
  SET 
    pontos = COALESCE(pontos, 0) + (points_awarded / 2),
    experience_points = COALESCE(experience_points, 0) + (points_awarded / 2)
  WHERE id = challenge_record.creator_id;
  
  -- Notify creator
  INSERT INTO public.notifications (user_id, title, message, type, action_url)
  VALUES (
    challenge_record.creator_id,
    'Desafio Concluído!',
    (SELECT name FROM profiles WHERE id = auth.uid()) || ' completou seu desafio e ganhou ' || points_awarded || ' pontos!',
    'challenge',
    '/challenges'
  );
  
  -- Level up check for challenger
  UPDATE public.profiles 
  SET level = GREATEST(1, (COALESCE(experience_points, 0) / 100) + 1)
  WHERE id = auth.uid();
  
  -- Level up check for creator
  UPDATE public.profiles 
  SET level = GREATEST(1, (COALESCE(experience_points, 0) / 100) + 1)
  WHERE id = challenge_record.creator_id;
  
  RETURN TRUE;
END;
$$;

-- Function to create challenge between users
CREATE OR REPLACE FUNCTION public.create_user_challenge(
  challenger_user_id UUID,
  challenge_title TEXT,
  challenge_description TEXT,
  challenge_type TEXT DEFAULT 'daily',
  reward_points INTEGER DEFAULT 100,
  expires_days INTEGER DEFAULT 7
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_challenge_id UUID;
BEGIN
  -- Create challenge
  INSERT INTO public.challenges (
    creator_id,
    challenger_id,
    title,
    description,
    challenge_type,
    reward_points,
    expires_at
  )
  VALUES (
    auth.uid(),
    challenger_user_id,
    challenge_title,
    challenge_description,
    challenge_type,
    reward_points,
    NOW() + (expires_days || ' days')::interval
  )
  RETURNING id INTO new_challenge_id;
  
  -- Notify challenged user
  INSERT INTO public.notifications (user_id, title, message, type, action_url)
  VALUES (
    challenger_user_id,
    'Novo Desafio!',
    (SELECT name FROM profiles WHERE id = auth.uid()) || ' te desafiou: ' || challenge_title,
    'challenge',
    '/challenges'
  );
  
  RETURN new_challenge_id;
END;
$$;

-- Update friendships policies to allow viewing friendships for social features
CREATE POLICY "Users can view public friendships" 
ON public.friendships 
FOR SELECT 
TO authenticated
USING (status = 'accepted');