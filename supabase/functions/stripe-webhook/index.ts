import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

// Stripe webhook - allow Stripe IPs and known origins
// Note: Stripe webhooks come directly from Stripe servers, not browsers
const allowedOrigins = [
  'https://lovable.dev',
  'https://preview.lovable.dev',
  Deno.env.get('FRONTEND_URL') ?? '',
].filter(Boolean);

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') ?? '';
  // For webhooks from Stripe (no origin header), allow the request
  if (!origin) {
    return {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
    };
  }
  const allowedOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0] || 'https://lovable.dev';
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
    'Access-Control-Allow-Credentials': 'true',
  };
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    let event: Stripe.Event;

    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        logStep("Webhook signature verified");
      } catch (err) {
        logStep("Webhook signature verification failed", { error: err });
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      // For testing without webhook secret
      event = JSON.parse(body);
      logStep("Webhook without signature verification (testing mode)");
    }

    logStep("Event type", { type: event.type });

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      logStep("Checkout session completed", { sessionId: session.id });

      const metadata = session.metadata;
      if (!metadata?.productId || !metadata?.userId || !metadata?.sellerId) {
        logStep("Missing metadata", { metadata });
        throw new Error("Missing required metadata");
      }

      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } }
      );

      const amountCents = parseInt(metadata.amountCents) || (session.amount_total ?? 0);
      const platformFeeCents = Math.floor(amountCents * 0.1);
      const sellerAmountCents = amountCents - platformFeeCents;

      // Create or update purchase record
      const { data: existingPurchase } = await supabaseAdmin
        .from('purchases')
        .select('id')
        .eq('product_id', metadata.productId)
        .eq('buyer_id', metadata.userId)
        .eq('status', 'pending')
        .maybeSingle();

      if (existingPurchase) {
        // Update existing pending purchase
        const { error: updateError } = await supabaseAdmin
          .from('purchases')
          .update({
            status: 'completed',
            payment_intent_id: session.payment_intent as string,
            completed_at: new Date().toISOString(),
          })
          .eq('id', existingPurchase.id);

        if (updateError) {
          logStep("Error updating purchase", { error: updateError });
          throw updateError;
        }
        logStep("Purchase updated to completed", { purchaseId: existingPurchase.id });
      } else {
        // Create new purchase record
        const { error: insertError } = await supabaseAdmin
          .from('purchases')
          .insert({
            product_id: metadata.productId,
            buyer_id: metadata.userId,
            seller_id: metadata.sellerId,
            amount_cents: amountCents,
            platform_fee_cents: platformFeeCents,
            seller_amount_cents: sellerAmountCents,
            status: 'completed',
            payment_intent_id: session.payment_intent as string,
            completed_at: new Date().toISOString(),
          });

        if (insertError) {
          logStep("Error inserting purchase", { error: insertError });
          throw insertError;
        }
        logStep("New purchase created as completed");
      }

      // Update product total_sales
      await supabaseAdmin
        .from('products')
        .update({ 
          total_sales: supabaseAdmin.rpc('increment_total_sales', { product_id: metadata.productId })
        })
        .eq('id', metadata.productId);

      // Create notification for seller
      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: metadata.sellerId,
          title: 'Nova venda!',
          message: `Você fez uma nova venda! Valor: R$ ${(amountCents / 100).toFixed(2)}`,
          type: 'sale',
        });

      logStep("Purchase flow completed successfully");
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: 'An error occurred processing the webhook' }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      status: 500,
    });
  }
});