
-- GlowCoins column on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS glow_coins integer DEFAULT 0;

-- Leagues system
CREATE TABLE public.leagues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  league_tier text NOT NULL DEFAULT 'bronze',
  league_group integer NOT NULL DEFAULT 0,
  week_start date NOT NULL DEFAULT CURRENT_DATE,
  weekly_points integer NOT NULL DEFAULT 0,
  position_in_group integer DEFAULT 0,
  promoted boolean DEFAULT false,
  demoted boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view league members in same group" ON public.leagues FOR SELECT USING (true);
CREATE POLICY "Users can create own league" ON public.leagues FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own league" ON public.leagues FOR UPDATE USING (auth.uid() = user_id);

-- Duels (1v1)
CREATE TABLE public.duels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id uuid NOT NULL,
  opponent_id uuid NOT NULL,
  quest_text text NOT NULL,
  stake_coins integer NOT NULL DEFAULT 10,
  stake_streak_days integer DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  challenger_proof_url text,
  opponent_proof_url text,
  challenger_completed boolean DEFAULT false,
  opponent_completed boolean DEFAULT false,
  winner_id uuid,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.duels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their duels" ON public.duels FOR SELECT USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);
CREATE POLICY "Users can create duels" ON public.duels FOR INSERT WITH CHECK (auth.uid() = challenger_id);
CREATE POLICY "Users can update their duels" ON public.duels FOR UPDATE USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);

-- Clans (Blood Pact)
CREATE TABLE public.clans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon_emoji text DEFAULT '⚔️',
  leader_id uuid NOT NULL,
  max_members integer DEFAULT 10,
  member_count integer DEFAULT 1,
  total_xp integer DEFAULT 0,
  streak_bonus_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.clans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view clans" ON public.clans FOR SELECT USING (true);
CREATE POLICY "Auth users can create clans" ON public.clans FOR INSERT WITH CHECK (auth.uid() = leader_id);
CREATE POLICY "Leaders can update clans" ON public.clans FOR UPDATE USING (auth.uid() = leader_id);
CREATE POLICY "Leaders can delete clans" ON public.clans FOR DELETE USING (auth.uid() = leader_id);

CREATE TABLE public.clan_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id uuid NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text DEFAULT 'member',
  daily_quest_completed boolean DEFAULT false,
  last_quest_date date,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(clan_id, user_id)
);
ALTER TABLE public.clan_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view clan members" ON public.clan_members FOR SELECT USING (true);
CREATE POLICY "Users can join clans" ON public.clan_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own membership" ON public.clan_members FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can leave clans" ON public.clan_members FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime for leagues (live rankings)
ALTER PUBLICATION supabase_realtime ADD TABLE public.leagues;
ALTER PUBLICATION supabase_realtime ADD TABLE public.duels;
