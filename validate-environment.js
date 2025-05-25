#!/usr/bin/env node
// Script de validação de variáveis de ambiente

const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SMTP_HOST',
    'SMTP_PORT', 
    'SMTP_USERNAME',
    'SMTP_PASSWORD',
    'SITE_URL',
    'EVOLUTION_API_URL',
    'EVOLUTION_API_KEY'
];

const optionalEnvVars = [
    'STRIPE_SECRET_KEY',
    'STRIPE_PUBLISHABLE_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
];

console.log('🔍 Validando configuração de ambiente...\n');

let missingRequired = [];
let missingOptional = [];

// Verificar variáveis obrigatórias
requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
        missingRequired.push(varName);
        console.log(`❌ ${varName}: AUSENTE (OBRIGATÓRIA)`);
    } else {
        console.log(`✅ ${varName}: CONFIGURADA`);
    }
});

// Verificar variáveis opcionais
optionalEnvVars.forEach(varName => {
    if (!process.env[varName]) {
        missingOptional.push(varName);
        console.log(`⚠️  ${varName}: AUSENTE (OPCIONAL)`);
    } else {
        console.log(`✅ ${varName}: CONFIGURADA`);
    }
});

console.log('\n📊 RESUMO:');
console.log(`✅ Variáveis obrigatórias configuradas: ${requiredEnvVars.length - missingRequired.length}/${requiredEnvVars.length}`);
console.log(`⚠️  Variáveis opcionais configuradas: ${optionalEnvVars.length - missingOptional.length}/${optionalEnvVars.length}`);

if (missingRequired.length > 0) {
    console.log('\n❌ ERRO: Variáveis obrigatórias ausentes:');
    missingRequired.forEach(varName => {
        console.log(`   - ${varName}`);
    });
    console.log('\n💡 Configure essas variáveis no arquivo .env antes de continuar.');
    process.exit(1);
} else {
    console.log('\n🎉 Configuração de ambiente válida!');
    process.exit(0);
}
