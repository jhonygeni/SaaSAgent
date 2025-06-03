// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import Stripe from "https://esm.sh/stripe@12.18.0";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Declare Deno namespace for TypeScript
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
  "Content-Type": "application/json"
};

// Helper logging function for debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

// Get required environment variables
const STRIPE_STARTER_PRICE_ID = Deno.env.get("STRIPE_STARTER_PRICE_ID");
const STRIPE_GROWTH_PRICE_ID = Deno.env.get("STRIPE_GROWTH_PRICE_ID");
// Novos price IDs para ciclos semestral e anual
const STRIPE_STARTER_SEMIANNUAL_PRICE_ID = Deno.env.get("STRIPE_STARTER_SEMIANNUAL_PRICE_ID") || "price_1RUGkFP1QgGAc8KHAXICojLH";
const STRIPE_STARTER_ANNUAL_PRICE_ID = Deno.env.get("STRIPE_STARTER_ANNUAL_PRICE_ID") || "price_1RUGkgP1QgGAc8KHctjcrt7h";
const STRIPE_GROWTH_SEMIANNUAL_PRICE_ID = Deno.env.get("STRIPE_GROWTH_SEMIANNUAL_PRICE_ID") || "price_1RUAt2P1QgGAc8KHr8K4uqXG";
const STRIPE_GROWTH_ANNUAL_PRICE_ID = Deno.env.get("STRIPE_GROWTH_ANNUAL_PRICE_ID") || "price_1RUAtVP1QgGAc8KH01aRe0Um";
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// Validate all required environment variables
const requiredEnvVars = {
  STRIPE_STARTER_PRICE_ID,
  STRIPE_GROWTH_PRICE_ID,
  STRIPE_SECRET_KEY,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
};

for (const [key, value] of Object.entries(requiredEnvVars)) {
  if (!value) {
    console.error(`Missing required environment variable: ${key}`);
    throw new Error(`${key} must be set`);
  }
}

const PRICE_IDS = {
  starter: {
    monthly: STRIPE_STARTER_PRICE_ID,
    semiannual: STRIPE_STARTER_SEMIANNUAL_PRICE_ID,
    annual: STRIPE_STARTER_ANNUAL_PRICE_ID
  },
  growth: {
    monthly: STRIPE_GROWTH_PRICE_ID,
    semiannual: STRIPE_GROWTH_SEMIANNUAL_PRICE_ID,
    annual: STRIPE_GROWTH_ANNUAL_PRICE_ID
  }
};

// Initialize Stripe with proper error handling
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16" // Use the latest stable API version
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Validate Content-Type
    const contentType = req.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      logStep("Invalid content-type", { contentType });
      return new Response(
        JSON.stringify({ 
          error: "Content-Type must be application/json",
          received: contentType 
        }), 
        { 
          headers: corsHeaders,
          status: 400 
        }
      );
    }

    // Get and validate request body
    let body: any;
    try {
      body = await req.json();
    } catch (e) {
      logStep("Invalid JSON body", { error: String(e) });
      return new Response(
        JSON.stringify({ 
          error: "Invalid JSON body",
          details: String(e)
        }), 
        { 
          headers: corsHeaders,
          status: 400 
        }
      );
    }
    const { planId, priceId, billingCycle = 'monthly' } = body;
    
    // 🔍 DEBUG: Log all received parameters
    logStep("🔍 BILLING CYCLE DEBUG - Parameters received", { 
      planId, 
      priceId, 
      billingCycle,
      fullBody: body 
    });
    
    if (!planId || !["starter", "growth"].includes(planId)) {
      logStep("Invalid or missing planId", { planId });
      return new Response(JSON.stringify({ error: "Invalid or missing planId. Must be 'starter' or 'growth'." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    if (billingCycle && !['monthly', 'semiannual', 'annual'].includes(billingCycle)) {
      logStep("Invalid billingCycle", { billingCycle });
      return new Response(JSON.stringify({ error: "Invalid billingCycle. Must be 'monthly', 'semiannual', or 'annual'." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
    
    // Se um price ID específico for fornecido, use-o
    // Caso contrário, use o price ID baseado no plano e ciclo de cobrança
    const selectedPriceId = priceId || PRICE_IDS[planId as 'starter' | 'growth'][billingCycle as 'monthly' | 'semiannual' | 'annual'];
    
    // 🔍 DEBUG: Log price ID selection
    logStep("🔍 BILLING CYCLE DEBUG - Price ID Selection", { 
      receivedPriceId: priceId,
      selectedPlan: planId,
      selectedCycle: billingCycle,
      finalPriceId: selectedPriceId,
      availablePriceIds: PRICE_IDS,
      priceIdFromConfig: PRICE_IDS[planId as 'starter' | 'growth'][billingCycle as 'monthly' | 'semiannual' | 'annual']
    });
    
    logStep("Plan requested", { planId, billingCycle, priceId: selectedPriceId });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      logStep("Stripe key missing");
      return new Response(JSON.stringify({ error: "STRIPE_SECRET_KEY is not set" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }
    logStep("Stripe key verified");

    // Initialize Supabase client with the service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("No authorization header provided");
      return new Response(JSON.stringify({ error: "No authorization header provided" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData?.user) {
      logStep("Authentication error", { error: userError?.message });
      return new Response(JSON.stringify({ error: `Authentication error: ${userError?.message || "User not found"}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }
    const user = userData.user;
    if (!user?.email) {
      logStep("User not authenticated or email not available");
      return new Response(JSON.stringify({ error: "User not authenticated or email not available" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check if the user already has a Stripe customer record
    let customerId: string;
    try {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        logStep("Found existing customer", { customerId });
      } else {
        // Create a new customer
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.user_metadata?.name || user.email,
          metadata: { user_id: user.id },
        });
        customerId = customer.id;
        logStep("Created new customer", { customerId });
      }
    } catch (err) {
      logStep("Stripe customer error", { error: String(err) });
      return new Response(JSON.stringify({ error: "Failed to create or fetch Stripe customer" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Create a checkout session with the proper price ID
    const origin = req.headers.get("origin") || "http://localhost:3000";
    let session;
    try {
      // Usar o price ID selecionado anteriormente
      if (!selectedPriceId) {
        throw new Error(`Price ID not found for plan: ${planId} with billing cycle: ${billingCycle}`);
      }

      logStep("Creating checkout session", { planId, priceId: selectedPriceId, billingCycle, customerId });
      
      session = await stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [
          {
            price: selectedPriceId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        payment_method_types: ["card"],
        allow_promotion_codes: true,
        billing_address_collection: "required",
        success_url: `${origin}/planos?checkout_success=true&billing_cycle=${billingCycle}`,
        cancel_url: `${origin}/planos?checkout_cancelled=true`,
      });
    } catch (err) {
      logStep("Stripe checkout session error", { error: String(err) });
      return new Response(JSON.stringify({ error: "Failed to create checkout session" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    if (!session.url) {
      logStep("Checkout session URL missing", { sessionId: session.id });
      return new Response(JSON.stringify({ error: "Failed to create checkout session URL" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    // All responses should include CORS headers
    return new Response(JSON.stringify({ url: session.url }), {
      headers: corsHeaders,
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        timestamp: new Date().toISOString()
      }), 
      {
        headers: corsHeaders,
        status: 500,
      }
    );
  }
});
