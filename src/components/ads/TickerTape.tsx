import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink } from "lucide-react";

export const TickerTape = () => {
  const { data: ads } = useQuery({
    queryKey: ['ticker-ads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('advertisements')
        .select('*')
        .eq('ad_type', 'ticker')
        .eq('status', 'active')
        .lte('starts_at', new Date().toISOString())
        .gt('expires_at', new Date().toISOString())
        .order('priority', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 60000,
  });

  if (!ads || ads.length === 0) return null;

  const handleClick = async (adId: string, linkUrl: string | null) => {
    // Increment click count
    await supabase.from('advertisements').update({ 
      clicks_count: (ads?.find(a => a.id === adId)?.clicks_count || 0) + 1 
    }).eq('id', adId);
    
    if (linkUrl) {
      window.open(linkUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="bg-gradient-to-r from-primary via-primary/90 to-primary overflow-hidden py-2 relative">
      <div className="flex animate-ticker whitespace-nowrap">
        {[...ads, ...ads, ...ads].map((ad, index) => (
          <button
            key={`${ad.id}-${index}`}
            onClick={() => handleClick(ad.id, ad.link_url)}
            className="inline-flex items-center gap-2 mx-8 text-primary-foreground hover:text-primary-foreground/80 transition-colors cursor-pointer"
          >
            <span className="font-medium">{ad.title}</span>
            <span className="opacity-80">—</span>
            <span>{ad.content}</span>
            {ad.link_url && <ExternalLink className="h-3 w-3" />}
          </button>
        ))}
      </div>
    </div>
  );
};
