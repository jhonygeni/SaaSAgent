import { supabase } from '../integrations/supabase/client';

export interface PersistenceTestResult {
  success: boolean;
  timestamp: string;
  testType: string;
  userId?: string;
  results: {
    allInstances?: {
      count: number;
      data: any[];
      error?: any;
    };
    userInstances?: {
      count: number;
      data: any[];
      error?: any;
    };
    createTest?: {
      success: boolean;
      data?: any;
      error?: any;
    };
    upsertTest?: {
      insert: {
        success: boolean;
        data?: any;
        error?: any;
      };
      update: {
        success: boolean;
        data?: any;
        error?: any;
      };
    };
  };
  error?: string;
}

export async function runPersistenceTest(
  testType: string = 'read',
  userId?: string
): Promise<PersistenceTestResult> {
  try {
    const results: any = {};

    // 1. Verificar se conseguimos ler instâncias
    if (testType === 'read' || testType === 'all') {
      console.log('🔍 Testando leitura de instâncias...');
      
      // Listar todas as instâncias
      const { data: allInstances, error: allError } = await supabase
        .from('whatsapp_instances')
        .select('*');
      
      results.allInstances = {
        count: allInstances?.length || 0,
        data: allInstances || [],
        error: allError
      };

      // Se userId fornecido, filtrar por usuário
      if (userId) {
        const { data: userInstances, error: userError } = await supabase
          .from('whatsapp_instances')
          .select('*')
          .eq('user_id', userId);
        
        results.userInstances = {
          count: userInstances?.length || 0,
          data: userInstances || [],
          error: userError
        };
      }
    }

    // 2. Testar inserção de nova instância
    if (testType === 'create' || testType === 'all') {
      console.log('✏️ Testando criação de instância...');
      
      if (!userId) {
        results.createTest = {
          success: false,
          error: 'userId é obrigatório para teste de criação'
        };
      } else {
        const testInstanceName = `test_instance_${Date.now()}`;
        
        const { data: createData, error: createError } = await supabase
          .from('whatsapp_instances')
          .insert({
            user_id: userId,
            name: testInstanceName,
            status: 'testing',
            evolution_instance_id: `test_${Date.now()}`,
            session_data: {
              test: true,
              created_at: new Date().toISOString()
            }
          })
          .select()
          .single();

        results.createTest = {
          success: !createError,
          data: createData,
          error: createError
        };

        // Limpar instância de teste
        if (createData?.id) {
          await supabase
            .from('whatsapp_instances')
            .delete()
            .eq('id', createData.id);
        }
      }
    }

    // 3. Testar upsert (atualizar/inserir)
    if (testType === 'upsert' || testType === 'all') {
      console.log('🔄 Testando upsert de instância...');
      
      if (!userId) {
        results.upsertTest = {
          insert: {
            success: false,
            error: 'userId é obrigatório para teste de upsert'
          },
          update: {
            success: false,
            error: 'userId é obrigatório para teste de upsert'
          }
        };
      } else {
        const testInstanceName = `upsert_test_${Date.now()}`;
        
        // Primeiro upsert (inserção)
        const { data: upsertData1, error: upsertError1 } = await supabase
          .from('whatsapp_instances')
          .upsert({
            user_id: userId,
            name: testInstanceName,
            status: 'pending',
            evolution_instance_id: `upsert_${Date.now()}`,
            session_data: { phase: 'insert' }
          })
          .select();

        // Segundo upsert (atualização baseada no user_id e name)
        const { data: upsertData2, error: upsertError2 } = await supabase
          .from('whatsapp_instances')
          .update({
            status: 'connected',
            session_data: { phase: 'update' }
          })
          .eq('user_id', userId)
          .eq('name', testInstanceName)
          .select();

        results.upsertTest = {
          insert: {
            success: !upsertError1,
            data: upsertData1,
            error: upsertError1
          },
          update: {
            success: !upsertError2,
            data: upsertData2,
            error: upsertError2
          }
        };

        // Limpar instância de teste
        if (upsertData1?.[0]?.id) {
          await supabase
            .from('whatsapp_instances')
            .delete()
            .eq('name', testInstanceName);
        }
      }
    }

    return {
      success: true,
      timestamp: new Date().toISOString(),
      testType,
      userId,
      results
    };

  } catch (error) {
    console.error('❌ Erro no teste de persistência:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString(),
      testType,
      userId,
      results: {}
    };
  }
}

export async function simulateInstanceCreation(userId: string, instanceData: any) {
  try {
    console.log('🎭 Simulando criação de instância real...');
    
    if (!userId || !instanceData) {
      throw new Error('userId e instanceData são obrigatórios');
    }

    // Simular o fluxo real de criação
    const { data: creationData, error: creationError } = await supabase
      .from('whatsapp_instances')
      .upsert({
        user_id: userId,
        name: instanceData.name,
        status: instanceData.status || 'pending',
        evolution_instance_id: instanceData.evolution_instance_id,
        session_data: instanceData.session_data,
        phone_number: instanceData.phone_number,
        qr_code: instanceData.qr_code
      })
      .select()
      .single();

    return {
      success: !creationError,
      data: creationData,
      error: creationError,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Erro na simulação:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    };
  }
}
