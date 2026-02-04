import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCelebration } from '@/components/CelebrationSystem';
import { calculateLevel, SCORE_ACTIONS, calculatePointsWithStreak } from '@/lib/scoring';
import { useToast } from '@/hooks/use-toast';

interface UseScoreOptions {
  userId: string;
}

export function useScoring({ userId }: UseScoreOptions) {
  const { celebrate } = useCelebration();
  const { toast } = useToast();

  const addPoints = useCallback(async (
    actionType: keyof typeof SCORE_ACTIONS,
    currentStreak: number = 0
  ) => {
    if (!userId) return { success: false };

    const action = SCORE_ACTIONS[actionType];
    if (!action) {
      console.error('Unknown action type:', actionType);
      return { success: false };
    }

    try {
      // Get current profile
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('pontos, experience_points, level')
        .eq('id', userId)
        .single();

      if (fetchError) throw fetchError;

      const currentXP = profile?.experience_points || 0;
      const currentLevel = profile?.level || 1;
      const currentPoints = profile?.pontos || 0;

      // Calculate points with streak bonus
      const pointsToAdd = calculatePointsWithStreak(action.basePoints, currentStreak);
      const xpToAdd = action.xpReward;

      const newPoints = currentPoints + pointsToAdd;
      const newXP = currentXP + xpToAdd;

      // Calculate new level
      const levelInfo = calculateLevel(newXP);
      const leveledUp = levelInfo.level > currentLevel;

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          pontos: newPoints,
          experience_points: newXP,
          level: levelInfo.level
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Show toast for points earned
      toast({
        title: `${action.emoji} +${pointsToAdd} pontos!`,
        description: action.description,
      });

      // Trigger level up celebration if leveled up
      if (leveledUp) {
        celebrate({
          type: 'level_up',
          value: levelInfo.level,
          title: `Nível ${levelInfo.level}! ${levelInfo.emoji}`,
          subtitle: `Você evoluiu para ${levelInfo.title}!`
        });

        // Create notification for level up
        await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            title: `🎉 Level Up! Nível ${levelInfo.level}`,
            message: `Parabéns! Você agora é ${levelInfo.title}! ${levelInfo.emoji}`,
            type: 'level_up'
          });
      }

      return {
        success: true,
        pointsAdded: pointsToAdd,
        xpAdded: xpToAdd,
        newLevel: levelInfo.level,
        leveledUp,
        levelInfo
      };

    } catch (error) {
      console.error('Error adding points:', error);
      return { success: false };
    }
  }, [userId, celebrate, toast]);

  const checkLevelUp = useCallback(async () => {
    if (!userId) return null;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('experience_points, level')
        .eq('id', userId)
        .single();

      if (!profile) return null;

      const levelInfo = calculateLevel(profile.experience_points);
      
      if (levelInfo.level > profile.level) {
        // Update level in database
        await supabase
          .from('profiles')
          .update({ level: levelInfo.level })
          .eq('id', userId);

        // Trigger celebration
        celebrate({
          type: 'level_up',
          value: levelInfo.level,
          title: `Nível ${levelInfo.level}! ${levelInfo.emoji}`,
          subtitle: `Você evoluiu para ${levelInfo.title}!`
        });

        return levelInfo;
      }

      return null;
    } catch (error) {
      console.error('Error checking level up:', error);
      return null;
    }
  }, [userId, celebrate]);

  return {
    addPoints,
    checkLevelUp
  };
}
