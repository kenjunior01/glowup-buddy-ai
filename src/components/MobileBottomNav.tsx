import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Users, Trophy, Store, User } from 'lucide-react';
import { Badge } from './ui/badge';

export default function MobileBottomNav() {
  const location = useLocation();
  
  const navItems = [
    { icon: Home, label: 'Home', path: '/dashboard' },
    { icon: Users, label: 'Social', path: '/social' },
    { icon: Store, label: 'Loja', path: '/marketplace' },
    { icon: Trophy, label: 'Desafios', path: '/challenges' },
    { icon: User, label: 'Perfil', path: '/profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border z-50 safe-area-pb">
      <div className="grid grid-cols-5 h-16">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          
          return (
            <NavLink
              key={path}
              to={path}
              className={`flex flex-col items-center justify-center relative scale-press tap-highlight transition-all duration-200 ${
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon 
                size={20} 
                className={`mb-1 transition-all duration-200 ${
                  isActive ? 'scale-110' : 'scale-100'
                }`} 
              />
              <span className={`text-xs font-medium transition-all duration-200 ${
                isActive ? 'scale-105 text-primary' : 'text-muted-foreground'
              }`}>
                {label}
              </span>
              
              {isActive && (
                <div className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-8 h-0.5 gradient-primary rounded-full" />
              )}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}