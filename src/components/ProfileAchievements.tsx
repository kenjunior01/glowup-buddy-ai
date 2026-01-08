import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Flame, Star, Target, Users, Zap, Crown, Medal } from 'lucide-react';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  color: string;
}

interface ProfileAchievementsProps {
  currentStreak: number;
  totalChallenges: number;
  totalFriends: number;
  points: number;
}

export function ProfileAchievements({ 
  currentStreak, 
  totalChallenges, 
  totalFriends, 
  points 
}: ProfileAchievementsProps) {
  const achievements: Achievement[] = [
    {
      id: 'streak-7',
      name: 'Semana de Fogo',
      description: '7 dias consecutivos',
      icon: <Flame className="w-5 h-5" />,
      unlocked: currentStreak >= 7,
      color: 'from-orange-500 to-red-500'
    },
    {
      id: 'challenges-10',
      name: 'Desafiante',
      description: '10 desafios completos',
      icon: <Trophy className="w-5 h-5" />,
      unlocked: totalChallenges >= 10,
      color: 'from-yellow-500 to-orange-500'
    },
    {
      id: 'friends-5',
      name: 'Popular',
      description: '5 amigos adicionados',
      icon: <Users className="w-5 h-5" />,
      unlocked: totalFriends >= 5,
      color: 'from-blue-500 to-purple-500'
    },
    {
      id: 'points-1000',
      name: 'Mil Pontos',
      description: 'Alcançou 1000 pontos',
      icon: <Star className="w-5 h-5" />,
      unlocked: points >= 1000,
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'streak-30',
      name: 'Mês de Ouro',
      description: '30 dias consecutivos',
      icon: <Crown className="w-5 h-5" />,
      unlocked: currentStreak >= 30,
      color: 'from-yellow-400 to-amber-500'
    },
    {
      id: 'challenges-50',
      name: 'Mestre',
      description: '50 desafios completos',
      icon: <Medal className="w-5 h-5" />,
      unlocked: totalChallenges >= 50,
      color: 'from-emerald-500 to-teal-500'
    }
  ];

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <Card className="animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Conquistas
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {unlockedCount}/{achievements.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2">
          {achievements.map((achievement, index) => (
            <div
              key={achievement.id}
              className={`relative p-3 rounded-lg text-center transition-all animate-fade-in ${
                achievement.unlocked 
                  ? `bg-gradient-to-br ${achievement.color} text-white shadow-lg` 
                  : 'bg-muted/50 text-muted-foreground opacity-50'
              }`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={`mx-auto mb-1 ${achievement.unlocked ? 'animate-bounce-subtle' : ''}`}>
                {achievement.icon}
              </div>
              <p className="text-xs font-medium line-clamp-1">{achievement.name}</p>
              {!achievement.unlocked && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
                  <span className="text-lg">🔒</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
