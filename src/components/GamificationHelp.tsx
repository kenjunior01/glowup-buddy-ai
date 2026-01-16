import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, Trophy, Star, Zap, Target, Flame, Crown, Medal } from 'lucide-react';

export default function GamificationHelp() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground">
          <HelpCircle className="w-4 h-4" />
          Como funciona?
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Como Funciona a Gamificação
          </DialogTitle>
          <DialogDescription>
            Entenda como ganhar pontos, subir de nível e conquistar recompensas
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-6">
            {/* Points Section */}
            <section className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                Pontos (XP)
              </h3>
              <p className="text-sm text-muted-foreground">
                Ganhe pontos realizando atividades na plataforma:
              </p>
              <div className="grid gap-2 text-sm">
                {[
                  { action: 'Completar uma missão diária', points: '+50 XP', emoji: '✅' },
                  { action: 'Completar um desafio', points: '+100 XP', emoji: '🏆' },
                  { action: 'Manter streak diário', points: '+25 XP', emoji: '🔥' },
                  { action: 'Criar um post social', points: '+20 XP', emoji: '📱' },
                  { action: 'Adicionar um amigo', points: '+30 XP', emoji: '👥' },
                  { action: 'Registrar no diário', points: '+15 XP', emoji: '📝' },
                  { action: 'Completar check-in', points: '+10 XP', emoji: '📍' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <span>{item.emoji} {item.action}</span>
                    <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-600">
                      {item.points}
                    </Badge>
                  </div>
                ))}
              </div>
            </section>

            {/* Levels Section */}
            <section className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-500" />
                Níveis
              </h3>
              <p className="text-sm text-muted-foreground">
                Suba de nível acumulando XP. Cada nível desbloqueia novas conquistas!
              </p>
              <div className="grid gap-2 text-sm">
                {[
                  { level: '1-5', title: 'Iniciante', emoji: '🌱', xp: '0 - 500 XP' },
                  { level: '6-10', title: 'Aprendiz', emoji: '📚', xp: '500 - 1.500 XP' },
                  { level: '11-20', title: 'Praticante', emoji: '💪', xp: '1.500 - 5.000 XP' },
                  { level: '21-30', title: 'Avançado', emoji: '⭐', xp: '5.000 - 15.000 XP' },
                  { level: '31-50', title: 'Expert', emoji: '🏅', xp: '15.000 - 50.000 XP' },
                  { level: '51+', title: 'Mestre', emoji: '👑', xp: '50.000+ XP' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <span>{item.emoji} Nv. {item.level}: {item.title}</span>
                    <span className="text-muted-foreground text-xs">{item.xp}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Ranks Section */}
            <section className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Crown className="w-4 h-4 text-purple-500" />
                Ranking
              </h3>
              <p className="text-sm text-muted-foreground">
                Seu rank é baseado no total de pontos acumulados:
              </p>
              <div className="grid gap-2 text-sm">
                {[
                  { rank: 'Bronze', emoji: '🥉', points: '0 - 999 pts' },
                  { rank: 'Prata', emoji: '🥈', points: '1.000 - 4.999 pts' },
                  { rank: 'Ouro', emoji: '🥇', points: '5.000 - 14.999 pts' },
                  { rank: 'Platina', emoji: '💎', points: '15.000 - 49.999 pts' },
                  { rank: 'Diamante', emoji: '💠', points: '50.000 - 99.999 pts' },
                  { rank: 'Lendário', emoji: '👑', points: '100.000+ pts' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <span>{item.emoji} {item.rank}</span>
                    <span className="text-muted-foreground text-xs">{item.points}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Streak Section */}
            <section className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" />
                Sequência (Streak)
              </h3>
              <p className="text-sm text-muted-foreground">
                Mantenha uma sequência diária para multiplicar seus ganhos:
              </p>
              <div className="grid gap-2 text-sm">
                {[
                  { days: '7 dias', bonus: '+10% XP', emoji: '🔥' },
                  { days: '30 dias', bonus: '+25% XP', emoji: '🔥🔥' },
                  { days: '100 dias', bonus: '+50% XP + Badge', emoji: '🔥🔥🔥' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <span>{item.emoji} {item.days}</span>
                    <Badge variant="secondary" className="bg-orange-500/20 text-orange-600">
                      {item.bonus}
                    </Badge>
                  </div>
                ))}
              </div>
            </section>

            {/* Missions Section */}
            <section className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Target className="w-4 h-4 text-green-500" />
                Missões
              </h3>
              <p className="text-sm text-muted-foreground">
                Complete missões diárias e semanais para ganhar recompensas extras:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Missões diárias renovam todo dia à meia-noite</li>
                <li>Missões semanais oferecem recompensas maiores</li>
                <li>Missões especiais aparecem em eventos</li>
              </ul>
            </section>

            {/* Achievements Section */}
            <section className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Medal className="w-4 h-4 text-amber-500" />
                Conquistas
              </h3>
              <p className="text-sm text-muted-foreground">
                Desbloqueie conquistas completando marcos especiais:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Primeiro desafio completado</li>
                <li>7 dias de streak</li>
                <li>100 pontos acumulados</li>
                <li>10 amigos adicionados</li>
                <li>E muito mais...</li>
              </ul>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
