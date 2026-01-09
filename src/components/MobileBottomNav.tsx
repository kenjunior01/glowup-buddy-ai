import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Users, Trophy, Store, User, Plus, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MobileBottomNav() {
  const location = useLocation();
  const [tappedItem, setTappedItem] = useState<string | null>(null);
  
  const navItems = [
    { icon: Home, label: 'Home', path: '/dashboard' },
    { icon: Users, label: 'Social', path: '/social' },
    { icon: null, label: 'Criar', path: '/challenges', isCenter: true },
    { icon: Store, label: 'Loja', path: '/marketplace' },
    { icon: User, label: 'Perfil', path: '/profile' },
  ];

  const handleTap = (path: string) => {
    setTappedItem(path);
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    setTimeout(() => setTappedItem(null), 300);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 safe-area-pb">
      {/* Blur background */}
      <div className="absolute inset-0 bg-card/90 backdrop-blur-2xl border-t border-border/30" />
      
      {/* Shadow gradient on top */}
      <div className="absolute -top-6 left-0 right-0 h-6 bg-gradient-to-t from-background/80 to-transparent pointer-events-none" />
      
      <div className="relative grid grid-cols-5 h-20 items-center px-2">
        {navItems.map(({ icon: Icon, label, path, isCenter }) => {
          const isActive = location.pathname === path;
          const isTapped = tappedItem === path;
          
          // Center button (Create/Add)
          if (isCenter) {
            return (
              <NavLink
                key={path}
                to={path}
                onClick={() => handleTap(path)}
                className="flex items-center justify-center -mt-4"
              >
                <div className={cn(
                  "relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300",
                  "bg-gradient-to-br from-primary to-primary-dark shadow-lg",
                  isTapped ? "scale-90" : "scale-100",
                  isActive && "shadow-[0_0_25px_hsl(var(--primary)/0.5)]"
                )}>
                  {/* Pulse ring */}
                  <div className="absolute inset-0 rounded-2xl bg-primary/50 animate-[ping_2s_ease-in-out_infinite]" />
                  
                  <Plus className="w-7 h-7 text-primary-foreground relative z-10" strokeWidth={2.5} />
                  
                  {/* Sparkle decorations */}
                  <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-yellow-400 animate-wiggle" />
                </div>
              </NavLink>
            );
          }
          
          return (
            <NavLink
              key={path}
              to={path}
              onClick={() => handleTap(path)}
              className="flex flex-col items-center justify-center relative h-full"
            >
              {/* Active indicator line */}
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-primary to-primary-dark rounded-full animate-scale-in" />
              )}
              
              {/* Background glow for active */}
              {isActive && (
                <div className="absolute inset-2 bg-primary/10 rounded-2xl animate-fade-in" />
              )}
              
              {/* Icon container */}
              <div className={cn(
                "relative transition-all duration-300 mb-1",
                isTapped && "scale-125",
                isActive && "scale-110"
              )}>
                {Icon && (
                  <Icon 
                    className={cn(
                      "w-7 h-7 transition-all duration-300",
                      isActive 
                        ? "text-primary drop-shadow-[0_0_10px_hsl(var(--primary)/0.6)]" 
                        : "text-muted-foreground"
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                )}
                
                {/* Tap sparkle */}
                {isTapped && (
                  <Sparkles className="absolute -top-2 -right-2 w-4 h-4 text-primary animate-scale-in" />
                )}
              </div>
              
              {/* Label */}
              <span className={cn(
                "text-xs font-medium transition-all duration-300",
                isActive 
                  ? "text-primary font-semibold" 
                  : "text-muted-foreground"
              )}>
                {label}
              </span>
              
              {/* Ripple on tap */}
              {isTapped && (
                <div className="absolute inset-2 flex items-center justify-center pointer-events-none">
                  <div className="w-14 h-14 rounded-full bg-primary/20 animate-scale-in" />
                </div>
              )}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}
