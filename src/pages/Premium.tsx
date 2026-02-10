import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PREMIUM_FEATURES, PLAN_PRICE } from '@/lib/subscription';
import { Check, Crown, ArrowRight, Loader2, Star } from 'lucide-react';

const Premium = () => {
  const { isPremium, tier, subscriptionEnd, checkSubscription } = useSubscription();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { mode: 'subscription' },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'Erro', description: 'Não foi possível iniciar o checkout.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) window.open(data.url, '_blank');
    } catch (err) {
      toast({ title: 'Erro', description: 'Não foi possível abrir o portal.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="content-width section-padding">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Crown className="h-4 w-4" />
            <span>GlowUp Premium</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
            Desbloqueie todo o potencial
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Planos IA avançados, analytics detalhados, desafios exclusivos e muito mais.
          </p>
        </div>

        {/* Pricing Card */}
        <div className="max-w-md mx-auto mb-16">
          <div className="bento-card relative overflow-hidden">
            {isPremium && (
              <div className="absolute top-4 right-4">
              <Badge className="bg-primary/10 text-primary border-primary/20">
                  <Check className="h-3 w-3 mr-1" /> Ativo
                </Badge>
              </div>
            )}

            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-2">Premium</h2>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold text-foreground">
                  R${PLAN_PRICE.monthly.toFixed(2).replace('.', ',')}
                </span>
                <span className="text-muted-foreground">/mês</span>
              </div>
            </div>

            <div className="space-y-3 mb-8">
              {PREMIUM_FEATURES.map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-lg">{feature.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{feature.title}</p>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {isPremium ? (
              <div className="space-y-3">
                <p className="text-xs text-center text-muted-foreground">
                  Renovação em {subscriptionEnd ? new Date(subscriptionEnd).toLocaleDateString('pt-BR') : '—'}
                </p>
                <Button
                  onClick={handleManageSubscription}
                  disabled={loading}
                  variant="outline"
                  className="w-full rounded-xl h-11"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Gerenciar assinatura
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleSubscribe}
                disabled={loading}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl h-12 text-base font-medium"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Star className="h-4 w-4 mr-2" />}
                Assinar Premium
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>

        {/* Free vs Premium comparison */}
        <div className="max-w-2xl mx-auto">
          <h3 className="text-xl font-semibold text-center mb-6">Grátis vs Premium</h3>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="font-medium text-muted-foreground">Recurso</div>
            <div className="text-center font-medium text-muted-foreground">Grátis</div>
            <div className="text-center font-medium text-primary">Premium</div>

            {[
              ['Planos de IA', 'Básicos', 'Avançados'],
              ['Analytics', 'Resumo', 'Detalhados'],
              ['Desafios', 'Públicos', 'Exclusivos'],
              ['Anúncios', 'Com anúncios', 'Sem anúncios'],
              ['Metas', 'Até 3', 'Ilimitadas'],
              ['Cupons de parceiros', '—', 'Acesso total'],
            ].map(([feature, free, premium], i) => (
              <div key={i} className="contents">
                <div className="py-3 border-t border-border text-foreground">{feature}</div>
                <div className="py-3 border-t border-border text-center text-muted-foreground">{free}</div>
                <div className="py-3 border-t border-border text-center text-primary font-medium">{premium}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Refresh button */}
        <div className="text-center mt-8">
          <Button variant="ghost" size="sm" onClick={checkSubscription} className="text-muted-foreground">
            Atualizar status da assinatura
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Premium;
