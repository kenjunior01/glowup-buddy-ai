import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Timer, Zap, Volume2, VolumeX, Coffee, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useScoring } from '@/hooks/useScoring';
import { useToast } from '@/hooks/use-toast';

interface FocusTimerProps {
  className?: string;
}

type TimerMode = 'focus' | 'break' | 'longBreak';

const TIMER_PRESETS = {
  focus: 25 * 60,
  break: 5 * 60,
  longBreak: 15 * 60,
};

const MODE_CONFIG = {
  focus: { label: 'Foco', icon: Target, color: 'primary' },
  break: { label: 'Pausa', icon: Coffee, color: 'accent' },
  longBreak: { label: 'Pausa Longa', icon: Coffee, color: 'accent' },
};

export default function FocusTimer({ className }: FocusTimerProps) {
  const [mode, setMode] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState(TIMER_PRESETS.focus);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [todayPoints, setTodayPoints] = useState(0);
  
  const { toast } = useToast();
  const { addPoints } = useScoring({ userId: userId || '' });

  const totalTime = TIMER_PRESETS[mode];
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  // Get user and load today's sessions
  useEffect(() => {
    const loadUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
      }
    };
    loadUserData();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      handleSessionComplete();
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const handleSessionComplete = async () => {
    // Play notification sound
    if (soundEnabled) {
      playNotificationSound();
    }

    if (mode === 'focus') {
      const newSessions = sessions + 1;
      setSessions(newSessions);
      
      // Award points for focus session
      if (userId) {
        await addPoints('FOCUS_SESSION', 0);
        setTodayPoints(prev => prev + 25);
        
        // Bonus for completing 4 sessions
        if (newSessions % 4 === 0) {
          await addPoints('FOCUS_STREAK_4', 0);
          setTodayPoints(prev => prev + 50);
          
          toast({
            title: "⚡ Bônus de Foco!",
            description: "4 sessões consecutivas! +50 pontos extras!",
          });
        }
      }

      // Auto-switch to break
      if (newSessions % 4 === 0) {
        setMode('longBreak');
        setTimeLeft(TIMER_PRESETS.longBreak);
      } else {
        setMode('break');
        setTimeLeft(TIMER_PRESETS.break);
      }
    } else {
      // Break finished, back to focus
      setMode('focus');
      setTimeLeft(TIMER_PRESETS.focus);
    }
  };

  const playNotificationSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 880;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

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

  const ModeIcon = MODE_CONFIG[mode].icon;

  return (
    <div className={cn("bento-card p-5", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Timer className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Focus Timer</h3>
            <p className="text-[10px] text-muted-foreground">{sessions} sessões hoje</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-lg hover:bg-muted/60 transition-colors"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-muted-foreground" />
            ) : (
              <VolumeX className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10">
            <Zap className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-semibold text-primary">
              +{todayPoints}
            </span>
          </div>
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="flex gap-1 p-1 bg-muted/40 rounded-xl mb-5">
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
            {MODE_CONFIG[m].label}
          </button>
        ))}
      </div>

      {/* Timer Display */}
      <div className="relative flex items-center justify-center mb-5">
        {/* Progress Ring */}
        <svg className="w-44 h-44 transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="3"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={mode === 'focus' ? "hsl(var(--primary))" : "hsl(var(--accent))"}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${progress * 2.827} 282.7`}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>

        {/* Timer Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center mb-2",
            mode === 'focus' ? "bg-primary/10" : "bg-accent/10"
          )}>
            <ModeIcon className={cn(
              "w-5 h-5",
              mode === 'focus' ? "text-primary" : "text-accent"
            )} />
          </div>
          <span className="text-4xl font-bold text-foreground tracking-tight font-mono">
            {formatTime(timeLeft)}
          </span>
          <span className="text-xs text-muted-foreground mt-1">
            {MODE_CONFIG[mode].label}
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
            "w-14 h-14 rounded-xl transition-all",
            isRunning 
              ? "bg-muted hover:bg-muted/80 text-foreground" 
              : mode === 'focus'
                ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                : "bg-accent hover:bg-accent/90 text-accent-foreground"
          )}
        >
          {isRunning ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5 ml-0.5" />
          )}
        </Button>

        <div className="w-10 h-10" /> {/* Spacer for balance */}
      </div>

      {/* Session Progress */}
      <div className="mt-5 pt-4 border-t border-border/40">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">Progresso para pausa longa</span>
          <span className="text-xs font-medium text-foreground">{sessions % 4}/4</span>
        </div>
        <div className="flex gap-1.5">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "flex-1 h-1.5 rounded-full transition-all",
                i < (sessions % 4)
                  ? "bg-primary"
                  : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
