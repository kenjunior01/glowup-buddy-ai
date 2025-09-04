import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Plus, Zap } from 'lucide-react';

interface StoryRingProps {
  user?: {
    name: string;
    avatar?: string;
    hasStory?: boolean;
    isViewed?: boolean;
  };
  isAddStory?: boolean;
  onClick?: () => void;
}

export default function StoryRing({ user, isAddStory, onClick }: StoryRingProps) {
  if (isAddStory) {
    return (
      <div 
        onClick={onClick}
        className="flex flex-col items-center space-y-2 scale-press tap-highlight"
      >
        <div className="story-size relative">
          <div className="w-full h-full gradient-primary rounded-full p-0.5 shadow-medium">
            <div className="w-full h-full bg-card rounded-full flex items-center justify-center">
              <Plus size={20} className="text-primary" />
            </div>
          </div>
        </div>
        <span className="text-xs font-medium text-center">Sua História</span>
      </div>
    );
  }

  return (
    <div 
      onClick={onClick}
      className="flex flex-col items-center space-y-2 scale-press tap-highlight"
    >
      <div className="story-size relative">
        <div 
          className={`w-full h-full rounded-full p-0.5 shadow-medium transition-all duration-300 ${
            user?.hasStory 
              ? user?.isViewed 
                ? 'bg-muted' 
                : 'gradient-story story-ring'
              : 'bg-border'
          }`}
        >
          <Avatar className="w-full h-full border-2 border-card">
            <AvatarImage src={user?.avatar} alt={user?.name} />
            <AvatarFallback className="text-sm font-semibold">
              {user?.name?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
        
        {user?.hasStory && !user?.isViewed && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 gradient-success rounded-full border-2 border-card flex items-center justify-center">
            <Zap size={10} className="text-white" />
          </div>
        )}
      </div>
      <span className="text-xs font-medium text-center max-w-16 truncate">
        {user?.name}
      </span>
    </div>
  );
}