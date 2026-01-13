import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Eye, MousePointer, Calendar, Trash2, Loader2 } from "lucide-react";
import { CreateAdModal } from "./CreateAdModal";
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

export const MyAdsManager = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: ads, isLoading } = useQuery({
    queryKey: ['my-ads'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('advertisements')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const deleteAd = useMutation({
    mutationFn: async (adId: string) => {
      const { error } = await supabase
        .from('advertisements')
        .delete()
        .eq('id', adId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-ads'] });
      toast.success('Anúncio removido');
    },
    onError: () => {
      toast.error('Erro ao remover anúncio');
    },
  });

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Meus Anúncios</h2>
          <p className="text-muted-foreground">Gerencie seus anúncios na plataforma</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Criar Anúncio
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : ads?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">Você ainda não criou nenhum anúncio</p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar primeiro anúncio
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {ads?.map((ad) => (
            <Card key={ad.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={statusColors[ad.status as keyof typeof statusColors]}>
                        {statusLabels[ad.status as keyof typeof statusLabels]}
                      </Badge>
                      <Badge variant="secondary">
                        {adTypeLabels[ad.ad_type as keyof typeof adTypeLabels]}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{ad.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{ad.content}</CardDescription>
                  </div>
                  
                  {ad.status === 'pending' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteAd.mutate(ad.id)}
                      disabled={deleteAd.isPending}
                    >
                      {deleteAd.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span>{ad.views_count || 0} visualizações</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MousePointer className="h-4 w-4" />
                    <span>{ad.clicks_count || 0} cliques</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {ad.starts_at && ad.expires_at 
                        ? `${format(new Date(ad.starts_at), 'dd/MM', { locale: ptBR })} - ${format(new Date(ad.expires_at), 'dd/MM/yyyy', { locale: ptBR })}`
                        : 'Aguardando aprovação'
                      }
                    </span>
                  </div>
                  <div className="ml-auto font-medium text-foreground">
                    {formatPrice(ad.amount_paid_cents || 0)}
                  </div>
                </div>

                {ad.admin_notes && (
                  <div className="mt-3 p-3 rounded-lg bg-muted">
                    <p className="text-sm font-medium">Nota do administrador:</p>
                    <p className="text-sm text-muted-foreground">{ad.admin_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateAdModal open={showCreateModal} onOpenChange={setShowCreateModal} />
    </div>
  );
};
