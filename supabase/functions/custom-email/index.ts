/// <reference types="https://deno.land/x/types/index.d.ts" />

// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { connect } from "https://deno.land/x/smtp/mod.ts";

interface EmailRequest {
  email: string;
  template: string;
  data: Record<string, unknown>;
}

interface EmailTemplate {
  subject: string;
  html: string;
}

const BASE_URL = 'https://saa-s-agent.vercel.app';

const TEMPLATES: Record<string, (data: Record<string, unknown>) => EmailTemplate> = {
  confirmacao: (data) => ({
    subject: "Confirme seu email - Geni Chat",
    html: `
      <h1>Olá ${data.nome || ""}!</h1>
      <p>Bem-vindo(a) ao Geni Chat. Para confirmar seu email, clique no link abaixo:</p>
      <a href="${BASE_URL}/confirmar?token=${data.token || ""}"">Confirmar Email</a>
      <p>Se você não criou uma conta, pode ignorar este email.</p>
    `
  }),
  resetSenha: (data) => ({
    subject: "Redefinição de Senha - Geni Chat",
    html: `
      <h1>Redefinição de Senha</h1>
      <p>Você solicitou a redefinição de sua senha. Clique no link abaixo para criar uma nova senha:</p>
      <a href="${BASE_URL}/reset-senha?token=${data.token || ""}"">Redefinir Senha</a>
      <p>Se você não solicitou esta redefinição, pode ignorar este email.</p>
    `
  })
};

const sendEmail = async (to: string, subject: string, html: string) => {
  console.log('=== Iniciando processo de envio de email ===');
  
  const smtp = {
    hostname: Deno.env.get('SMTP_HOST') || '',
    port: parseInt(Deno.env.get('SMTP_PORT') || '465'),
    username: Deno.env.get('SMTP_USERNAME') || '',
    password: Deno.env.get('SMTP_PASSWORD') || '',
    from: Deno.env.get('SMTP_FROM') || ''
  };

  // Log das configurações (sem a senha)
  console.log('Configurações SMTP:', {
    hostname: smtp.hostname,
    port: smtp.port,
    username: smtp.username,
    from: smtp.from
  });

  // Validar configurações SMTP
  if (!smtp.hostname) throw new Error('SMTP_HOST não configurado');
  if (!smtp.username) throw new Error('SMTP_USERNAME não configurado');
  if (!smtp.password) throw new Error('SMTP_PASSWORD não configurado');
  if (!smtp.from) throw new Error('SMTP_FROM não configurado');

  console.log('Todas as configurações SMTP estão presentes');

  try {
    console.log('Conectando ao servidor SMTP...');
    const client = await connect({
      hostname: smtp.hostname,
      port: smtp.port,
      username: smtp.username,
      password: smtp.password,
    });

    console.log('Enviando email...');
    await client.send({
      from: smtp.username,
      to: to,
      subject: subject,
      content: html,
      html: true
    });

    console.log('Email enviado com sucesso!');
    await client.close();
    console.log('Conexão SMTP fechada');
    
  } catch (error) {
    console.error('=== ERRO DETALHADO NO ENVIO DE EMAIL ===');
    console.error('Tipo do erro:', error.name);
    console.error('Mensagem:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  }
};

serve(async (req) => {
  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] Nova requisição recebida`);
  
  try {
    if (req.method !== 'POST') {
      console.log(`[${requestId}] Método não permitido: ${req.method}`);
      return new Response(
        JSON.stringify({ success: false, message: 'Method not allowed' }),
        { 
          status: 405,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const data: EmailRequest = await req.json();
    console.log(`[${requestId}] Dados recebidos:`, {
      email: data.email,
      template: data.template,
      data: data.data
    });

    if (!data.email || !data.template || !data.data) {
      console.error(`[${requestId}] Dados obrigatórios faltando`);
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Missing required fields: email, template, and data are required'
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (!TEMPLATES[data.template]) {
      console.error(`[${requestId}] Template não encontrado:`, data.template);
      return new Response(
        JSON.stringify({
          success: false,
          message: `Template "${data.template}" not found`
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`[${requestId}] Gerando template do email...`);
    const template = TEMPLATES[data.template](data.data);

    console.log(`[${requestId}] Iniciando envio do email...`);
    await sendEmail(data.email, template.subject, template.html);

    console.log(`[${requestId}] Processo finalizado com sucesso`);
    return new Response(
      JSON.stringify({
        success: true,
        message: `Email sent successfully to ${data.email}`
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error(`[${requestId}] Erro no processamento:`, {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Internal server error',
        error: error.message,
        stack: error.stack,
        type: error.name
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/custom-email' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
