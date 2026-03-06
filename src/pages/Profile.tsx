import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import MobileBottomNav from '@/components/MobileBottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Flame, Trophy, LogOut, Crown, ChevronRight, Settings, Pencil, X, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export default function Profile() {
  const [profile, setProfile] = useState<any>(null);
  const [streak, setStreak] = useState({ current: 0, longest: 0 });
  const [score, setScore] = useState({ score: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAge, setEditAge] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { navigate('/auth'); return; }
      const uid = session.user.id;

      const [profileRes, streakRes, scoreRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', uid).single(),
        supabase.from('streaks').select('current_streak, longest_streak').eq('user_id', uid).maybeSingle(),
        supabase.from('transformation_scores').select('score, quests_completed_total').eq('user_id', uid).maybeSingle(),
      ]);

      setProfile(profileRes.data);
      setEditName(profileRes.data?.display_name || profileRes.data?.name || '');
      setEditAge(profileRes.data?.age?.toString() || '');
      setStreak({ current: streakRes.data?.current_streak || 0, longest: streakRes.data?.longest_streak || 0 });
      setScore({ score: scoreRes.data?.score || 0, total: scoreRes.data?.quests_completed_total || 0 });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({
        display_name: editName,
        name: editName,
        age: editAge ? parseInt(editAge) : null,
      }).eq('id', profile.id);
      if (error) throw error;
      setProfile((p: any) => ({ ...p, display_name: editName, name: editName, age: editAge ? parseInt(editAge) : null }));
      setEditing(false);
      toast({ title: '✅ Perfil atualizado!' });
    } catch {
      toast({ title: 'Erro ao salvar', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-primary/20 animate-pulse" />
      </div>
    );
  }

  const userName = profile?.display_name || profile?.name || 'Guerreiro';
  const memberSince = profile?.created_at ? new Date(profile.created_at).toLocaleDateString('pt-BR') : '';

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className={cn("px-4 py-8 space-y-6", !isMobile && "max-w-lg mx-auto")}>
        
        {/* Avatar + Name */}
        <div className="flex flex-col items-center text-center">
          <Avatar className="w-24 h-24 border-4 border-primary/20 mb-4">
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback className="text-2xl font-bold text-primary bg-primary/10">
              {userName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {editing ? (
            <div className="w-full space-y-3 max-w-xs">
              <div>
                <Label className="text-xs text-muted-foreground">Nome</Label>
                <Input value={editName} onChange={e => setEditName(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Idade</Label>
                <Input type="number" value={editAge} onChange={e => setEditAge(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave} disabled={saving} className="flex-1">
                  <Check className="w-4 h-4 mr-1" /> Salvar
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(false)} className="flex-1">
                  <X className="w-4 h-4 mr-1" /> Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-foreground">{userName}</h2>
              <p className="text-sm text-muted-foreground">{profile?.ocupacao || 'Membro GlowUp'}</p>
              <button onClick={() => setEditing(true)} className="mt-2 text-xs text-primary flex items-center gap-1">
                <Pencil className="w-3 h-3" /> Editar perfil
              </button>
            </>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-orange-500/10 border border-orange-500/20 p-4 text-center">
            <Flame className="w-5 h-5 text-orange-500 mx-auto mb-1" />
            <p className="text-2xl font-bold font-mono text-foreground">{streak.current}</p>
            <p className="text-[10px] text-muted-foreground">Streak</p>
          </div>
          <div className="rounded-2xl bg-primary/10 border border-primary/20 p-4 text-center">
            <Trophy className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold font-mono text-foreground">{score.total}</p>
            <p className="text-[10px] text-muted-foreground">Quests</p>
          </div>
          <div className="rounded-2xl bg-green-500/10 border border-green-500/20 p-4 text-center">
            <Crown className="w-5 h-5 text-green-500 mx-auto mb-1" />
            <p className="text-2xl font-bold font-mono text-foreground">{score.score}</p>
            <p className="text-[10px] text-muted-foreground">Score</p>
          </div>
        </div>

        {/* Transformation Progress */}
        <div className="rounded-2xl bg-card border border-border p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Transformação</span>
            <span className="text-sm font-bold text-primary">{score.score}%</span>
          </div>
          <div className="w-full h-3 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-1000"
              style={{ width: `${score.score}%` }}
            />
          </div>
        </div>

        {/* Links */}
        <div className="space-y-2">
          <button
            onClick={() => navigate('/premium')}
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">💎</span>
              <span className="text-sm font-medium text-primary">GlowUp Premium</span>
            </div>
            <ChevronRight className="w-4 h-4 text-primary/60" />
          </button>

          <button
            onClick={() => navigate('/progress')}
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-card border border-border/50 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">📊</span>
              <span className="text-sm font-medium text-foreground">Meu Progresso</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Info */}
        <div className="rounded-2xl bg-card border border-border p-5 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Membro desde</span>
            <span className="font-medium text-foreground">{memberSince}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Maior streak</span>
            <span className="font-medium text-foreground">{streak.longest} dias</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Nível</span>
            <span className="font-medium text-foreground">{profile?.level || 1}</span>
          </div>
        </div>

        {/* Sign Out */}
        <Button
          variant="outline"
          onClick={handleSignOut}
          className="w-full h-12 rounded-2xl text-destructive border-destructive/20 hover:bg-destructive/5"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair da conta
        </Button>
      </div>

      <MobileBottomNav />
    </div>
  );
}
