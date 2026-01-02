import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { toast } from "@/hooks/use-toast";
import { 
  Plus, Package, DollarSign, ShoppingBag, TrendingUp,
  Edit, Trash2, Eye, MoreVertical, BookOpen, Video, Users, FileText
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  type: string;
  status: string;
  image_url: string | null;
  created_at: string;
}

interface Stats {
  totalProducts: number;
  totalSales: number;
  totalRevenue: number;
  pendingSales: number;
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'ebook':
      return <BookOpen className="h-4 w-4" />;
    case 'course':
      return <Video className="h-4 w-4" />;
    case 'mentoria':
      return <Users className="h-4 w-4" />;
    case 'template':
      return <FileText className="h-4 w-4" />;
    default:
      return <Package className="h-4 w-4" />;
  }
};

const SellerDashboard = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalSales: 0,
    totalRevenue: 0,
    pendingSales: 0,
  });
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate('/auth');
        return;
      }
      setUserId(session.user.id);
    };
    checkUser();
  }, [navigate]);

  useEffect(() => {
    if (userId) {
      fetchProducts();
      fetchStats();
    }
  }, [userId]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Get total products
      const { count: productCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', userId);

      // Get sales data
      const { data: sales } = await supabase
        .from('purchases')
        .select('price_paid, status, products!inner(seller_id)')
        .eq('products.seller_id', userId);

      const completedSales = sales?.filter(s => s.status === 'completed') || [];
      const pendingSales = sales?.filter(s => s.status === 'pending') || [];

      setStats({
        totalProducts: productCount || 0,
        totalSales: completedSales.length,
        totalRevenue: completedSales.reduce((acc, s) => acc + s.price_paid, 0),
        pendingSales: pendingSales.length,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      setProducts(products.filter(p => p.id !== productId));
      toast({
        title: "Produto excluído",
        description: "O produto foi removido com sucesso.",
      });
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o produto",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-500">Publicado</Badge>;
      case 'draft':
        return <Badge variant="secondary">Rascunho</Badge>;
      case 'archived':
        return <Badge variant="outline">Arquivado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background ${isMobile ? 'pb-20' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Package className="h-8 w-8 text-primary" />
              Meus Produtos
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie seus produtos e acompanhe suas vendas
            </p>
          </div>
          <Button onClick={() => navigate('/create-product')} className="gradient-primary">
            <Plus className="h-4 w-4 mr-2" />
            Novo Produto
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">Produtos</span>
              </div>
              <p className="text-2xl font-bold mt-2">{stats.totalProducts}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-green-500" />
                <span className="text-sm text-muted-foreground">Vendas</span>
              </div>
              <p className="text-2xl font-bold mt-2">{stats.totalSales}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-yellow-500" />
                <span className="text-sm text-muted-foreground">Receita</span>
              </div>
              <p className="text-2xl font-bold mt-2">R$ {stats.totalRevenue.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                <span className="text-sm text-muted-foreground">Pendentes</span>
              </div>
              <p className="text-2xl font-bold mt-2">{stats.pendingSales}</p>
            </CardContent>
          </Card>
        </div>

        {/* Products List */}
        <Card>
          <CardHeader>
            <CardTitle>Meus Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            {products.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Nenhum produto ainda</h3>
                <p className="text-muted-foreground mb-4">
                  Crie seu primeiro produto e comece a vender!
                </p>
                <Button onClick={() => navigate('/create-product')} className="gradient-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Produto
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {products.map((product) => (
                  <div 
                    key={product.id}
                    className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="h-16 w-16 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {getTypeIcon(product.type)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{product.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="gap-1">
                          {getTypeIcon(product.type)}
                          {product.type}
                        </Badge>
                        {getStatusBadge(product.status)}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">R$ {product.price.toFixed(2)}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/product/${product.id}`)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/edit-product/${product.id}`)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {isMobile && <MobileBottomNav />}
    </div>
  );
};

export default SellerDashboard;
