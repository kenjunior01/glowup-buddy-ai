-- Create stories table
CREATE TABLE public.stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'progress' CHECK (type IN ('progress', 'achievement', 'challenge', 'milestone')),
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours')
);

-- Create story_likes table for tracking likes
CREATE TABLE public.story_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(story_id, user_id)
);

-- Enable RLS
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_likes ENABLE ROW LEVEL SECURITY;

-- Stories policies: viewable by all authenticated users, CRUD by owner
CREATE POLICY "Stories are viewable by authenticated users" 
ON public.stories FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Users can create their own stories" 
ON public.stories FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stories" 
ON public.stories FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Story likes policies
CREATE POLICY "Story likes are viewable by authenticated users" 
ON public.story_likes FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Users can like stories" 
ON public.story_likes FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike stories" 
ON public.story_likes FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Enable realtime for stories
ALTER PUBLICATION supabase_realtime ADD TABLE public.stories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.story_likes;