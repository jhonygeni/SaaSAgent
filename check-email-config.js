#!/usr/bin/env node
// Script para verificar e configurar environment variables para email

const fs = require('fs');
const path = require('path');

console.log('🔍 VERIFICAÇÃO DE CONFIGURAÇÃO DE EMAIL');
console.log('=====================================\n');

// Carregar .env se existir
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    require('dotenv').config();
    console.log('✅ Arquivo .env encontrado e carregado\n');
} else {
    console.log('❌ Arquivo .env NÃO encontrado!');
    console.log('💡 Execute: cp .env.example .env\n');
}

// Variáveis necessárias para email
const emailVars = {
    'SMTP_HOST': process.env.SMTP_HOST,
    'SMTP_PORT': process.env.SMTP_PORT,
    'SMTP_USERNAME': process.env.SMTP_USERNAME,
    'SMTP_PASSWORD': process.env.SMTP_PASSWORD,
    'SITE_URL': process.env.SITE_URL,
    'SUPABASE_URL': process.env.SUPABASE_URL,
    'SUPABASE_ANON_KEY': process.env.SUPABASE_ANON_KEY,
    'PROJECT_REF': process.env.PROJECT_REF
};

console.log('📧 VERIFICAÇÃO DAS VARIÁVEIS DE EMAIL:');
console.log('--------------------------------------');

let allConfigured = true;
let hasEmailConfig = true;

for (const [varName, value] of Object.entries(emailVars)) {
    if (!value) {
        console.log(`❌ ${varName}: NÃO CONFIGURADA`);
        allConfigured = false;
        if (varName.startsWith('SMTP_')) {
            hasEmailConfig = false;
        }
    } else {
        // Mascarar senhas e tokens
        let displayValue = value;
        if (varName.includes('PASSWORD') || varName.includes('KEY')) {
            displayValue = '*'.repeat(Math.min(value.length, 8)) + '...';
        }
        console.log(`✅ ${varName}: ${displayValue}`);
    }
}

console.log('\n📊 RESUMO DA CONFIGURAÇÃO:');
console.log('-------------------------');

if (!fs.existsSync(envPath)) {
    console.log('🔴 STATUS: ARQUIVO .ENV AUSENTE');
    console.log('\n💡 PRÓXIMOS PASSOS:');
    console.log('1. Execute: cp .env.example .env');
    console.log('2. Edite o arquivo .env com suas credenciais');
    console.log('3. Execute novamente: node check-email-config.js');
    process.exit(1);
}

if (!hasEmailConfig) {
    console.log('🔴 STATUS: CONFIGURAÇÃO SMTP INCOMPLETA');
    console.log('\n💡 AÇÕES NECESSÁRIAS:');
    console.log('1. 🔑 Altere a senha SMTP no Hostinger');
    console.log('2. ⚙️  Configure SMTP_* no arquivo .env');
    console.log('3. 🌐 Configure SMTP no dashboard Supabase');
    process.exit(1);
} else if (!allConfigured) {
    console.log('🟡 STATUS: CONFIGURAÇÃO PARCIAL');
    console.log('\n💡 Configure as variáveis ausentes no arquivo .env');
    process.exit(1);
} else {
    console.log('🟢 STATUS: CONFIGURAÇÃO COMPLETA!');
    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('1. ✅ Configure SMTP no dashboard Supabase');
    console.log('2. 🧪 Teste envio de email');
    console.log('3. 🚀 Execute: node test-email-sending.js');
}

console.log('\n📋 CHECKLIST SUPABASE:');
console.log('----------------------');
console.log('□ Dashboard → Authentication → Settings → SMTP Settings');
console.log('□ Edge Functions → Settings → Secrets');
console.log('□ Authentication → Hooks → Email Hook');
console.log('□ Teste manual no dashboard');

console.log('\n📖 Guia completo: GUIA-CONFIGURAR-EMAIL-SUPABASE.md');
