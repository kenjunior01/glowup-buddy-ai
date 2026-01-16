import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Target, TrendingUp, Brain, Calendar, Zap, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import RealSocialFeed from "@/components/RealSocialFeed";
import ChallengeModal from "@/components/ChallengeModal";
import UsersList from "@/components/UsersList";
import { TickerTape } from "@/components/ads/TickerTape";
import { PremiumBanner } from "@/components/ads/PremiumBanner";

const Index = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedUserName, setSelectedUserName] = useState<string>('');
  const [showUsersList, setShowUsersList] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleChallengeUser = (userId: string, userName: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setShowUsersList(false);
    setShowChallengeModal(true);
  };

  return (
    <div className="min-h-screen">
      {/* Ticker Tape Ads */}
      <TickerTape />
      
      {/* Premium Banner */}
      <PremiumBanner />
      
      {/* Hero Section */}
      <section className="relative py-20 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-90"></div>
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="mb-6">
            <Sparkles className="h-20 w-20 mx-auto text-white shadow-glow" />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
            GlowUp Planner AI
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
            Transforme sua vida com planos personalizados de Glow Up gerados por IA. 
            Evolua diariamente em saúde, estética, produtividade e mentalidade.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate("/auth")}
              size="lg" 
              className="bg-white text-primary hover:bg-white/90 shadow-elegant"
            >
              Começar Transformação
            </Button>
            <Button 
              onClick={() => navigate("/dashboard")}
              variant="outline" 
              size="lg" 
              className="border-white/80 text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm"
            >
              Ver Dashboard
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-card">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-gradient">
              Como Funciona
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Nossa IA analisa seus objetivos e cria planos personalizados para sua transformação pessoal
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="shadow-elegant border-0 bg-gradient-to-br from-card to-secondary/50">
              <CardHeader className="text-center">
                <Target className="h-12 w-12 mx-auto text-primary mb-4" />
                <CardTitle className="text-xl">Defina Objetivos</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Conte-nos sobre suas metas de transformação pessoal em áreas como saúde, estética e produtividade.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="shadow-elegant border-0 bg-gradient-to-br from-card to-secondary/50">
              <CardHeader className="text-center">
                <Brain className="h-12 w-12 mx-auto text-accent mb-4" />
                <CardTitle className="text-xl">IA Personalizada</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Nossa IA avançada gera planos diários, semanais e mensais adaptados ao seu perfil e estilo de vida.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="shadow-elegant border-0 bg-gradient-to-br from-card to-secondary/50">
              <CardHeader className="text-center">
                <TrendingUp className="h-12 w-12 mx-auto text-primary mb-4" />
                <CardTitle className="text-xl">Acompanhe Progresso</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Monitore sua evolução e receba ajustes automáticos nos planos conforme você progride.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-8 text-gradient">
            Transformação Completa
          </h2>
          <div className="grid md:grid-cols-2 gap-8 text-left">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Calendar className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg">Planos Estruturados</h3>
                  <p className="text-muted-foreground">Atividades organizadas por período: diário, semanal e mensal.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Sparkles className="h-6 w-6 text-accent mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg">Motivação Constante</h3>
                  <p className="text-muted-foreground">Recomendações motivadoras que te mantêm focado nos objetivos.</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Target className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg">Resultados Reais</h3>
                  <p className="text-muted-foreground">Foque em ações práticas que geram mudanças visíveis.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Zap className="h-6 w-6 text-accent mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg">Evolução Contínua</h3>
                  <p className="text-muted-foreground">Planos que se adaptam conforme você evolui e conquista metas.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Feed Section - Only for authenticated users */}
      {isAuthenticated && (
        <section className="py-20 px-4 bg-card">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gradient">Feed da Comunidade</h2>
              <Button 
                onClick={() => setShowUsersList(!showUsersList)}
                className="social-button"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Desafio
              </Button>
            </div>
            
            {showUsersList ? (
              <UsersList onChallengeUser={handleChallengeUser} />
            ) : (
              <RealSocialFeed />
            )}
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold mb-6 text-gradient">
            Pronto para Sua Transformação?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Junte-se a milhares de pessoas que já estão transformando suas vidas com nossa IA personalizada.
          </p>
          <Button 
            onClick={() => navigate(isAuthenticated ? "/dashboard" : "/auth")}
            size="lg" 
            className="gradient-primary text-white hover:opacity-90 shadow-glow"
          >
            {isAuthenticated ? "Ir para Dashboard" : "Começar Agora - É Grátis"}
          </Button>
        </div>
      </section>

      {/* Challenge Modal */}
      <ChallengeModal
        isOpen={showChallengeModal}
        onClose={() => setShowChallengeModal(false)}
        targetUserId={selectedUserId}
        targetUserName={selectedUserName}
      />
    </div>
  );
};

export default Index;
