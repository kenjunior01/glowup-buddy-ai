import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export const PremiumBanner = () => {
  const [dismissedAds, setDismissedAds] = useState<string[]>([]);

  const { data: ads } = useQuery({
    queryKey: ['premium-banner-ads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('advertisements')
        .select('*')
        .eq('ad_type', 'premium_banner')
        .eq('status', 'active')
        .lte('starts_at', new Date().toISOString())
        .gt('expires_at', new Date().toISOString())
        .order('priority', { ascending: false })
        .limit(3);
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 60000,
  });

  const handleClick = async (adId: string, linkUrl: string | null) => {
    await supabase.from('advertisements').update({ 
      clicks_count: (ads?.find(a => a.id === adId)?.clicks_count || 0) + 1 
    }).eq('id', adId);
    
    if (linkUrl) {
      window.open(linkUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const visibleAds = ads?.filter(ad => !dismissedAds.includes(ad.id)) || [];

  if (visibleAds.length === 0) return null;

  const currentAd = visibleAds[0];

  return (
    <div 
      className="relative overflow-hidden rounded-lg mx-4 my-2 shadow-lg"
      style={{ 
        backgroundColor: currentAd.background_color || 'hsl(var(--primary))',
        color: currentAd.text_color || 'hsl(var(--primary-foreground))'
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      
      <button
        onClick={() => setDismissedAds(prev => [...prev, currentAd.id])}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/20 transition-colors z-10"
      >
        <X className="h-4 w-4" />
      </button>

      <button
        onClick={() => handleClick(currentAd.id, currentAd.link_url)}
        className="w-full p-4 text-left flex items-center gap-4"
      >
        {currentAd.image_url && (
          <img 
            src={currentAd.image_url} 
            alt={currentAd.title}
            className="w-16 h-16 object-cover rounded-lg"
          />
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/20">
              Patrocinado
            </span>
          </div>
          <h3 className="font-bold text-lg mt-1 truncate">{currentAd.title}</h3>
          <p className="opacity-90 text-sm line-clamp-2">{currentAd.content}</p>
        </div>

        {currentAd.link_url && (
          <Button 
            variant="secondary" 
            size="sm"
            className="shrink-0"
          >
            Saiba mais
            <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
        )}
      </button>
    </div>
  );
};
