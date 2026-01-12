// Advanced ranking system with tiers and rewards
export interface RankTier {
  id: string;
  name: string;
  emoji: string;
  minPoints: number;
  maxPoints: number;
  color: string;
  gradient: string;
  benefits: string[];
  badge: string;
}

export const RANK_TIERS: RankTier[] = [
  {
    id: 'bronze',
    name: 'Bronze',
    emoji: '🥉',
    minPoints: 0,
    maxPoints: 499,
    color: 'text-amber-700',
    gradient: 'from-amber-600 to-amber-800',
    benefits: ['Acesso básico', 'Missões diárias'],
    badge: '🛡️'
  },
  {
    id: 'silver',
    name: 'Prata',
    emoji: '🥈',
    minPoints: 500,
    maxPoints: 1499,
    color: 'text-gray-400',
    gradient: 'from-gray-300 to-gray-500',
    benefits: ['Desafios exclusivos', '+10% pontos bônus'],
    badge: '⚔️'
  },
  {
    id: 'gold',
    name: 'Ouro',
    emoji: '🥇',
    minPoints: 1500,
    maxPoints: 3999,
    color: 'text-yellow-500',
    gradient: 'from-yellow-400 to-yellow-600',
    benefits: ['Conquistas especiais', '+25% pontos bônus', 'Avatar dourado'],
    badge: '👑'
  },
  {
    id: 'platinum',
    name: 'Platina',
    emoji: '💎',
    minPoints: 4000,
    maxPoints: 7999,
    color: 'text-cyan-400',
    gradient: 'from-cyan-300 to-cyan-600',
    benefits: ['Missões VIP', '+40% pontos bônus', 'Destaque no ranking'],
    badge: '💠'
  },
  {
    id: 'diamond',
    name: 'Diamante',
    emoji: '💠',
    minPoints: 8000,
    maxPoints: 14999,
    color: 'text-purple-400',
    gradient: 'from-purple-400 to-purple-700',
    benefits: ['Acesso antecipado', '+60% pontos bônus', 'Título exclusivo'],
    badge: '🔮'
  },
  {
    id: 'master',
    name: 'Mestre',
    emoji: '🏆',
    minPoints: 15000,
    maxPoints: 29999,
    color: 'text-red-500',
    gradient: 'from-red-500 to-red-700',
    benefits: ['Mentor oficial', '+80% pontos bônus', 'Comunidade VIP'],
    badge: '🎖️'
  },
  {
    id: 'legend',
    name: 'Lendário',
    emoji: '⭐',
    minPoints: 30000,
    maxPoints: Infinity,
    color: 'text-amber-400',
    gradient: 'from-amber-300 via-yellow-500 to-orange-500',
    benefits: ['Lenda da plataforma', '+100% pontos bônus', 'Personalização total'],
    badge: '🌟'
  }
];

export function getRankByPoints(points: number): RankTier {
  return RANK_TIERS.find(tier => points >= tier.minPoints && points <= tier.maxPoints) || RANK_TIERS[0];
}

export function getNextRank(points: number): RankTier | null {
  const currentRank = getRankByPoints(points);
  const currentIndex = RANK_TIERS.findIndex(tier => tier.id === currentRank.id);
  return currentIndex < RANK_TIERS.length - 1 ? RANK_TIERS[currentIndex + 1] : null;
}

export function getProgressToNextRank(points: number): number {
  const currentRank = getRankByPoints(points);
  const nextRank = getNextRank(points);
  
  if (!nextRank) return 100;
  
  const pointsInCurrentRank = points - currentRank.minPoints;
  const pointsNeededForNextRank = nextRank.minPoints - currentRank.minPoints;
  
  return Math.min(100, Math.round((pointsInCurrentRank / pointsNeededForNextRank) * 100));
}

export function getPointsToNextRank(points: number): number {
  const nextRank = getNextRank(points);
  if (!nextRank) return 0;
  return nextRank.minPoints - points;
}

// Leaderboard position titles
export const POSITION_TITLES: Record<number, { title: string; emoji: string; color: string }> = {
  1: { title: 'Campeão', emoji: '🏆', color: 'text-yellow-500' },
  2: { title: 'Vice-Campeão', emoji: '🥈', color: 'text-gray-400' },
  3: { title: 'Terceiro Lugar', emoji: '🥉', color: 'text-amber-600' },
  4: { title: 'Top 5', emoji: '⭐', color: 'text-blue-400' },
  5: { title: 'Top 5', emoji: '⭐', color: 'text-blue-400' },
};

export function getPositionInfo(position: number) {
  if (position <= 5) return POSITION_TITLES[position];
  if (position <= 10) return { title: 'Top 10', emoji: '🔥', color: 'text-orange-400' };
  if (position <= 25) return { title: 'Top 25', emoji: '💪', color: 'text-green-400' };
  if (position <= 50) return { title: 'Top 50', emoji: '🚀', color: 'text-cyan-400' };
  if (position <= 100) return { title: 'Top 100', emoji: '📈', color: 'text-purple-400' };
  return { title: `#${position}`, emoji: '🎯', color: 'text-muted-foreground' };
}

// Weekly/Monthly reset bonuses
export const RESET_BONUSES = {
  weekly: {
    topPercentile: [
      { percentile: 1, bonus: 500, title: 'Top 1%' },
      { percentile: 5, bonus: 250, title: 'Top 5%' },
      { percentile: 10, bonus: 100, title: 'Top 10%' },
      { percentile: 25, bonus: 50, title: 'Top 25%' },
    ]
  },
  monthly: {
    topPercentile: [
      { percentile: 1, bonus: 2000, title: 'Top 1%' },
      { percentile: 5, bonus: 1000, title: 'Top 5%' },
      { percentile: 10, bonus: 500, title: 'Top 10%' },
      { percentile: 25, bonus: 200, title: 'Top 25%' },
    ]
  }
};
