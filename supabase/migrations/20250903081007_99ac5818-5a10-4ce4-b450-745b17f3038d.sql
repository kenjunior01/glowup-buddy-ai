-- Create comprehensive social and gamification system

-- First, create the messages table for user-to-user chat
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE NULL
);

-- Enable RLS for messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policies for messages
CREATE POLICY "Users can view their own messages" 
ON public.messages 
FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" 
ON public.messages 
FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can mark their messages as read" 
ON public.messages 
FOR UPDATE 
USING (auth.uid() = receiver_id);

-- Create friendships table
CREATE TABLE public.friendships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  friend_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

-- Enable RLS for friendships
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Create policies for friendships
CREATE POLICY "Users can view their friendships" 
ON public.friendships 
FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friend requests" 
ON public.friendships 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update friendship status" 
ON public.friendships 
FOR UPDATE 
USING (auth.uid() = friend_id OR auth.uid() = user_id);

-- Create challenges table for social gamification
CREATE TABLE public.challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL,
  challenger_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  challenge_type TEXT NOT NULL DEFAULT 'daily' CHECK (challenge_type IN ('daily', 'weekly', 'custom')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'completed', 'expired')),
  reward_points INTEGER NOT NULL DEFAULT 50,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE NULL
);

-- Enable RLS for challenges
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

-- Create policies for challenges
CREATE POLICY "Users can view their challenges" 
ON public.challenges 
FOR SELECT 
USING (auth.uid() = creator_id OR auth.uid() = challenger_id);

CREATE POLICY "Users can create challenges" 
ON public.challenges 
FOR INSERT 
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their challenges" 
ON public.challenges 
FOR UPDATE 
USING (auth.uid() = creator_id OR auth.uid() = challenger_id);

-- Create notifications table for engagement
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('achievement', 'challenge', 'friend_request', 'level_up', 'streak', 'reminder')),
  read BOOLEAN NOT NULL DEFAULT false,
  action_url TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "Users can view their notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create streaks table for addiction mechanics
CREATE TABLE public.streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for streaks
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;

-- Create policies for streaks
CREATE POLICY "Users can view their own streaks" 
ON public.streaks 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their streak record" 
ON public.streaks 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their streaks" 
ON public.streaks 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create user_roles table for admin system
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS for user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_roles
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Update profiles table with new addiction-focused fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS experience_points INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS login_streak INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_challenges_completed INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT NULL;

-- Create function to update streaks and award points
CREATE OR REPLACE FUNCTION public.update_user_streak(user_uuid UUID)
RETURNS VOID AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;