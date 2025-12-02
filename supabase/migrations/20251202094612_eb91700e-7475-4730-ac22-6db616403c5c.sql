-- SEGURANÇA: Corrigir RLS Policies Permissivas

-- 1. PROFILES: Restringir SELECT para próprio perfil + amigos aceitos
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile and friends" ON public.profiles
FOR SELECT USING (
  auth.uid() = id OR
  EXISTS (
    SELECT 1 FROM friendships 
    WHERE status = 'accepted' AND (
      (user_id = auth.uid() AND friend_id = id) OR
      (friend_id = auth.uid() AND user_id = id)
    )
  )
);

-- 2. STREAKS: Restringir SELECT para próprio streak
DROP POLICY IF EXISTS "Users can view all streaks" ON public.streaks;

CREATE POLICY "Users can view own streak" ON public.streaks
FOR SELECT USING (auth.uid() = user_id);

-- 3. NOTIFICATIONS: Restringir INSERT para próprio usuário
DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications;

CREATE POLICY "Users can create own notifications" ON public.notifications
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. MESSAGES: Adicionar UPDATE policy para marcar como lida
CREATE POLICY "Users can update messages they received" ON public.messages
FOR UPDATE USING (auth.uid() = receiver_id);

-- 5. CHALLENGES: Adicionar DELETE policy
CREATE POLICY "Users can delete their challenges" ON public.challenges
FOR DELETE USING (auth.uid() = creator_id OR auth.uid() = target_user_id);

-- 6. NOTIFICATIONS: Adicionar DELETE policy
CREATE POLICY "Users can delete own notifications" ON public.notifications
FOR DELETE USING (auth.uid() = user_id);