import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Heart, MessageCircle, Share, Trophy, Target, Clock, Zap, Bookmark } from 'lucide-react';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';

const REACTIONS = [
  { emoji: '❤️', label: 'Amei' },
  { emoji: '🔥', label: 'Incrível' },
  { emoji: '👏', label: 'Parabéns' },
  { emoji: '💪', label: 'Força' },
  { emoji: '🎉', label: 'Celebrar' },
  { emoji: '😮', label: 'Uau' },
];

interface PostCardProps {
  post: {
    id: string;
    user: {
      name: string;
      avatar?: string;
      level?: number;
    };
    type: 'achievement' | 'progress' | 'challenge' | 'social';
    content: string;
    image?: string;
    timestamp: string;
    likes: number;
    comments: number;
    achievement?: {
      title: string;
      points: number;
      icon: string;
    };
    progress?: {
      current: number;
      target: number;
      unit: string;
    };
  };
}

export default function PostCard({ post }: PostCardProps) {
  const [currentReaction, setCurrentReaction] = useState<string | null>(null);
  const [likesCount, setLikesCount] = useState(post.likes);
  const [showReactions, setShowReactions] = useState(false);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleDoubleTap = () => {
    if (!currentReaction) {
      handleReact('❤️');
      setShowHeartBurst(true);
      setTimeout(() => setShowHeartBurst(false), 1000);
    }
  };

  const handleReact = (emoji: string) => {
    setIsLikeAnimating(true);
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }

    if (currentReaction === emoji) {
      setCurrentReaction(null);
      setLikesCount(prev => prev - 1);
    } else {
      if (!currentReaction) {
        setLikesCount(prev => prev + 1);
      }
      setCurrentReaction(emoji);
    }
    setShowReactions(false);
    
    setTimeout(() => setIsLikeAnimating(false), 300);
  };

  const getPostIcon = () => {
    switch (post.type) {
      case 'achievement': return <Trophy className="w-4 h-4 text-yellow-500" />;
      case 'progress': return <Target className="w-4 h-4 text-blue-500" />;
      case 'challenge': return <Zap className="w-4 h-4 text-purple-500" />;
      default: return null;
    }
  };

  return (
    <div 
      className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md"
      onDoubleClick={handleDoubleTap}
    >
      {/* Header */}
      <div className="flex items-center p-4 gap-3">
        <Avatar className="w-12 h-12 ring-2 ring-primary/20">
          <AvatarImage src={post.user.avatar} alt={post.user.name} />
          <AvatarFallback className="text-sm font-semibold bg-gradient-to-br from-primary to-primary-dark text-primary-foreground">
            {post.user.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-base truncate">{post.user.name}</h4>
            {post.user.level && (
              <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-primary/10 text-primary">
                Nv. {post.user.level}
              </Badge>
            )}
            {getPostIcon()}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
            <Clock className="w-3 h-3" />
            <span>{post.timestamp}</span>
          </div>
        </div>
      </div>

      {/* Achievement card */}
      {post.achievement && (
        <div className="mx-4 mb-3 bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-yellow-500/20 p-4 rounded-xl border border-yellow-500/30">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-base">Nova Conquista! 🎉</p>
              <p className="text-sm text-muted-foreground">{post.achievement.title}</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-yellow-500">+{post.achievement.points}</span>
              <p className="text-xs text-muted-foreground">pontos</p>
            </div>
          </div>
        </div>
      )}

      {/* Progress card */}
      {post.progress && (
        <div className="mx-4 mb-3 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 p-4 rounded-xl border border-blue-500/20">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium">Progresso</span>
            <span className="text-sm text-muted-foreground">
              {post.progress.current} / {post.progress.target} {post.progress.unit}
            </span>
          </div>
          <div className="relative h-3 bg-muted rounded-full overflow-hidden">
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-1000"
              style={{ width: `${(post.progress.current / post.progress.target) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-4 pb-3 relative">
        <p className="text-base leading-relaxed">{post.content}</p>
        
        {/* Heart burst animation on double tap */}
        {showHeartBurst && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Heart 
              className="w-24 h-24 text-red-500 fill-red-500 animate-[heartBurst_0.8s_ease-out_forwards]" 
            />
          </div>
        )}
      </div>

      {/* Actions - TikTok/Instagram style */}
      <div className="px-4 pb-4 pt-2 border-t border-border/30">
        <div className="flex items-center justify-between">
          {/* Left actions */}
          <div className="flex items-center gap-1">
            {/* Like button with long press for reactions */}
            <div className="relative">
              <Button 
                variant="ghost" 
                size="sm" 
                className={cn(
                  "gap-2 px-3 h-10 rounded-xl transition-all duration-200",
                  currentReaction && "bg-red-500/10"
                )}
                onClick={() => handleReact('❤️')}
                onMouseEnter={() => setShowReactions(true)}
                onMouseLeave={() => setShowReactions(false)}
              >
                {currentReaction ? (
                  <span className={cn(
                    "text-xl transition-transform",
                    isLikeAnimating && "animate-bounce-subtle"
                  )}>
                    {currentReaction}
                  </span>
                ) : (
                  <Heart className={cn(
                    "w-6 h-6 transition-all",
                    isLikeAnimating && "scale-125 text-red-500"
                  )} />
                )}
                <span className="font-semibold">{likesCount}</span>
              </Button>
              
              {/* Reactions popup */}
              {showReactions && (
                <div 
                  className="absolute bottom-full left-0 mb-2 bg-card rounded-full shadow-xl border border-border/50 p-2 flex gap-1 animate-scale-in z-50"
                  onMouseEnter={() => setShowReactions(true)}
                  onMouseLeave={() => setShowReactions(false)}
                >
                  {REACTIONS.map(({ emoji, label }) => (
                    <button
                      key={emoji}
                      onClick={() => handleReact(emoji)}
                      className={cn(
                        "w-10 h-10 flex items-center justify-center text-xl rounded-full transition-all hover:scale-125 hover:bg-muted",
                        currentReaction === emoji && "bg-primary/20 scale-110"
                      )}
                      title={label}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Comment button */}
            <Button variant="ghost" size="sm" className="gap-2 px-3 h-10 rounded-xl">
              <MessageCircle className="w-6 h-6" />
              <span className="font-semibold">{post.comments}</span>
            </Button>
            
            {/* Share button */}
            <Button variant="ghost" size="sm" className="px-3 h-10 rounded-xl">
              <Share className="w-6 h-6" />
            </Button>
          </div>
          
          {/* Save button */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="px-3 h-10 rounded-xl"
            onClick={() => setIsSaved(!isSaved)}
          >
            <Bookmark className={cn(
              "w-6 h-6 transition-all",
              isSaved && "fill-foreground"
            )} />
          </Button>
        </div>
      </div>

      <style>{`
        @keyframes heartBurst {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          50% {
            transform: scale(1.2);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
