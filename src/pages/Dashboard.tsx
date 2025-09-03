import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";
import { Sparkles, Target, Calendar, TrendingUp, LogOut, User as UserIcon } from "lucide-react";
import { achievements } from "@/lib/achievements";
import { userRanking } from "@/lib/ranking";
import GoalsForm from "@/components/GoalsForm";
import PlansView from "@/components/PlansView";
import ProgressTracker from "@/components/ProgressTracker";
import WelcomeGuide from "@/components/WelcomeGuide";
import ProfileForm from "@/components/ProfileForm";
import SocialFeed from "@/components/SocialFeed";

interface Profile {
  id: string;
  name: string;
  age?: number;
  pontos?: number;
  conquistas?: string[];
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("plans");
  const [hasGoals, setHasGoals] = useState(false);
  const [hasPlans, setHasPlans] = useState(false);
  const [hasProgress, setHasProgress] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    checkUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user) {
        navigate("/auth");
      } else {
        setUser(session.user);
        fetchProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      navigate("/auth");
      return;
    }
    
    setUser(session.user);
    await fetchProfile(session.user.id);
    setLoading(false);
  };

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    
    if (error) {
      console.error("Error fetching profile:", error);
    } else {
      setProfile(data);
    }
    
    // Check if user has data
    await checkUserData(userId);
  };

  const checkUserData = async (userId: string) => {
    // Check goals
    const { data: goalsData } = await supabase
      .from("goals")
      .select("id")
      .eq("user_id", userId)
      .limit(1);
    
    // Check plans  
    const { data: plansData } = await supabase
      .from("plans")
      .select("id")
      .eq("user_id", userId)
      .limit(1);
      
    // Check progress
    const { data: progressData } = await supabase
      .from("progress")
      .select("id")
      .eq("user_id", userId)
      .limit(1);

    const hasGoalsData = goalsData && goalsData.length > 0;
    const hasPlansData = plansData && plansData.length > 0;
    const hasProgressData = progressData && progressData.length > 0;

    setHasGoals(hasGoalsData);
    setHasPlans(hasPlansData);
    setHasProgress(hasProgressData);
    
    // Show welcome guide if user has no data
    setShowWelcome(!hasGoalsData && !hasPlansData && !hasProgressData);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Erro ao sair",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleGuideAction = (stepId: string) => {
    setActiveTab(stepId);
    setShowWelcome(false);
  };

  const getCompletedSteps = () => {
    const steps = [];
    if (hasGoals) steps.push("goals");
    if (hasPlans) steps.push("plans");
    if (hasProgress) steps.push("progress");
    return steps;
  };

  // Conquistas reais do usuário
  const unlockedAchievements = achievements.filter(a => profile?.conquistas?.includes(a.id));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              GlowUp Planner AI
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="text-sm">
              Olá, {profile?.name || user?.email}
            </Badge>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Medalhas/Conquistas */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Seu Plano de Transformação</h2>
          <p className="text-muted-foreground">
            Acompanhe seu progresso e evolua a cada dia com planos personalizados por IA
          </p>
          <div className="mt-2 mb-2">
            <span className="font-bold text-lg text-yellow-700">Pontos: {profile?.pontos ?? 0}</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-4">
            {unlockedAchievements.length === 0 ? (
              <span className="text-sm text-yellow-600">Nenhuma conquista desbloqueada ainda. Complete planos e missões para ganhar medalhas!</span>
            ) : (
              unlockedAchievements.map(a => (
                <div key={a.id} className="flex flex-col items-center p-2 bg-yellow-50 border border-yellow-200 rounded-lg min-w-[120px]">
                  <span className="text-3xl mb-1">{a.icon}</span>
                  <span className="font-bold text-yellow-700 text-sm">{a.title}</span>
                  <span className="text-xs text-yellow-600 text-center">{a.description}</span>
                </div>
              ))
            )}
          </div>
          {/* Ranking de usuários */}
          <div className="mt-8">
            <h3 className="text-xl font-bold mb-2 text-blue-700">Ranking Semanal</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-blue-800">
                    <th className="text-left">Usuário</th>
                    <th className="text-right">Pontos</th>
                  </tr>
                </thead>
                <tbody>
                  {userRanking.map((u, idx) => (
                    <tr key={u.name} className={idx === 0 ? "font-bold text-blue-900" : ""}>
                      <td>{u.name}</td>
                      <td className="text-right">{u.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {showWelcome ? (
          <WelcomeGuide 
            onStepAction={handleGuideAction}
            completedSteps={getCompletedSteps()}
          />
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="plans" className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Planos</span>
              </TabsTrigger>
              <TabsTrigger value="goals" className="flex items-center space-x-2">
                <Target className="h-4 w-4" />
                <span>Objetivos</span>
              </TabsTrigger>
              <TabsTrigger value="progress" className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4" />
                <span>Progresso</span>
              </TabsTrigger>
              <TabsTrigger value="social" className="flex items-center space-x-2">
                <UserIcon className="h-4 w-4" />
                <span>Social</span>
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex items-center space-x-2">
                <UserIcon className="h-4 w-4" />
                <span>Perfil</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="plans" className="space-y-6">
              <PlansView 
                userId={user?.id || ""} 
                onDataChange={() => checkUserData(user?.id || "")} 
              />
            </TabsContent>

            <TabsContent value="goals" className="space-y-6">
              <GoalsForm 
                userId={user?.id || ""} 
                onDataChange={() => checkUserData(user?.id || "")}
              />
            </TabsContent>

            <TabsContent value="progress" className="space-y-6">
              <ProgressTracker 
                userId={user?.id || ""} 
                onDataChange={() => checkUserData(user?.id || "")}
              />
            </TabsContent>

            <TabsContent value="social" className="space-y-6">
              <SocialFeed />
            </TabsContent>

            <TabsContent value="profile" className="space-y-6">
              <ProfileForm userId={user?.id || ""} />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
};

export default Dashboard;