import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Target, TrendingUp, Brain, Calendar, Zap, Plus, ArrowRight, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import RealSocialFeed from "@/components/RealSocialFeed";
import ChallengeModal from "@/components/ChallengeModal";
import UsersList from "@/components/UsersList";

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
      {/* Hero Section - Clean & Minimal */}
      <section className="section-padding text-center">
        <div className="content-width">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-8">
            <Sparkles className="h-4 w-4" />
            <span>Transformação com IA</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 tracking-tight leading-tight">
            Evolua todos os dias
            <br />
            <span className="text-primary">com planos de IA</span>
          </h1>
          
          <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
            Planos personalizados de Glow Up que se adaptam ao seu estilo de vida. 
            Saúde, estética, produtividade e mentalidade em um só lugar.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={() => navigate("/auth")}
              size="lg" 
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-soft px-8 h-12 text-base font-medium rounded-xl"
            >
              Começar agora
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button 
              onClick={() => navigate("/dashboard")}
              variant="outline" 
              size="lg" 
              className="border-border text-foreground hover:bg-secondary px-8 h-12 text-base font-medium rounded-xl"
            >
              Ver Dashboard
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section - Bento Grid */}
      <section className="section-padding bg-secondary/30">
        <div className="content-width">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3 text-foreground">Como funciona</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">Três passos simples para sua transformação</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-5">
            <div className="bento-card text-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Defina objetivos</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Conte suas metas de transformação em saúde, estética e produtividade.
              </p>
            </div>

            <div className="bento-card text-center">
              <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mx-auto mb-4">
                <Brain className="h-6 w-6 text-accent-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-2">IA personalizada</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Planos diários, semanais e mensais adaptados ao seu perfil.
              </p>
            </div>

            <div className="bento-card text-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Acompanhe progresso</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Monitore sua evolução com ajustes automáticos nos planos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="section-padding">
        <div className="content-width">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3 text-foreground">Tudo que você precisa</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">Ferramentas para sua evolução diária</p>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bento-card-sm flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Planos estruturados</h3>
                <p className="text-muted-foreground text-sm">Atividades organizadas por período: diário, semanal e mensal.</p>
              </div>
            </div>
            
            <div className="bento-card-sm flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Motivação constante</h3>
                <p className="text-muted-foreground text-sm">Recomendações que te mantêm focado nos objetivos.</p>
              </div>
            </div>
            
            <div className="bento-card-sm flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Resultados reais</h3>
                <p className="text-muted-foreground text-sm">Ações práticas que geram mudanças visíveis.</p>
              </div>
            </div>
            
            <div className="bento-card-sm flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                <Zap className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Evolução contínua</h3>
                <p className="text-muted-foreground text-sm">Planos que se adaptam conforme você conquista metas.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Feed Section - Only for authenticated users */}
      {isAuthenticated && (
        <section className="section-padding bg-secondary/30">
          <div className="content-width">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">Comunidade</h2>
              <Button 
                onClick={() => setShowUsersList(!showUsersList)}
                className="social-button"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Desafio
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
      <section className="section-padding text-center">
        <div className="content-width">
          <div className="bento-card max-w-2xl mx-auto py-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-foreground">
            Pronto para evoluir?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Junte-se a milhares transformando suas vidas com IA personalizada.
          </p>
          <Button 
            onClick={() => navigate(isAuthenticated ? "/dashboard" : "/auth")}
            size="lg" 
            className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-soft px-8 h-12 text-base font-medium rounded-xl"
          >
            {isAuthenticated ? "Ir para Dashboard" : "Começar agora — é grátis"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          </div>
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
