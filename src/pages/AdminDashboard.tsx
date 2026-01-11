import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { formatNumber, calculateLevel, getRank, SCORE_ACTIONS } from '@/lib/scoring';
import {
  Users, ShoppingBag, Trophy, TrendingUp, 
  AlertTriangle, CheckCircle, XCircle, Search,
  BarChart3, DollarSign, Target, MessageCircle,
  Settings, Shield, Eye, Trash2, Ban, Plus,
  Sparkles, Crown, Zap, Star, Gift, RefreshCw,
  UserPlus, Edit, Award, Activity, Clock, 
  ArrowUpRight, ArrowDownRight, Flame, Bell,
  FileText, Database, Lock, Unlock, MoreVertical
} from 'lucide-react';

interface Stats {
  totalUsers: number;
  totalProducts: number;
  totalChallenges: number;
  totalPurchases: number;
  totalRevenue: number;
  activeUsers: number;
  totalMessages: number;
  totalGoals: number;
  totalPlans: number;
  pendingProducts: number;
}

interface User {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  level: number | null;
  pontos: number | null;
  experience_points: number | null;
  created_at: string | null;
  total_challenges_completed: number | null;
}

type ProductStatus = 'draft' | 'published' | 'archived';

interface Product {
  id: string;
  title: string;
  price_cents: number;
  status: ProductStatus;
  seller_id: string;
  created_at: string | null;
  total_sales: number | null;
  product_type: string;
}

interface Challenge {
  id: string;
  title: string;
  status: string | null;
  creator_id: string;
  target_user_id: string | null;
  reward_points: number | null;
  created_at: string | null;
}

interface RecentActivity {
  type: 'user' | 'product' | 'challenge' | 'purchase';
  title: string;
  subtitle: string;
  time: string;
  icon: React.ReactNode;
  color: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalProducts: 0,
    totalChallenges: 0,
    totalPurchases: 0,
    totalRevenue: 0,
    activeUsers: 0,
    totalMessages: 0,
    totalGoals: 0,
    totalPlans: 0,
    pendingProducts: 0
  });
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);

  // Dialog states
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showPointsDialog, setShowPointsDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showNotifyDialog, setShowNotifyDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pointsToAdd, setPointsToAdd] = useState('');
  const [selectedRole, setSelectedRole] = useState<'user' | 'moderator' | 'admin'>('user');
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [broadcastMode, setBroadcastMode] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      if (!roleData) {
        toast({
          title: "⛔ Acesso Negado",
          description: "Você não tem permissão de administrador.",
          variant: "destructive"
        });
        navigate('/dashboard');
        return;
      }

      setIsAdmin(true);
      fetchAdminData();
    } catch (error) {
      console.error('Error checking admin access:', error);
      navigate('/dashboard');
    }
  };

  const fetchAdminData = useCallback(async () => {
    try {
      // Parallel fetches for better performance
      const [
        { count: userCount },
        { count: productCount },
        { count: challengeCount },
        { data: purchases, count: purchaseCount },
        { count: messageCount },
        { count: goalCount },
        { count: planCount },
        { count: pendingCount },
        { data: recentUsers },
        { data: allProducts },
        { data: allChallenges }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('challenges').select('*', { count: 'exact', head: true }),
        supabase.from('purchases').select('amount_cents', { count: 'exact' }).eq('status', 'completed'),
        supabase.from('messages').select('*', { count: 'exact', head: true }),
        supabase.from('goals').select('*', { count: 'exact', head: true }),
        supabase.from('plans').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
        supabase.from('profiles').select('id, display_name, avatar_url, level, pontos, experience_points, created_at, total_challenges_completed').order('created_at', { ascending: false }).limit(50),
        supabase.from('products').select('id, title, price_cents, status, seller_id, created_at, total_sales, product_type').order('created_at', { ascending: false }).limit(50),
        supabase.from('challenges').select('id, title, status, creator_id, target_user_id, reward_points, created_at').order('created_at', { ascending: false }).limit(30)
      ]);

      const totalRevenue = purchases?.reduce((sum, p) => sum + (p.amount_cents || 0), 0) || 0;

      setStats({
        totalUsers: userCount || 0,
        totalProducts: productCount || 0,
        totalChallenges: challengeCount || 0,
        totalPurchases: purchaseCount || 0,
        totalRevenue: totalRevenue,
        activeUsers: Math.floor((userCount || 0) * 0.3),
        totalMessages: messageCount || 0,
        totalGoals: goalCount || 0,
        totalPlans: planCount || 0,
        pendingProducts: pendingCount || 0
      });

      setUsers(recentUsers || []);
      setProducts(allProducts || []);
      setChallenges(allChallenges || []);

      // Build recent activities
      const activities: RecentActivity[] = [];
      recentUsers?.slice(0, 5).forEach(u => {
        activities.push({
          type: 'user',
          title: `Novo usuário: ${u.display_name || 'Anônimo'}`,
          subtitle: `Nível ${u.level || 1}`,
          time: u.created_at ? new Date(u.created_at).toLocaleDateString('pt-BR') : '',
          icon: <UserPlus className="w-4 h-4" />,
          color: 'text-blue-500'
        });
      });
      allProducts?.slice(0, 3).forEach(p => {
        activities.push({
          type: 'product',
          title: `Produto: ${p.title}`,
          subtitle: `R$ ${(p.price_cents / 100).toFixed(2)}`,
          time: p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : '',
          icon: <ShoppingBag className="w-4 h-4" />,
          color: 'text-green-500'
        });
      });
      setRecentActivities(activities.slice(0, 10));

    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAdminData();
    toast({ title: "✅ Dados atualizados!" });
  };

  const handleUpdateProductStatus = async (productId: string, newStatus: ProductStatus) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ status: newStatus })
        .eq('id', productId);

      if (error) throw error;

      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, status: newStatus } : p
      ));

      toast({
        title: "✅ Sucesso",
        description: `Produto ${newStatus === 'published' ? 'aprovado' : newStatus === 'archived' ? 'arquivado' : 'atualizado'}.`
      });
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o produto.",
        variant: "destructive"
      });
    }
  };

  const handleAddPoints = async () => {
    if (!selectedUser || !pointsToAdd) return;
    
    const points = parseInt(pointsToAdd);
    if (isNaN(points)) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          pontos: (selectedUser.pontos || 0) + points,
          experience_points: (selectedUser.experience_points || 0) + points
        })
        .eq('id', selectedUser.id);

      if (error) throw error;

      // Create notification for user
      await supabase.from('notifications').insert({
        user_id: selectedUser.id,
        title: '🎁 Pontos Recebidos!',
        message: `Você recebeu ${points} pontos do administrador!`,
        type: 'reward'
      });

      setUsers(prev => prev.map(u => 
        u.id === selectedUser.id 
          ? { ...u, pontos: (u.pontos || 0) + points, experience_points: (u.experience_points || 0) + points }
          : u
      ));

      toast({ title: "✅ Pontos adicionados com sucesso!" });
      setShowPointsDialog(false);
      setPointsToAdd('');
    } catch (error) {
      console.error('Error adding points:', error);
      toast({ title: "Erro ao adicionar pontos", variant: "destructive" });
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedUser) return;

    try {
      // Remove existing roles
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', selectedUser.id);

      // Add new role
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: selectedUser.id, role: selectedRole });

      if (error) throw error;

      toast({ title: `✅ Cargo atualizado para ${selectedRole}!` });
      setShowRoleDialog(false);
    } catch (error) {
      console.error('Error updating role:', error);
      toast({ title: "Erro ao atualizar cargo", variant: "destructive" });
    }
  };

  const handleSendNotification = async () => {
    if (!notificationTitle || !notificationMessage) return;

    try {
      if (broadcastMode) {
        // Send to all users
        const userIds = users.map(u => u.id);
        const notifications = userIds.map(userId => ({
          user_id: userId,
          title: notificationTitle,
          message: notificationMessage,
          type: 'admin'
        }));

        const { error } = await supabase.from('notifications').insert(notifications);
        if (error) throw error;

        toast({ title: `✅ Notificação enviada para ${userIds.length} usuários!` });
      } else if (selectedUser) {
        const { error } = await supabase.from('notifications').insert({
          user_id: selectedUser.id,
          title: notificationTitle,
          message: notificationMessage,
          type: 'admin'
        });
        if (error) throw error;

        toast({ title: `✅ Notificação enviada para ${selectedUser.display_name}!` });
      }

      setShowNotifyDialog(false);
      setNotificationTitle('');
      setNotificationMessage('');
    } catch (error) {
      console.error('Error sending notification:', error);
      toast({ title: "Erro ao enviar notificação", variant: "destructive" });
    }
  };

  const handleDeleteChallenge = async (challengeId: string) => {
    try {
      const { error } = await supabase
        .from('challenges')
        .delete()
        .eq('id', challengeId);

      if (error) throw error;

      setChallenges(prev => prev.filter(c => c.id !== challengeId));
      toast({ title: "✅ Desafio removido!" });
    } catch (error) {
      console.error('Error deleting challenge:', error);
      toast({ title: "Erro ao remover desafio", variant: "destructive" });
    }
  };

  const filteredUsers = users.filter(u => 
    u.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProducts = products.filter(p =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-accent/10">
        <div className="text-center space-y-4">
          <LoadingSpinner />
          <p className="text-muted-foreground animate-pulse">Carregando painel admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      {/* Header */}
      <div className="sticky top-16 z-30 bg-card/95 backdrop-blur-xl border-b border-border shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-accent shadow-glow">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                Painel Admin 
                <Crown className="h-5 w-5 text-yellow-500" />
              </h1>
              <p className="text-xs text-muted-foreground">Controle total da plataforma</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={refreshing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setBroadcastMode(true);
                setShowNotifyDialog(true);
              }}
              className="gap-2"
            >
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Broadcast</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              Voltar
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Overview - Enhanced */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: 'Usuários', value: stats.totalUsers, icon: Users, color: 'blue', emoji: '👥' },
            { label: 'Produtos', value: stats.totalProducts, icon: ShoppingBag, color: 'green', emoji: '🛍️', badge: stats.pendingProducts > 0 ? `${stats.pendingProducts} pendentes` : null },
            { label: 'Desafios', value: stats.totalChallenges, icon: Trophy, color: 'yellow', emoji: '🏆' },
            { label: 'Vendas', value: stats.totalPurchases, icon: BarChart3, color: 'purple', emoji: '📈' },
            { label: 'Receita', value: `R$ ${formatNumber(stats.totalRevenue / 100)}`, icon: DollarSign, color: 'emerald', emoji: '💰' },
          ].map((stat, i) => (
            <Card key={i} className={`relative overflow-hidden bg-gradient-to-br from-${stat.color}-500/10 to-${stat.color}-600/5 border-${stat.color}-500/20 hover:shadow-lg transition-all duration-300 group`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{stat.emoji}</span>
                  <stat.icon className={`h-5 w-5 text-${stat.color}-500 group-hover:scale-110 transition-transform`} />
                </div>
                <p className="text-2xl font-bold">{typeof stat.value === 'number' ? formatNumber(stat.value) : stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                {stat.badge && (
                  <Badge variant="destructive" className="absolute top-2 right-2 text-[10px] px-1.5">
                    {stat.badge}
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Mensagens', value: stats.totalMessages, emoji: '💬' },
            { label: 'Metas', value: stats.totalGoals, emoji: '🎯' },
            { label: 'Planos', value: stats.totalPlans, emoji: '📋' },
            { label: 'Ativos', value: stats.activeUsers, emoji: '🟢' },
          ].map((stat, i) => (
            <div key={i} className="p-3 rounded-xl bg-card/50 border border-border/50 text-center">
              <span className="text-lg">{stat.emoji}</span>
              <p className="text-lg font-bold">{formatNumber(stat.value)}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap bg-card/50 p-1">
            <TabsTrigger value="overview" className="gap-2">
              <Activity className="h-4 w-4" /> Visão Geral
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" /> Usuários
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2">
              <ShoppingBag className="h-4 w-4" /> Produtos
            </TabsTrigger>
            <TabsTrigger value="challenges" className="gap-2">
              <Trophy className="h-4 w-4" /> Desafios
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" /> Config
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid lg:grid-cols-2 gap-4">
              {/* Recent Activity */}
              <Card className="bg-card/50 backdrop-blur">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Atividade Recente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-72">
                    <div className="space-y-3">
                      {recentActivities.map((activity, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                          <div className={`p-2 rounded-full bg-muted ${activity.color}`}>
                            {activity.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{activity.title}</p>
                            <p className="text-xs text-muted-foreground">{activity.subtitle}</p>
                          </div>
                          <span className="text-[10px] text-muted-foreground">{activity.time}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Top Users */}
              <Card className="bg-card/50 backdrop-blur">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Crown className="h-5 w-5 text-yellow-500" />
                    Top Usuários
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-72">
                    <div className="space-y-3">
                      {users
                        .sort((a, b) => (b.pontos || 0) - (a.pontos || 0))
                        .slice(0, 10)
                        .map((user, i) => {
                          const level = calculateLevel(user.experience_points || 0);
                          const rank = getRank(user.pontos || 0);
                          return (
                            <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                              <span className="text-lg font-bold text-muted-foreground w-6">
                                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                              </span>
                              <Avatar className="h-8 w-8 border-2 border-primary/30">
                                <AvatarImage src={user.avatar_url || undefined} />
                                <AvatarFallback className="bg-primary/20 text-xs">
                                  {user.display_name?.charAt(0).toUpperCase() || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{user.display_name || 'Usuário'}</p>
                                <p className="text-xs text-muted-foreground">
                                  {level.emoji} {level.title} • {rank.emoji} {rank.rank}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-primary">{formatNumber(user.pontos || 0)}</p>
                                <p className="text-[10px] text-muted-foreground">pontos</p>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="bg-card/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5 text-accent" />
                  Ações Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col gap-2 hover:bg-primary/10 hover:border-primary"
                    onClick={() => {
                      setBroadcastMode(true);
                      setShowNotifyDialog(true);
                    }}
                  >
                    <Bell className="h-6 w-6" />
                    <span className="text-xs">Notificação Global</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col gap-2 hover:bg-green-500/10 hover:border-green-500"
                    onClick={() => setActiveTab('products')}
                  >
                    <CheckCircle className="h-6 w-6 text-green-500" />
                    <span className="text-xs">Aprovar Produtos</span>
                    {stats.pendingProducts > 0 && (
                      <Badge variant="destructive" className="text-[10px]">{stats.pendingProducts}</Badge>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col gap-2 hover:bg-yellow-500/10 hover:border-yellow-500"
                    onClick={() => setActiveTab('users')}
                  >
                    <Gift className="h-6 w-6 text-yellow-500" />
                    <span className="text-xs">Dar Pontos</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col gap-2 hover:bg-purple-500/10 hover:border-purple-500"
                    onClick={() => navigate('/marketplace')}
                  >
                    <Eye className="h-6 w-6 text-purple-500" />
                    <span className="text-xs">Ver Marketplace</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="bg-card/50">
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Gerenciar Usuários ({users.length})
                  </CardTitle>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar usuário..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {filteredUsers.map(user => {
                      const level = calculateLevel(user.experience_points || 0);
                      const rank = getRank(user.pontos || 0);
                      return (
                        <div key={user.id} className="flex items-center gap-4 p-3 rounded-xl border bg-card/50 hover:bg-muted/30 transition-colors group">
                          <Avatar className="h-12 w-12 border-2 border-primary/20">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary/20">
                              {user.display_name?.charAt(0).toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{user.display_name || 'Usuário'}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{level.emoji} Nv. {level.level}</span>
                              <span>•</span>
                              <span className={rank.color}>{rank.emoji} {rank.rank}</span>
                              <span>•</span>
                              <span>{formatNumber(user.pontos || 0)} pts</span>
                            </div>
                            <Progress value={level.progress} className="h-1 mt-1" />
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setSelectedUser(user);
                                setShowUserDialog(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8 text-yellow-500"
                              onClick={() => {
                                setSelectedUser(user);
                                setShowPointsDialog(true);
                              }}
                            >
                              <Gift className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8 text-purple-500"
                              onClick={() => {
                                setSelectedUser(user);
                                setShowRoleDialog(true);
                              }}
                            >
                              <Shield className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8 text-blue-500"
                              onClick={() => {
                                setSelectedUser(user);
                                setBroadcastMode(false);
                                setShowNotifyDialog(true);
                              }}
                            >
                              <Bell className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products">
            <Card className="bg-card/50">
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5" />
                    Gerenciar Produtos ({products.length})
                    {stats.pendingProducts > 0 && (
                      <Badge variant="destructive">{stats.pendingProducts} pendentes</Badge>
                    )}
                  </CardTitle>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar produto..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {filteredProducts.map(product => (
                      <div key={product.id} className="flex items-center gap-4 p-3 rounded-xl border bg-card/50 hover:bg-muted/30 transition-colors">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                          <ShoppingBag className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{product.title}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>R$ {(product.price_cents / 100).toFixed(2)}</span>
                            <span>•</span>
                            <span>{product.product_type}</span>
                            <span>•</span>
                            <span>{product.total_sales || 0} vendas</span>
                          </div>
                        </div>
                        <Badge 
                          variant={product.status === 'published' ? 'default' : 
                                  product.status === 'draft' ? 'secondary' : 'destructive'}
                          className="capitalize"
                        >
                          {product.status === 'published' ? '✅ Publicado' : 
                           product.status === 'draft' ? '⏳ Pendente' : '📦 Arquivado'}
                        </Badge>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => navigate(`/marketplace/${product.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {product.status === 'draft' && (
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8 text-green-500"
                              onClick={() => handleUpdateProductStatus(product.id, 'published')}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {product.status !== 'archived' && (
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleUpdateProductStatus(product.id, 'archived')}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Challenges Tab */}
          <TabsContent value="challenges">
            <Card className="bg-card/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Gerenciar Desafios ({challenges.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {challenges.map(challenge => (
                      <div key={challenge.id} className="flex items-center gap-4 p-3 rounded-xl border bg-card/50 hover:bg-muted/30 transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                          <Trophy className="h-5 w-5 text-yellow-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{challenge.title}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>🎁 {challenge.reward_points || 0} pts</span>
                            <span>•</span>
                            <span>{challenge.created_at ? new Date(challenge.created_at).toLocaleDateString('pt-BR') : ''}</span>
                          </div>
                        </div>
                        <Badge 
                          variant={challenge.status === 'completed' ? 'default' : 
                                  challenge.status === 'pending' ? 'secondary' : 'outline'}
                        >
                          {challenge.status === 'completed' ? '✅ Completo' : 
                           challenge.status === 'pending' ? '⏳ Pendente' : 
                           challenge.status === 'accepted' ? '🤝 Aceito' : challenge.status}
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDeleteChallenge(challenge.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="bg-card/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Estatísticas do Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-2xl font-bold">{stats.totalUsers}</p>
                      <p className="text-xs text-muted-foreground">Total Usuários</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-2xl font-bold">{stats.totalProducts}</p>
                      <p className="text-xs text-muted-foreground">Total Produtos</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-2xl font-bold">{stats.totalChallenges}</p>
                      <p className="text-xs text-muted-foreground">Total Desafios</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-2xl font-bold">R$ {formatNumber(stats.totalRevenue / 100)}</p>
                      <p className="text-xs text-muted-foreground">Receita Total</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Sistema de Pontuação
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-48">
                    <div className="space-y-2">
                      {Object.entries(SCORE_ACTIONS).slice(0, 8).map(([key, action]) => (
                        <div key={key} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                          <div className="flex items-center gap-2">
                            <span>{action.emoji}</span>
                            <span className="text-sm">{action.description}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-bold text-primary">+{action.basePoints}</span>
                            <span className="text-xs text-muted-foreground ml-1">pts</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* User Details Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Usuário</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedUser.avatar_url || undefined} />
                  <AvatarFallback>{selectedUser.display_name?.charAt(0) || '?'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-bold">{selectedUser.display_name || 'Usuário'}</p>
                  <p className="text-sm text-muted-foreground">ID: {selectedUser.id.slice(0, 8)}...</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Nível</p>
                  <p className="text-xl font-bold">{selectedUser.level || 1}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Pontos</p>
                  <p className="text-xl font-bold">{formatNumber(selectedUser.pontos || 0)}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">XP</p>
                  <p className="text-xl font-bold">{formatNumber(selectedUser.experience_points || 0)}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Desafios</p>
                  <p className="text-xl font-bold">{selectedUser.total_challenges_completed || 0}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Points Dialog */}
      <Dialog open={showPointsDialog} onOpenChange={setShowPointsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>🎁 Adicionar Pontos</DialogTitle>
            <DialogDescription>
              Adicionar pontos para {selectedUser?.display_name || 'usuário'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="number"
              placeholder="Quantidade de pontos"
              value={pointsToAdd}
              onChange={(e) => setPointsToAdd(e.target.value)}
            />
            <div className="flex gap-2">
              {[50, 100, 500, 1000].map(amount => (
                <Button
                  key={amount}
                  variant="outline"
                  size="sm"
                  onClick={() => setPointsToAdd(amount.toString())}
                >
                  +{amount}
                </Button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPointsDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddPoints} className="gap-2">
              <Gift className="h-4 w-4" />
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>🛡️ Alterar Cargo</DialogTitle>
            <DialogDescription>
              Alterar cargo de {selectedUser?.display_name || 'usuário'}
            </DialogDescription>
          </DialogHeader>
          <Select value={selectedRole} onValueChange={(v: any) => setSelectedRole(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">👤 Usuário</SelectItem>
              <SelectItem value="moderator">🛡️ Moderador</SelectItem>
              <SelectItem value="admin">👑 Administrador</SelectItem>
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateRole}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Notification Dialog */}
      <Dialog open={showNotifyDialog} onOpenChange={setShowNotifyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {broadcastMode ? '📢 Notificação Global' : `🔔 Notificar ${selectedUser?.display_name}`}
            </DialogTitle>
            <DialogDescription>
              {broadcastMode 
                ? `Enviar para todos os ${users.length} usuários`
                : 'Enviar notificação personalizada'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Título da notificação"
              value={notificationTitle}
              onChange={(e) => setNotificationTitle(e.target.value)}
            />
            <Textarea
              placeholder="Mensagem..."
              value={notificationMessage}
              onChange={(e) => setNotificationMessage(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNotifyDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSendNotification} className="gap-2">
              <Bell className="h-4 w-4" />
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
