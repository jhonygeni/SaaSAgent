#!/usr/bin/env node

/**
 * Script para aplicar políticas RLS via Supabase SDK
 * Execute: node scripts/apply-rls-policies.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuração do Supabase - substitua pelas suas credenciais
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project-ref.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'your-service-role-key-here';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || SUPABASE_URL.includes('your-project') || SUPABASE_SERVICE_KEY.includes('your-service')) {
  console.error('❌ ERRO: Configure as variáveis SUPABASE_URL e SUPABASE_SERVICE_KEY');
  console.error('Exemplo:');
  console.error('SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_KEY=eyJ... node scripts/apply-rls-policies.js');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function applyRLSPolicies() {
  console.log('🔒 Aplicando políticas RLS...');
  
  try {
    // Ler o arquivo SQL
    const sqlFilePath = path.join(__dirname, 'implement-rls-policies.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Dividir o SQL em comandos individuais
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd && !cmd.startsWith('--') && !cmd.startsWith('/*'));
    
    console.log(`📝 Executando ${commands.length} comandos SQL...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (!command) continue;
      
      try {
        console.log(`⏳ [${i + 1}/${commands.length}] Executando comando...`);
        
        const { error } = await supabase.rpc('execute_sql', {
          sql_query: command + ';'
        });
        
        if (error) {
          console.warn(`⚠️  Aviso no comando ${i + 1}: ${error.message}`);
          errorCount++;
        } else {
          successCount++;
        }
      } catch (err) {
        console.error(`❌ Erro no comando ${i + 1}: ${err.message}`);
        errorCount++;
      }
    }
    
    console.log('');
    console.log('✅ APLICAÇÃO DE POLÍTICAS RLS CONCLUÍDA!');
    console.log(`📊 Comandos executados com sucesso: ${successCount}`);
    console.log(`⚠️  Comandos com avisos/erros: ${errorCount}`);
    console.log('');
    console.log('🔐 Políticas RLS implementadas:');
    console.log('   - profiles: Usuários podem ver/editar apenas seu próprio perfil');
    console.log('   - subscriptions: Usuários podem ver apenas suas próprias assinaturas');
    console.log('   - subscription_plans: Planos ativos visíveis para todos');
    console.log('   - whatsapp_instances: Usuários podem gerenciar apenas suas instâncias');
    console.log('   - agents: Usuários podem gerenciar apenas seus agentes');
    console.log('   - messages: Usuários podem acessar apenas suas mensagens');
    console.log('   - contacts: Usuários podem gerenciar apenas seus contatos');
    console.log('   - payments: Usuários podem ver apenas seus pagamentos');
    console.log('   - usage_stats: Usuários podem ver apenas suas estatísticas');
    
  } catch (error) {
    console.error('❌ ERRO CRÍTICO:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  applyRLSPolicies().catch(console.error);
}

module.exports = { applyRLSPolicies };
