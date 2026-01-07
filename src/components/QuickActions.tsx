import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Target, MessageCircle, ShoppingBag, Trophy, 
  Sparkles, Users, Bell, Settings 
} from 'lucide-react';

export default function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    { icon: Target, label: 'Novo Objetivo', path: '/dashboard', color: 'text-primary' },
    { icon: Trophy, label: 'Desafios', path: '/challenges', color: 'text-yellow-500' },
    { icon: ShoppingBag, label: 'Marketplace', path: '/marketplace', color: 'text-green-500' },
    { icon: MessageCircle, label: 'Chat IA', path: '/chat', color: 'text-blue-500' },
    { icon: Users, label: 'Social', path: '/social', color: 'text-purple-500' },
    { icon: Bell, label: 'Notificações', path: '/notifications', color: 'text-orange-500' },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Ações Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-2">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant="ghost"
            className="flex flex-col h-auto py-3 hover:bg-muted/80 transition-all group"
            onClick={() => navigate(action.path)}
          >
            <action.icon className={`h-5 w-5 mb-1 ${action.color} group-hover:scale-110 transition-transform`} />
            <span className="text-[10px] text-muted-foreground group-hover:text-foreground">
              {action.label}
            </span>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
