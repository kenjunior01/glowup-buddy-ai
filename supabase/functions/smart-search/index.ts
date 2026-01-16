import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, context } = await req.json();

    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ error: "Query is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Step 1: Use AI to interpret the user's intent
    const intentResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Você é um assistente de busca inteligente para um marketplace de desenvolvimento pessoal.
Sua tarefa é:
1. Interpretar a intenção do usuário
2. Extrair palavras-chave para busca
3. Identificar o tipo de produto desejado (ebook, curso, mentoria)
4. Gerar uma resposta útil

Contexto do marketplace: ${context || 'Produtos digitais de desenvolvimento pessoal, incluindo e-books, cursos e mentorias sobre saúde, produtividade, estética e mentalidade.'}`
          },
          {
            role: "user",
            content: query
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "search_intent",
              description: "Extrair intenção de busca do usuário",
              parameters: {
                type: "object",
                properties: {
                  keywords: {
                    type: "array",
                    items: { type: "string" },
                    description: "Palavras-chave para buscar nos produtos"
                  },
                  product_type: {
                    type: "string",
                    enum: ["ebook", "curso", "mentoria", "all"],
                    description: "Tipo de produto desejado"
                  },
                  answer: {
                    type: "string",
                    description: "Resposta útil para o usuário sobre sua busca"
                  },
                  pillars: {
                    type: "array",
                    items: { 
                      type: "string",
                      enum: ["saude", "produtividade", "estetica", "mentalidade"]
                    },
                    description: "Pilares de desenvolvimento pessoal relacionados"
                  }
                },
                required: ["keywords", "product_type", "answer"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "search_intent" } }
      }),
    });

    if (!intentResponse.ok) {
      if (intentResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (intentResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Por favor, adicione créditos." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI Gateway error: ${intentResponse.status}`);
    }

    const intentData = await intentResponse.json();
    
    let searchIntent = {
      keywords: [query],
      product_type: "all",
      answer: "Aqui estão os produtos encontrados para sua busca.",
      pillars: []
    };

    if (intentData.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments) {
      try {
        searchIntent = JSON.parse(intentData.choices[0].message.tool_calls[0].function.arguments);
      } catch (e) {
        console.error("Error parsing intent:", e);
      }
    }

    // Step 2: Search products in database
    let productsQuery = supabaseClient
      .from('products')
      .select('id, title, description, price_cents, product_type, cover_image_url, rating_avg')
      .eq('status', 'published');

    if (searchIntent.product_type !== 'all') {
      productsQuery = productsQuery.eq('product_type', searchIntent.product_type);
    }

    // Search by keywords using text search
    const keywordFilter = searchIntent.keywords
      .map(k => `title.ilike.%${k}%,description.ilike.%${k}%`)
      .join(',');

    const { data: products, error: productsError } = await productsQuery
      .or(searchIntent.keywords.map(k => `title.ilike.%${k}%`).join(','))
      .limit(10);

    if (productsError) {
      console.error("Products search error:", productsError);
    }

    // Step 3: If no products found, try Perplexity for web search
    let citations: any[] = [];
    let webAnswer = "";

    if (!products || products.length === 0) {
      const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
      
      if (PERPLEXITY_API_KEY) {
        try {
          const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'sonar',
              messages: [
                { role: 'system', content: 'Você é um assistente de busca especializado em desenvolvimento pessoal. Responda em português brasileiro de forma concisa.' },
                { role: 'user', content: `${query} (foco em: ${searchIntent.pillars?.join(', ') || 'desenvolvimento pessoal'})` }
              ],
            }),
          });

          if (perplexityResponse.ok) {
            const perplexityData = await perplexityResponse.json();
            webAnswer = perplexityData.choices?.[0]?.message?.content || "";
            citations = perplexityData.citations?.map((url: string, i: number) => ({
              url,
              title: `Fonte ${i + 1}`
            })) || [];
          }
        } catch (e) {
          console.error("Perplexity error:", e);
        }
      }
    }

    // Build final response
    const finalAnswer = products && products.length > 0
      ? `${searchIntent.answer}\n\nEncontramos ${products.length} produto(s) relacionados à sua busca.`
      : webAnswer || searchIntent.answer;

    return new Response(
      JSON.stringify({
        answer: finalAnswer,
        products: products || [],
        citations,
        intent: {
          keywords: searchIntent.keywords,
          type: searchIntent.product_type,
          pillars: searchIntent.pillars
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Smart search error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Erro na busca inteligente",
        answer: "Desculpe, não foi possível processar sua busca. Tente termos mais simples.",
        products: [],
        citations: []
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});