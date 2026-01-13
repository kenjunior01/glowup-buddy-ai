import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { MyAdsManager } from "@/components/ads/MyAdsManager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Megaphone, Crown, LayoutTemplate, TrendingUp, Users, Eye } from "lucide-react";
import { CreateAdModal } from "@/components/ads/CreateAdModal";

export default function Advertising() {
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const { data: pricing } = useQuery({
    queryKey: ['ad-pricing'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ad_pricing')
        .select('*')
        .eq('is_active', true);
      
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!sessionLoading && !session) {
      navigate('/auth');
    }
  }, [session, sessionLoading, navigate]);

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100);
  };

  const adTypes = [
    {
      type: 'ticker',
      icon: Megaphone,
      title: 'Ticker Tape',
      description: 'Seu anúncio aparece como texto rolante no topo de todas as páginas. Máxima visibilidade!',
      features: ['Visível em todas as páginas', 'Animação de rolagem', 'Link clicável'],
    },
    {
      type: 'premium_banner',
      icon: Crown,
      title: 'Banner Premium',
      description: 'Banner destacado posicionado logo abaixo do header. Ideal para campanhas de impacto.',
      features: ['Posição premium', 'Suporta imagem', 'Design personalizado'],
    },
    {
      type: 'mid_page',
      icon: LayoutTemplate,
      title: 'Anúncio Central',
      description: 'Aparece naturalmente no meio do feed de conteúdo. Engajamento orgânico.',
      features: ['Integrado ao feed', 'Formato de card', 'Alta conversão'],
    },
  ];

  if (sessionLoading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-6 pb-24 md:pb-6">
        <Tabs defaultValue="explore" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="explore">Explorar</TabsTrigger>
            <TabsTrigger value="my-ads">Meus Anúncios</TabsTrigger>
          </TabsList>

          <TabsContent value="explore" className="space-y-8">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-8 text-primary-foreground">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
              
              <div className="relative z-10">
                <h1 className="text-3xl md:text-4xl font-bold mb-4">
                  Anuncie na Plataforma
                </h1>
                <p className="text-lg opacity-90 max-w-2xl mb-6">
                  Alcance milhares de usuários ativos com seus produtos, serviços ou mensagens. 
                  Escolha o formato ideal para sua campanha.
                </p>
                <Button 
                  size="lg" 
                  variant="secondary"
                  onClick={() => setShowCreateModal(true)}
                >
                  <Megaphone className="h-5 w-5 mr-2" />
                  Criar Anúncio
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">10K+</p>
                      <p className="text-sm text-muted-foreground">Usuários ativos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <Eye className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">50K+</p>
                      <p className="text-sm text-muted-foreground">Visualizações/dia</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <TrendingUp className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">5%+</p>
                      <p className="text-sm text-muted-foreground">Taxa de cliques</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Ad Types */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Tipos de Anúncio</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {adTypes.map((adType) => {
                  const priceInfo = pricing?.find(p => p.ad_type === adType.type);
                  const Icon = adType.icon;
                  
                  return (
                    <Card key={adType.type} className="relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent" />
                      
                      <CardHeader>
                        <div className="p-3 rounded-xl bg-primary/10 w-fit mb-2">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle>{adType.title}</CardTitle>
                        <CardDescription>{adType.description}</CardDescription>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        <ul className="space-y-2">
                          {adType.features.map((feature, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                              {feature}
                            </li>
                          ))}
                        </ul>

                        <div className="pt-4 border-t">
                          <p className="text-sm text-muted-foreground mb-1">A partir de</p>
                          <p className="text-2xl font-bold text-primary">
                            {formatPrice(priceInfo?.price_per_day_cents || 0)}
                            <span className="text-sm font-normal text-muted-foreground">/dia</span>
                          </p>
                        </div>

                        <Button 
                          className="w-full" 
                          onClick={() => setShowCreateModal(true)}
                        >
                          Anunciar agora
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Pricing Table */}
            <Card>
              <CardHeader>
                <CardTitle>Tabela de Preços</CardTitle>
                <CardDescription>
                  Quanto mais tempo, mais economia!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Tipo</th>
                        <th className="text-center py-3 px-4">1 Dia</th>
                        <th className="text-center py-3 px-4">7 Dias</th>
                        <th className="text-center py-3 px-4">30 Dias</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pricing?.map((price) => (
                        <tr key={price.id} className="border-b last:border-0">
                          <td className="py-3 px-4 font-medium">{price.name}</td>
                          <td className="py-3 px-4 text-center">
                            {formatPrice(price.price_per_day_cents)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {formatPrice(price.price_per_week_cents)}
                            <span className="block text-xs text-green-600">
                              -{Math.round((1 - price.price_per_week_cents / (price.price_per_day_cents * 7)) * 100)}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {formatPrice(price.price_per_month_cents)}
                            <span className="block text-xs text-green-600">
                              -{Math.round((1 - price.price_per_month_cents / (price.price_per_day_cents * 30)) * 100)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="my-ads">
            <MyAdsManager />
          </TabsContent>
        </Tabs>
      </main>

      <MobileBottomNav />
      <CreateAdModal open={showCreateModal} onOpenChange={setShowCreateModal} />
    </div>
  );
}
