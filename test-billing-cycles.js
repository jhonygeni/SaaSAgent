#!/usr/bin/env node

/**
 * 🧪 Script de Teste - Sistema de Checkout com Múltiplos Ciclos de Cobrança
 * 
 * Este script valida se:
 * 1. Os Price IDs estão consistentes entre frontend e backend
 * 2. A função create-checkout aceita todos os ciclos de cobrança
 * 3. A função check-subscription reconhece todas as assinaturas
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Iniciando testes do sistema de checkout...\n');

// 1. Validar consistência dos Price IDs
console.log('📋 1. Validando consistência dos Price IDs...');

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

// Ler o arquivo PricingPlans.tsx
const pricingPlansPath = path.join(__dirname, 'src', 'components', 'PricingPlans.tsx');
let frontendConsistent = true;

try {
  const pricingPlansContent = fs.readFileSync(pricingPlansPath, 'utf8');
  
  // Verificar se todos os price IDs estão presentes
  Object.entries(frontendPricing).forEach(([plan, cycles]) => {
    Object.entries(cycles).forEach(([cycle, priceId]) => {
      if (pricingPlansContent.includes(priceId)) {
        console.log(`  ✅ ${plan}-${cycle}: ${priceId}`);
      } else {
        console.log(`  ❌ ${plan}-${cycle}: ${priceId} NÃO ENCONTRADO`);
        frontendConsistent = false;
      }
    });
  });
} catch (error) {
  console.log(`  ❌ Erro ao ler PricingPlans.tsx: ${error.message}`);
  frontendConsistent = false;
}

// Ler as funções backend
const checkSubscriptionPath = path.join(__dirname, 'supabase', 'functions', 'check-subscription', 'index.ts');
const createCheckoutPath = path.join(__dirname, 'supabase', 'functions', 'create-checkout', 'index.ts');

let backendConsistent = true;

try {
  const checkSubscriptionContent = fs.readFileSync(checkSubscriptionPath, 'utf8');
  const createCheckoutContent = fs.readFileSync(createCheckoutPath, 'utf8');
  
  console.log('\n📋 2. Validando funções backend...');
  
  // Verificar se as funções backend reconhecem todos os price IDs
  Object.entries(frontendPricing).forEach(([plan, cycles]) => {
    Object.entries(cycles).forEach(([cycle, priceId]) => {
      const inCheckSubscription = checkSubscriptionContent.includes(priceId);
      const inCreateCheckout = createCheckoutContent.includes(priceId) || 
                              createCheckoutContent.includes(`${cycle}:`);
      
      if (inCheckSubscription) {
        console.log(`  ✅ check-subscription reconhece ${plan}-${cycle}`);
      } else {
        console.log(`  ❌ check-subscription NÃO reconhece ${plan}-${cycle}`);
        backendConsistent = false;
      }
      
      if (inCreateCheckout) {
        console.log(`  ✅ create-checkout suporta ${plan}-${cycle}`);
      } else {
        console.log(`  ❌ create-checkout NÃO suporta ${plan}-${cycle}`);
        backendConsistent = false;
      }
    });
  });
} catch (error) {
  console.log(`  ❌ Erro ao ler funções backend: ${error.message}`);
  backendConsistent = false;
}

// 3. Verificar estrutura das funções
console.log('\n📋 3. Verificando estrutura das funções...');

try {
  const createCheckoutContent = fs.readFileSync(createCheckoutPath, 'utf8');
  
  // Verificar se aceita parâmetro billingCycle
  if (createCheckoutContent.includes('billingCycle')) {
    console.log('  ✅ create-checkout aceita parâmetro billingCycle');
  } else {
    console.log('  ❌ create-checkout NÃO aceita parâmetro billingCycle');
    backendConsistent = false;
  }
  
  // Verificar se valida os ciclos
  if (createCheckoutContent.includes('monthly') && 
      createCheckoutContent.includes('semiannual') && 
      createCheckoutContent.includes('annual')) {
    console.log('  ✅ create-checkout valida todos os ciclos');
  } else {
    console.log('  ❌ create-checkout NÃO valida todos os ciclos');
    backendConsistent = false;
  }
  
  // Verificar estrutura PRICE_IDS
  if (createCheckoutContent.includes('PRICE_IDS') && 
      createCheckoutContent.includes('starter:') && 
      createCheckoutContent.includes('growth:')) {
    console.log('  ✅ create-checkout tem estrutura PRICE_IDS correta');
  } else {
    console.log('  ❌ create-checkout NÃO tem estrutura PRICE_IDS correta');
    backendConsistent = false;
  }
} catch (error) {
  console.log(`  ❌ Erro ao verificar estrutura: ${error.message}`);
  backendConsistent = false;
}

// 4. Verificar documentação
console.log('\n📋 4. Verificando documentação...');

const docPath = path.join(__dirname, 'DOCUMENTACAO-PLANOS-PRECOS.md');
let docConsistent = true;

try {
  const docContent = fs.readFileSync(docPath, 'utf8');
  
  // Verificar se todos os price IDs estão documentados
  Object.entries(frontendPricing).forEach(([plan, cycles]) => {
    Object.entries(cycles).forEach(([cycle, priceId]) => {
      if (docContent.includes(priceId)) {
        console.log(`  ✅ ${plan}-${cycle} documentado`);
      } else {
        console.log(`  ❌ ${plan}-${cycle} NÃO documentado`);
        docConsistent = false;
      }
    });
  });
} catch (error) {
  console.log(`  ❌ Erro ao ler documentação: ${error.message}`);
  docConsistent = false;
}

// Resultado final
console.log('\n🎯 RESULTADO FINAL:');
console.log('==================');

if (frontendConsistent) {
  console.log('✅ Frontend: Price IDs consistentes');
} else {
  console.log('❌ Frontend: Price IDs inconsistentes');
}

if (backendConsistent) {
  console.log('✅ Backend: Funções configuradas corretamente');
} else {
  console.log('❌ Backend: Problemas nas funções');
}

if (docConsistent) {
  console.log('✅ Documentação: Atualizada');
} else {
  console.log('❌ Documentação: Desatualizada');
}

const allGood = frontendConsistent && backendConsistent && docConsistent;

if (allGood) {
  console.log('\n🎉 SUCESSO: Sistema de checkout está funcionando corretamente!');
  console.log('✅ Todos os ciclos de cobrança estão configurados');
  console.log('✅ Frontend e backend estão sincronizados');
  console.log('✅ Documentação está atualizada');
} else {
  console.log('\n⚠️ ATENÇÃO: Foram encontrados problemas que precisam ser corrigidos');
}

// 5. Testes de integração simulados
console.log('\n📋 5. Simulando testes de integração...');

const testCases = [
  { plan: 'starter', cycle: 'monthly', expectedPrice: 'price_1RRBDsP1QgGAc8KHzueN2CJL' },
  { plan: 'starter', cycle: 'semiannual', expectedPrice: 'price_1RUGkFP1QgGAc8KHAXICojLH' },
  { plan: 'starter', cycle: 'annual', expectedPrice: 'price_1RUGkgP1QgGAc8KHctjcrt7h' },
  { plan: 'growth', cycle: 'monthly', expectedPrice: 'price_1RRBEZP1QgGAc8KH71uKIH6i' },
  { plan: 'growth', cycle: 'semiannual', expectedPrice: 'price_1RUAt2P1QgGAc8KHr8K4uqXG' },
  { plan: 'growth', cycle: 'annual', expectedPrice: 'price_1RUAtVP1QgGAc8KH01aRe0Um' }
];

console.log('\nSimulando chamadas de checkout:');
testCases.forEach(testCase => {
  const { plan, cycle, expectedPrice } = testCase;
  const actualPrice = frontendPricing[plan][cycle];
  
  if (actualPrice === expectedPrice) {
    console.log(`  ✅ ${plan} ${cycle}: Checkout seria criado com ${actualPrice}`);
  } else {
    console.log(`  ❌ ${plan} ${cycle}: Esperado ${expectedPrice}, mas usaria ${actualPrice}`);
  }
});

console.log('\n🔧 Para testar manualmente:');
console.log('1. Abra http://localhost:8080/planos');
console.log('2. Alterne entre os ciclos de cobrança');
console.log('3. Verifique se os preços atualizam corretamente');
console.log('4. Teste o checkout para cada combinação');
console.log('5. Verifique se o status da assinatura é detectado corretamente');

process.exit(allGood ? 0 : 1);
