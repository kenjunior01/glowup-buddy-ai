import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, BarChart3, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MobileBottomNav() {
  const location = useLocation();
  const [tappedItem, setTappedItem] = useState<string | null>(null);

  const navItems = [
    { icon: Home, label: 'Hoje', path: '/dashboard', emoji: '🎯' },
    { icon: BarChart3, label: 'Progresso', path: '/progress', emoji: '📊' },
    { icon: User, label: 'Perfil', path: '/profile', emoji: '👤' },
  ];

  const handleTap = (path: string) => {
    setTappedItem(path);
    if (navigator.vibrate) navigator.vibrate(10);
    setTimeout(() => setTappedItem(null), 200);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 safe-area-pb">
      <div className="absolute inset-0 bg-card/95 backdrop-blur-xl border-t border-border/30" />

      <div className="relative grid grid-cols-3 h-16 items-center px-4">
        {navItems.map(({ icon: Icon, label, path, emoji }) => {
          const isActive = location.pathname === path;
          const isTapped = tappedItem === path;

          return (
            <NavLink
              key={path}
              to={path}
              onClick={() => handleTap(path)}
              className="flex flex-col items-center justify-center h-full py-1"
            >
              {isActive && (
                <div className="absolute top-0 w-8 h-0.5 bg-primary rounded-full" />
              )}

              <div className={cn(
                "transition-all duration-200 mb-0.5",
                isTapped && "scale-125",
                isActive && "scale-110"
              )}>
                {isActive ? (
                  <span className="text-xl">{emoji}</span>
                ) : (
                  <Icon className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
                )}
              </div>

              <span className={cn(
                "text-[10px] font-semibold transition-colors",
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
