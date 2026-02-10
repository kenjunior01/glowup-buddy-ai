import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from '@/hooks/useSubscription';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Crown, Tag, ExternalLink, Lock, Check, Gift, Percent } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Coupon {
  id: string;
  partner_name: string;
  partner_logo_url: string | null;
  coupon_code: string;
  description: string;
  discount_type: string;
  discount_value: number;
  category: string;
  external_url: string | null;
  is_premium_only: boolean;
  expires_at: string | null;
}

const PartnerCoupons = () => {
  const { isPremium } = useSubscription();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [redeemedIds, setRedeemedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const { data: couponsData } = await supabase
        .from('partner_coupons')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      setCoupons((couponsData as Coupon[]) || []);

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: redemptions } = await supabase
          .from('coupon_redemptions')
          .select('coupon_id')
          .eq('user_id', session.user.id);
        setRedeemedIds(new Set((redemptions || []).map((r: any) => r.coupon_id)));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (coupon: Coupon) => {
    if (coupon.is_premium_only && !isPremium) {
      toast({ title: '🔒 Exclusivo Premium', description: 'Assine o Premium para acessar este cupom.', variant: 'destructive' });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/auth'); return; }

      const { error } = await supabase.from('coupon_redemptions').insert({
        user_id: session.user.id,
        coupon_id: coupon.id,
      });

      if (error) {
        if (error.code === '23505') {
          toast({ title: 'Já resgatado', description: 'Você já resgatou este cupom.' });
        } else {
          throw error;
        }
        return;
      }

      setRedeemedIds(prev => new Set(prev).add(coupon.id));
      toast({ title: '🎉 Cupom resgatado!', description: `Código: ${coupon.coupon_code}` });

      if (coupon.external_url) {
        window.open(coupon.external_url, '_blank');
      }
    } catch (err) {
      toast({ title: 'Erro', description: 'Não foi possível resgatar o cupom.', variant: 'destructive' });
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: 'Copiado!', description: `Código ${code} copiado para a área de transferência.` });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando cupons...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="content-width section-padding">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Gift className="h-4 w-4" />
            <span>Parcerias & Cupons</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Ofertas exclusivas</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Aproveite descontos de marcas parceiras do GlowUp.
          </p>
        </div>

        {coupons.length === 0 ? (
          <div className="bento-card text-center max-w-md mx-auto py-12">
            <Tag className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum cupom disponível</h3>
            <p className="text-sm text-muted-foreground">Novos cupons de parceiros serão adicionados em breve!</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {coupons.map((coupon) => {
              const isLocked = coupon.is_premium_only && !isPremium;
              const isRedeemed = redeemedIds.has(coupon.id);

              return (
                <div key={coupon.id} className={`bento-card relative ${isLocked ? 'opacity-75' : ''}`}>
                  {coupon.is_premium_only && (
                    <Badge className="absolute top-4 right-4 bg-primary/10 text-primary border-primary/20">
                      <Crown className="h-3 w-3 mr-1" /> Premium
                    </Badge>
                  )}

                  <div className="flex items-center gap-3 mb-4">
                    {coupon.partner_logo_url ? (
                      <img src={coupon.partner_logo_url} alt={coupon.partner_name} className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                        <Tag className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-foreground text-sm">{coupon.partner_name}</h3>
                      <Badge variant="outline" className="text-xs">{coupon.category}</Badge>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4">{coupon.description}</p>

                  <div className="flex items-center gap-2 mb-4">
                    <div className="bg-primary/10 text-primary px-3 py-1.5 rounded-lg font-bold text-sm flex items-center gap-1">
                      <Percent className="h-3.5 w-3.5" />
                      {coupon.discount_type === 'percentage' ? `${coupon.discount_value}% OFF` : `R$${coupon.discount_value} OFF`}
                    </div>
                    {coupon.expires_at && (
                      <span className="text-xs text-muted-foreground">
                        até {new Date(coupon.expires_at).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>

                  {isLocked ? (
                    <Button
                      onClick={() => navigate('/premium')}
                      variant="outline"
                      className="w-full rounded-xl h-10 text-sm"
                    >
                      <Lock className="h-3.5 w-3.5 mr-2" />
                      Desbloquear com Premium
                    </Button>
                  ) : isRedeemed ? (
                    <div className="space-y-2">
                      <Button
                        onClick={() => copyCode(coupon.coupon_code)}
                        variant="outline"
                        className="w-full rounded-xl h-10 text-sm"
                      >
                        <Check className="h-3.5 w-3.5 mr-2 text-primary" />
                        {coupon.coupon_code}
                      </Button>
                      {coupon.external_url && (
                        <Button
                          onClick={() => window.open(coupon.external_url!, '_blank')}
                          variant="ghost"
                          size="sm"
                          className="w-full text-xs"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" /> Ir para o site
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Button
                      onClick={() => handleRedeem(coupon)}
                      className="w-full bg-primary text-primary-foreground rounded-xl h-10 text-sm"
                    >
                      Resgatar cupom
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PartnerCoupons;
