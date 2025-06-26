// filepath: /Users/jhonymonhol/Desktop/SaaSAgent-main/supabase/functions/check-subscription/index.ts
// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import Stripe from "https://esm.sh/stripe@12.18.0";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, Authorization, prefer",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
  "Content-Type": "application/json"
};

// Helper logging function for debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Handler para gerenciar timeouts internos
const withTimeout = async (promise, timeoutMs = 4000, fallbackValue = null) => {
  let timeoutHandle;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutHandle = setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutHandle);
    return result;
  } catch (e) {
    clearTimeout(timeoutHandle);
    console.error(`Timeout or error: ${e.message}`);
    return fallbackValue;
  }
};

// Price IDs for our plans - updated to support all billing cycles
const PRICE_IDS = {
  starter: {
    monthly: "price_1RRBDsP1QgGAc8KHzueN2CJL",
    semiannual: "price_1RUGkFP1QgGAc8KHAXICojLH", 
    annual: "price_1RUGkgP1QgGAc8KHctjcrt7h"
  },
  growth: {
    monthly: "price_1RRBEZP1QgGAc8KH71uKIH6i",
    semiannual: "price_1RUAt2P1QgGAc8KHr8K4uqXG",
    annual: "price_1RUAtVP1QgGAc8KH01aRe0Um"
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Use the service role key to perform writes (upsert) in Supabase
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    // Usar timeout para getUser para evitar bloquear
    const userResult = await withTimeout(
      supabaseClient.auth.getUser(token),
      3000,
      { data: null, error: new Error("Auth request timed out") }
    );
    
    if (userResult.error) throw userResult.error;
    
    const user = userResult.data?.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });
    
    // Função para obter contagem de mensagens do usuário
    const getMessageCount = async (userId: string) => {
      try {
        // Consulta todos os registros de uso do usuário e soma os valores
        const { data: messageStats, error: statsError } = await withTimeout(
          supabaseClient
            .from('usage_stats')
            .select('messages_sent, messages_received')
            .eq('user_id', userId),
          2000,
          { data: [], error: null }
        );
        
        if (statsError || !messageStats || messageStats.length === 0) {
          logStep("No message stats found, returning 0");
          return 0;
        }
        
        // CORREÇÃO: Para limite do plano, consideramos apenas mensagens enviadas
        let totalSent = 0;
        let totalReceived = 0;
        
        messageStats.forEach(stat => {
          totalSent += (stat.messages_sent || 0);
          totalReceived += (stat.messages_received || 0);
        });
        
        // Apenas mensagens enviadas contam para o limite do plano
        const messageCount = totalSent;
        logStep("Message count retrieved", { 
          messagesSent: totalSent, 
          messagesReceived: totalReceived, 
          totalForLimit: messageCount,  // Só enviadas contam para limite
          recordsCount: messageStats.length
        });
        
        return messageCount;
      } catch (error) {
        logStep("Error getting message count", { error: error.message });
        return 0;
      }
    };

    // Antes de chamar o Stripe, verificar se há uma assinatura no banco de dados
    // Isso pode evitar chamadas desnecessárias ao Stripe
    try {
      const { data: subscriptionData, error: dbError } = await withTimeout(
        supabaseClient
          .from('subscriptions')
          .select('*, subscription_plans(*)')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single(),
        3000,
        { data: null, error: null }
      );
      
      if (subscriptionData && !dbError) {
        logStep("Found subscription in database", { plan: subscriptionData.subscription_plans?.name || 'free' });
        const dbPlan = subscriptionData.subscription_plans?.name?.toLowerCase() || 'free';
        const messageCount = await getMessageCount(user.id);
        
        return new Response(JSON.stringify({
          subscribed: true,
          plan: dbPlan,
          subscription_end: subscriptionData.current_period_end,
          message_count: messageCount
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    } catch (dbCheckError) {
      // Apenas log, continuar com Stripe como fallback
      logStep("Error checking database subscription", { error: dbCheckError.message });
    }

    // Se não encontrou no banco, verificar no Stripe
    // Inicializar Stripe com timeout mais curto
    const stripe = new Stripe(stripeKey, { 
      apiVersion: "2023-10-16",
      timeout: 5000 // milliseconds
    });
    
    // Usar timeout para chamada ao Stripe
    const customersResult = await withTimeout(
      stripe.customers.list({ email: user.email, limit: 1 }),
      4000,
      { data: [] }
    );
    
    const customers = customersResult.data || [];
    
    if (customers.length === 0) {
      logStep("No customer found, returning free plan");
      const messageCount = await getMessageCount(user.id);
      
      return new Response(JSON.stringify({ 
        subscribed: false, 
        plan: "free",
        message_count: messageCount
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers[0].id;
    logStep("Found Stripe customer", { customerId });

    // Usar timeout para buscar assinaturas
    const subscriptionsResult = await withTimeout(
      stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 1,
      }),
      4000,
      { data: [] }
    );
    
    const subscriptions = subscriptionsResult.data || [];
    const hasActiveSub = subscriptions.length > 0;
    let plan = "free";
    let subscriptionEnd = null;

    if (hasActiveSub) {
      const subscription = subscriptions[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      logStep("Active subscription found", { subscriptionId: subscription.id, endDate: subscriptionEnd });        // Determine subscription tier from price ID
      if (subscription.items?.data?.length > 0) {
        const priceId = subscription.items.data[0].price.id;
        
        // Check for starter plan (all billing cycles)
        if (priceId === PRICE_IDS.starter.monthly || 
            priceId === PRICE_IDS.starter.semiannual || 
            priceId === PRICE_IDS.starter.annual) {
          plan = "starter";
        } 
        // Check for growth plan (all billing cycles)
        else if (priceId === PRICE_IDS.growth.monthly || 
                 priceId === PRICE_IDS.growth.semiannual || 
                 priceId === PRICE_IDS.growth.annual) {
          plan = "growth";
        }
        else {
          // Fallback to checking amounts
          const amount = subscription.items.data[0].price.unit_amount || 0;
          if (amount <= 19900) {
            plan = "starter";
          } else {
            plan = "growth";
          }
        }
      }
      
      logStep("Determined subscription plan", { plan });
    }

    logStep("Returning subscription status", { subscribed: hasActiveSub, plan });
    const messageCount = await getMessageCount(user.id);
    
    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      plan,
      subscription_end: subscriptionEnd,
      message_count: messageCount
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[CHECK-SUBSCRIPTION] Error:`, errorMessage);
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        timestamp: new Date().toISOString()
      }),
      {
        headers: corsHeaders,
        status: 500
      }
    );
  }
});
