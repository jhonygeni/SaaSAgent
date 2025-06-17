/**
 * Função Edge custom-email para o Supabase
 * 
 * Esta função lida com eventos de autenticação do Supabase e envia emails personalizados.
 * 
 * FORMATOS DE PAYLOAD ESPERADOS:
 * 
 * 1. Formato Hook Auth (EventTypes): 
 * {
 *   "type": "auth",
 *   "event": "signup"|"email_change"|"recovery",
 *   "user": {
 *     "id": "user_id",
 *     "email": "user@example.com"
 *   },
 *   "data": {
 *     "token": "verification_token"
 *   }
 * }
 * 
 * 2. Formato API Direto (Legacy): 
 * {
 *   "email": "user@example.com",
 *   "type": "signup"|"email_change"|"recovery",
 *   "token": "verification_token",
 *   "redirect_to": "https://example.com/redirect",
 *   "metadata": {
 *     "name": "User Name"
 *   }
 * }
 * 
 * @see https://supabase.com/docs/guides/auth/auth-hooks
 */

// @ts-ignore
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
// @ts-ignore
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400"
};

// Informações do remetente - usar variáveis de ambiente quando disponíveis
const FROM_EMAIL = Deno.env.get("EMAIL_FROM_ADDRESS") || "validar@geni.chat";
const FROM_NAME = Deno.env.get("EMAIL_FROM_NAME") || "ConversaAI Brasil";
const REPLY_TO = Deno.env.get("EMAIL_REPLY_TO") || Deno.env.get("SUPPORT_EMAIL") || "suporte@geni.chat";

// Sistema de logging aprimorado com níveis de severidade
const log = {
  info: (message, data = {}) => {
    console.log(`[INFO] ${new Date().toISOString()} | ${message}`, data ? JSON.stringify(data) : '');
  },
  warn: (message, data = {}) => {
    console.warn(`[WARN] ${new Date().toISOString()} | ${message}`, data ? JSON.stringify(data) : '');
  },
  error: (message, error = null, data = {}) => {
    console.error(`[ERROR] ${new Date().toISOString()} | ${message}`, 
      error ? `\nError: ${error instanceof Error ? error.message : String(error)}` : '',
      data ? `\nData: ${JSON.stringify(data)}` : '');
  },
  email: (email, type, success, errorMessage = null) => {
    console.log(`[EMAIL] ${new Date().toISOString()} | To: ${email} | Type: ${type} | Success: ${success} ${errorMessage ? '| Error: ' + errorMessage : ''}`);
  }
};

// Template de e-mail de confirmação
const generateConfirmationEmailHTML = (confirmationLink, userName) => {
  const appUrl = Deno.env.get("SITE_URL") || "https://ia.geni.chat";
  const supportEmail = Deno.env.get("SUPPORT_EMAIL") || "suporte@geni.chat";
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Confirme seu e-mail - ConversaAI Brasil</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      padding: 20px 0;
      background-color: #151F33;
    }
    .header img {
      max-height: 50px;
    }
    .content {
      padding: 30px 20px;
      background-color: #ffffff;
      border-radius: 5px;
    }
    .button {
      display: inline-block;
      background-color: #0066FF;
      color: #ffffff !important;
      text-decoration: none;
      padding: 12px 30px;
      border-radius: 5px;
      margin: 20px 0;
      font-weight: bold;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #666;
      font-size: 14px;
    }
    .note {
      font-size: 13px;
      color: #666;
      margin-top: 30px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${appUrl}/logo.png" alt="ConversaAI Brasil" />
    </div>
    <div class="content">
      <h2>Olá ${userName || "novo usuário"},</h2>
      <p>Obrigado por se cadastrar na plataforma ConversaAI Brasil.</p>
      <p>Por favor, confirme seu endereço de e-mail clicando no botão abaixo:</p>
      <div style="text-align: center;">
        <a href="${confirmationLink}" class="button">Confirmar meu e-mail</a>
      </div>
      <p>Se você não solicitou este e-mail, pode ignorá-lo com segurança.</p>
      <p>O link de confirmação expira em 24 horas.</p>
      <div class="note">
        <p>Se o botão não funcionar, copie e cole o link abaixo em seu navegador:</p>
        <p style="word-break: break-all;">${confirmationLink}</p>
      </div>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} ConversaAI Brasil. Todos os direitos reservados.</p>
      <p>Em caso de dúvidas, entre em contato conosco: ${supportEmail}</p>
      <p>Este e-mail foi enviado por validar@geni.chat em nome da ConversaAI Brasil</p>
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Analisa o payload da requisição e extrai os dados necessários,
 * suportando diferentes formatos enviados pelo Supabase
 */
const parsePayload = (body) => {
  // Log do payload completo para debug
  log.info("Payload completo recebido:", body);

  // Dados que precisamos extrair
  let email = null;
  let type = null;
  let token = null;
  let redirectTo = null;
  let metadata = null;
  let userId = null;
  
  try {
    // Caso 1: Formato do Auth Hooks do Supabase (formato preferido)
    if (body.type === "auth" && body.event && body.user) {
      log.info("Formato detectado: Auth Hook");
      email = body.user?.email;
      type = body.event;  // signup, email_change, recovery, etc.
      token = body.data?.token || body.token;
      userId = body.user?.id;
      
      // Construir URL de redirecionamento se não fornecido
      const baseUrl = Deno.env.get("SITE_URL") || "https://ia.geni.chat";
      if (type === "signup" || type === "email_signup") {
        redirectTo = `${baseUrl}/confirmar-email`;
      } else if (type === "recovery" || type === "password_recovery") {
        redirectTo = `${baseUrl}/redefinir-senha`;
      } else {
        redirectTo = baseUrl;
      }
      
      metadata = body.user?.user_metadata || {};
    }
    // Caso 2: Formato direto da API (legacy)
    else if (body.email && body.type && body.token) {
      log.info("Formato detectado: API Direta");
      email = body.email;
      type = body.type;
      token = body.token;
      redirectTo = body.redirect_to;
      metadata = body.metadata || {};
    }
    // Caso 3: Tentativa de extrair de qualquer formato
    else {
      log.warn("Formato desconhecido, tentando detectar campos");
      
      // Tenta encontrar e-mail em diferentes locais possíveis
      email = body.user?.email || body.email || body.user_email || 
              body.data?.email || body.payload?.email || null;
      
      // Tenta encontrar tipo em diferentes locais possíveis
      type = body.event || body.type || body.eventType || 
             body.data?.type || body.action || "signup";
      
      // Para chamadas diretas da aplicação, gerar token se não existir
      token = body.data?.token || body.token || body.verification_token ||
              body.payload?.token || `signup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
              
      // Tentativa para metadados
      metadata = body.user?.user_metadata || body.metadata || 
                body.data?.metadata || body.user_data || {};
                
      // Tentativa para redirect
      redirectTo = body.redirect_to || body.redirectTo || body.redirect_url || null;
    }
    
    // Validação final dos dados extraídos
    if (!email) {
      log.error("Email não encontrado no payload", null, body);
      throw new Error("Email não encontrado no payload");
    }
    
    if (!type) {
      log.warn("Tipo não encontrado, usando 'signup' como padrão");
      type = "signup";
    }
    
    // Se não tiver token, gerar um para permitir funcionamento
    if (!token) {
      log.warn("Token não encontrado, gerando token de teste");
      token = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Log dos dados extraídos
    log.info("Dados extraídos com sucesso", { 
      email, 
      type, 
      hasToken: !!token,
      hasRedirect: !!redirectTo,
      userId,
      metadataFields: metadata ? Object.keys(metadata) : []
    });
    
    return { email, type, token, redirectTo, metadata, userId };
  } catch (error) {
    log.error("Erro ao processar payload", error, body);
    throw error;
  }
};

const sendCustomEmail = async (email, type, token, redirectTo, metadata) => {
  try {
    log.info("Iniciando envio de e-mail personalizado", { email, type });
    
    // Obter configurações do ambiente (Deno será disponível no ambiente de execução da função Edge)
    // @ts-ignore - Deno will be available in the Edge Function environment
    const SMTP_HOST = Deno.env.get("SMTP_HOST");
    // @ts-ignore - Deno will be available in the Edge Function environment
    const SMTP_PORT = Number(Deno.env.get("SMTP_PORT"));
    // @ts-ignore - Deno will be available in the Edge Function environment
    const SMTP_USERNAME = Deno.env.get("SMTP_USERNAME");
    // @ts-ignore - Deno will be available in the Edge Function environment
    const SMTP_PASSWORD = Deno.env.get("SMTP_PASSWORD");
    
    // Verificar se todas as variáveis de ambiente necessárias estão definidas
    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USERNAME || !SMTP_PASSWORD) {
      throw new Error("Configurações SMTP incompletas. Verifique as variáveis de ambiente.");
    }
    
    log.info(`Usando SMTP: ${SMTP_HOST}:${SMTP_PORT}, usuário: ${SMTP_USERNAME}`);
    
    // Configurar cliente SMTP
    const client = new SMTPClient({
      connection: {
        hostname: SMTP_HOST,
        port: SMTP_PORT,
        tls: true,
        auth: {
          username: SMTP_USERNAME,
          password: SMTP_PASSWORD,
        }
      }
    });

    // Determinar o tipo de e-mail e criar o assunto e conteúdo adequados
    let subject = "";
    let content = "";
    let confirmationLink = "";
    const userName = metadata?.name || email.split("@")[0];
    
    // Construir link com base nos parâmetros recebidos
    const baseUrl = Deno.env.get("SITE_URL") || "https://ia.geni.chat";
    
    // Adicionar as tabelas de projeto do Supabase
    const projectRef = Deno.env.get("PROJECT_REF") || "hpovwcaskorzzrpphgkc";
    
    // Normalizar tipos de evento para formatos compatíveis
    const normalizedType = type.toLowerCase();
    
    // Construir o link de verificação. Importante preservar o formato correto para o Supabase processar
    let supabaseURL = `https://${projectRef}.supabase.co/auth/v1/verify`;
    
    // Definir configurações com base no tipo de e-mail
    if (normalizedType.includes("signup") || normalizedType === "signup") {
      confirmationLink = `${supabaseURL}?token=${token}&type=signup&redirect_to=${encodeURIComponent(redirectTo || baseUrl+"/confirmar-email")}`;
      subject = "Confirme seu e-mail - ConversaAI Brasil";
      content = generateConfirmationEmailHTML(confirmationLink, userName);
    } else if (normalizedType.includes("change") || normalizedType === "email_change") {
      confirmationLink = `${supabaseURL}?token=${token}&type=email_change&redirect_to=${encodeURIComponent(redirectTo || baseUrl)}`;
      subject = "Confirme seu novo e-mail - ConversaAI Brasil";
      content = generateConfirmationEmailHTML(confirmationLink, userName);
    } else if (normalizedType.includes("recovery") || normalizedType === "password_recovery" || normalizedType === "recovery") {
      confirmationLink = `${supabaseURL}?token=${token}&type=recovery&redirect_to=${encodeURIComponent(redirectTo || baseUrl+"/redefinir-senha")}`;
      subject = "Redefinição de senha - ConversaAI Brasil";
      content = generateConfirmationEmailHTML(confirmationLink, userName);
    } else {
      // Tipo de e-mail desconhecido ou não tratado
      log.warn(`Tipo de e-mail não reconhecido: ${type}, usando configuração padrão`);
      confirmationLink = `${baseUrl}`;
      subject = "Notificação - ConversaAI Brasil";
      content = generateConfirmationEmailHTML(confirmationLink, userName);
    }
    
    log.info(`Enviando e-mail tipo '${normalizedType}' para: ${email}`, { confirmationLink });

    // Enviar e-mail
    await client.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [email],
      subject: subject,
      html: content,
      headers: {
        "Reply-To": REPLY_TO,
        "X-Mailer": "ConversaAI-CustomMailer",
      },
    });

    // Registrar sucesso no log
    log.email(email, normalizedType, true);
    log.info("E-mail enviado com sucesso!");

    await client.close();
    return { success: true };
  } catch (error) {
    // Registrar falha no log
    log.email(email, type, false, error.message);
    log.error("Erro ao enviar e-mail", error);
    return { success: false, error: error.message };
  }
};

serve(async (req) => {
  // Registrar recebimento da solicitação
  log.info(`Requisição recebida: ${req.method} ${new URL(req.url).pathname}`);
  
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Apenas POST é suportado
    if (req.method !== "POST") {
      throw new Error(`Method ${req.method} not allowed`);
    }

    // Recuperar corpo da requisição
    const body = await req.json();
    
    // Registrar o body completo para facilitar diagnóstico
    log.info("Body completo recebido", body);
    
    // Extrair dados relevantes, suportando diferentes formatos
    const { email, type, token, redirectTo, metadata } = parsePayload(body);

    // Enviar e-mail personalizado
    const result = await sendCustomEmail(email, type, token, redirectTo, metadata);
    
    if (!result.success) {
      throw new Error(`Failed to send email: ${result.error}`);
    }
    
    return new Response(JSON.stringify({ 
      success: true,
      message: "E-mail enviado com sucesso",
      email,
      type
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error("[CUSTOM-EMAIL] Erro na função", error);
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        message: "Falha ao processar solicitação",
        timestamp: new Date().toISOString() 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400 
      }
    );
  }
});
