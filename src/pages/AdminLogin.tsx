import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Shield, Eye, EyeOff, Lock, Mail, AlertTriangle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loginAttempts, setLoginAttempts] = useState(0);
  
  const [credentials, setCredentials] = useState({
    email: "",
    password: ""
  });

  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Check if user is admin
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .eq('role', 'admin')
          .single();

        if (roleData) {
          navigate('/admin');
          return;
        }
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (loginAttempts >= 5) {
      setError("Muitas tentativas de login. Aguarde alguns minutos.");
      return;
    }

    setLoading(true);

    try {
      // Sign in with email/password
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (authError) {
        setLoginAttempts(prev => prev + 1);
        setError("Credenciais inválidas. Verifique seu email e senha.");
        setLoading(false);
        return;
      }

      if (!authData.user) {
        setError("Erro ao autenticar. Tente novamente.");
        setLoading(false);
        return;
      }

      // Check if user has admin role - server-side validation
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authData.user.id)
        .eq('role', 'admin')
        .single();

      if (roleError || !roleData) {
        // Sign out if not admin
        await supabase.auth.signOut();
        setLoginAttempts(prev => prev + 1);
        setError("⛔ Acesso negado. Esta área é restrita a administradores.");
        setLoading(false);
        return;
      }

      // Log admin access
      console.log(`Admin access granted for user: ${authData.user.id}`);

      toast({
        title: "✅ Login de administrador realizado!",
        description: "Bem-vindo ao painel de controle.",
      });

      navigate('/admin');
    } catch (error) {
      console.error('Login error:', error);
      setError("Erro inesperado. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <Card className="w-full max-w-md relative z-10 bg-card/95 backdrop-blur-xl border-2 border-purple-500/30 shadow-2xl shadow-purple-500/20">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/50">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Painel Administrativo
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-2">
              Acesso restrito a administradores autorizados
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive" className="bg-destructive/10 border-destructive/30">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email" className="text-sm font-medium">
                Email de Administrador
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@empresa.com"
                  value={credentials.email}
                  onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                  className="pl-10 bg-background/50 border-border/50 focus:border-purple-500 transition-colors"
                  required
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="admin-password" className="text-sm font-medium">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  className="pl-10 pr-10 bg-background/50 border-border/50 focus:border-purple-500 transition-colors"
                  required
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium h-11 shadow-lg shadow-purple-500/25 transition-all duration-300" 
              disabled={loading || loginAttempts >= 5}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Autenticando...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Acessar Painel Admin
                </>
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Área Segura
              </span>
            </div>
          </div>

          <div className="text-center space-y-2">
            <p className="text-xs text-muted-foreground">
              🔒 Conexão segura • Acesso monitorado
            </p>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/auth')}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Voltar para login normal
            </Button>
          </div>

          {loginAttempts > 0 && loginAttempts < 5 && (
            <p className="text-center text-xs text-yellow-500">
              ⚠️ {5 - loginAttempts} tentativas restantes
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
