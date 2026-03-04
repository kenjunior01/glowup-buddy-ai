import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Plus, Crown, MessageCircle, Send, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Tribe {
  id: string;
  name: string;
  description: string;
  category: string;
  icon_emoji: string;
  cover_color: string;
  member_count: number;
  is_public: boolean;
}

interface TribePost {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  likes_count: number;
  profile?: { display_name: string; avatar_url: string };
}

export default function TribesSystem({ userId }: { userId: string }) {
  const [tribes, setTribes] = useState<Tribe[]>([]);
  const [myTribes, setMyTribes] = useState<string[]>([]);
  const [selectedTribe, setSelectedTribe] = useState<Tribe | null>(null);
  const [posts, setPosts] = useState<TribePost[]>([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTribe, setNewTribe] = useState({ name: '', description: '', category: 'geral' });

  useEffect(() => {
    fetchTribes();
  }, [userId]);

  const fetchTribes = async () => {
    try {
      const [{ data: allTribes }, { data: memberships }] = await Promise.all([
        supabase.from('tribes').select('*').order('member_count', { ascending: false }),
        supabase.from('tribe_members').select('tribe_id').eq('user_id', userId),
      ]);
      setTribes((allTribes as any[]) || []);
      setMyTribes((memberships || []).map((m: any) => m.tribe_id));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const joinTribe = async (tribeId: string) => {
    const { error } = await supabase.from('tribe_members').insert({ tribe_id: tribeId, user_id: userId });
    if (error) { toast.error('Erro ao entrar na tribo'); return; }
    // Update member count
    await supabase.from('tribes').update({ member_count: (tribes.find(t => t.id === tribeId)?.member_count || 0) + 1 }).eq('id', tribeId);
    toast.success('Você entrou na tribo! 🎉');
    setMyTribes(prev => [...prev, tribeId]);
    fetchTribes();
  };

  const leaveTribe = async (tribeId: string) => {
    await supabase.from('tribe_members').delete().eq('tribe_id', tribeId).eq('user_id', userId);
    await supabase.from('tribes').update({ member_count: Math.max((tribes.find(t => t.id === tribeId)?.member_count || 1) - 1, 0) }).eq('id', tribeId);
    toast.success('Você saiu da tribo');
    setMyTribes(prev => prev.filter(id => id !== tribeId));
    if (selectedTribe?.id === tribeId) setSelectedTribe(null);
    fetchTribes();
  };

  const openTribe = async (tribe: Tribe) => {
    setSelectedTribe(tribe);
    const { data } = await supabase
      .from('tribe_posts')
      .select('*')
      .eq('tribe_id', tribe.id)
      .order('created_at', { ascending: false })
      .limit(50);
    
    // Fetch profiles for posts
    if (data && data.length > 0) {
      const userIds = [...new Set(data.map((p: any) => p.user_id))];
      const { data: profiles } = await supabase.rpc('get_public_profile', { profile_id: userIds[0] });
      // Simple approach: attach profiles
      const enriched = data.map((p: any) => ({ ...p, profile: profiles?.[0] }));
      setPosts(enriched);
    } else {
      setPosts([]);
    }
  };

  const sendPost = async () => {
    if (!newPost.trim() || !selectedTribe) return;
    const { error } = await supabase.from('tribe_posts').insert({
      tribe_id: selectedTribe.id,
      user_id: userId,
      content: newPost.trim(),
    });
    if (error) { toast.error('Erro ao postar'); return; }
    setNewPost('');
    openTribe(selectedTribe);
  };

  const createTribe = async () => {
    if (!newTribe.name.trim()) return;
    const { error } = await supabase.from('tribes').insert({
      name: newTribe.name,
      description: newTribe.description,
      category: newTribe.category,
      creator_id: userId,
    });
    if (error) { toast.error('Erro ao criar tribo'); return; }
    // Auto-join
    toast.success('Tribo criada! 🎉');
    setShowCreate(false);
    setNewTribe({ name: '', description: '', category: 'geral' });
    fetchTribes();
  };

  const categoryConfig: Record<string, { label: string; gradient: string }> = {
    biohacking: { label: 'Biohacking', gradient: 'from-cyan-500 to-blue-600' },
    looksmaxxing: { label: 'Looksmaxxing', gradient: 'from-purple-500 to-pink-500' },
    fitness: { label: 'Fitness', gradient: 'from-orange-500 to-red-500' },
    mindset: { label: 'Mindset', gradient: 'from-emerald-500 to-teal-600' },
    geral: { label: 'Geral', gradient: 'from-gray-500 to-gray-600' },
  };

  // Tribe detail view
  if (selectedTribe) {
    const isMember = myTribes.includes(selectedTribe.id);
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className={cn("rounded-2xl p-6 bg-gradient-to-br text-white relative overflow-hidden", selectedTribe.cover_color)}>
          <Button variant="ghost" size="sm" className="absolute top-3 left-3 text-white/80 hover:text-white hover:bg-white/10" onClick={() => setSelectedTribe(null)}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
          </Button>
          <div className="text-center pt-6">
            <span className="text-4xl mb-2 block">{selectedTribe.icon_emoji}</span>
            <h2 className="text-xl font-bold">{selectedTribe.name}</h2>
            <p className="text-white/70 text-sm mt-1">{selectedTribe.description}</p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <Badge className="bg-white/20 text-white border-0">
                <Users className="w-3 h-3 mr-1" />
                {selectedTribe.member_count} membros
              </Badge>
            </div>
          </div>
        </div>

        {/* Post input */}
        {isMember && (
          <div className="bento-card flex gap-2">
            <Input
              placeholder="Compartilhe com a tribo..."
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendPost()}
              className="flex-1"
            />
            <Button size="sm" onClick={sendPost} disabled={!newPost.trim()} className="gradient-button text-white">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        )}

        {!isMember && (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground mb-3">Entre na tribo para participar das discussões</p>
              <Button onClick={() => joinTribe(selectedTribe.id)} className="gradient-button text-white">
                Entrar na Tribo
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Posts */}
        {posts.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <MessageCircle className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-muted-foreground">Nenhuma postagem ainda. Seja o primeiro!</p>
            </CardContent>
          </Card>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="bento-card">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {post.profile?.display_name?.charAt(0) || '?'}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{post.profile?.display_name || 'Membro'}</p>
                  <p className="text-sm text-muted-foreground mt-1">{post.content}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-2">
                    {new Date(post.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    );
  }

  // Tribes list view
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            ⚔️ Tribos
          </h2>
          <p className="text-xs text-muted-foreground">Encontre seu clã e evolua junto</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm" className="gradient-button text-white">
              <Plus className="w-4 h-4 mr-1" /> Criar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Tribo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <Input placeholder="Nome da tribo" value={newTribe.name} onChange={(e) => setNewTribe(p => ({ ...p, name: e.target.value }))} />
              <Textarea placeholder="Descrição" value={newTribe.description} onChange={(e) => setNewTribe(p => ({ ...p, description: e.target.value }))} />
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(categoryConfig).map(([key, { label, gradient }]) => (
                  <button
                    key={key}
                    onClick={() => setNewTribe(p => ({ ...p, category: key }))}
                    className={cn(
                      "p-2 rounded-lg text-xs font-medium border transition-all",
                      newTribe.category === key ? "border-primary bg-primary/10" : "border-border"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <Button className="w-full gradient-button text-white" onClick={createTribe}>Criar Tribo</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* My Tribes */}
      {myTribes.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Minhas Tribos</p>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {tribes.filter(t => myTribes.includes(t.id)).map(tribe => (
              <button
                key={tribe.id}
                onClick={() => openTribe(tribe)}
                className={cn("flex-shrink-0 w-20 text-center group")}
              >
                <div className={cn("w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br flex items-center justify-center text-2xl shadow-md transition-transform group-hover:scale-105", tribe.cover_color)}>
                  {tribe.icon_emoji}
                </div>
                <p className="text-[10px] font-medium text-foreground mt-1.5 truncate">{tribe.name}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* All Tribes */}
      <div className="grid gap-3">
        {tribes.map((tribe) => {
          const isMember = myTribes.includes(tribe.id);
          const cat = categoryConfig[tribe.category] || categoryConfig.geral;
          return (
            <div
              key={tribe.id}
              className="bento-card cursor-pointer tap-scale"
              onClick={() => isMember ? openTribe(tribe) : undefined}
            >
              <div className="flex items-center gap-3">
                <div className={cn("w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-xl shadow-sm", tribe.cover_color)}>
                  {tribe.icon_emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm text-foreground truncate">{tribe.name}</h3>
                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0">{cat.label}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{tribe.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Users className="w-3 h-3" /> {tribe.member_count}
                    </span>
                  </div>
                </div>
                {isMember ? (
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">Membro</Badge>
                ) : (
                  <Button size="sm" variant="outline" className="text-xs" onClick={(e) => { e.stopPropagation(); joinTribe(tribe.id); }}>
                    Entrar
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
