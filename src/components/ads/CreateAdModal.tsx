import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Loader2, Megaphone, Crown, LayoutTemplate } from "lucide-react";

interface CreateAdModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type AdType = 'ticker' | 'premium_banner' | 'mid_page';
type DurationType = 'day' | 'week' | 'month';

export const CreateAdModal = ({ open, onOpenChange }: CreateAdModalProps) => {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [adType, setAdType] = useState<AdType>('ticker');
  const [duration, setDuration] = useState<DurationType>('week');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    link_url: '',
    image_url: '',
    background_color: '#3B82F6',
    text_color: '#FFFFFF',
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

  const createAd = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const durationDays = duration === 'day' ? 1 : duration === 'week' ? 7 : 30;
      const startsAt = new Date();
      const expiresAt = new Date(startsAt.getTime() + durationDays * 24 * 60 * 60 * 1000);

      const { error } = await supabase.from('advertisements').insert({
        user_id: user.id,
        ad_type: adType,
        title: formData.title,
        content: formData.content,
        link_url: formData.link_url || null,
        image_url: formData.image_url || null,
        background_color: formData.background_color,
        text_color: formData.text_color,
        duration_days: durationDays,
        amount_paid_cents: getPrice(),
        starts_at: startsAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        status: 'pending',
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-ads'] });
      toast.success('Anúncio criado! Aguarde aprovação do administrador.');
      onOpenChange(false);
      resetForm();
    },
    onError: () => {
      toast.error('Erro ao criar anúncio');
    },
  });

  const resetForm = () => {
    setStep(1);
    setAdType('ticker');
    setDuration('week');
    setFormData({
      title: '',
      content: '',
      link_url: '',
      image_url: '',
      background_color: '#3B82F6',
      text_color: '#FFFFFF',
    });
  };

  const getPrice = () => {
    const typePrice = pricing?.find(p => p.ad_type === adType);
    if (!typePrice) return 0;
    
    switch (duration) {
      case 'day': return typePrice.price_per_day_cents;
      case 'week': return typePrice.price_per_week_cents;
      case 'month': return typePrice.price_per_month_cents;
      default: return 0;
    }
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100);
  };

  const adTypeInfo = {
    ticker: {
      icon: Megaphone,
      title: 'Ticker Tape',
      description: 'Texto rolante no topo da página',
    },
    premium_banner: {
      icon: Crown,
      title: 'Banner Premium',
      description: 'Banner destacado abaixo do header',
    },
    mid_page: {
      icon: LayoutTemplate,
      title: 'Anúncio Central',
      description: 'Aparece no meio do feed',
    },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Criar Anúncio</DialogTitle>
          <DialogDescription>
            {step === 1 && 'Escolha o tipo de anúncio'}
            {step === 2 && 'Escolha a duração'}
            {step === 3 && 'Configure seu anúncio'}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <RadioGroup value={adType} onValueChange={(v) => setAdType(v as AdType)}>
              {(Object.keys(adTypeInfo) as AdType[]).map((type) => {
                const info = adTypeInfo[type];
                const price = pricing?.find(p => p.ad_type === type);
                const Icon = info.icon;
                
                return (
                  <label
                    key={type}
                    className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      adType === type 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <RadioGroupItem value={type} className="sr-only" />
                    <div className={`p-2 rounded-lg ${adType === type ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{info.title}</p>
                      <p className="text-sm text-muted-foreground">{info.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">A partir de</p>
                      <p className="font-bold text-primary">
                        {formatPrice(price?.price_per_day_cents || 0)}/dia
                      </p>
                    </div>
                  </label>
                );
              })}
            </RadioGroup>
            
            <Button onClick={() => setStep(2)} className="w-full">
              Continuar
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <RadioGroup value={duration} onValueChange={(v) => setDuration(v as DurationType)}>
              {[
                { value: 'day', label: '1 Dia', field: 'price_per_day_cents' },
                { value: 'week', label: '7 Dias', field: 'price_per_week_cents' },
                { value: 'month', label: '30 Dias', field: 'price_per_month_cents' },
              ].map((option) => {
                const price = pricing?.find(p => p.ad_type === adType)?.[option.field as keyof typeof pricing[0]] as number || 0;
                
                return (
                  <label
                    key={option.value}
                    className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      duration === option.value 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <RadioGroupItem value={option.value} className="sr-only" />
                    <span className="font-medium">{option.label}</span>
                    <span className="font-bold text-primary">{formatPrice(price)}</span>
                  </label>
                );
              })}
            </RadioGroup>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Voltar
              </Button>
              <Button onClick={() => setStep(3)} className="flex-1">
                Continuar
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Título do anúncio"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Conteúdo *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Descrição do anúncio"
                maxLength={500}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="link">Link (opcional)</Label>
              <Input
                id="link"
                type="url"
                value={formData.link_url}
                onChange={(e) => setFormData(prev => ({ ...prev, link_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>

            {adType !== 'ticker' && (
              <div className="space-y-2">
                <Label htmlFor="image">URL da Imagem (opcional)</Label>
                <Input
                  id="image"
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bgColor">Cor de Fundo</Label>
                <div className="flex gap-2">
                  <Input
                    id="bgColor"
                    type="color"
                    value={formData.background_color}
                    onChange={(e) => setFormData(prev => ({ ...prev, background_color: e.target.value }))}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={formData.background_color}
                    onChange={(e) => setFormData(prev => ({ ...prev, background_color: e.target.value }))}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="textColor">Cor do Texto</Label>
                <div className="flex gap-2">
                  <Input
                    id="textColor"
                    type="color"
                    value={formData.text_color}
                    onChange={(e) => setFormData(prev => ({ ...prev, text_color: e.target.value }))}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={formData.text_color}
                    onChange={(e) => setFormData(prev => ({ ...prev, text_color: e.target.value }))}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-muted">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total a pagar:</span>
                <span className="text-2xl font-bold text-primary">{formatPrice(getPrice())}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                Voltar
              </Button>
              <Button 
                onClick={() => createAd.mutate()} 
                className="flex-1"
                disabled={!formData.title || !formData.content || createAd.isPending}
              >
                {createAd.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Criar Anúncio'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
