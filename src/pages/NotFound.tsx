import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Search, Sparkles, Ghost, Rocket, Star, Zap } from "lucide-react";

const NotFound = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [stars, setStars] = useState<Array<{ id: number; x: number; y: number; size: number; delay: number }>>([]);

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    
    // Generate random stars
    const newStars = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      delay: Math.random() * 3
    }));
    setStars(newStars);
  }, [location.pathname]);

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  return (
    <div 
      className="min-h-screen relative overflow-hidden bg-gradient-to-br from-background via-primary/5 to-accent/10"
      onMouseMove={handleMouseMove}
    >
      {/* Animated background stars */}
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute animate-pulse-glow"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationDelay: `${star.delay}s`
          }}
        >
          <Star className="text-primary/30" style={{ width: star.size, height: star.size }} />
        </div>
      ))}

      {/* Floating elements */}
      <div className="absolute top-20 left-10 animate-float opacity-20">
        <Rocket className="w-16 h-16 text-primary" style={{ transform: 'rotate(-45deg)' }} />
      </div>
      <div className="absolute bottom-40 right-20 animate-float opacity-20" style={{ animationDelay: '1s' }}>
        <Zap className="w-12 h-12 text-accent" />
      </div>
      <div className="absolute top-1/3 right-1/4 animate-float opacity-15" style={{ animationDelay: '2s' }}>
        <Sparkles className="w-20 h-20 text-primary" />
      </div>

      {/* Glow effect following mouse */}
      <div 
        className="pointer-events-none fixed w-96 h-96 rounded-full opacity-20 blur-3xl transition-all duration-300"
        style={{
          background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)',
          left: mousePosition.x - 192,
          top: mousePosition.y - 192
        }}
      />

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 text-center">
        {/* Ghost animation */}
        <div className="relative mb-8">
          <div className="absolute inset-0 animate-pulse-glow">
            <div className="w-40 h-40 rounded-full bg-primary/20 blur-xl" />
          </div>
          <div className="relative animate-float">
            <Ghost className="w-32 h-32 text-primary drop-shadow-lg" />
          </div>
        </div>

        {/* 404 Number */}
        <div className="relative mb-6">
          <h1 className="text-[120px] md:text-[180px] font-black leading-none tracking-tighter">
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%]">
              404
            </span>
          </h1>
          <div className="absolute -top-4 -right-4 animate-spin" style={{ animationDuration: '10s' }}>
            <Sparkles className="w-8 h-8 text-accent" />
          </div>
        </div>

        {/* Message */}
        <div className="space-y-4 mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Oops! Página não encontrada 🔍
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto text-lg">
            Parece que você se perdeu no universo do GlowUp. Essa página não existe ou foi movida para outra galáxia.
          </p>
          <p className="text-sm text-muted-foreground/70">
            Rota tentada: <code className="px-2 py-1 bg-muted rounded text-primary">{location.pathname}</code>
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            size="lg"
            className="group gap-2 border-primary/30 hover:bg-primary/10"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Voltar
          </Button>
          <Button
            onClick={() => navigate('/')}
            size="lg"
            className="gradient-primary gap-2 text-white shadow-glow"
          >
            <Home className="w-5 h-5" />
            Ir para Início
          </Button>
          <Button
            onClick={() => navigate('/dashboard')}
            variant="secondary"
            size="lg"
            className="gap-2"
          >
            <Search className="w-5 h-5" />
            Dashboard
          </Button>
        </div>

        {/* Fun suggestions */}
        <div className="mt-16 p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 max-w-lg">
          <h3 className="font-semibold mb-4 flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Enquanto está aqui...
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <button 
              onClick={() => navigate('/challenges')}
              className="p-3 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors text-left"
            >
              ⚔️ Ver desafios
            </button>
            <button 
              onClick={() => navigate('/social')}
              className="p-3 rounded-xl bg-accent/10 hover:bg-accent/20 transition-colors text-left"
            >
              👥 Comunidade
            </button>
            <button 
              onClick={() => navigate('/marketplace')}
              className="p-3 rounded-xl bg-green-500/10 hover:bg-green-500/20 transition-colors text-left"
            >
              🛍️ Marketplace
            </button>
            <button 
              onClick={() => navigate('/profile')}
              className="p-3 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 transition-colors text-left"
            >
              👤 Meu perfil
            </button>
          </div>
        </div>
      </div>

      {/* Footer text */}
      <div className="absolute bottom-4 left-0 right-0 text-center text-xs text-muted-foreground/50">
        GlowUp Planner AI • Transforme sua vida
      </div>
    </div>
  );
};

export default NotFound;
