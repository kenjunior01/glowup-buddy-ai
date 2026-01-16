import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { ProductFilters } from "@/components/ProductFilters";
import { SmartSearch } from "@/components/SmartSearch";
import { TopCreators } from "@/components/TopCreators";
import { PopularProducts } from "@/components/PopularProducts";
import LoadingSpinner from "@/components/LoadingSpinner";
import MobileBottomNav from "@/components/MobileBottomNav";
import { TickerTape } from "@/components/ads/TickerTape";
import { MidPageAd } from "@/components/ads/MidPageAd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Store, TrendingUp, Sparkles, Tag, ShoppingBag, BookOpen, Video, Users } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface Product {
  id: string;
  title: string;
  description: string | null;
  price_cents: number;
  product_type: string;
  cover_image_url: string | null;
  seller_id: string;
  rating_avg: number | null;
  rating_count: number | null;
}

const Marketplace = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [userId, setUserId] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, ebooks: 0, cursos: 0, mentorias: 0 });

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserId(session?.user?.id || null);
    };
    checkUser();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [selectedType, sortBy]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('products')
        .select(`
          id,
          title,
          description,
          price_cents,
          product_type,
          cover_image_url,
          seller_id,
          rating_avg,
          rating_count
        `)
        .eq('status', 'published');

      if (selectedType !== 'all') {
        query = query.eq('product_type', selectedType as 'ebook' | 'curso' | 'mentoria');
      }

      switch (sortBy) {
        case 'price_asc':
          query = query.order('price_cents', { ascending: true });
          break;
        case 'price_desc':
          query = query.order('price_cents', { ascending: false });
          break;
        case 'rating':
          query = query.order('rating_avg', { ascending: false, nullsFirst: false });
          break;
        case 'popular':
          query = query.order('total_sales', { ascending: false, nullsFirst: false });
          break;
        case 'recent':
        default:
          query = query.order('created_at', { ascending: false });
          break;
      }

      const { data, error } = await query;

      if (error) throw error;
      const productsData = (data as Product[]) || [];
      setProducts(productsData);
      
      setStats({
        total: productsData.length,
        ebooks: productsData.filter(p => p.product_type === 'ebook').length,
        cursos: productsData.filter(p => p.product_type === 'curso').length,
        mentorias: productsData.filter(p => p.product_type === 'mentoria').length
      });
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.title.toLowerCase().includes(search.toLowerCase()) ||
    (product.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={`min-h-screen bg-background ${isMobile ? 'pb-20' : ''}`}>
      {/* Ticker Tape Ad */}
      <TickerTape />
      
      <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <Store className="h-7 w-7 text-primary" />
                Marketplace
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Descubra cursos, e-books e mentorias da comunidade
              </p>
            </div>
            {userId && (
              <Button onClick={() => navigate('/seller-dashboard')} className="gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Vender Produto
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Left Sidebar - Desktop Only */}
          {!isMobile && (
            <aside className="hidden lg:block w-72 flex-shrink-0 space-y-4 animate-fade-in">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Tag className="w-4 h-4 text-primary" />
                    Categorias
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { type: 'all', label: 'Todos', icon: ShoppingBag, count: stats.total },
                    { type: 'ebook', label: 'E-books', icon: BookOpen, count: stats.ebooks },
                    { type: 'curso', label: 'Cursos', icon: Video, count: stats.cursos },
                    { type: 'mentoria', label: 'Mentorias', icon: Users, count: stats.mentorias }
                  ].map(({ type, label, icon: Icon, count }) => (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg transition-all ${
                        selectedType === type 
                          ? 'bg-primary text-primary-foreground' 
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{label}</span>
                      </div>
                      <span className="text-xs opacity-70">{count}</span>
                    </button>
                  ))}
                </CardContent>
              </Card>
              
              <TopCreators />
            </aside>
          )}

          {/* Main Content */}
          <main className="flex-1 min-w-0 space-y-6">
            {/* AI Search */}
            <div className="animate-fade-in">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="font-semibold">Busca Inteligente com IA</span>
              </div>
              <SmartSearch 
                placeholder="Ex: Qual o melhor curso de produtividade?" 
                context="Marketplace de produtos digitais de desenvolvimento pessoal, incluindo e-books, cursos, mentorias e templates."
              />
            </div>

            {/* Filters - Mobile */}
            {isMobile && (
              <div className="animate-fade-in" style={{ animationDelay: '50ms' }}>
                <ProductFilters
                  search={search}
                  onSearchChange={setSearch}
                  selectedType={selectedType}
                  onTypeChange={setSelectedType}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                />
              </div>
            )}

            {/* Featured Section */}
            {!search && selectedType === 'all' && (
              <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Em Destaque</h2>
                </div>
              </div>
            )}

            {/* Products Grid */}
            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12 animate-fade-in">
                <Store className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Nenhum produto encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  {search ? 'Tente uma busca diferente' : 'Seja o primeiro a criar um produto!'}
                </p>
                {userId && (
                  <Button onClick={() => navigate('/seller-dashboard')} className="gradient-primary">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Produto
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.slice(0, 6).map((product, index) => (
                    <div 
                      key={product.id} 
                      className="animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <ProductCard
                        id={product.id}
                        title={product.title}
                        description={product.description || ''}
                        price={product.price_cents / 100}
                        type={product.product_type}
                        imageUrl={product.cover_image_url}
                        rating={product.rating_avg ?? undefined}
                        reviewCount={product.rating_count ?? undefined}
                      />
                    </div>
                  ))}
                </div>

                {/* Mid-page Ad after first 6 products */}
                {filteredProducts.length > 6 && <MidPageAd />}

                {filteredProducts.length > 6 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProducts.slice(6).map((product, index) => (
                      <div 
                        key={product.id} 
                        className="animate-fade-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <ProductCard
                          id={product.id}
                          title={product.title}
                          description={product.description || ''}
                          price={product.price_cents / 100}
                          type={product.product_type}
                          imageUrl={product.cover_image_url}
                          rating={product.rating_avg ?? undefined}
                          reviewCount={product.rating_count ?? undefined}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </main>

          {/* Right Sidebar - Desktop Only */}
          {!isMobile && (
            <aside className="hidden xl:block w-72 flex-shrink-0 space-y-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
              <PopularProducts />
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Dicas para Vendedores
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>📚 Crie conteúdo de qualidade</p>
                  <p>💡 Use descrições detalhadas</p>
                  <p>🎯 Defina preços competitivos</p>
                  <p>⭐ Responda avaliações</p>
                </CardContent>
              </Card>
            </aside>
          )}
        </div>
      </div>

      {isMobile && <MobileBottomNav />}
    </div>
  );
};

export default Marketplace;
