import React, { useState, useEffect } from 'react';
import { Clock, Trophy, Users, Flame, Target, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface ChallengeCountdownProps {
  title: string;
  description?: string;
  expiresAt: Date;
  progress?: number;
  participants?: number;
  rewardPoints?: number;
  isBuddy?: boolean;
  buddyName?: string;
  buddyAvatar?: string;
  onComplete?: () => void;
  className?: string;
}

export default function ChallengeCountdown({
  title,
  description,
  expiresAt,
  progress = 0,
  participants,
  rewardPoints,
  isBuddy,
  buddyName,
  buddyAvatar,
  onComplete,
  className,
}: ChallengeCountdownProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = expiresAt.getTime();
      const diff = target - now;

      if (diff <= 0) {
        setIsExpired(true);
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      };
    };

    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const isUrgent = timeLeft.days === 0 && timeLeft.hours < 12;

  return (
    <div className={cn(
      "bento-card overflow-hidden transition-all hover:shadow-md",
      isUrgent && !isExpired && "ring-1 ring-destructive/30",
      className
    )}>
      {/* Header with badge */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {isBuddy ? (
                <div className="w-6 h-6 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Users className="w-3.5 h-3.5 text-accent" />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Target className="w-3.5 h-3.5 text-primary" />
                </div>
              )}
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                {isBuddy ? 'Desafio em Dupla' : 'Desafio'}
              </span>
            </div>
            <h4 className="font-semibold text-foreground text-sm line-clamp-1">{title}</h4>
            {description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{description}</p>
            )}
          </div>

          {/* Reward Badge */}
          {rewardPoints && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 shrink-0">
              <Trophy className="w-3 h-3 text-primary" />
              <span className="text-xs font-semibold text-primary">+{rewardPoints}</span>
            </div>
          )}
        </div>

        {/* Buddy Info */}
        {isBuddy && buddyName && (
          <div className="flex items-center gap-2 mt-3 p-2 rounded-lg bg-muted/30">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-semibold">
              {buddyAvatar ? (
                <img src={buddyAvatar} alt={buddyName} className="w-full h-full rounded-full object-cover" />
              ) : (
                buddyName.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{buddyName}</p>
              <p className="text-[10px] text-muted-foreground">Seu parceiro</p>
            </div>
          </div>
        )}
      </div>

      {/* Progress Section */}
      <div className="px-4 pb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-muted-foreground">Progresso</span>
          <span className="text-xs font-medium text-foreground">{progress}%</span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* Countdown */}
      <div className={cn(
        "px-4 py-3 border-t border-border/40",
        isUrgent && !isExpired ? "bg-destructive/5" : "bg-muted/20"
      )}>
        {isExpired ? (
          <div className="flex items-center justify-center gap-2 text-destructive">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">Expirado</span>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Clock className={cn(
                "w-4 h-4",
                isUrgent ? "text-destructive" : "text-muted-foreground"
              )} />
              <span className={cn(
                "text-[10px] font-medium",
                isUrgent ? "text-destructive" : "text-muted-foreground"
              )}>
                Tempo restante
              </span>
            </div>

            {/* Time Units */}
            <div className="flex items-center gap-1">
              {timeLeft.days > 0 && (
                <TimeUnit value={timeLeft.days} label="d" isUrgent={isUrgent} />
              )}
              <TimeUnit value={timeLeft.hours} label="h" isUrgent={isUrgent} />
              <TimeUnit value={timeLeft.minutes} label="m" isUrgent={isUrgent} />
              {timeLeft.days === 0 && (
                <TimeUnit value={timeLeft.seconds} label="s" isUrgent={isUrgent} />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      {onComplete && !isExpired && (
        <button
          onClick={onComplete}
          className="w-full px-4 py-3 flex items-center justify-between bg-primary/5 hover:bg-primary/10 transition-colors border-t border-border/40"
        >
          <span className="text-xs font-medium text-primary">Completar desafio</span>
          <ArrowRight className="w-4 h-4 text-primary" />
        </button>
      )}

      {/* Participants */}
      {participants && participants > 1 && (
        <div className="px-4 py-2 border-t border-border/40 bg-muted/10">
          <div className="flex items-center gap-1.5">
            <Users className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">
              {participants} participantes
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function TimeUnit({ value, label, isUrgent }: { value: number; label: string; isUrgent: boolean }) {
  return (
    <div className={cn(
      "flex items-baseline gap-0.5 px-1.5 py-0.5 rounded",
      isUrgent ? "bg-destructive/10" : "bg-card"
    )}>
      <span className={cn(
        "text-sm font-bold tabular-nums",
        isUrgent ? "text-destructive" : "text-foreground"
      )}>
        {value.toString().padStart(2, '0')}
      </span>
      <span className={cn(
        "text-[10px]",
        isUrgent ? "text-destructive/70" : "text-muted-foreground"
      )}>
        {label}
      </span>
    </div>
  );
}
