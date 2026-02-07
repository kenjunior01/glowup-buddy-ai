import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Timer, Target, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FocusTimerProps {
  onComplete?: () => void;
  className?: string;
}

type TimerMode = 'focus' | 'break' | 'longBreak';

const TIMER_PRESETS = {
  focus: 25 * 60,
  break: 5 * 60,
  longBreak: 15 * 60,
};

const MODE_LABELS = {
  focus: 'Foco',
  break: 'Pausa',
  longBreak: 'Pausa Longa',
};

export default function FocusTimer({ onComplete, className }: FocusTimerProps) {
  const [mode, setMode] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState(TIMER_PRESETS.focus);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);

  const totalTime = TIMER_PRESETS[mode];
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      if (mode === 'focus') {
        setSessions((prev) => prev + 1);
        onComplete?.();
      }
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode, onComplete]);

  const toggleTimer = useCallback(() => {
    setIsRunning((prev) => !prev);
  }, []);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(TIMER_PRESETS[mode]);
  }, [mode]);

  const switchMode = useCallback((newMode: TimerMode) => {
    setMode(newMode);
    setTimeLeft(TIMER_PRESETS[newMode]);
    setIsRunning(false);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn("bento-card p-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Timer className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Focus Timer</h3>
            <p className="text-[10px] text-muted-foreground">{sessions} sessões hoje</p>
          </div>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted/50">
          <Zap className="w-3 h-3 text-primary" />
          <span className="text-[10px] font-medium text-muted-foreground">
            {sessions * 25} pontos
          </span>
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="flex gap-1 p-1 bg-muted/40 rounded-xl mb-6">
        {(['focus', 'break', 'longBreak'] as TimerMode[]).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={cn(
              "flex-1 py-2 text-xs font-medium rounded-lg transition-all",
              mode === m
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {MODE_LABELS[m]}
          </button>
        ))}
      </div>

      {/* Timer Display */}
      <div className="relative flex items-center justify-center mb-6">
        {/* Progress Ring Background */}
        <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="4"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={mode === 'focus' ? "hsl(var(--primary))" : "hsl(var(--accent))"}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${progress * 2.827} 282.7`}
            className="transition-all duration-1000"
          />
        </svg>

        {/* Timer Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-foreground tracking-tight">
            {formatTime(timeLeft)}
          </span>
          <span className="text-xs text-muted-foreground mt-1">
            {MODE_LABELS[mode]}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={resetTimer}
          className="w-10 h-10 rounded-xl border-border/60"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
        
        <Button
          size="lg"
          onClick={toggleTimer}
          className={cn(
            "w-14 h-14 rounded-xl",
            isRunning 
              ? "bg-muted hover:bg-muted/80 text-foreground" 
              : "bg-primary hover:bg-primary/90 text-primary-foreground"
          )}
        >
          {isRunning ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5 ml-0.5" />
          )}
        </Button>

        <Button
          variant="outline"
          size="icon"
          disabled
          className="w-10 h-10 rounded-xl border-border/60 opacity-50"
        >
          <Target className="w-4 h-4" />
        </Button>
      </div>

      {/* Session Indicators */}
      <div className="flex items-center justify-center gap-1.5 mt-6">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-2 h-2 rounded-full transition-all",
              i < (sessions % 4)
                ? "bg-primary"
                : "bg-muted"
            )}
          />
        ))}
        <span className="text-[10px] text-muted-foreground ml-2">
          Pausa longa em {4 - (sessions % 4)} sessões
        </span>
      </div>
    </div>
  );
}
