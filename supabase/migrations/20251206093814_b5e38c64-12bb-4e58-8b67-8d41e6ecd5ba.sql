-- Add missing fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS age integer,
ADD COLUMN IF NOT EXISTS ocupacao text,
ADD COLUMN IF NOT EXISTS rotina text,
ADD COLUMN IF NOT EXISTS ambiente text,
ADD COLUMN IF NOT EXISTS mentalidade text,
ADD COLUMN IF NOT EXISTS informacoes_extras text;

-- Add challenge_type to challenges table
ALTER TABLE public.challenges
ADD COLUMN IF NOT EXISTS challenge_type text DEFAULT 'custom';

-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars bucket
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Drop existing restrictive policy for profiles SELECT
DROP POLICY IF EXISTS "Users can view own profile and friends" ON public.profiles;

-- Create new policy allowing public access to basic profile info for leaderboard
CREATE POLICY "Public profiles for leaderboard"
ON public.profiles FOR SELECT
USING (true);