/**
 * Função Edge confirm-custom-email para o Supabase
 * 
 * Esta função lida especificamente com confirmação de tokens customizados
 * que começam com "custom-token-".
 */

// @ts-ignore
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400"
};

interface ConfirmRequest {
  token: string;
  type: string;
  email?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, type, email }: ConfirmRequest = await req.json();

    console.log(`🔍 Received confirmation request:`, {
      token: token?.substring(0, 20) + "...",
      type,
      email
    });

    // Validar se é um token customizado
    if (!token || !token.startsWith('custom-token-')) {
      return new Response(
        JSON.stringify({ 
          error: "Token inválido. Esperado token customizado." 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Criar cliente Supabase com chave de serviço
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extrair o ID do token customizado
    const tokenId = token.replace('custom-token-', '');
    console.log(`🎯 Processing custom token ID: ${tokenId}`);

    // Verificar se existe um registro na tabela de confirmação customizada
    // (Se você tiver uma tabela para isso)
    const { data: confirmData, error: confirmError } = await supabase
      .from('custom_email_confirmations')
      .select('*')
      .eq('token_id', tokenId)
      .eq('used', false)
      .single();

    if (confirmError && confirmError.code !== 'PGRST116') {
      console.error('Erro ao verificar token customizado:', confirmError);
      return new Response(
        JSON.stringify({ 
          error: "Erro interno ao verificar token." 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    if (!confirmData) {
      console.log('❌ Token customizado não encontrado ou já usado');
      return new Response(
        JSON.stringify({ 
          error: "Token inválido, expirado ou já usado." 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Verificar se o token não expirou (24 horas)
    const tokenCreated = new Date(confirmData.created_at);
    const now = new Date();
    const diffHours = (now.getTime() - tokenCreated.getTime()) / (1000 * 60 * 60);

    if (diffHours > 24) {
      console.log('❌ Token customizado expirado');
      return new Response(
        JSON.stringify({ 
          error: "Token expirado. Solicite um novo email de confirmação." 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Confirmar o email do usuário
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
      confirmData.user_id,
      {
        email_confirmed_at: new Date().toISOString()
      }
    );

    if (updateError) {
      console.error('Erro ao confirmar email:', updateError);
      return new Response(
        JSON.stringify({ 
          error: "Erro ao confirmar email." 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Marcar token como usado
    const { error: markUsedError } = await supabase
      .from('custom_email_confirmations')
      .update({ used: true, confirmed_at: new Date().toISOString() })
      .eq('token_id', tokenId);

    if (markUsedError) {
      console.error('Erro ao marcar token como usado:', markUsedError);
    }

    console.log('✅ Email confirmado com sucesso para usuário:', confirmData.user_id);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Email confirmado com sucesso!",
        user_id: confirmData.user_id
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error('Erro geral na confirmação customizada:', error);
    return new Response(
      JSON.stringify({ 
        error: "Erro interno do servidor." 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
