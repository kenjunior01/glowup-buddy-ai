import { useNavigate } from 'react-router-dom';
import { 
  Target, MessageCircle, ShoppingBag, Trophy, 
  Users, Bell 
} from 'lucide-react';

export default function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    { icon: Target, label: 'Objetivo', path: '/dashboard' },
    { icon: Trophy, label: 'Desafios', path: '/challenges' },
    { icon: ShoppingBag, label: 'Loja', path: '/marketplace' },
    { icon: MessageCircle, label: 'Chat IA', path: '/chat' },
    { icon: Users, label: 'Social', path: '/social' },
    { icon: Bell, label: 'Alertas', path: '/notifications' },
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Ações Rápidas</h3>
      <div className="grid grid-cols-3 gap-2">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={() => navigate(action.path)}
            className="bento-card p-3 flex flex-col items-center gap-1.5 hover:bg-muted/60 transition-colors"
          >
            <action.icon className="h-5 w-5 text-primary" />
            <span className="text-[10px] font-medium text-muted-foreground">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
