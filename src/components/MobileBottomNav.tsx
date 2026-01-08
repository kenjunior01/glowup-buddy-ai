import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Users, Trophy, Store, User, Sparkles } from 'lucide-react';

export default function MobileBottomNav() {
  const location = useLocation();
  const [tappedItem, setTappedItem] = useState<string | null>(null);
  
  const navItems = [
    { icon: Home, label: 'Home', path: '/dashboard', emoji: '🏠' },
    { icon: Users, label: 'Social', path: '/social', emoji: '👥' },
    { icon: Store, label: 'Loja', path: '/marketplace', emoji: '🛍️' },
    { icon: Trophy, label: 'Desafios', path: '/challenges', emoji: '🏆' },
    { icon: User, label: 'Perfil', path: '/profile', emoji: '👤' },
  ];

  const handleTap = (path: string) => {
    setTappedItem(path);
    setTimeout(() => setTappedItem(null), 300);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border/50 z-50 safe-area-pb">
      {/* Glow effect on top */}
      <div className="absolute -top-4 left-0 right-0 h-4 bg-gradient-to-t from-card/50 to-transparent pointer-events-none" />
      
      <div className="grid grid-cols-5 h-16 relative">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          const isTapped = tappedItem === path;
          
          return (
            <NavLink
              key={path}
              to={path}
              onClick={() => handleTap(path)}
              className={`flex flex-col items-center justify-center relative transition-all duration-300 ${
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {/* Background glow for active */}
              {isActive && (
                <div className="absolute inset-0 bg-primary/5 rounded-t-2xl animate-fade-in" />
              )}
              
              {/* Icon with animations */}
              <div className={`relative transition-all duration-300 ${
                isTapped ? 'scale-125' : ''
              } ${isActive ? 'scale-110' : 'scale-100'}`}>
                <Icon 
                  size={22}
                  className={`mb-0.5 transition-all duration-300 ${
                    isActive ? 'text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]' : ''
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                
                {/* Sparkle effect on tap */}
                {isTapped && (
                  <Sparkles 
                    className="absolute -top-1 -right-1 w-3 h-3 text-accent animate-scale-in"
                  />
                )}
              </div>
              
              {/* Label with animation */}
              <span className={`text-[10px] font-medium transition-all duration-300 ${
                isActive 
                  ? 'text-primary font-semibold' 
                  : 'text-muted-foreground'
              }`}>
                {label}
              </span>
              
              {/* Active indicator - animated bar */}
              {isActive && (
                <div className="absolute -top-0.5 left-1/2 transform -translate-x-1/2">
                  <div className="w-8 h-1 bg-gradient-to-r from-primary via-accent to-primary rounded-full animate-pulse" />
                </div>
              )}
              
              {/* Ripple effect on tap */}
              {isTapped && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-12 h-12 rounded-full bg-primary/20 animate-scale-in" />
                </div>
              )}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}