import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, TrendingUp, BookOpen, Video, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Product {
  id: string;
  title: string;
  price_cents: number;
  product_type: string;
  rating_avg: number | null;
  cover_image_url: string | null;
}

export function PopularProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPopularProducts();
  }, []);

  const fetchPopularProducts = async () => {
    try {
      const { data } = await supabase
        .from('products')
        .select('id, title, price_cents, product_type, rating_avg, cover_image_url')
        .eq('status', 'published')
        .order('total_sales', { ascending: false, nullsFirst: false })
        .limit(5);

      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ebook': return <BookOpen className="w-3 h-3" />;
      case 'curso': return <Video className="w-3 h-3" />;
      case 'mentoria': return <Users className="w-3 h-3" />;
      default: return null;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'ebook': return 'E-book';
      case 'curso': return 'Curso';
      case 'mentoria': return 'Mentoria';
      default: return type;
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-3">
          <div className="h-5 bg-muted rounded w-36" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-3">
              <div className="w-12 h-12 rounded bg-muted" />
              <div className="flex-1 space-y-1">
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-20" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <Card className="animate-fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Mais Populares
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {products.map((product, index) => (
          <div
            key={product.id}
            onClick={() => navigate(`/product/${product.id}`)}
            className="flex gap-3 p-2 rounded-lg hover:bg-muted/50 transition-all cursor-pointer animate-fade-in group"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              {product.cover_image_url ? (
                <img 
                  src={product.cover_image_url} 
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10">
                  {getTypeIcon(product.product_type)}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                {product.title}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs py-0 px-1.5 flex items-center gap-1">
                  {getTypeIcon(product.product_type)}
                  {getTypeLabel(product.product_type)}
                </Badge>
                {product.rating_avg && (
                  <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
                    <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                    {product.rating_avg.toFixed(1)}
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-sm text-primary">
                R$ {(product.price_cents / 100).toFixed(0)}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
