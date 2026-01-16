import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Users, Trophy, Store, User, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MobileBottomNav() {
  const location = useLocation();
  const [tappedItem, setTappedItem] = useState<string | null>(null);
  
  const navItems = [
    { icon: Home, label: 'Home', path: '/dashboard', emoji: '🏠' },
    { icon: Users, label: 'Social', path: '/social', emoji: '👥' },
    { icon: null, label: 'Criar', path: '/challenges', isCenter: true, emoji: '✨' },
    { icon: Store, label: 'Loja', path: '/advertising', emoji: '📢' },
    { icon: User, label: 'Perfil', path: '/profile', emoji: '👤' },
  ];

  const handleTap = (path: string) => {
    setTappedItem(path);
    if (navigator.vibrate) navigator.vibrate(10);
    setTimeout(() => setTappedItem(null), 200);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 safe-area-pb">
      {/* Background */}
      <div className="absolute inset-0 bg-card/95 backdrop-blur-xl border-t border-border/30" />
      
      <div className="relative grid grid-cols-5 h-16 items-center px-1">
        {navItems.map(({ icon: Icon, label, path, isCenter, emoji }) => {
          const isActive = location.pathname === path;
          const isTapped = tappedItem === path;
          
          // Center button
          if (isCenter) {
            return (
              <NavLink
                key={path}
                to={path}
                onClick={() => handleTap(path)}
                className="flex items-center justify-center -mt-5"
              >
                <div className={cn(
                  "relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200",
                  "bg-gradient-to-br from-primary to-accent shadow-lg",
                  isTapped ? "scale-90" : "scale-100",
                  isActive && "shadow-[0_0_20px_hsl(var(--primary)/0.4)]"
                )}>
                  <Plus className="w-5 h-5 text-primary-foreground" strokeWidth={2.5} />
                  <span className="absolute -top-1 -right-1 text-xs">{emoji}</span>
                </div>
              </NavLink>
            );
          }
          
          return (
            <NavLink
              key={path}
              to={path}
              onClick={() => handleTap(path)}
              className="flex flex-col items-center justify-center h-full py-1"
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute top-0 w-6 h-0.5 bg-primary rounded-full" />
              )}
              
              {/* Icon/Emoji */}
              <div className={cn(
                "transition-all duration-200 mb-0.5",
                isTapped && "scale-110",
                isActive && "scale-105"
              )}>
                {isActive ? (
                  <span className="text-lg">{emoji}</span>
                ) : (
                  Icon && <Icon className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
                )}
              </div>
              
              {/* Label */}
              <span className={cn(
                "text-[10px] font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}
