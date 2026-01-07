import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Heart, MessageCircle, Share, Trophy, Target, Clock, Zap } from 'lucide-react';
import { Badge } from './ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

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

  const handleReact = (emoji: string) => {
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
    <div className="bg-card rounded-xl border p-4 space-y-4">
      <div className="flex items-center space-x-3">
        <Avatar className="w-10 h-10">
          <AvatarImage src={post.user.avatar} alt={post.user.name} />
          <AvatarFallback className="text-sm font-semibold">
            {post.user.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h4 className="font-semibold text-sm">{post.user.name}</h4>
            {post.user.level && (
              <Badge variant="secondary" className="text-xs px-2 py-0">
                Nv. {post.user.level}
              </Badge>
            )}
            {getPostIcon()}
          </div>
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{post.timestamp}</span>
          </div>
        </div>
      </div>

      {post.achievement && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-3 rounded-xl text-white">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-sm">Nova Conquista!</p>
              <p className="text-xs opacity-90">{post.achievement.title}</p>
            </div>
            <div className="ml-auto">
              <span className="font-bold text-lg">+{post.achievement.points}</span>
              <p className="text-xs opacity-90">pontos</p>
            </div>
          </div>
        </div>
      )}

      {post.progress && (
        <div className="bg-secondary p-3 rounded-xl">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Progresso</span>
            <span className="text-sm text-muted-foreground">
              {post.progress.current} / {post.progress.target} {post.progress.unit}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-1000"
              style={{ width: `${(post.progress.current / post.progress.target) * 100}%` }}
            />
          </div>
        </div>
      )}

      <p className="text-sm leading-relaxed">{post.content}</p>

      <div className="flex items-center justify-between pt-2 border-t">
        <div className="flex items-center space-x-2">
          <Popover open={showReactions} onOpenChange={setShowReactions}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className={currentReaction ? 'text-primary' : ''}>
                {currentReaction ? (
                  <span className="text-lg mr-1">{currentReaction}</span>
                ) : (
                  <Heart className="w-4 h-4 mr-1" />
                )}
                <span className="text-sm">{likesCount}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" side="top">
              <div className="flex gap-1">
                {REACTIONS.map(({ emoji, label }) => (
                  <button
                    key={emoji}
                    onClick={() => handleReact(emoji)}
                    className={`text-xl p-1.5 rounded-lg hover:bg-muted transition-all hover:scale-125 ${
                      currentReaction === emoji ? 'bg-primary/20' : ''
                    }`}
                    title={label}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          
          <Button variant="ghost" size="sm">
            <MessageCircle className="w-4 h-4 mr-1" />
            <span className="text-sm">{post.comments}</span>
          </Button>
        </div>
        
        <Button variant="ghost" size="sm">
          <Share className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
