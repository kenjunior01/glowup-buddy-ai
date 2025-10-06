import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { storyType, userContext } = await req.json();

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('Lovable API key not configured');
    }

    const typeDescriptions = {
      progress: 'progresso na jornada de transformação pessoal',
      achievement: 'conquista ou objetivo alcançado',
      challenge: 'desafio aceito ou proposto',
      milestone: 'marco importante na jornada'
    };

    const systemPrompt = `Você é um especialista em criar legendas motivacionais e inspiradoras para redes sociais de Glow Up e transformação pessoal.

Sua missão é gerar 3 sugestões de legendas criativas, autênticas e motivadoras para um story de ${typeDescriptions[storyType as keyof typeof typeDescriptions] || 'transformação pessoal'}.

DIRETRIZES:
- Use emojis relevantes (1-3 por legenda)
- Seja autêntico e inspirador
- Mantenha entre 100-150 caracteres
- Varie entre tom motivacional, reflexivo e celebratório
- Use hashtags quando apropriado (#GlowUp #Transformação)

Responda APENAS com JSON no formato:
{
  "captions": ["legenda 1", "legenda 2", "legenda 3"],
  "sentiment": "positive|neutral|motivational",
  "suggested_hashtags": ["tag1", "tag2", "tag3"]
}`;

    const userPrompt = `Gere legendas para um story de tipo: ${storyType}
${userContext ? `\nContexto adicional: ${userContext}` : ''}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.9,
        max_tokens: 400,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', errorText);
      
      if (response.status === 429) {
        throw new Error('Limite de requisições atingido. Tente novamente em alguns minutos.');
      } else if (response.status === 402) {
        throw new Error('Créditos insuficientes.');
      }
      throw new Error(`AI Gateway error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : aiResponse;
      const result = JSON.parse(jsonString);
      
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      // Fallback captions
      return new Response(
        JSON.stringify({
          captions: [
            "Cada dia é uma oportunidade de evoluir! 💪✨",
            "Pequenos passos, grandes transformações 🌟",
            "Continuo em frente, sempre melhorando! 🚀"
          ],
          sentiment: 'positive',
          suggested_hashtags: ['GlowUp', 'Transformacao', 'Evolucao']
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in generate-caption function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
