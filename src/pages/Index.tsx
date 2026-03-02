import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Target, TrendingUp, Brain, Calendar, Zap, ArrowRight, CheckCircle2, Shield, Crown, Star, Users } from "lucide-react";
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
      {/* Hero Section — Cyber-Aesthetic Dark */}
      <section className="relative overflow-hidden gradient-hero text-white">
        {/* Mesh gradient overlay */}
        <div className="absolute inset-0 gradient-mesh" />
        {/* Floating orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-primary/10 blur-3xl animate-float" />
        <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-accent/8 blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
        
        <div className="relative section-padding text-center min-h-[85vh] flex flex-col items-center justify-center">
          <div className="content-width">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-5 py-2.5 rounded-full text-sm font-medium mb-8 border border-white/10">
              <Sparkles className="h-4 w-4 text-accent" />
              <span className="text-white/90">Transformação com IA</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight leading-[1.1]">
              Evolua todos os dias
              <br />
              <span className="text-gradient-cyber">com planos de IA</span>
            </h1>
            
            <p className="text-lg md:text-xl text-white/60 mb-12 max-w-2xl mx-auto leading-relaxed">
              Planos personalizados de Glow Up que se adaptam ao seu estilo de vida. 
              Saúde, estética, produtividade e mentalidade — tudo em um só lugar.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => navigate("/auth")}
                size="lg" 
                className="gradient-button text-white shadow-cyber px-10 h-14 text-base font-semibold rounded-xl scale-press hover:opacity-90 transition-opacity"
              >
                Começar Minha Transformação
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                onClick={() => navigate("/dashboard")}
                variant="outline" 
                size="lg" 
                className="border-white/20 text-white hover:bg-white/10 px-10 h-14 text-base font-medium rounded-xl backdrop-blur-sm"
              >
                Ver Dashboard
              </Button>
            </div>

            {/* Social proof */}
            <div className="mt-14 flex items-center justify-center gap-8 text-white/40 text-sm">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>2.4k+ usuários</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-warning" />
                <span>4.9 avaliação</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-accent" />
                <span>100% seguro</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works — Bento Grid */}
      <section className="section-padding">
        <div className="content-width">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Como funciona</p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">Três passos para sua transformação</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: Target, title: "Defina objetivos", desc: "A IA conversa com você para entender metas de saúde, estética e produtividade.", accent: false },
              { icon: Brain, title: "IA personalizada", desc: "Planos diários, semanais e mensais criados sob medida para seu perfil.", accent: true },
              { icon: TrendingUp, title: "Acompanhe progresso", desc: "Gráficos, gamificação e ajustes automáticos conforme sua evolução.", accent: false },
            ].map((item, i) => (
              <div key={i} className="cyber-card text-center group">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-5 transition-all duration-300 ${item.accent ? 'bg-accent/15 group-hover:bg-accent/25' : 'bg-primary/10 group-hover:bg-primary/20'}`}>
                  <item.icon className={`h-7 w-7 ${item.accent ? 'text-accent-foreground' : 'text-primary'}`} />
                </div>
                <h3 className="font-bold text-lg mb-2 text-foreground">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* XP / Gamification showcase */}
      <section className="section-padding bg-secondary/30">
        <div className="content-width">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-sm font-semibold text-accent-foreground uppercase tracking-wider mb-3">Gamificação</p>
              <h2 className="text-3xl font-bold text-foreground mb-4 tracking-tight">Suba de nível como um personagem</h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Ganhe XP em Beleza, Intelecto, Força e Carisma. Complete missões, desbloqueie badges e compita no ranking global.
              </p>
              <div className="space-y-4">
                {[
                  { label: "Beleza", value: 72, color: "from-primary to-primary-light" },
                  { label: "Intelecto", value: 58, color: "from-info to-primary" },
                  { label: "Força", value: 85, color: "from-accent to-success" },
                  { label: "Carisma", value: 64, color: "from-primary to-accent" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium text-foreground">{stat.label}</span>
                      <span className="text-muted-foreground">{stat.value}%</span>
                    </div>
                    <div className="xp-bar">
                      <div className="xp-bar-fill" style={{ width: `${stat.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: "🏆", label: "Desafios", value: "150+", sub: "disponíveis" },
                { icon: "🔥", label: "Streak", value: "30 dias", sub: "recorde" },
                { icon: "⭐", label: "Badges", value: "45", sub: "para desbloquear" },
                { icon: "👥", label: "Comunidade", value: "2.4k", sub: "membros" },
              ].map((item, i) => (
                <div key={i} className="bento-card text-center">
                  <div className="text-3xl mb-2">{item.icon}</div>
                  <p className="text-2xl font-bold text-foreground">{item.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="section-padding">
        <div className="content-width">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Funcionalidades</p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">Tudo que você precisa</h2>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: Calendar, title: "Planos estruturados", desc: "Atividades por período: diário, semanal e mensal.", primary: true },
              { icon: Sparkles, title: "Coach de IA", desc: "Assistente pessoal que adapta seu plano em tempo real.", primary: false },
              { icon: CheckCircle2, title: "Daily Quests", desc: "Missões diárias com recompensas de XP e badges.", primary: true },
              { icon: Zap, title: "Evolução contínua", desc: "Planos que se adaptam conforme você conquista metas.", primary: false },
            ].map((item, i) => (
              <div key={i} className="bento-card-sm flex items-start gap-4 group">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-200 ${item.primary ? 'bg-primary/10 group-hover:bg-primary/20' : 'bg-accent/15 group-hover:bg-accent/25'}`}>
                  <item.icon className={`h-5 w-5 ${item.primary ? 'text-primary' : 'text-accent-foreground'}`} />
                </div>
                <div>
                  <h3 className="font-semibold mb-1 text-foreground">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Feed Section */}
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
                <Target className="w-4 h-4 mr-2" />
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

      {/* CTA Section — Dark Cyber */}
      <section className="relative overflow-hidden gradient-hero text-white">
        <div className="absolute inset-0 gradient-mesh" />
        <div className="relative section-padding text-center">
          <div className="content-width max-w-2xl mx-auto">
            <Crown className="w-12 h-12 text-accent mx-auto mb-6 animate-float" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
              Pronto para evoluir?
            </h2>
            <p className="text-white/50 mb-10 text-lg max-w-md mx-auto">
              Junte-se a milhares transformando suas vidas com planos personalizados de IA.
            </p>
            <Button 
              onClick={() => navigate(isAuthenticated ? "/dashboard" : "/auth")}
              size="lg" 
              className="gradient-button text-white shadow-cyber px-10 h-14 text-base font-semibold rounded-xl scale-press hover:opacity-90 transition-opacity"
            >
              {isAuthenticated ? "Ir para Dashboard" : "Começar agora — é grátis"}
              <ArrowRight className="w-5 h-5 ml-2" />
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