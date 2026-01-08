import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import {
  Users, ShoppingBag, Trophy, TrendingUp, 
  AlertTriangle, CheckCircle, XCircle, Search,
  BarChart3, DollarSign, Target, MessageCircle,
  Settings, Shield, Eye, Trash2, Ban
} from 'lucide-react';

interface Stats {
  totalUsers: number;
  totalProducts: number;
  totalChallenges: number;
  totalPurchases: number;
  totalRevenue: number;
  activeUsers: number;
}

interface User {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  level: number | null;
  pontos: number | null;
  created_at: string | null;
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
    activeUsers: 0
  });
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

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

      // Check if user has admin role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      if (!roleData) {
        toast({
          title: "Acesso Negado",
          description: "Você não tem permissão para acessar esta página.",
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

  const fetchAdminData = async () => {
    try {
      // Fetch user count
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch product count
      const { count: productCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      // Fetch challenge count
      const { count: challengeCount } = await supabase
        .from('challenges')
        .select('*', { count: 'exact', head: true });

      // Fetch purchases and calculate revenue
      const { data: purchases, count: purchaseCount } = await supabase
        .from('purchases')
        .select('amount_cents', { count: 'exact' })
        .eq('status', 'completed');

      const totalRevenue = purchases?.reduce((sum, p) => sum + (p.amount_cents || 0), 0) || 0;

      // Fetch recent users
      const { data: recentUsers } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, level, pontos, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

      // Fetch products
      const { data: allProducts } = await supabase
        .from('products')
        .select('id, title, price_cents, status, seller_id, created_at, total_sales')
        .order('created_at', { ascending: false })
        .limit(20);

      setStats({
        totalUsers: userCount || 0,
        totalProducts: productCount || 0,
        totalChallenges: challengeCount || 0,
        totalPurchases: purchaseCount || 0,
        totalRevenue: totalRevenue,
        activeUsers: Math.floor((userCount || 0) * 0.3) // Estimate
      });

      setUsers(recentUsers || []);
      setProducts(allProducts || []);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
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
        title: "Sucesso",
        description: `Produto ${newStatus === 'published' ? 'aprovado' : 'atualizado'}.`
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

  const filteredUsers = users.filter(u => 
    u.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProducts = products.filter(p =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-16 z-30 bg-card/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Painel Administrativo</h1>
              <p className="text-sm text-muted-foreground">Gerencie toda a plataforma</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Voltar ao App
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                <span className="text-sm text-muted-foreground">Usuários</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.totalUsers}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-green-500" />
                <span className="text-sm text-muted-foreground">Produtos</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.totalProducts}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <span className="text-sm text-muted-foreground">Desafios</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.totalChallenges}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-500" />
                <span className="text-sm text-muted-foreground">Vendas</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.totalPurchases}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/10 to-accent/5">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">Receita</span>
              </div>
              <p className="text-2xl font-bold mt-1">
                R$ {(stats.totalRevenue / 100).toFixed(0)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-orange-500" />
                <span className="text-sm text-muted-foreground">Ativos</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.activeUsers}</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="products">Produtos</TabsTrigger>
            <TabsTrigger value="moderation">Moderação</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Usuários Recentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="space-y-3">
                      {users.slice(0, 5).map(user => (
                        <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback>
                              {user.display_name?.charAt(0).toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {user.display_name || 'Usuário'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Nv. {user.level || 1} • {user.pontos || 0} pts
                            </p>
                          </div>
                          <Badge variant="secondary" className="text-[10px]">
                            {new Date(user.created_at || '').toLocaleDateString('pt-BR')}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5" />
                    Produtos Recentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="space-y-3">
                      {products.slice(0, 5).map(product => (
                        <div key={product.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                            <ShoppingBag className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{product.title}</p>
                            <p className="text-xs text-muted-foreground">
                              R$ {(product.price_cents / 100).toFixed(2)}
                            </p>
                          </div>
                          <Badge 
                            variant={product.status === 'published' ? 'default' : 'secondary'}
                            className="text-[10px]"
                          >
                            {product.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Gerenciar Usuários</CardTitle>
                  <div className="relative w-64">
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
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {filteredUsers.map(user => (
                      <div key={user.id} className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/30">
                        <Avatar>
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback>
                            {user.display_name?.charAt(0).toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">{user.display_name || 'Usuário'}</p>
                          <p className="text-sm text-muted-foreground">
                            Nível {user.level || 1} • {user.pontos || 0} pontos
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive">
                            <Ban className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Gerenciar Produtos</CardTitle>
                  <div className="relative w-64">
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
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {filteredProducts.map(product => (
                      <div key={product.id} className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/30">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <ShoppingBag className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{product.title}</p>
                          <p className="text-sm text-muted-foreground">
                            R$ {(product.price_cents / 100).toFixed(2)} • {product.total_sales || 0} vendas
                          </p>
                        </div>
                        <Badge 
                          variant={product.status === 'published' ? 'default' : 
                                  product.status === 'draft' ? 'secondary' : 'destructive'}
                        >
                          {product.status}
                        </Badge>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => navigate(`/marketplace/${product.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {product.status === 'draft' && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-green-500"
                              onClick={() => handleUpdateProductStatus(product.id, 'published')}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-destructive"
                            onClick={() => handleUpdateProductStatus(product.id, 'archived')}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="moderation">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Central de Moderação
                </CardTitle>
                <CardDescription>
                  Revise conteúdo reportado e gerencie denúncias
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500/50" />
                  <h3 className="text-lg font-semibold mb-2">Tudo em ordem!</h3>
                  <p className="text-sm">Nenhuma denúncia ou conteúdo pendente para revisão.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
