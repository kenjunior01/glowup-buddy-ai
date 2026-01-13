-- Create enum for ad types
CREATE TYPE public.ad_type AS ENUM ('ticker', 'premium_banner', 'mid_page');

-- Create enum for ad status
CREATE TYPE public.ad_status AS ENUM ('pending', 'approved', 'rejected', 'active', 'expired');

-- Create ad pricing table (managed by admin)
CREATE TABLE public.ad_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_type public.ad_type NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  price_per_day_cents INTEGER NOT NULL DEFAULT 0,
  price_per_week_cents INTEGER NOT NULL DEFAULT 0,
  price_per_month_cents INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create advertisements table
CREATE TABLE public.advertisements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  ad_type public.ad_type NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  link_url TEXT,
  image_url TEXT,
  background_color TEXT DEFAULT '#3B82F6',
  text_color TEXT DEFAULT '#FFFFFF',
  status public.ad_status DEFAULT 'pending',
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  duration_days INTEGER DEFAULT 7,
  amount_paid_cents INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  clicks_count INTEGER DEFAULT 0,
  priority INTEGER DEFAULT 0,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ad_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;

-- Ad pricing policies (public read, admin write)
CREATE POLICY "Anyone can view ad pricing"
ON public.ad_pricing FOR SELECT
USING (true);

CREATE POLICY "Admins can manage ad pricing"
ON public.ad_pricing FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Advertisements policies
CREATE POLICY "Anyone can view active ads"
ON public.advertisements FOR SELECT
USING (status = 'active' AND starts_at <= now() AND expires_at > now());

CREATE POLICY "Users can view their own ads"
ON public.advertisements FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create ads"
ON public.advertisements FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their pending ads"
ON public.advertisements FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND status = 'pending')
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their pending ads"
ON public.advertisements FOR DELETE
TO authenticated
USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can manage all ads"
ON public.advertisements FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default pricing
INSERT INTO public.ad_pricing (ad_type, name, description, price_per_day_cents, price_per_week_cents, price_per_month_cents) VALUES
('ticker', 'Ticker Tape', 'Anúncio em texto rolante no topo da página', 500, 2500, 8000),
('premium_banner', 'Banner Premium', 'Banner destacado entre o header e o conteúdo principal', 1000, 5000, 15000),
('mid_page', 'Anúncio Central', 'Anúncio no meio do feed de conteúdo', 750, 3500, 10000);

-- Create trigger for updated_at
CREATE TRIGGER update_ad_pricing_updated_at
BEFORE UPDATE ON public.ad_pricing
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_advertisements_updated_at
BEFORE UPDATE ON public.advertisements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();