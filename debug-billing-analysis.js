#!/usr/bin/env node

/**
 * 🔍 Debug Script - Análise Detalhada do Problema do Billing Cycle
 * 
 * Este script analisa se há inconsistências entre o que o frontend envia
 * e o que o backend espera receber.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Iniciando análise detalhada do problema do billing cycle...\n');

// 1. Analisar configuração do frontend
console.log('📋 1. Analisando configuração do frontend (PricingPlans.tsx)...');

const frontendPath = path.join(__dirname, 'src/components/PricingPlans.tsx');
const frontendContent = fs.readFileSync(frontendPath, 'utf8');

// Extrair configuração de preços do frontend
const pricingConfigMatch = frontendContent.match(/const pricingConfig = \{[\s\S]*?\};/);
if (pricingConfigMatch) {
  console.log('✅ Configuração de preços encontrada no frontend');
  console.log(pricingConfigMatch[0]);
} else {
  console.log('❌ Configuração de preços NÃO encontrada no frontend');
}

// Verificar se billingCycle é enviado
if (frontendContent.includes('billingCycle: billingCycle') || frontendContent.includes('billingCycle,')) {
  console.log('✅ Frontend ENVIA billingCycle para create-checkout');
} else {
  console.log('❌ Frontend NÃO ENVIA billingCycle para create-checkout');
}

// 2. Analisar backend
console.log('\n📋 2. Analisando configuração do backend (create-checkout)...');

const backendPath = path.join(__dirname, 'supabase/functions/create-checkout/index.ts');
const backendContent = fs.readFileSync(backendPath, 'utf8');

// Verificar se aceita billingCycle
if (backendContent.includes('billingCycle') && backendContent.includes('planId')) {
  console.log('✅ Backend ACEITA billingCycle como parâmetro');
} else {
  console.log('❌ Backend NÃO ACEITA billingCycle como parâmetro');
}

// Verificar estrutura PRICE_IDS
const priceIdsMatch = backendContent.match(/const PRICE_IDS = \{[\s\S]*?\};/);
if (priceIdsMatch) {
  console.log('✅ Estrutura PRICE_IDS encontrada no backend');
  console.log(priceIdsMatch[0]);
} else {
  console.log('❌ Estrutura PRICE_IDS NÃO encontrada no backend');
}

// 3. Verificar lógica de seleção do price ID
console.log('\n📋 3. Analisando lógica de seleção do Price ID...');

// Procurar pela linha que seleciona o price ID
const selectedPriceIdMatch = backendContent.match(/const selectedPriceId = [^;]+;/);
if (selectedPriceIdMatch) {
  console.log('✅ Lógica de seleção do Price ID encontrada:');
  console.log(selectedPriceIdMatch[0]);
  
  // Verificar se usa billingCycle na seleção
  if (selectedPriceIdMatch[0].includes('billingCycle')) {
    console.log('✅ A lógica USA billingCycle para selecionar o Price ID');
  } else {
    console.log('❌ A lógica NÃO USA billingCycle para selecionar o Price ID');
  }
} else {
  console.log('❌ Lógica de seleção do Price ID NÃO encontrada');
}

// 4. Verificar criação da sessão Stripe
console.log('\n📋 4. Analisando criação da sessão Stripe...');

const checkoutSessionMatch = backendContent.match(/stripe\.checkout\.sessions\.create\(\{[\s\S]*?\}\);/);
if (checkoutSessionMatch) {
  console.log('✅ Criação da sessão Stripe encontrada');
  
  // Verificar se usa selectedPriceId
  if (checkoutSessionMatch[0].includes('selectedPriceId')) {
    console.log('✅ Sessão Stripe USA selectedPriceId (correto)');
  } else if (checkoutSessionMatch[0].includes('priceId')) {
    console.log('⚠️ Sessão Stripe usa priceId genérico');
  } else {
    console.log('❌ Sessão Stripe NÃO usa price ID dinâmico');
  }
} else {
  console.log('❌ Criação da sessão Stripe NÃO encontrada');
}

// 5. Simular fluxo completo
console.log('\n📋 5. Simulando fluxo completo...');

const frontendPricing = {
  starter: {
    monthly: 'price_1RRBDsP1QgGAc8KHzueN2CJL',
    semiannual: 'price_1RUGkFP1QgGAc8KHAXICojLH',
    annual: 'price_1RUGkgP1QgGAc8KHctjcrt7h'
  },
  growth: {
    monthly: 'price_1RRBEZP1QgGAc8KH71uKIH6i',
    semiannual: 'price_1RUAt2P1QgGAc8KHr8K4uqXG',
    annual: 'price_1RUAtVP1QgGAc8KH01aRe0Um'
  }
};

const testCases = [
  { plan: 'starter', cycle: 'monthly' },
  { plan: 'starter', cycle: 'semiannual' },
  { plan: 'starter', cycle: 'annual' },
  { plan: 'growth', cycle: 'monthly' },
  { plan: 'growth', cycle: 'semiannual' },
  { plan: 'growth', cycle: 'annual' }
];

console.log('\n📤 Simulando dados enviados pelo frontend:');
testCases.forEach(testCase => {
  const { plan, cycle } = testCase;
  const expectedPriceId = frontendPricing[plan][cycle];
  
  const frontendData = {
    planId: plan,
    billingCycle: cycle,
    priceId: expectedPriceId
  };
  
  console.log(`\n🧪 Teste: ${plan} - ${cycle}`);
  console.log(`📤 Dados enviados: ${JSON.stringify(frontendData, null, 2)}`);
  console.log(`🎯 Price ID esperado: ${expectedPriceId}`);
});

// 6. Verificar problemas potenciais
console.log('\n📋 6. Verificando problemas potenciais...');

let issuesFound = [];

// Verificar se há hardcoding de price IDs
if (backendContent.includes('price_1RRBDsP1QgGAc8KH71uKIH6i') && !backendContent.includes('PRICE_IDS')) {
  issuesFound.push('❌ Price IDs podem estar hardcoded no backend');
}

// Verificar se há fallback para monthly
if (backendContent.includes("|| 'monthly'") || backendContent.includes('monthly')) {
  issuesFound.push('⚠️ Pode haver fallback forçado para "monthly"');
}

// Verificar se há uso incorreto de variáveis de ambiente
const envVarMatches = backendContent.match(/STRIPE_[A-Z_]+_PRICE_ID/g);
if (envVarMatches) {
  console.log('📝 Variáveis de ambiente encontradas:');
  [...new Set(envVarMatches)].forEach(envVar => {
    console.log(`  - ${envVar}`);
  });
}

if (issuesFound.length > 0) {
  console.log('\n⚠️ Problemas identificados:');
  issuesFound.forEach(issue => console.log(issue));
} else {
  console.log('\n✅ Nenhum problema óbvio identificado na análise estática');
}

// 7. Recomendações
console.log('\n📋 7. Recomendações para debug:');
console.log('1. 🔍 Adicionar logs detalhados no create-checkout para ver:');
console.log('   - Que parâmetros são recebidos');
console.log('   - Qual price ID é selecionado');
console.log('   - Se billingCycle está sendo usado corretamente');
console.log('');
console.log('2. 🧪 Testar com diferentes ciclos e verificar:');
console.log('   - Se selectedPriceId está correto');
console.log('   - Se a sessão Stripe é criada com o price ID certo');
console.log('');
console.log('3. 🔧 Verificar variáveis de ambiente no Supabase:');
console.log('   - STRIPE_STARTER_SEMIANNUAL_PRICE_ID');
console.log('   - STRIPE_STARTER_ANNUAL_PRICE_ID');
console.log('   - STRIPE_GROWTH_SEMIANNUAL_PRICE_ID');
console.log('   - STRIPE_GROWTH_ANNUAL_PRICE_ID');
console.log('');
console.log('4. 📊 Testar diretamente no Stripe Dashboard:');
console.log('   - Verificar se os price IDs existem');
console.log('   - Confirmar se estão configurados corretamente');

console.log('\n🎯 Conclusão: O código PARECE estar correto. O problema pode estar em:');
console.log('   - Variáveis de ambiente não configuradas');
console.log('   - Cache do browser/Supabase');
console.log('   - Logs não sendo exibidos');
console.log('   - Problema na infraestrutura do Stripe');

console.log('\n✅ Análise concluída!');
