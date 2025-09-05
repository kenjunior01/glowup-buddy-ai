-- Fix security warnings by setting search_path in all functions

-- Fix accept_challenge function
CREATE OR REPLACE FUNCTION public.accept_challenge(challenge_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Fix complete_challenge function
CREATE OR REPLACE FUNCTION public.complete_challenge(
  challenge_id UUID,
  evidence_url TEXT DEFAULT NULL,
  evidence_description TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Fix create_user_challenge function
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
SET search_path = public
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