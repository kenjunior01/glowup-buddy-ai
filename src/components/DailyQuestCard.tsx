import { useState } from 'react';
import { CheckCircle, Circle, Zap, Target, MessageSquare, Users, Award, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Quest {
  id: string;
  title: string;
  description: string;
  icon: 'streak' | 'social' | 'challenge' | 'profile' | 'chat' | 'ai';
  target: number;
  current: number;
  completed: boolean;
  reward_points: number;
  action_required?: string;
}

interface DailyQuestCardProps {
  quests: Quest[];
  onComplete: (quest: Quest) => void;
  onQuickAction: (quest: Quest) => void;
}

const iconMap = {
  streak: Zap,
  social: Users,
  challenge: Target,
  profile: Users,
  chat: MessageSquare,
  ai: Award,
};

export default function DailyQuestCard({ quests, onComplete, onQuickAction }: DailyQuestCardProps) {
  const [celebratingId, setCelebratingId] = useState<string | null>(null);
  const completedCount = quests.filter(q => q.completed).length;
  const totalRewards = quests.reduce((sum, q) => sum + (q.completed ? q.reward_points : 0), 0);
  const progressPercent = quests.length > 0 ? (completedCount / quests.length) * 100 : 0;

  const handleComplete = (quest: Quest) => {
    if (quest.completed) return;
    setCelebratingId(quest.id);
    onComplete(quest);
    setTimeout(() => setCelebratingId(null), 1200);
  };

  return (
    <div className="bento-card p-0 overflow-hidden">
      {/* Header with gradient accent */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-cyber flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Daily Quests</h3>
              <p className="text-[10px] text-muted-foreground">+{totalRewards} XP hoje</p>
            </div>
          </div>
          <div className={cn(
            "text-xs font-bold px-2.5 py-1 rounded-full transition-all duration-300",
            completedCount === quests.length
              ? "bg-accent/20 text-accent-foreground"
              : "bg-primary/10 text-primary"
          )}>
            {completedCount}/{quests.length}
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="xp-bar">
          <div
            className="xp-bar-fill progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Quest List */}
      <div className="px-3 pb-3 space-y-1">
        {quests.map((quest) => {
          const Icon = iconMap[quest.icon] || Target;
          const isCelebrating = celebratingId === quest.id;
          const progress = quest.target > 0 ? (quest.current / quest.target) * 100 : 0;

          return (
            <div
              key={quest.id}
              className={cn(
                "quest-card flex items-center gap-3 group cursor-pointer tap-scale",
                quest.completed && "completed",
                isCelebrating && "ring-2 ring-accent/40"
              )}
              onClick={() => quest.action_required ? onQuickAction(quest) : handleComplete(quest)}
            >
              {/* Check Circle */}
              <div className="relative flex-shrink-0">
                {quest.completed ? (
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    "bg-accent text-primary-foreground",
                    isCelebrating && "animate-check"
                  )}>
                    <CheckCircle className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full border-2 border-border flex items-center justify-center group-hover:border-primary/50 transition-colors">
                    <Circle className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                )}

                {/* Confetti dots on celebrate */}
                {isCelebrating && (
                  <>
                    <span className="absolute -top-1 -left-1 w-1.5 h-1.5 rounded-full bg-primary animate-confetti-pop" />
                    <span className="absolute -top-2 right-0 w-1 h-1 rounded-full bg-accent animate-confetti-pop" style={{ animationDelay: '0.1s' }} />
                    <span className="absolute bottom-0 -right-1 w-1.5 h-1.5 rounded-full bg-warning animate-confetti-pop" style={{ animationDelay: '0.2s' }} />
                  </>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-medium quest-title truncate",
                  quest.completed ? "text-muted-foreground line-through" : "text-foreground"
                )}>
                  {quest.title}
                </p>
                {!quest.completed && (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full progress-fill"
                        style={{
                          width: `${progress}%`,
                          background: 'var(--gradient-progress)',
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {quest.current}/{quest.target}
                    </span>
                  </div>
                )}
              </div>

              {/* Reward Badge */}
              <div className={cn(
                "flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full transition-all",
                quest.completed
                  ? "bg-accent/20 text-accent-foreground"
                  : "bg-primary/10 text-primary"
              )}>
                +{quest.reward_points}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
