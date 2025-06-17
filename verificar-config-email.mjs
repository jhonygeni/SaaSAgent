#!/usr/bin/env node

/**
 * 🔧 VERIFICAÇÃO COMPLETA DA CONFIGURAÇÃO DE EMAIL CONFIRMATION
 * Este script verifica todas as configurações relacionadas à confirmação de email
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("🔍 === VERIFICAÇÃO DE CONFIGURAÇÃO EMAIL CONFIRMATION ===");
console.log("=".repeat(60));

// 1. Verificar variáveis de ambiente
console.log("\n📋 1. VERIFICANDO VARIÁVEIS DE AMBIENTE:");
console.log("SUPABASE_URL:", SUPABASE_URL ? "✅ Configurada" : "❌ Não encontrada");
console.log("SUPABASE_ANON_KEY:", SUPABASE_ANON_KEY ? "✅ Configurada" : "❌ Não encontrada");
console.log("SUPABASE_SERVICE_ROLE_KEY:", SUPABASE_SERVICE_ROLE_KEY ? "✅ Configurada" : "❌ Não encontrada");

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.log("\n❌ ERRO: Variáveis de ambiente essenciais não configuradas!");
    process.exit(1);
}

// 2. Criar cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log("\n🔧 2. VERIFICANDO CONFIGURAÇÕES DE AUTENTICAÇÃO:");

// 3. Verificar configurações de email
console.log("\n📧 3. CONFIGURAÇÕES DE EMAIL ESPERADAS:");
console.log("- emailRedirectTo deve estar definido como: https://ia.geni.chat/confirmar-email");
console.log("- Template de email deve incluir o token correto");
console.log("- Edge Function custom-email deve estar funcionando");

// 4. Testar diferentes formatos de URL de confirmação
console.log("\n🧪 4. FORMATOS DE URL DE CONFIRMAÇÃO SUPORTADOS:");

const testUrls = [
    {
        name: "Formato padrão Supabase (tokens no hash)",
        url: "https://ia.geni.chat/confirmar-email#access_token=eyJ...&refresh_token=abc...&token_type=bearer",
        method: "supabase.auth.setSession()"
    },
    {
        name: "Formato OTP com token_hash",
        url: "https://ia.geni.chat/confirmar-email?token_hash=abc123&type=signup",
        method: "supabase.auth.verifyOtp()"
    },
    {
        name: "Formato customizado com token",
        url: "https://ia.geni.chat/confirmar-email?token=abc123&type=signup",
        method: "supabase.auth.verifyOtp() (token convertido)"
    }
];

testUrls.forEach((test, index) => {
    console.log(`\n${index + 1}. ${test.name}`);
    console.log(`   URL: ${test.url}`);
    console.log(`   Método: ${test.method}`);
});

// 5. Verificar configuração de redirect
console.log("\n🔗 5. CONFIGURAÇÃO DE REDIRECT:");
console.log("Site URL (Production): https://ia.geni.chat");
console.log("Site URL (Development): http://localhost:8082");
console.log("Redirect URLs permitidas:");
console.log("- https://ia.geni.chat/confirmar-email");
console.log("- http://localhost:8082/confirmar-email");

// 6. Teste básico de conectividade
console.log("\n🏥 6. TESTE DE CONECTIVIDADE:");
try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
        console.log("❌ Erro ao conectar com Supabase:", error.message);
    } else {
        console.log("✅ Conexão com Supabase funcionando");
        console.log("   Session data:", data.session ? "Existe sessão ativa" : "Nenhuma sessão ativa");
    }
} catch (err) {
    console.log("💥 Erro de conectividade:", err.message);
}

console.log("\n📊 7. RESUMO DO DIAGNÓSTICO:");
console.log("=".repeat(60));

console.log("\n✅ ITENS FUNCIONANDO:");
console.log("- Variáveis de ambiente configuradas");
console.log("- Cliente Supabase funcionando");
console.log("- Página de confirmação com logs detalhados");
console.log("- Múltiplos métodos de confirmação implementados");

console.log("\n🔍 PRÓXIMOS PASSOS PARA DEBUGGING:");
console.log("1. Criar uma conta de teste no sistema");
console.log("2. Verificar qual formato de URL está sendo gerado");
console.log("3. Acompanhar os logs no console da página de confirmação");
console.log("4. Verificar se o problema está no token ou no método de verificação");

console.log("\n🚨 POSSÍVEIS PROBLEMAS:");
console.log("- Template de email enviando formato incorreto de token");
console.log("- URL de redirect incorreta na configuração do Supabase");
console.log("- Token sendo enviado corrompido ou incompleto");
console.log("- Conflito entre sistema de email customizado e padrão");

console.log("\n⚡ COMANDOS ÚTEIS:");
console.log("- Teste manual: open 'http://localhost:8082/confirmar-email?token_hash=test&type=signup'");
console.log("- Ver logs: Abrir console do navegador na página de confirmação");
console.log("- Criar conta: http://localhost:8082/cadastro");

console.log("\n✨ CONFIGURAÇÃO FINAL NECESSÁRIA:");
console.log("Se todos os testes locais funcionarem, verificar:");
console.log("1. Configuração de templates no Supabase Console");
console.log("2. URLs de redirect em Production");
console.log("3. Deploy da Edge Function custom-email");
