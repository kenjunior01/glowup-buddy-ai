import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Flame, Target, Zap, Crown, Star, Shield, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-hero text-white">
        <div className="absolute inset-0 gradient-mesh" />
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-primary/10 blur-3xl animate-float" />
        <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-accent/8 blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
        
        <div className="relative section-padding text-center min-h-[85vh] flex flex-col items-center justify-center">
          <div className="content-width">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-5 py-2.5 rounded-full text-sm font-medium mb-8 border border-white/10">
              <Flame className="h-4 w-4 text-orange-400" />
              <span className="text-white/90">1 quest por dia. Evolução real.</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight leading-[1.1]">
              Uma ação por dia.
              <br />
              <span className="text-gradient-cyber">Transformação total.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-white/60 mb-12 max-w-2xl mx-auto leading-relaxed">
              Sem overwhelm. Sem 50 tarefas. O GlowUp te dá UMA quest diária 
              personalizada por IA — e gamifica sua evolução com streaks e XP.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => navigate(isAuthenticated ? "/dashboard" : "/auth")}
                size="lg" 
                className="gradient-button text-white shadow-cyber px-10 h-14 text-base font-semibold rounded-xl scale-press hover:opacity-90 transition-opacity"
              >
                {isAuthenticated ? "Minha Quest de Hoje" : "Começar Grátis"}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>

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
                <span>100% gratuito</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section-padding">
        <div className="content-width">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Simples assim</p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">Como funciona</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: Target, emoji: "🎯", title: "Receba sua Quest", desc: "Todo dia uma missão personalizada pela IA baseada no seu perfil e objetivos." },
              { icon: Zap, emoji: "⚡", title: "Complete & Ganhe XP", desc: "Finalize a quest, ganhe pontos, suba de nível e mantenha seu streak." },
              { icon: Sparkles, emoji: "📈", title: "Veja a Transformação", desc: "Seu Transformation Score sobe a cada dia de consistência." },
            ].map((item, i) => (
              <div key={i} className="cyber-card text-center group">
                <div className="text-4xl mb-4">{item.emoji}</div>
                <h3 className="font-bold text-lg mb-2 text-foreground">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats showcase */}
      <section className="section-padding bg-secondary/30">
        <div className="content-width">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { emoji: "🔥", value: "1", label: "Quest por dia" },
              { emoji: "⚡", value: "30s", label: "Para começar" },
              { emoji: "🏆", value: "100%", label: "Personalizado" },
              { emoji: "📈", value: "∞", label: "Potencial" },
            ].map((item, i) => (
              <div key={i} className="bento-card text-center">
                <div className="text-3xl mb-2">{item.emoji}</div>
                <p className="text-2xl font-bold text-foreground">{item.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden gradient-hero text-white">
        <div className="absolute inset-0 gradient-mesh" />
        <div className="relative section-padding text-center">
          <div className="content-width max-w-2xl mx-auto">
            <Crown className="w-12 h-12 text-accent mx-auto mb-6 animate-float" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
              Sua evolução começa hoje
            </h2>
            <p className="text-white/50 mb-10 text-lg max-w-md mx-auto">
              Uma quest. Um streak. Uma transformação.
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
    </div>
  );
};

export default Index;