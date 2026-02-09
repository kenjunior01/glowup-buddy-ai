// Advanced scoring system with XP, levels, and multipliers

export interface ScoreAction {
  type: string;
  basePoints: number;
  xpReward: number;
  description: string;
  emoji: string;
}

// All scoring actions in the system
export const SCORE_ACTIONS: Record<string, ScoreAction> = {
  // Daily activities
  DAILY_CHECKIN: {
    type: 'daily_checkin',
    basePoints: 10,
    xpReward: 25,
    description: 'Check-in diário',
    emoji: '✅'
  },
  COMPLETE_TASK: {
    type: 'complete_task',
    basePoints: 15,
    xpReward: 30,
    description: 'Completar tarefa',
    emoji: '📋'
  },
  COMPLETE_PLAN: {
    type: 'complete_plan',
    basePoints: 100,
    xpReward: 200,
    description: 'Completar plano',
    emoji: '🎯'
  },
  
  // Social activities
  SEND_CHALLENGE: {
    type: 'send_challenge',
    basePoints: 20,
    xpReward: 40,
    description: 'Enviar desafio',
    emoji: '⚔️'
  },
  COMPLETE_CHALLENGE: {
    type: 'complete_challenge',
    basePoints: 50,
    xpReward: 100,
    description: 'Completar desafio',
    emoji: '🏆'
  },
  ACCEPT_CHALLENGE: {
    type: 'accept_challenge',
    basePoints: 10,
    xpReward: 20,
    description: 'Aceitar desafio',
    emoji: '🤝'
  },
  ADD_FRIEND: {
    type: 'add_friend',
    basePoints: 25,
    xpReward: 50,
    description: 'Adicionar amigo',
    emoji: '👥'
  },
  SEND_MESSAGE: {
    type: 'send_message',
    basePoints: 5,
    xpReward: 10,
    description: 'Enviar mensagem',
    emoji: '💬'
  },
  
  // Content creation
  CREATE_STORY: {
    type: 'create_story',
    basePoints: 30,
    xpReward: 60,
    description: 'Criar story',
    emoji: '📸'
  },
  CREATE_PRODUCT: {
    type: 'create_product',
    basePoints: 100,
    xpReward: 200,
    description: 'Criar produto',
    emoji: '🛍️'
  },
  MAKE_SALE: {
    type: 'make_sale',
    basePoints: 200,
    xpReward: 400,
    description: 'Realizar venda',
    emoji: '💰'
  },
  LEAVE_REVIEW: {
    type: 'leave_review',
    basePoints: 25,
    xpReward: 50,
    description: 'Deixar avaliação',
    emoji: '⭐'
  },
  
  // Focus Timer
  FOCUS_SESSION: {
    type: 'focus_session',
    basePoints: 25,
    xpReward: 50,
    description: 'Sessão de foco completa',
    emoji: '🎯'
  },
  FOCUS_STREAK_4: {
    type: 'focus_streak_4',
    basePoints: 50,
    xpReward: 100,
    description: '4 sessões consecutivas',
    emoji: '⚡'
  },
  
  // Streaks
  STREAK_BONUS_3: {
    type: 'streak_3',
    basePoints: 50,
    xpReward: 100,
    description: 'Streak de 3 dias',
    emoji: '🔥'
  },
  STREAK_BONUS_7: {
    type: 'streak_7',
    basePoints: 150,
    xpReward: 300,
    description: 'Streak de 7 dias',
    emoji: '🔥🔥'
  },
  STREAK_BONUS_30: {
    type: 'streak_30',
    basePoints: 500,
    xpReward: 1000,
    description: 'Streak de 30 dias',
    emoji: '👑'
  },
  
  // Goals
  CREATE_GOAL: {
    type: 'create_goal',
    basePoints: 20,
    xpReward: 40,
    description: 'Criar meta',
    emoji: '🎯'
  },
  COMPLETE_GOAL: {
    type: 'complete_goal',
    basePoints: 150,
    xpReward: 300,
    description: 'Completar meta',
    emoji: '🏅'
  }
};

// Level thresholds with progressive XP requirements
export const LEVEL_THRESHOLDS = [
  { level: 1, xpRequired: 0, title: 'Iniciante', emoji: '🌱' },
  { level: 2, xpRequired: 100, title: 'Aprendiz', emoji: '📚' },
  { level: 3, xpRequired: 300, title: 'Praticante', emoji: '💪' },
  { level: 4, xpRequired: 600, title: 'Competente', emoji: '⭐' },
  { level: 5, xpRequired: 1000, title: 'Habilidoso', emoji: '🌟' },
  { level: 6, xpRequired: 1500, title: 'Experiente', emoji: '💎' },
  { level: 7, xpRequired: 2200, title: 'Avançado', emoji: '🔥' },
  { level: 8, xpRequired: 3000, title: 'Expert', emoji: '🏆' },
  { level: 9, xpRequired: 4000, title: 'Mestre', emoji: '👑' },
  { level: 10, xpRequired: 5500, title: 'Grão-Mestre', emoji: '⚡' },
  { level: 11, xpRequired: 7500, title: 'Lendário', emoji: '🦅' },
  { level: 12, xpRequired: 10000, title: 'Mítico', emoji: '🐉' },
  { level: 13, xpRequired: 13000, title: 'Divino', emoji: '✨' },
  { level: 14, xpRequired: 17000, title: 'Celestial', emoji: '🌙' },
  { level: 15, xpRequired: 22000, title: 'Transcendente', emoji: '🌌' },
];

// Streak multipliers for bonus points
export const STREAK_MULTIPLIERS = [
  { minDays: 1, multiplier: 1.0 },
  { minDays: 3, multiplier: 1.2 },
  { minDays: 7, multiplier: 1.5 },
  { minDays: 14, multiplier: 1.8 },
  { minDays: 30, multiplier: 2.0 },
  { minDays: 60, multiplier: 2.5 },
  { minDays: 100, multiplier: 3.0 },
];

// Calculate level from XP
export function calculateLevel(xp: number): { level: number; title: string; emoji: string; progress: number; xpToNext: number } {
  let currentLevel = LEVEL_THRESHOLDS[0];
  let nextLevel = LEVEL_THRESHOLDS[1];
  
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i].xpRequired) {
      currentLevel = LEVEL_THRESHOLDS[i];
      nextLevel = LEVEL_THRESHOLDS[i + 1] || LEVEL_THRESHOLDS[i];
      break;
    }
  }
  
  const xpInCurrentLevel = xp - currentLevel.xpRequired;
  const xpNeededForNext = nextLevel.xpRequired - currentLevel.xpRequired;
  const progress = xpNeededForNext > 0 ? (xpInCurrentLevel / xpNeededForNext) * 100 : 100;
  const xpToNext = nextLevel.xpRequired - xp;
  
  return {
    level: currentLevel.level,
    title: currentLevel.title,
    emoji: currentLevel.emoji,
    progress: Math.min(progress, 100),
    xpToNext: Math.max(xpToNext, 0)
  };
}

// Get streak multiplier
export function getStreakMultiplier(streakDays: number): number {
  let multiplier = 1.0;
  for (const tier of STREAK_MULTIPLIERS) {
    if (streakDays >= tier.minDays) {
      multiplier = tier.multiplier;
    }
  }
  return multiplier;
}

// Calculate points with streak bonus
export function calculatePointsWithStreak(basePoints: number, streakDays: number): number {
  const multiplier = getStreakMultiplier(streakDays);
  return Math.round(basePoints * multiplier);
}

// Get rank based on total points
export function getRank(points: number): { rank: string; emoji: string; color: string } {
  if (points >= 50000) return { rank: 'Diamante', emoji: '💎', color: 'text-cyan-400' };
  if (points >= 25000) return { rank: 'Platina', emoji: '🌟', color: 'text-purple-400' };
  if (points >= 10000) return { rank: 'Ouro', emoji: '🥇', color: 'text-yellow-400' };
  if (points >= 5000) return { rank: 'Prata', emoji: '🥈', color: 'text-gray-300' };
  if (points >= 1000) return { rank: 'Bronze', emoji: '🥉', color: 'text-orange-400' };
  return { rank: 'Novato', emoji: '🌱', color: 'text-green-400' };
}

// Format large numbers (1000 -> 1K, 1000000 -> 1M)
export function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}
