-- Create tribes/clans table
CREATE TABLE public.tribes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'geral',
  icon_emoji TEXT NOT NULL DEFAULT '⚡',
  cover_color TEXT NOT NULL DEFAULT 'from-purple-500 to-pink-500',
  creator_id UUID NOT NULL,
  member_count INTEGER NOT NULL DEFAULT 1,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tribe members table
CREATE TABLE public.tribe_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tribe_id UUID NOT NULL REFERENCES public.tribes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tribe_id, user_id)
);

-- Create tribe posts table
CREATE TABLE public.tribe_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tribe_id UUID NOT NULL REFERENCES public.tribes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  likes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tribes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tribe_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tribe_posts ENABLE ROW LEVEL SECURITY;

-- Tribes policies
CREATE POLICY "Anyone can view public tribes" ON public.tribes FOR SELECT USING (is_public = true);
CREATE POLICY "Authenticated users can create tribes" ON public.tribes FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update tribes" ON public.tribes FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Creators can delete tribes" ON public.tribes FOR DELETE USING (auth.uid() = creator_id);

-- Tribe members policies
CREATE POLICY "Members visible to authenticated" ON public.tribe_members FOR SELECT USING (true);
CREATE POLICY "Users can join tribes" ON public.tribe_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave tribes" ON public.tribe_members FOR DELETE USING (auth.uid() = user_id);

-- Tribe posts policies
CREATE POLICY "Posts visible to members" ON public.tribe_posts FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.tribe_members WHERE tribe_id = tribe_posts.tribe_id AND user_id = auth.uid())
);
CREATE POLICY "Members can create posts" ON public.tribe_posts FOR INSERT WITH CHECK (
  auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.tribe_members WHERE tribe_id = tribe_posts.tribe_id AND user_id = auth.uid())
);
CREATE POLICY "Users can delete own posts" ON public.tribe_posts FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_tribes_updated_at BEFORE UPDATE ON public.tribes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();