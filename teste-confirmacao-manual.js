#!/usr/bin/env node

/**
 * 🔧 TESTE ESPECÍFICO DE CONFIRMAÇÃO DE EMAIL
 * Este script testa diretamente a página de confirmação com diferentes cenários
 */

console.log("🚀 INICIANDO TESTE DE CONFIRMAÇÃO DE EMAIL");
console.log("=".repeat(50));

// URLs de teste que simulam diferentes formatos de links de confirmação
const testUrls = [
    {
        name: "CENÁRIO 1: Link padrão Supabase (access_token no hash)",
        url: "http://localhost:8082/confirmar-email#access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test&refresh_token=test-refresh&token_type=bearer",
        description: "Simula um link gerado pelo Supabase auth padrão"
    },
    {
        name: "CENÁRIO 2: Link com token_hash (formato OTP)",
        url: "http://localhost:8082/confirmar-email?token_hash=test-token-hash-123&type=signup",
        description: "Simula um link com token_hash para verifyOtp"
    },
    {
        name: "CENÁRIO 3: Link com token simples",
        url: "http://localhost:8082/confirmar-email?token=simple-token-123&type=signup",
        description: "Simula um link com token simples"
    },
    {
        name: "CENÁRIO 4: Link com erro",
        url: "http://localhost:8082/confirmar-email?error=invalid_request&error_description=Token+expired",
        description: "Simula um link com erro do Supabase"
    },
    {
        name: "CENÁRIO 5: Link vazio (sem parâmetros)",
        url: "http://localhost:8082/confirmar-email",
        description: "Página de confirmação sem nenhum parâmetro"
    }
];

console.log("🎯 CENÁRIOS DE TESTE IDENTIFICADOS:");
testUrls.forEach((test, index) => {
    console.log(`\n${index + 1}. ${test.name}`);
    console.log(`   URL: ${test.url}`);
    console.log(`   Descrição: ${test.description}`);
});

console.log("\n🔧 INSTRUÇÕES PARA TESTE MANUAL:");
console.log("1. Abra o console do navegador (F12)");
console.log("2. Copie e cole cada URL acima");
console.log("3. Observe os logs detalhados no console");
console.log("4. Verifique qual etapa está falhando");

console.log("\n📋 O QUE PROCURAR NOS LOGS:");
console.log("✅ 'ETAPA 1: Verificando se usuário já está autenticado'");
console.log("✅ 'ETAPA 2: Tentando processar tokens do hash'");
console.log("✅ 'ETAPA 3: Processando confirmação com token_hash'");
console.log("✅ 'ETAPA 4: Tentando token simples'");
console.log("❌ 'TODOS OS MÉTODOS FALHARAM' - indica onde o problema está");

console.log("\n🚨 PROBLEMAS MAIS COMUNS:");
console.log("1. URL de redirect incorreta no Supabase Console");
console.log("2. Template de email enviando formato incorreto");
console.log("3. Configuração de Auth incorreta");
console.log("4. Função Edge enviando tokens inválidos");

console.log("\n⚡ TESTE RÁPIDO:");
console.log("Execute este comando para abrir um teste:");
console.log("open 'http://localhost:8082/confirmar-email?token_hash=test-123&type=signup'");
