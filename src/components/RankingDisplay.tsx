import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  getRankByPoints, 
  getNextRank, 
  getProgressToNextRank, 
  getPointsToNextRank,
  RANK_TIERS 
} from '@/lib/ranking';
import { Trophy, TrendingUp, Star, Sparkles, Zap, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RankingDisplayProps {
  points: number;
  level: number;
  showAllRanks?: boolean;
  compact?: boolean;
}

export const RankingDisplay = ({ 
  points, 
  level, 
  showAllRanks = false,
  compact = false 
}: RankingDisplayProps) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const currentRank = getRankByPoints(points);
  const nextRank = getNextRank(points);
  const progress = getProgressToNextRank(points);
  const pointsToNext = getPointsToNextRank(points);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedProgress(progress), 100);
    return () => clearTimeout(timer);
  }, [progress]);

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center text-lg",
          `bg-gradient-to-br ${currentRank.gradient} shadow-lg`
        )}>
          {currentRank.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn("font-bold text-sm", currentRank.color)}>
              {currentRank.name}
            </span>
            <Badge variant="secondary" className="text-xs">
              Nv.{level}
            </Badge>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Progress value={animatedProgress} className="h-1.5 flex-1" />
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {pointsToNext > 0 ? `-${pointsToNext}` : '🎉'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden border-0 shadow-xl">
      {/* Header com gradiente animado */}
      <CardHeader className={cn(
        "relative pb-6 bg-gradient-to-br text-white",
        currentRank.gradient
      )}>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-2 right-2 animate-pulse">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="absolute bottom-4 left-4 animate-bounce delay-100">
            <Star className="w-4 h-4" />
          </div>
          <div className="absolute top-1/2 right-8 animate-pulse delay-200">
            <Zap className="w-5 h-5" />
          </div>
        </div>
        
        <div className="relative flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl shadow-inner border border-white/30">
            {currentRank.emoji}
          </div>
          
          <div className="flex-1">
            <CardTitle className="text-xl flex items-center gap-2">
              {currentRank.name}
              {currentRank.id === 'legend' && <Crown className="w-5 h-5 animate-bounce" />}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1 opacity-90">
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-xs">
                ⭐ Nível {level}
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-xs">
                💎 {points.toLocaleString()} pts
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {/* Progresso para próximo rank */}
        {nextRank && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                Próximo: {nextRank.emoji} {nextRank.name}
              </span>
              <span className="font-medium text-primary">
                {progress}%
              </span>
            </div>
            
            <div className="relative">
              <Progress 
                value={animatedProgress} 
                className="h-3 bg-muted/50"
              />
              <div 
                className="absolute top-1/2 -translate-y-1/2 transition-all duration-500"
                style={{ left: `${Math.min(95, animatedProgress)}%` }}
              >
                <div className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center shadow-lg animate-pulse">
                  🎯
                </div>
              </div>
            </div>
            
            <p className="text-xs text-center text-muted-foreground">
              Faltam <span className="font-bold text-primary">{pointsToNext.toLocaleString()}</span> pontos para {nextRank.name}
            </p>
          </div>
        )}

        {/* Benefícios do rank atual */}
        <div className="p-3 rounded-xl bg-gradient-to-r from-muted/50 to-muted/30 border">
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary" />
            Seus Benefícios
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {currentRank.benefits.map((benefit, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="text-xs bg-primary/10 text-primary border-primary/20"
              >
                ✓ {benefit}
              </Badge>
            ))}
          </div>
        </div>

        {/* Todos os ranks */}
        {showAllRanks && (
          <div className="space-y-2 pt-2 border-t">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              Todos os Ranks
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {RANK_TIERS.map((tier) => {
                const isCurrentRank = tier.id === currentRank.id;
                const isUnlocked = points >= tier.minPoints;
                
                return (
                  <div 
                    key={tier.id}
                    className={cn(
                      "p-2 rounded-lg border transition-all",
                      isCurrentRank && "ring-2 ring-primary bg-primary/10",
                      !isUnlocked && "opacity-50 grayscale",
                      isUnlocked && !isCurrentRank && "bg-muted/30"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{tier.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-xs font-medium truncate",
                          tier.color
                        )}>
                          {tier.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {tier.minPoints.toLocaleString()}+ pts
                        </p>
                      </div>
                      {isCurrentRank && (
                        <Badge className="text-[8px] px-1 py-0">VOCÊ</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
