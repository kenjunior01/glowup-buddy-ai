import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Sparkles, ExternalLink, Loader2, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Citation {
  url: string;
  title?: string;
}

interface SearchResult {
  answer: string;
  citations: Citation[];
}

interface SmartSearchProps {
  placeholder?: string;
  context?: string;
}

export const SmartSearch = ({ 
  placeholder = "Pergunte qualquer coisa...", 
  context 
}: SmartSearchProps) => {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('perplexity-search', {
        body: { query, context }
      });

      if (error) throw error;

      setResult(data);
      setIsOpen(true);
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Erro na busca",
        description: "Não foi possível realizar a busca. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="relative w-full">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="pl-10 pr-4"
            disabled={loading}
          />
        </div>
        <Button 
          onClick={handleSearch} 
          disabled={loading || !query.trim()}
          className="gradient-primary"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Buscar
            </>
          )}
        </Button>
      </div>

      {isOpen && result && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 shadow-large animate-fade-in">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Resultado da Pesquisa IA
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-64">
              <p className="text-sm text-foreground whitespace-pre-wrap">{result.answer}</p>
              
              {result.citations && result.citations.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Fontes:</p>
                  <div className="flex flex-wrap gap-2">
                    {result.citations.map((citation, index) => (
                      <a
                        key={index}
                        href={citation.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline bg-primary/10 px-2 py-1 rounded-full"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {citation.title || `Fonte ${index + 1}`}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
