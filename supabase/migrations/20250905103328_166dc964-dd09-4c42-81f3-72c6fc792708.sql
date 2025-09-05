-- Fix remaining functions with missing search_path

-- Fix update_user_streak function
CREATE OR REPLACE FUNCTION public.update_user_streak(user_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_date_val DATE := CURRENT_DATE;
  user_streak_record RECORD;
  points_to_award INTEGER := 10;
BEGIN
  -- Get or create streak record
  SELECT * INTO user_streak_record 
  FROM public.streaks 
  WHERE user_id = user_uuid;
  
  IF NOT FOUND THEN
    INSERT INTO public.streaks (user_id, current_streak, longest_streak, last_activity_date)
    VALUES (user_uuid, 1, 1, current_date_val);
    points_to_award := 10;
  ELSE
    IF user_streak_record.last_activity_date = current_date_val THEN
      -- Already checked in today
      RETURN;
    ELSIF user_streak_record.last_activity_date = current_date_val - 1 THEN
      -- Consecutive day
      UPDATE public.streaks 
      SET 
        current_streak = current_streak + 1,
        longest_streak = GREATEST(longest_streak, current_streak + 1),
        last_activity_date = current_date_val,
        updated_at = now()
      WHERE user_id = user_uuid;
      
      points_to_award := 10 + (user_streak_record.current_streak * 2); -- Escalating rewards
    ELSE
      -- Streak broken
      UPDATE public.streaks 
      SET 
        current_streak = 1,
        last_activity_date = current_date_val,
        updated_at = now()
      WHERE user_id = user_uuid;
      points_to_award := 10;
    END IF;
  END IF;
  
  -- Award points to user
  UPDATE public.profiles 
  SET 
    pontos = COALESCE(pontos, 0) + points_to_award,
    experience_points = COALESCE(experience_points, 0) + points_to_award,
    last_login = now()
  WHERE id = user_uuid;
  
  -- Level up check (every 100 XP = 1 level)
  UPDATE public.profiles 
  SET level = GREATEST(1, (COALESCE(experience_points, 0) / 100) + 1)
  WHERE id = user_uuid;
  
END;
$$;

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email));
  RETURN NEW;
END;
$$;