-- Security Definer Function for Public Profile Data (Leaderboard)
CREATE OR REPLACE FUNCTION public.get_public_profile(profile_id uuid)
RETURNS TABLE (
  id uuid,
  display_name text,
  avatar_url text,
  level integer,
  pontos integer,
  total_challenges_completed integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.display_name,
    p.avatar_url,
    p.level,
    p.pontos,
    p.total_challenges_completed
  FROM profiles p
  WHERE p.id = profile_id;
$$;

-- Security Definer Function for Leaderboard (Top Users)
CREATE OR REPLACE FUNCTION public.get_leaderboard(limit_count integer DEFAULT 10)
RETURNS TABLE (
  id uuid,
  display_name text,
  avatar_url text,
  level integer,
  pontos integer,
  total_challenges_completed integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.display_name,
    p.avatar_url,
    p.level,
    p.pontos,
    p.total_challenges_completed
  FROM profiles p
  ORDER BY p.pontos DESC
  LIMIT limit_count;
$$;

-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Public profiles for leaderboard" ON public.profiles;

-- Create a more restrictive SELECT policy (users can only see their own full profile)
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Marketplace Tables for Ebooks, Mentorias and Courses

-- Product Types Enum
DO $$ BEGIN
  CREATE TYPE public.product_type AS ENUM ('ebook', 'mentoria', 'curso');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Product Status Enum
DO $$ BEGIN
  CREATE TYPE public.product_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Purchase Status Enum
DO $$ BEGIN
  CREATE TYPE public.purchase_status AS ENUM ('pending', 'completed', 'refunded', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Products Table (Ebooks, Mentorias, Courses)
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  short_description text,
  product_type product_type NOT NULL,
  price_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'BRL',
  cover_image_url text,
  file_url text, -- For ebooks/downloadable content
  status product_status NOT NULL DEFAULT 'draft',
  is_featured boolean DEFAULT false,
  total_sales integer DEFAULT 0,
  rating_avg numeric(3,2) DEFAULT 0,
  rating_count integer DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Mentoria Sessions Table (for scheduling mentoria sessions)
CREATE TABLE IF NOT EXISTS public.mentoria_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  mentor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  scheduled_at timestamp with time zone,
  duration_minutes integer DEFAULT 60,
  meeting_url text,
  status text DEFAULT 'available', -- available, booked, completed, cancelled
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Course Modules Table
CREATE TABLE IF NOT EXISTS public.course_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Course Lessons Table
CREATE TABLE IF NOT EXISTS public.course_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text,
  video_url text,
  duration_minutes integer,
  order_index integer NOT NULL DEFAULT 0,
  is_free_preview boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Purchases Table
CREATE TABLE IF NOT EXISTS public.purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_cents integer NOT NULL,
  platform_fee_cents integer DEFAULT 0,
  seller_amount_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'BRL',
  status purchase_status NOT NULL DEFAULT 'pending',
  payment_intent_id text,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(buyer_id, product_id)
);

-- Course Progress Table (track user progress in courses)
CREATE TABLE IF NOT EXISTS public.course_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  completed boolean DEFAULT false,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- Product Reviews Table
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(product_id, user_id)
);

-- Enable RLS on all new tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentoria_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- Products RLS Policies
CREATE POLICY "Published products are viewable by everyone" 
ON public.products FOR SELECT 
USING (status = 'published' OR auth.uid() = seller_id);

CREATE POLICY "Sellers can create products" 
ON public.products FOR INSERT 
WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update their products" 
ON public.products FOR UPDATE 
USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete their products" 
ON public.products FOR DELETE 
USING (auth.uid() = seller_id);

-- Mentoria Sessions RLS Policies
CREATE POLICY "Sessions viewable by mentor or student" 
ON public.mentoria_sessions FOR SELECT 
USING (auth.uid() = mentor_id OR auth.uid() = student_id OR student_id IS NULL);

CREATE POLICY "Mentors can create sessions" 
ON public.mentoria_sessions FOR INSERT 
WITH CHECK (auth.uid() = mentor_id);

CREATE POLICY "Mentors can update their sessions" 
ON public.mentoria_sessions FOR UPDATE 
USING (auth.uid() = mentor_id);

CREATE POLICY "Mentors can delete their sessions" 
ON public.mentoria_sessions FOR DELETE 
USING (auth.uid() = mentor_id);

-- Course Modules RLS Policies (visible if product is visible)
CREATE POLICY "Modules viewable for accessible products" 
ON public.course_modules FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.products p 
    WHERE p.id = product_id 
    AND (p.status = 'published' OR p.seller_id = auth.uid())
  )
);

CREATE POLICY "Sellers can manage modules" 
ON public.course_modules FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.products p 
    WHERE p.id = product_id AND p.seller_id = auth.uid()
  )
);

-- Course Lessons RLS Policies
CREATE POLICY "Lessons viewable for purchased courses or free previews" 
ON public.course_lessons FOR SELECT 
USING (
  is_free_preview = true OR
  EXISTS (
    SELECT 1 FROM public.course_modules m
    JOIN public.products p ON p.id = m.product_id
    WHERE m.id = module_id 
    AND (p.seller_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.purchases pu 
      WHERE pu.product_id = p.id 
      AND pu.buyer_id = auth.uid() 
      AND pu.status = 'completed'
    ))
  )
);

CREATE POLICY "Sellers can manage lessons" 
ON public.course_lessons FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.course_modules m
    JOIN public.products p ON p.id = m.product_id
    WHERE m.id = module_id AND p.seller_id = auth.uid()
  )
);

-- Purchases RLS Policies
CREATE POLICY "Users can view their purchases" 
ON public.purchases FOR SELECT 
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can create purchases" 
ON public.purchases FOR INSERT 
WITH CHECK (auth.uid() = buyer_id);

-- Course Progress RLS Policies
CREATE POLICY "Users can view their progress" 
ON public.course_progress FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their progress" 
ON public.course_progress FOR ALL 
USING (auth.uid() = user_id);

-- Product Reviews RLS Policies
CREATE POLICY "Reviews are publicly viewable" 
ON public.product_reviews FOR SELECT 
USING (true);

CREATE POLICY "Users can create reviews for purchased products" 
ON public.product_reviews FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.purchases 
    WHERE product_id = product_reviews.product_id 
    AND buyer_id = auth.uid() 
    AND status = 'completed'
  )
);

CREATE POLICY "Users can update their reviews" 
ON public.product_reviews FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their reviews" 
ON public.product_reviews FOR DELETE 
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_mentoria_sessions_updated_at
BEFORE UPDATE ON public.mentoria_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_purchases_updated_at
BEFORE UPDATE ON public.purchases
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for product files
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for products bucket
CREATE POLICY "Product images are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'products');

CREATE POLICY "Sellers can upload product files" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'products' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Sellers can update their product files" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'products' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Sellers can delete their product files" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'products' AND auth.uid()::text = (storage.foldername(name))[1]);