import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, Crown, Flame } from "lucide-react";
import { LoadingSpinner } from "./LoadingSpinner";

interface LeaderboardEntry {
  id: string;
  display_name: string;
  avatar_url: string | null;
  level: number;
  pontos: number;
  total_challenges_completed: number;
}

export const Leaderboard = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase.rpc('get_leaderboard', { limit_count: 10 });
      
      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-muted-foreground font-bold">{rank}</span>;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/50";
      case 2:
        return "bg-gradient-to-r from-gray-300/20 to-gray-400/20 border-gray-400/50";
      case 3:
        return "bg-gradient-to-r from-amber-600/20 to-orange-500/20 border-amber-600/50";
      default:
        return "";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 flex justify-center">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="gradient-primary text-primary-foreground">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-6 w-6" />
          Ranking Global
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="pontos" className="w-full">
          <TabsList className="w-full grid grid-cols-3 rounded-none border-b">
            <TabsTrigger value="pontos">Por Pontos</TabsTrigger>
            <TabsTrigger value="level">Por Nível</TabsTrigger>
            <TabsTrigger value="challenges">Desafios</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pontos" className="mt-0">
            <div className="divide-y divide-border">
              {entries.map((entry, index) => (
                <div
                  key={entry.id}
                  className={`flex items-center gap-4 p-4 transition-colors hover:bg-muted/50 ${getRankStyle(index + 1)}`}
                >
                  <div className="w-8 flex justify-center">
                    {getRankIcon(index + 1)}
                  </div>
                  <Avatar className="h-12 w-12 border-2 border-primary/20">
                    <AvatarImage src={entry.avatar_url || undefined} />
                    <AvatarFallback className="gradient-primary text-primary-foreground">
                      {entry.display_name?.charAt(0).toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{entry.display_name || "Anônimo"}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="secondary" className="text-xs">
                        Nível {entry.level}
                      </Badge>
                      <span className="flex items-center gap-1">
                        <Flame className="h-3 w-3 text-orange-500" />
                        {entry.total_challenges_completed} desafios
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-primary">{entry.pontos.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">pontos</p>
                  </div>
                </div>
              ))}
              {entries.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhum usuário no ranking ainda.
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="level" className="mt-0">
            <div className="divide-y divide-border">
              {[...entries]
                .sort((a, b) => b.level - a.level)
                .map((entry, index) => (
                  <div
                    key={entry.id}
                    className={`flex items-center gap-4 p-4 transition-colors hover:bg-muted/50 ${getRankStyle(index + 1)}`}
                  >
                    <div className="w-8 flex justify-center">
                      {getRankIcon(index + 1)}
                    </div>
                    <Avatar className="h-12 w-12 border-2 border-primary/20">
                      <AvatarImage src={entry.avatar_url || undefined} />
                      <AvatarFallback className="gradient-primary text-primary-foreground">
                        {entry.display_name?.charAt(0).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{entry.display_name || "Anônimo"}</p>
                      <p className="text-sm text-muted-foreground">
                        {entry.pontos.toLocaleString()} pontos
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-primary">Nível {entry.level}</p>
                    </div>
                  </div>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="challenges" className="mt-0">
            <div className="divide-y divide-border">
              {[...entries]
                .sort((a, b) => b.total_challenges_completed - a.total_challenges_completed)
                .map((entry, index) => (
                  <div
                    key={entry.id}
                    className={`flex items-center gap-4 p-4 transition-colors hover:bg-muted/50 ${getRankStyle(index + 1)}`}
                  >
                    <div className="w-8 flex justify-center">
                      {getRankIcon(index + 1)}
                    </div>
                    <Avatar className="h-12 w-12 border-2 border-primary/20">
                      <AvatarImage src={entry.avatar_url || undefined} />
                      <AvatarFallback className="gradient-primary text-primary-foreground">
                        {entry.display_name?.charAt(0).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{entry.display_name || "Anônimo"}</p>
                      <p className="text-sm text-muted-foreground">
                        Nível {entry.level}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-primary">{entry.total_challenges_completed}</p>
                      <p className="text-xs text-muted-foreground">desafios</p>
                    </div>
                  </div>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
