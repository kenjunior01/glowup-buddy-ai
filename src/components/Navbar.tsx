import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Menu, X, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div 
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => navigate(user ? "/dashboard" : "/")}
          >
            <Sparkles className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-gradient">GlowUp</span>
          </div>

          {/* Desktop Navigation — Simplified */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <Button
                  variant={location.pathname === "/dashboard" ? "default" : "ghost"}
                  onClick={() => navigate("/dashboard")}
                >
                  Hoje
                </Button>
                <Button
                  variant={location.pathname === "/progress" ? "default" : "ghost"}
                  onClick={() => navigate("/progress")}
                >
                  Progresso
                </Button>
                <Button
                  variant={location.pathname === "/profile" ? "default" : "ghost"}
                  onClick={() => navigate("/profile")}
                >
                  Perfil
                </Button>
                <Button
                  variant={location.pathname === "/premium" ? "default" : "ghost"}
                  onClick={() => navigate("/premium")}
                >
                  <Crown className="h-4 w-4 mr-1" />
                  Premium
                </Button>
                <Button variant="ghost" onClick={handleSignOut}>
                  Sair
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant={location.pathname === "/auth" ? "default" : "ghost"}
                  onClick={() => navigate("/auth")}
                >
                  Entrar
                </Button>
                <Button
                  className="gradient-primary text-primary-foreground"
                  onClick={() => navigate("/auth")}
                >
                  Começar Grátis
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {isMenuOpen && (
          <>
            <div 
              className="fixed inset-0 z-40 bg-background/50 backdrop-blur-sm" 
              onClick={() => setIsMenuOpen(false)}
            />
            <div className="md:hidden py-4 border-t border-border absolute left-0 right-0 top-16 bg-background z-50 shadow-lg">
              <div className="flex flex-col space-y-2 px-4">
                {user ? (
                  <>
                    {[
                      { path: '/dashboard', label: 'Hoje' },
                      { path: '/progress', label: 'Progresso' },
                      { path: '/profile', label: 'Perfil' },
                      { path: '/premium', label: '💎 Premium' },
                    ].map(item => (
                      <Button
                        key={item.path}
                        variant={location.pathname === item.path ? "default" : "ghost"}
                        onClick={() => { navigate(item.path); setIsMenuOpen(false); }}
                        className="justify-start"
                      >
                        {item.label}
                      </Button>
                    ))}
                    <Button 
                      variant="ghost" 
                      onClick={() => { handleSignOut(); setIsMenuOpen(false); }}
                      className="justify-start"
                    >
                      Sair
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      onClick={() => { navigate("/auth"); setIsMenuOpen(false); }}
                      className="justify-start"
                    >
                      Entrar
                    </Button>
                    <Button
                      className="gradient-primary text-primary-foreground justify-start"
                      onClick={() => { navigate("/auth"); setIsMenuOpen(false); }}
                    >
                      Começar Grátis
                    </Button>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
