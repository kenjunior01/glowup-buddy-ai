import React, { useState, useEffect } from 'react';
import MyChallenges from '@/components/MyChallenges';
import UsersList from '@/components/UsersList';
import ChallengeModal from '@/components/ChallengeModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Target, Plus, Zap, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function Challenges() {
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedUserName, setSelectedUserName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    active: 0,
    completed: 0,
    pending: 0,
  });

  useEffect(() => {
    fetchChallengeStats();
  }, []);

  const fetchChallengeStats = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setLoading(false);
        return;
      }

      const { data: challenges, error } = await supabase
        .from('challenges')
        .select('status')
        .or(`creator_id.eq.${session.user.id},challenger_id.eq.${session.user.id}`);

      if (error) {
        console.error('Error fetching challenges:', error);
        setLoading(false);
        return;
      }

      const active = challenges?.filter(c => c.status === 'accepted').length || 0;
      const completed = challenges?.filter(c => c.status === 'completed').length || 0;
      const pending = challenges?.filter(c => c.status === 'pending').length || 0;

      setStats({ active, completed, pending });
    } catch (error) {
      console.error('Error in fetchChallengeStats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChallengeUser = (userId: string, userName: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setShowChallengeModal(true);
  };

  const challengeStats = [
    { label: 'Ativos', value: stats.active, icon: Zap, color: 'text-blue-500' },
    { label: 'Completados', value: stats.completed, icon: Trophy, color: 'text-green-500' },
    { label: 'Pendentes', value: stats.pending, icon: Target, color: 'text-orange-500' },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border mobile-safe">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gradient flex items-center gap-2">
                <Trophy className="w-6 h-6" />
                Desafios
              </h1>
              <p className="text-sm text-muted-foreground">
                Desafie amigos e conquiste suas metas
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Stats Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Carregando estatísticas...</span>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {challengeStats.map(({ label, value, icon: Icon, color }) => (
              <Card key={label} className="text-center">
                <CardContent className="p-4">
                  <Icon className={`w-6 h-6 mx-auto mb-2 ${color}`} />
                  <div className="text-2xl font-bold">{value}</div>
                  <div className="text-xs text-muted-foreground">{label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Tabs defaultValue="my-challenges" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="my-challenges">Meus Desafios</TabsTrigger>
            <TabsTrigger value="create-challenge">Criar Desafio</TabsTrigger>
          </TabsList>

          <TabsContent value="my-challenges" className="space-y-4">
            <MyChallenges />
          </TabsContent>

          <TabsContent value="create-challenge" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Desafiar Usuários</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Escolha um usuário para desafiar e crie uma competição saudável!
                </p>
                <UsersList onChallengeUser={handleChallengeUser} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <ChallengeModal
        isOpen={showChallengeModal}
        onClose={() => setShowChallengeModal(false)}
        targetUserId={selectedUserId}
        targetUserName={selectedUserName}
      />
    </div>
  );
}