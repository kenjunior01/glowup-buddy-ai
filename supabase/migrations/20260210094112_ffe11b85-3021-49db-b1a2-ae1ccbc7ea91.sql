
-- Partner coupons system
CREATE TABLE public.partner_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_name TEXT NOT NULL,
  partner_logo_url TEXT,
  coupon_code TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL,
  category TEXT DEFAULT 'geral',
  external_url TEXT,
  max_redemptions INTEGER,
  current_redemptions INTEGER DEFAULT 0,
  is_premium_only BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  coupon_id UUID REFERENCES public.partner_coupons(id) ON DELETE CASCADE NOT NULL,
  redeemed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, coupon_id)
);

ALTER TABLE public.partner_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

-- Everyone can view active coupons
CREATE POLICY "Anyone can view active coupons" ON public.partner_coupons
  FOR SELECT USING (is_active = true);

-- Only admins can manage coupons
CREATE POLICY "Admins can manage coupons" ON public.partner_coupons
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Users can view their own redemptions
CREATE POLICY "Users can view own redemptions" ON public.coupon_redemptions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can redeem coupons
CREATE POLICY "Users can redeem coupons" ON public.coupon_redemptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_partner_coupons_updated_at
  BEFORE UPDATE ON public.partner_coupons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add subscription_tier to profiles for caching
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_end TIMESTAMPTZ;
