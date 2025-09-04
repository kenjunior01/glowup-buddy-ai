import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Heart, MessageCircle, Share, Trophy, Target, Clock, Zap } from 'lucide-react';
import { Badge } from './ui/badge';

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
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  const getPostIcon = () => {
    switch (post.type) {
      case 'achievement': return <Trophy className="w-4 h-4 text-warning" />;
      case 'progress': return <Target className="w-4 h-4 text-info" />;
      case 'challenge': return <Zap className="w-4 h-4 text-accent" />;
      default: return null;
    }
  };

  return (
    <div className="post-card p-4 space-y-4 animate-fade-in">
      {/* Header */}
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

      {/* Achievement Banner */}
      {post.achievement && (
        <div className="gradient-success p-3 rounded-xl text-white animate-bounce-subtle">
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

      {/* Progress Bar */}
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
              className="gradient-primary h-2 rounded-full progress-fill transition-all duration-1000"
              style={{ width: `${(post.progress.current / post.progress.target) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="space-y-3">
        <p className="text-sm leading-relaxed">{post.content}</p>
        
        {post.image && (
          <div className="rounded-xl overflow-hidden shadow-medium">
            <img 
              src={post.image} 
              alt="Post content" 
              className="w-full h-48 object-cover"
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={`scale-press tap-highlight transition-all duration-200 ${
              isLiked ? 'text-red-500' : 'text-muted-foreground'
            }`}
          >
            <Heart 
              className={`w-4 h-4 mr-1 transition-transform duration-200 ${
                isLiked ? 'scale-110 fill-current' : ''
              }`} 
            />
            <span className="text-sm">{likesCount}</span>
          </Button>
          
          <Button variant="ghost" size="sm" className="scale-press tap-highlight">
            <MessageCircle className="w-4 h-4 mr-1" />
            <span className="text-sm">{post.comments}</span>
          </Button>
        </div>
        
        <Button variant="ghost" size="sm" className="scale-press tap-highlight">
          <Share className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}