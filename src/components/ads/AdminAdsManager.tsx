import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Check, X, Eye, MousePointer, Loader2, Save, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusColors = {
  pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
  approved: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  active: 'bg-green-500/10 text-green-600 border-green-500/30',
  rejected: 'bg-red-500/10 text-red-600 border-red-500/30',
  expired: 'bg-gray-500/10 text-gray-600 border-gray-500/30',
};

const statusLabels = {
  pending: 'Pendente',
  approved: 'Aprovado',
  active: 'Ativo',
  rejected: 'Rejeitado',
  expired: 'Expirado',
};

const adTypeLabels = {
  ticker: 'Ticker Tape',
  premium_banner: 'Banner Premium',
  mid_page: 'Anúncio Central',
};

export const AdminAdsManager = () => {
  const queryClient = useQueryClient();
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  const { data: ads, isLoading: adsLoading } = useQuery({
    queryKey: ['all-ads-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('advertisements')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: pricing, isLoading: pricingLoading } = useQuery({
    queryKey: ['ad-pricing-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ad_pricing')
        .select('*')
        .order('ad_type');
      
      if (error) throw error;
      return data;
    },
  });

  const [editingPricing, setEditingPricing] = useState<Record<string, {
    price_per_day_cents: number;
    price_per_week_cents: number;
    price_per_month_cents: number;
  }>>({});

  const updateAdStatus = useMutation({
    mutationFn: async ({ adId, status, notes }: { adId: string; status: string; notes?: string }) => {
      const updateData: Record<string, unknown> = { status };
      
      if (notes) {
        updateData.admin_notes = notes;
      }

      if (status === 'active') {
        const ad = ads?.find(a => a.id === adId);
        if (ad) {
          const startsAt = new Date();
          const expiresAt = new Date(startsAt.getTime() + (ad.duration_days || 7) * 24 * 60 * 60 * 1000);
          updateData.starts_at = startsAt.toISOString();
          updateData.expires_at = expiresAt.toISOString();
        }
      }

      const { error } = await supabase
        .from('advertisements')
        .update(updateData)
        .eq('id', adId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-ads-admin'] });
      toast.success('Status atualizado');
    },
    onError: () => {
      toast.error('Erro ao atualizar status');
    },
  });

  const updatePricing = useMutation({
    mutationFn: async ({ id, prices }: { 
      id: string; 
      prices: { price_per_day_cents: number; price_per_week_cents: number; price_per_month_cents: number } 
    }) => {
      const { error } = await supabase
        .from('ad_pricing')
        .update(prices)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-pricing-admin'] });
      queryClient.invalidateQueries({ queryKey: ['ad-pricing'] });
      toast.success('Preços atualizados');
    },
    onError: () => {
      toast.error('Erro ao atualizar preços');
    },
  });

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100);
  };

  const pendingAds = ads?.filter(ad => ad.status === 'pending') || [];
  const activeAds = ads?.filter(ad => ad.status === 'active') || [];
  const otherAds = ads?.filter(ad => !['pending', 'active'].includes(ad.status || '')) || [];

  const totalRevenue = ads?.reduce((sum, ad) => sum + (ad.amount_paid_cents || 0), 0) || 0;
  const totalViews = ads?.reduce((sum, ad) => sum + (ad.views_count || 0), 0) || 0;
  const totalClicks = ads?.reduce((sum, ad) => sum + (ad.clicks_count || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Receita Total</p>
                <p className="text-2xl font-bold">{formatPrice(totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Visualizações</p>
                <p className="text-2xl font-bold">{totalViews.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <MousePointer className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Cliques</p>
                <p className="text-2xl font-bold">{totalClicks.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
                {pendingAds.length}
              </Badge>
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-lg font-medium">aguardando aprovação</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Pendentes ({pendingAds.length})
          </TabsTrigger>
          <TabsTrigger value="active">
            Ativos ({activeAds.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            Histórico ({otherAds.length})
          </TabsTrigger>
          <TabsTrigger value="pricing">
            Preços
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4 space-y-4">
          {adsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : pendingAds.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nenhum anúncio pendente de aprovação
              </CardContent>
            </Card>
          ) : (
            pendingAds.map((ad) => (
              <Card key={ad.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge variant="secondary" className="mb-2">
                        {adTypeLabels[ad.ad_type as keyof typeof adTypeLabels]}
                      </Badge>
                      <CardTitle>{ad.title}</CardTitle>
                      <CardDescription>{ad.content}</CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{formatPrice(ad.amount_paid_cents || 0)}</p>
                      <p className="text-sm text-muted-foreground">{ad.duration_days} dias</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {ad.link_url && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">Link:</span>{' '}
                      <a href={ad.link_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {ad.link_url}
                      </a>
                    </p>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-8 h-8 rounded border"
                      style={{ backgroundColor: ad.background_color || '#3B82F6' }}
                    />
                    <span className="text-sm text-muted-foreground">Cor de fundo</span>
                    <div 
                      className="w-8 h-8 rounded border flex items-center justify-center"
                      style={{ backgroundColor: ad.text_color || '#FFFFFF' }}
                    >
                      <span style={{ color: ad.background_color || '#3B82F6' }}>A</span>
                    </div>
                    <span className="text-sm text-muted-foreground">Cor do texto</span>
                  </div>

                  <div className="space-y-2">
                    <Label>Notas do administrador (opcional)</Label>
                    <Textarea
                      value={adminNotes[ad.id] || ''}
                      onChange={(e) => setAdminNotes(prev => ({ ...prev, [ad.id]: e.target.value }))}
                      placeholder="Adicione uma nota para o anunciante..."
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => updateAdStatus.mutate({ 
                        adId: ad.id, 
                        status: 'active',
                        notes: adminNotes[ad.id]
                      })}
                      disabled={updateAdStatus.isPending}
                      className="flex-1"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Aprovar e Ativar
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => updateAdStatus.mutate({ 
                        adId: ad.id, 
                        status: 'rejected',
                        notes: adminNotes[ad.id]
                      })}
                      disabled={updateAdStatus.isPending}
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Rejeitar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="active" className="mt-4 space-y-4">
          {activeAds.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nenhum anúncio ativo no momento
              </CardContent>
            </Card>
          ) : (
            activeAds.map((ad) => (
              <Card key={ad.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={statusColors.active}>Ativo</Badge>
                        <Badge variant="secondary">
                          {adTypeLabels[ad.ad_type as keyof typeof adTypeLabels]}
                        </Badge>
                      </div>
                      <CardTitle>{ad.title}</CardTitle>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateAdStatus.mutate({ adId: ad.id, status: 'expired' })}
                    >
                      Encerrar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      <span>{ad.views_count || 0} views</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MousePointer className="h-4 w-4" />
                      <span>{ad.clicks_count || 0} cliques</span>
                    </div>
                    <div>
                      Expira: {ad.expires_at && format(new Date(ad.expires_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </div>
                    <div className="ml-auto font-medium">
                      {formatPrice(ad.amount_paid_cents || 0)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4 space-y-4">
          {otherAds.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nenhum histórico de anúncios
              </CardContent>
            </Card>
          ) : (
            otherAds.map((ad) => (
              <Card key={ad.id} className="opacity-75">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={statusColors[ad.status as keyof typeof statusColors]}>
                          {statusLabels[ad.status as keyof typeof statusLabels]}
                        </Badge>
                        <Badge variant="secondary">
                          {adTypeLabels[ad.ad_type as keyof typeof adTypeLabels]}
                        </Badge>
                      </div>
                      <CardTitle className="text-base">{ad.title}</CardTitle>
                    </div>
                    <p className="font-medium">{formatPrice(ad.amount_paid_cents || 0)}</p>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="pricing" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurar Preços</CardTitle>
              <CardDescription>
                Defina os preços para cada tipo de anúncio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {pricingLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                pricing?.map((price) => {
                  const currentEdit = editingPricing[price.id] || {
                    price_per_day_cents: price.price_per_day_cents,
                    price_per_week_cents: price.price_per_week_cents,
                    price_per_month_cents: price.price_per_month_cents,
                  };

                  return (
                    <div key={price.id} className="p-4 border rounded-lg space-y-4">
                      <div>
                        <h4 className="font-medium">{price.name}</h4>
                        <p className="text-sm text-muted-foreground">{price.description}</p>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Preço por Dia (centavos)</Label>
                          <Input
                            type="number"
                            value={currentEdit.price_per_day_cents}
                            onChange={(e) => setEditingPricing(prev => ({
                              ...prev,
                              [price.id]: {
                                ...currentEdit,
                                price_per_day_cents: parseInt(e.target.value) || 0
                              }
                            }))}
                          />
                          <p className="text-xs text-muted-foreground">
                            = {formatPrice(currentEdit.price_per_day_cents)}
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Preço por Semana (centavos)</Label>
                          <Input
                            type="number"
                            value={currentEdit.price_per_week_cents}
                            onChange={(e) => setEditingPricing(prev => ({
                              ...prev,
                              [price.id]: {
                                ...currentEdit,
                                price_per_week_cents: parseInt(e.target.value) || 0
                              }
                            }))}
                          />
                          <p className="text-xs text-muted-foreground">
                            = {formatPrice(currentEdit.price_per_week_cents)}
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Preço por Mês (centavos)</Label>
                          <Input
                            type="number"
                            value={currentEdit.price_per_month_cents}
                            onChange={(e) => setEditingPricing(prev => ({
                              ...prev,
                              [price.id]: {
                                ...currentEdit,
                                price_per_month_cents: parseInt(e.target.value) || 0
                              }
                            }))}
                          />
                          <p className="text-xs text-muted-foreground">
                            = {formatPrice(currentEdit.price_per_month_cents)}
                          </p>
                        </div>
                      </div>

                      <Button
                        onClick={() => updatePricing.mutate({ id: price.id, prices: currentEdit })}
                        disabled={updatePricing.isPending}
                        size="sm"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Salvar Preços
                      </Button>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
