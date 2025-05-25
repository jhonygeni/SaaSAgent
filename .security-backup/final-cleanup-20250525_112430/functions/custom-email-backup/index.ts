// filepath: /Users/jhonymonhol/Desktop/conversa-ai-brasil/supabase/functions/custom-email/index.ts
// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400"
};

// Informações do remetente
const FROM_EMAIL = "validar@geni.chat";
const FROM_NAME = "ConversaAI Brasil";
const REPLY_TO = "suporte@conversaai.com.br";

// Configurações SMTP - Obtidas das variáveis de ambiente
const SMTP_HOST = Deno.env.get("SMTP_HOST") || "smtp.hostinger.com";
const SMTP_PORT = Number(Deno.env.get("SMTP_PORT")) || 465;
const SMTP_USERNAME = Deno.env.get("SMTP_USERNAME") || "validar@geni.chat";
const SMTP_PASSWORD = Deno.env.get("SMTP_PASSWORD") || "";

// Função para registrar logs de e-mail
const logEmailSend = async (email, type, success, errorMessage = null) => {
  try {
    // Esta função seria idealmente conectada a uma tabela do Supabase
    // Por enquanto, apenas registra no console
    console.log(`EMAIL_LOG: ${new Date().toISOString()} | To: ${email} | Type: ${type} | Success: ${success} ${errorMessage ? '| Error: ' + errorMessage : ''}`);
  } catch (err) {
    // Não fazer nada se falhar o log, apenas registrar no console
    console.error("Failed to log email send:", err);
  }
};

// Template de e-mail de confirmação
const generateConfirmationEmailHTML = (confirmationLink, userName) => {
  const appUrl = "https://app.conversaai.com.br";
  const supportEmail = "suporte@conversaai.com.br";
  
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

const sendCustomEmail = async (email, type, token, redirectTo, metadata) => {
  try {
    // Configurar cliente SMTP com SSL/TLS na porta 465
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
    const baseUrl = Deno.env.get("SITE_URL") || "https://app.conversaai.com.br";
    
    // Adicionar as tabelas de projeto do Supabase
    const projectRef = "hpovwcaskorzzrpphgkc";
    
    // Construir o link de verificação. Importante preservar o formato correto para o Supabase processar
    let supabaseURL = "";
    
    if (type === "signup" || type === "email_signup") {
      // URL para confirmação de cadastro - mantém o formato do Supabase para verificação
      supabaseURL = `https://${projectRef}.supabase.co/auth/v1/verify`;
      confirmationLink = `${supabaseURL}?token=${token}&type=${type}&redirect_to=${encodeURIComponent(redirectTo || baseUrl+"/confirmar-email")}`;
      subject = "Confirme seu e-mail - ConversaAI Brasil";
      content = generateConfirmationEmailHTML(confirmationLink, userName);
    } else if (type === "email_change") {
      // URL para confirmação de alteração de e-mail
      supabaseURL = `https://${projectRef}.supabase.co/auth/v1/verify`;
      confirmationLink = `${supabaseURL}?token=${token}&type=${type}&redirect_to=${encodeURIComponent(redirectTo || baseUrl)}`;
      subject = "Confirme seu novo e-mail - ConversaAI Brasil";
      content = generateConfirmationEmailHTML(confirmationLink, userName);
    } else if (type === "recovery" || type === "password_recovery") {
      // URL para recuperação de senha
      supabaseURL = `https://${projectRef}.supabase.co/auth/v1/verify`;
      confirmationLink = `${supabaseURL}?token=${token}&type=${type}&redirect_to=${encodeURIComponent(redirectTo || baseUrl+"/redefinir-senha")}`;
      subject = "Redefinição de senha - ConversaAI Brasil";
      content = generateConfirmationEmailHTML(confirmationLink, userName);
    } else {
      // Tipo de e-mail desconhecido ou não tratado
      console.warn(`Tipo de e-mail não reconhecido: ${type}`);
      subject = "Notificação - ConversaAI Brasil";
      content = generateConfirmationEmailHTML(`${baseUrl}`, userName);
    }

    // Enviar e-mail com a nova API
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
    await logEmailSend(email, type, true);

    await client.close();
    return { success: true };
  } catch (error) {
    // Registrar falha no log
    await logEmailSend(email, type, false, error.message);
    
    console.error("Erro ao enviar e-mail:", error);
    return { success: false, error: error.message };
  }
};

serve(async (req) => {
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
    const { email, type, token, redirect_to, metadata } = body;

    // Log para ajudar na depuração
    console.log("Payload recebido:", {
      email,
      type,
      hasToken: !!token,
      redirect_to,
      metadata
    });

    // Validar parâmetros obrigatórios
    if (!email || !type || !token) {
      throw new Error("Missing required parameters: email, type, token");
    }
    
    // Enviar e-mail personalizado
    const result = await sendCustomEmail(email, type, token, redirect_to, metadata);
    
    if (!result.success) {
      throw new Error(`Failed to send email: ${result.error}`);
    }
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[CUSTOM-EMAIL] ERROR: ${errorMessage}`);
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400 
      }
    );
  }
});
