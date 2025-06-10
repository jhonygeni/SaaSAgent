// Validação Final - Dashboard Contatos
// Este script verifica se todas as mudanças foram aplicadas corretamente

const fs = require('fs');
const path = require('path');

console.log('🔍 VALIDAÇÃO FINAL - DASHBOARD CONTATOS');
console.log('='.repeat(60));

function checkFile(filePath, description) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    console.log(`✅ ${description}: ${filePath}`);
    return content;
  } catch (error) {
    console.log(`❌ ${description}: ARQUIVO NÃO ENCONTRADO - ${filePath}`);
    return null;
  }
}

function validateUseContacts() {
  console.log('\n📋 1. Validando Hook useContacts.ts...');
  
  const hookPath = path.join(__dirname, 'src/hooks/useContacts.ts');
  const content = checkFile(hookPath, 'Hook useContacts');
  
  if (content) {
    const checks = [
      { pattern: /resume.*supabaseContact\.resume/, description: 'Campo resume mapeado corretamente' },
      { pattern: /status.*supabaseContact\.status/, description: 'Campo status mapeado corretamente' },
      { pattern: /valor_da_compra.*supabaseContact\.valor_da_compra/, description: 'Campo valor_da_compra mapeado corretamente' },
      { pattern: /from\('contacts'\)/, description: 'Busca na tabela contacts' },
      { pattern: /eq\('user_id'/, description: 'Filtro por user_id' }
    ];
    
    checks.forEach(check => {
      if (check.pattern.test(content)) {
        console.log(`  ✅ ${check.description}`);
      } else {
        console.log(`  ❌ ${check.description} - NÃO ENCONTRADO`);
      }
    });
  }
}

function validateInterestedClients() {
  console.log('\n📋 2. Validando Componente InterestedClients.tsx...');
  
  const componentPath = path.join(__dirname, 'src/components/InterestedClients.tsx');
  const content = checkFile(componentPath, 'Componente InterestedClients');
  
  if (content) {
    const checks = [
      { pattern: /useContacts/, description: 'Hook useContacts importado e usado' },
      { pattern: /resume.*currentClient\.summary/, description: 'Campo resume no handleSaveClient' },
      { pattern: /status.*currentClient\.status/, description: 'Campo status no handleSaveClient' },
      { pattern: /valor_da_compra.*currentClient\.purchaseAmount/, description: 'Campo valor_da_compra no handleSaveClient' },
      { pattern: /contacts.*isLoading.*error/, description: 'Estados do hook sendo utilizados' },
      { pattern: /!mockInterestedClients|mockInterestedClients.*\/\//, description: 'Dados mock removidos ou comentados' }
    ];
    
    checks.forEach(check => {
      if (check.pattern.test(content)) {
        console.log(`  ✅ ${check.description}`);
      } else {
        console.log(`  ❌ ${check.description} - NÃO ENCONTRADO`);
      }
    });
  }
}

function validateTypescript() {
  console.log('\n📋 3. Validando Types do Supabase...');
  
  const typesPath = path.join(__dirname, 'src/integrations/supabase/types.ts');
  const content = checkFile(typesPath, 'Types do Supabase');
  
  if (content) {
    const hasContactsTable = /contacts.*{/.test(content);
    console.log(`  ${hasContactsTable ? '✅' : '❌'} Tabela contacts definida nos types`);
  }
}

function generateSummary() {
  console.log('\n📋 RESUMO DAS MUDANÇAS IMPLEMENTADAS:');
  console.log('='.repeat(60));
  
  console.log('\n🔧 Arquivos Modificados:');
  console.log('  1. src/hooks/useContacts.ts - Hook para dados reais');
  console.log('  2. src/components/InterestedClients.tsx - Integração com dados reais');
  
  console.log('\n🎯 Mudanças Principais:');
  console.log('  • Removido dados mock do componente');
  console.log('  • Integrado hook useContacts para buscar dados reais');
  console.log('  • Corrigido mapeamento de campos:');
  console.log('    - resume (em vez de custom_fields.summary)');
  console.log('    - status (em vez de custom_fields.status)');
  console.log('    - valor_da_compra (em vez de custom_fields.purchaseAmount)');
  console.log('  • Implementado filtro por user_id');
  console.log('  • Adicionado tratamento de loading e erro');
  
  console.log('\n✅ PRÓXIMOS PASSOS:');
  console.log('  1. Iniciar aplicação: npm run dev');
  console.log('  2. Fazer login no dashboard');
  console.log('  3. Verificar se contatos reais aparecem');
  console.log('  4. Testar edição e salvamento');
  
  console.log('\n⚠️  TROUBLESHOOTING:');
  console.log('  • Se não aparecerem contatos: verificar dados na tabela contacts');
  console.log('  • Se der erro de permissão: verificar RLS policies no Supabase');
  console.log('  • Se campos não salvarem: verificar se colunas existem na tabela');
}

// Executar validações
validateUseContacts();
validateInterestedClients();
validateTypescript();
generateSummary();

console.log('\n🎉 VALIDAÇÃO CONCLUÍDA!');
console.log('='.repeat(60));
