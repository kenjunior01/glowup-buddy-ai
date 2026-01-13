import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface MidPageAdProps {
  position?: number;
}

export const MidPageAd = ({ position = 0 }: MidPageAdProps) => {
  const { data: ads } = useQuery({
    queryKey: ['mid-page-ads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('advertisements')
        .select('*')
        .eq('ad_type', 'mid_page')
        .eq('status', 'active')
        .lte('starts_at', new Date().toISOString())
        .gt('expires_at', new Date().toISOString())
        .order('priority', { ascending: false });
      
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

  if (!ads || ads.length === 0) return null;

  const currentAd = ads[position % ads.length];

  return (
    <Card 
      className="overflow-hidden my-4 border-2 border-dashed border-primary/20"
      style={{ 
        backgroundColor: currentAd.background_color || undefined,
        color: currentAd.text_color || undefined
      }}
    >
      <button
        onClick={() => handleClick(currentAd.id, currentAd.link_url)}
        className="w-full text-left"
      >
        <div className="relative">
          {currentAd.image_url && (
            <div className="aspect-video w-full overflow-hidden">
              <img 
                src={currentAd.image_url} 
                alt={currentAd.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="absolute top-2 left-2">
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-black/50 text-white">
              Anúncio
            </span>
          </div>
        </div>

        <div className="p-4">
          <h3 className="font-bold text-lg">{currentAd.title}</h3>
          <p className="text-muted-foreground mt-1 line-clamp-3">{currentAd.content}</p>
          
          {currentAd.link_url && (
            <Button 
              variant="outline" 
              size="sm"
              className="mt-3"
            >
              Ver mais
              <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          )}
        </div>
      </button>
    </Card>
  );
};
