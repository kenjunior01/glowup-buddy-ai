import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { ProductFilters } from "@/components/ProductFilters";
import { SmartSearch } from "@/components/SmartSearch";
import LoadingSpinner from "@/components/LoadingSpinner";
import MobileBottomNav from "@/components/MobileBottomNav";
import { Plus, Store, TrendingUp, Sparkles } from "lucide-react";
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
      setProducts((data as Product[]) || []);
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
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Store className="h-8 w-8 text-primary" />
              Marketplace
            </h1>
            <p className="text-muted-foreground mt-1">
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

        {/* AI Search */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-semibold">Busca Inteligente com IA</span>
          </div>
          <SmartSearch 
            placeholder="Ex: Qual o melhor curso de produtividade?" 
            context="Marketplace de produtos digitais de desenvolvimento pessoal, incluindo e-books, cursos, mentorias e templates."
          />
        </div>

        {/* Filters */}
        <div className="mb-6">
          <ProductFilters
            search={search}
            onSearchChange={setSearch}
            selectedType={selectedType}
            onTypeChange={setSelectedType}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />
        </div>

        {/* Featured Section */}
        {!search && selectedType === 'all' && (
          <div className="mb-8">
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
          <div className="text-center py-12">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                title={product.title}
                description={product.description || ''}
                price={product.price_cents / 100}
                type={product.product_type}
                imageUrl={product.cover_image_url}
                rating={product.rating_avg ?? undefined}
                reviewCount={product.rating_count ?? undefined}
              />
            ))}
          </div>
        )}
      </div>

      {isMobile && <MobileBottomNav />}
    </div>
  );
};

export default Marketplace;
