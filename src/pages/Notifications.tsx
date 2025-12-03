import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import NotificationsPage from '@/components/NotificationsPage';
import MobileBottomNav from '@/components/MobileBottomNav';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Notifications() {
  const [userId, setUserId] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      setUserId(session.user.id);
    };
    checkAuth();
  }, [navigate]);

  if (!userId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border mobile-safe">
        <div className="p-4 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Notificações</h1>
        </div>
      </div>
      <div className="p-4">
        <NotificationsPage />
      </div>
      <MobileBottomNav />
    </div>
  );
}
