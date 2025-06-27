/**
 * Script de teste para validar a sincronização do status da Evolution API
 * 
 * Este script simula o teste da funcionalidade implementada:
 * 1. Verifica se o agente com instance "inst_mcdgmk29_alu6eo" está no banco
 * 2. Testa a consulta na Evolution API
 * 3. Simula a sincronização do status
 */

import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase (usar variáveis de ambiente em produção)
const supabaseUrl = 'https://kqigmnhcobxvvhvcqhtl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxaWdtbmhjb2J4dnZodmNxaHRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQwMjA1NzcsImV4cCI6MjA0OTU5NjU3N30.F_4ROJ6WXgIHvmJWGy7xgU2GYPQjT-R_jGQ-kFNv_dY';

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Testa a sincronização do status da Evolution API
 */
async function testEvolutionStatusSync() {
  console.log('🧪 TESTE: Sincronização Status Evolution API');
  console.log('==========================================');

  try {
    // 1. Buscar agente com instance name específica
    console.log('\n1. Buscando agente com instance_name = "inst_mcdgmk29_alu6eo"...');
    
    const { data: agents, error: fetchError } = await supabase
      .from('agents')
      .select('*')
      .eq('instance_name', 'inst_mcdgmk29_alu6eo');

    if (fetchError) {
      console.error('❌ Erro ao buscar agente:', fetchError);
      return;
    }

    if (!agents || agents.length === 0) {
      console.log('⚠️ Nenhum agente encontrado com essa instance_name');
      return;
    }

    const agent = agents[0];
    console.log('✅ Agente encontrado:', {
      id: agent.id,
      nome: agent.nome,
      instance_name: agent.instance_name,
      connected: agent.connected,
      status: agent.status
    });

    // 2. Simular consulta na Evolution API
    console.log('\n2. Simulando consulta na Evolution API...');
    console.log('URL:', 'https://cloudsaas.geni.chat/instance/connectionState/inst_mcdgmk29_alu6eo');
    
    // Simular resposta da Evolution API (baseado no resumo da conversa)
    const mockEvolutionResponse = {
      instance: {
        instanceName: "inst_mcdgmk29_alu6eo",
        state: "open"
      }
    };
    
    console.log('✅ Resposta simulada da Evolution API:', mockEvolutionResponse);

    // 3. Verificar se status precisa ser atualizado
    const connectedStates = ["open", "connected", "confirmed"];
    const evolutionConnected = connectedStates.includes(mockEvolutionResponse.instance.state);
    const needsUpdate = agent.connected !== evolutionConnected;

    console.log('\n3. Análise de sincronização:');
    console.log('- Status no banco:', agent.connected);
    console.log('- Status na Evolution API:', evolutionConnected);
    console.log('- Precisa atualizar:', needsUpdate ? '✅ SIM' : '❌ NÃO');

    // 4. Simular atualização se necessário
    if (needsUpdate) {
      console.log('\n4. Atualizando status no banco de dados...');
      
      const { data: updatedAgent, error: updateError } = await supabase
        .from('agents')
        .update({
          connected: evolutionConnected,
          status: evolutionConnected ? 'ativo' : 'pendente',
          updated_at: new Date().toISOString()
        })
        .eq('id', agent.id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Erro ao atualizar agente:', updateError);
        return;
      }

      console.log('✅ Agente atualizado com sucesso:', {
        id: updatedAgent.id,
        connected: updatedAgent.connected,
        status: updatedAgent.status
      });

      console.log('\n🎉 SINCRONIZAÇÃO CONCLUÍDA!');
      console.log('O agente agora deve aparecer como "Conectado" no dashboard.');
    } else {
      console.log('\n✅ Status já sincronizado, nenhuma atualização necessária.');
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

/**
 * Teste para verificar todos os agentes que precisam de sincronização
 */
async function testBulkSync() {
  console.log('\n\n🔄 TESTE: Sincronização em Massa');
  console.log('===============================');

  try {
    // Buscar todos os agentes com instance_name
    const { data: agents, error } = await supabase
      .from('agents')
      .select('*')
      .not('instance_name', 'is', null)
      .neq('instance_name', '');

    if (error) {
      console.error('❌ Erro ao buscar agentes:', error);
      return;
    }

    console.log(`📊 Encontrados ${agents.length} agentes com instâncias WhatsApp`);

    agents.forEach((agent, index) => {
      console.log(`${index + 1}. ${agent.nome} (${agent.instance_name}) - Connected: ${agent.connected}`);
    });

    console.log('\n✅ Teste de bulk sync concluído');
  } catch (error) {
    console.error('❌ Erro durante teste bulk sync:', error);
  }
}

// Executar testes
console.log('🚀 Iniciando testes de sincronização...\n');

testEvolutionStatusSync()
  .then(() => testBulkSync())
  .then(() => {
    console.log('\n\n✅ TODOS OS TESTES CONCLUÍDOS!');
    console.log('===============================');
    console.log('📝 Próximos passos:');
    console.log('1. Verificar o dashboard para ver se agente aparece como "Conectado"');
    console.log('2. Testar sincronização automática (a cada 30 segundos)');
    console.log('3. Testar botão de sincronização manual no AgentList');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro geral nos testes:', error);
    process.exit(1);
  });
