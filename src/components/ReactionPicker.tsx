import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Smile } from 'lucide-react';

interface ReactionPickerProps {
  onReact: (emoji: string) => void;
  currentReaction?: string;
}

const REACTIONS = [
  { emoji: '❤️', label: 'Amei' },
  { emoji: '🔥', label: 'Incrível' },
  { emoji: '👏', label: 'Parabéns' },
  { emoji: '💪', label: 'Força' },
  { emoji: '🎉', label: 'Celebrar' },
  { emoji: '😮', label: 'Uau' },
  { emoji: '🙌', label: 'Top' },
  { emoji: '⭐', label: 'Favorito' },
];

export default function ReactionPicker({ onReact, currentReaction }: ReactionPickerProps) {
  const [open, setOpen] = useState(false);

  const handleReact = (emoji: string) => {
    onReact(emoji);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 px-2 hover:bg-muted/80"
        >
          {currentReaction ? (
            <span className="text-lg">{currentReaction}</span>
          ) : (
            <Smile className="h-4 w-4" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <div className="flex gap-1">
          {REACTIONS.map(({ emoji, label }) => (
            <button
              key={emoji}
              onClick={() => handleReact(emoji)}
              className={`text-xl p-1.5 rounded-lg hover:bg-muted transition-all hover:scale-125 ${
                currentReaction === emoji ? 'bg-primary/20 scale-110' : ''
              }`}
              title={label}
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
