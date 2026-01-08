import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Crown, Star, ShoppingBag } from 'lucide-react';

interface Creator {
  id: string;
  name: string;
  avatar_url: string | null;
  total_sales: number;
}

export function TopCreators() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopCreators();
  }, []);

  const fetchTopCreators = async () => {
    try {
      const { data: products } = await supabase
        .from('products')
        .select('seller_id, total_sales')
        .eq('status', 'published');

      if (products) {
        const sellerSales: Record<string, number> = {};
        products.forEach(p => {
          sellerSales[p.seller_id] = (sellerSales[p.seller_id] || 0) + (p.total_sales || 0);
        });

        const topSellerIds = Object.entries(sellerSales)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([id]) => id);

        if (topSellerIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, name, display_name, avatar_url')
            .in('id', topSellerIds);

          if (profiles) {
            const creatorsData = profiles.map(p => ({
              id: p.id,
              name: p.display_name || p.name || 'Criador',
              avatar_url: p.avatar_url,
              total_sales: sellerSales[p.id] || 0
            })).sort((a, b) => b.total_sales - a.total_sales);

            setCreators(creatorsData);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching creators:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-3">
          <div className="h-5 bg-muted rounded w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted" />
              <div className="flex-1 space-y-1">
                <div className="h-4 bg-muted rounded w-24" />
                <div className="h-3 bg-muted rounded w-16" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (creators.length === 0) {
    return null;
  }

  return (
    <Card className="animate-fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Crown className="w-4 h-4 text-yellow-500" />
          Top Criadores
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {creators.map((creator, index) => (
          <div
            key={creator.id}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="relative">
              <Avatar className="w-10 h-10 border-2 border-primary/20">
                <AvatarImage src={creator.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {creator.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {index < 3 && (
                <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                  index === 0 ? 'bg-yellow-500 text-white' :
                  index === 1 ? 'bg-gray-400 text-white' :
                  'bg-orange-500 text-white'
                }`}>
                  {index + 1}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{creator.name}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <ShoppingBag className="w-3 h-3" />
                <span>{creator.total_sales} vendas</span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
