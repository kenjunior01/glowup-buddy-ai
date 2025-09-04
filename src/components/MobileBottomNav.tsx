import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Users, Trophy, MessageCircle, User } from 'lucide-react';
import { Badge } from './ui/badge';

export default function MobileBottomNav() {
  const location = useLocation();
  
  const navItems = [
    { icon: Home, label: 'Home', path: '/dashboard' },
    { icon: Users, label: 'Social', path: '/social', badge: 3 },
    { icon: Trophy, label: 'Challenges', path: '/challenges', badge: 1 },
    { icon: MessageCircle, label: 'Chat', path: '/chat', badge: 5 },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border z-50 safe-area-pb">
      <div className="grid grid-cols-5 h-16">
        {navItems.map(({ icon: Icon, label, path, badge }) => {
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
              <div className="relative">
                <Icon 
                  size={20} 
                  className={`mb-1 transition-all duration-200 ${
                    isActive ? 'scale-110' : 'scale-100'
                  }`} 
                />
                {badge && badge > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-4 w-4 text-xs p-0 flex items-center justify-center notification-pulse rounded-full"
                  >
                    {badge > 9 ? '9+' : badge}
                  </Badge>
                )}
              </div>
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