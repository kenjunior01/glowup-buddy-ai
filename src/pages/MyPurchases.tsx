import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { 
  ShoppingBag, BookOpen, Video, Users, FileText, 
  Download, Play, Calendar, ExternalLink
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface Purchase {
  id: string;
  price_paid: number;
  status: string;
  created_at: string;
  products: {
    id: string;
    title: string;
    description: string;
    type: string;
    image_url: string | null;
  };
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'ebook':
      return <BookOpen className="h-5 w-5" />;
    case 'course':
      return <Video className="h-5 w-5" />;
    case 'mentoria':
      return <Users className="h-5 w-5" />;
    case 'template':
      return <FileText className="h-5 w-5" />;
    default:
      return <ShoppingBag className="h-5 w-5" />;
  }
};

const getActionButton = (type: string, productId: string, navigate: (path: string) => void) => {
  switch (type) {
    case 'ebook':
    case 'template':
      return (
        <Button size="sm" className="gradient-primary">
          <Download className="h-4 w-4 mr-2" />
          Baixar
        </Button>
      );
    case 'course':
      return (
        <Button size="sm" className="gradient-primary" onClick={() => navigate(`/product/${productId}`)}>
          <Play className="h-4 w-4 mr-2" />
          Assistir
        </Button>
      );
    case 'mentoria':
      return (
        <Button size="sm" className="gradient-primary">
          <Calendar className="h-4 w-4 mr-2" />
          Agendar
        </Button>
      );
    default:
      return (
        <Button size="sm" variant="outline" onClick={() => navigate(`/product/${productId}`)}>
          <ExternalLink className="h-4 w-4 mr-2" />
          Ver
        </Button>
      );
  }
};

const MyPurchases = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('purchases')
        .select(`
          id,
          price_paid,
          status,
          created_at,
          products (
            id,
            title,
            description,
            type,
            image_url
          )
        `)
        .eq('buyer_id', session.user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPurchases(data || []);
    } catch (error) {
      console.error("Error fetching purchases:", error);
    } finally {
      setLoading(false);
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
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShoppingBag className="h-8 w-8 text-primary" />
            Minhas Compras
          </h1>
          <p className="text-muted-foreground mt-1">
            Acesse todos os produtos que você adquiriu
          </p>
        </div>

        {/* Purchases List */}
        {purchases.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhuma compra ainda</h3>
              <p className="text-muted-foreground mb-4">
                Explore o marketplace e encontre produtos incríveis!
              </p>
              <Button onClick={() => navigate('/marketplace')} className="gradient-primary">
                Explorar Marketplace
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {purchases.map((purchase) => (
              <Card key={purchase.id} className="overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  <div className="sm:w-32 h-32 bg-muted flex-shrink-0">
                    {purchase.products.image_url ? (
                      <img 
                        src={purchase.products.image_url} 
                        alt={purchase.products.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {getTypeIcon(purchase.products.type)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="gap-1">
                            {getTypeIcon(purchase.products.type)}
                            {purchase.products.type}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-lg">{purchase.products.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {purchase.products.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Comprado em {new Date(purchase.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getActionButton(purchase.products.type, purchase.products.id, navigate)}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {isMobile && <MobileBottomNav />}
    </div>
  );
};

export default MyPurchases;
