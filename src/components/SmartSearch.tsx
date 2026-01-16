import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, Sparkles, ExternalLink, Loader2, X, Lightbulb, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Citation {
  url: string;
  title?: string;
}

interface SearchResult {
  answer: string;
  citations: Citation[];
  products?: any[];
}

interface SmartSearchProps {
  placeholder?: string;
  context?: string;
  onProductsFound?: (products: any[]) => void;
}

const EXAMPLE_QUERIES = [
  "Qual o melhor curso para aumentar produtividade?",
  "E-book sobre hábitos saudáveis",
  "Mentoria para desenvolvimento pessoal",
  "Como melhorar minha disciplina matinal?",
  "Curso de meditação e mindfulness"
];

export const SmartSearch = ({ 
  placeholder = "Descreva o que você procura...", 
  context,
  onProductsFound
}: SmartSearchProps) => {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const handleSearch = async (searchQuery?: string) => {
    const finalQuery = searchQuery || query;
    if (!finalQuery.trim()) return;

    setLoading(true);
    setResult(null);
    setQuery(finalQuery);

    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // First, try to interpret intent and search products
        const { data: intentData, error: intentError } = await supabase.functions.invoke('smart-search', {
          body: { query: finalQuery, context }
        });

        if (intentError) throw intentError;

        // If products found, notify parent
        if (intentData?.products && onProductsFound) {
          onProductsFound(intentData.products);
        }

        setResult(intentData);
        setIsOpen(true);
        setRetryCount(0);
        setShowExamples(false);
        return;
      } catch (error: any) {
        lastError = error;
        console.error(`Search attempt ${attempt + 1} failed:`, error);
        
        if (attempt < maxRetries) {
          // Wait before retry with exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 500));
          setRetryCount(attempt + 1);
        }
      }
    }

    // All retries failed
    toast({
      title: "Erro na busca",
      description: lastError?.message || "Não foi possível realizar a busca. Tente novamente.",
      variant: "destructive",
    });
    setRetryCount(0);
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleExampleClick = (example: string) => {
    handleSearch(example);
  };

  return (
    <div className="relative w-full space-y-3">
      {/* Search Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowExamples(true)}
            placeholder={placeholder}
            className="pl-10 pr-4"
            disabled={loading}
          />
        </div>
        <Button 
          onClick={() => handleSearch()} 
          disabled={loading || !query.trim()}
          className="gradient-primary"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {retryCount > 0 && <span className="ml-1 text-xs">({retryCount})</span>}
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Buscar
            </>
          )}
        </Button>
      </div>

      {/* AI Label */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Sparkles className="h-3 w-3 text-primary" />
        <span>Busca alimentada por IA - interpreta suas intenções e encontra o melhor conteúdo</span>
      </div>

      {/* Example Queries */}
      {showExamples && !isOpen && !loading && (
        <Card className="animate-fade-in border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              Exemplos de busca
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_QUERIES.map((example, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary/10 hover:border-primary transition-colors"
                  onClick={() => handleExampleClick(example)}
                >
                  {example}
                </Badge>
              ))}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="mt-2 text-xs"
              onClick={() => setShowExamples(false)}
            >
              Fechar exemplos
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {isOpen && result && (
        <Card className="animate-fade-in shadow-large border-primary/20">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Resultado da Pesquisa IA
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleSearch()}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-64">
              <p className="text-sm text-foreground whitespace-pre-wrap">{result.answer}</p>
              
              {result.products && result.products.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">
                    Produtos relacionados encontrados: {result.products.length}
                  </p>
                </div>
              )}
              
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