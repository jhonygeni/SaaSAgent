// Utilitário para resolver problemas de RLS automaticamente
import { supabase } from '@/integrations/supabase/client';

export interface RLSSolution {
  method: string;
  success: boolean;
  description: string;
  data?: any;
  error?: string;
}

export async function resolveRLSAccess(): Promise<RLSSolution[]> {
  const solutions: RLSSolution[] = [];

  console.log('🔧 Iniciando resolução automática de RLS...');

  // Solução 1: Tentar login anônimo
  try {
    console.log('🔑 Tentando login anônimo...');
    
    // Primeiro, verificar se já existe uma sessão
    const { data: { session: existingSession } } = await supabase.auth.getSession();
    
    if (existingSession) {
      solutions.push({
        method: 'Sessão Existente',
        success: true,
        description: 'Já existe uma sessão de autenticação ativa',
        data: { userId: existingSession.user.id, email: existingSession.user.email }
      });
    } else {
      // Tentar login anônimo
      const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
      
      if (!anonError && anonData.user) {
        solutions.push({
          method: 'Login Anônimo',
          success: true,
          description: 'Login anônimo realizado com sucesso',
          data: { userId: anonData.user.id }
        });
      } else {
        solutions.push({
          method: 'Login Anônimo',
          success: false,
          description: 'Login anônimo não disponível ou falhou',
          error: anonError?.message
        });
      }
    }
  } catch (err) {
    solutions.push({
      method: 'Login Anônimo',
      success: false,
      description: 'Erro ao tentar login anônimo',
      error: err instanceof Error ? err.message : 'Erro desconhecido'
    });
  }

  // Solução 2: Tentar inserir dados de teste para verificar políticas
  try {
    console.log('📝 Testando inserção de dados...');
    
    const testUserId = '123e4567-e89b-12d3-a456-426614174000';
    const testRecord = {
      user_id: testUserId,
      date: new Date().toISOString().split('T')[0],
      messages_sent: 10,
      messages_received: 8,
      active_sessions: 1,
      new_contacts: 0
    };

    const { data: insertData, error: insertError } = await supabase
      .from('usage_stats')
      .insert([testRecord])
      .select();

    if (!insertError) {
      solutions.push({
        method: 'Inserção de Teste',
        success: true,
        description: 'Conseguiu inserir dados de teste - RLS permite inserção',
        data: insertData
      });
    } else {
      solutions.push({
        method: 'Inserção de Teste',
        success: false,
        description: 'Falha na inserção - RLS bloqueia inserção',
        error: insertError.message
      });
    }
  } catch (err) {
    solutions.push({
      method: 'Inserção de Teste',
      success: false,
      description: 'Erro na inserção de teste',
      error: err instanceof Error ? err.message : 'Erro desconhecido'
    });
  }

  // Solução 3: Tentar diferentes estratégias de leitura
  const readStrategies = [
    {
      name: 'Leitura Direta',
      query: () => supabase.from('usage_stats').select('*').limit(5)
    },
    {
      name: 'Leitura por UUID',
      query: () => supabase.from('usage_stats').select('*').eq('user_id', '123e4567-e89b-12d3-a456-426614174000').limit(5)
    },
    {
      name: 'Leitura por Data',
      query: () => supabase.from('usage_stats').select('*').gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]).limit(5)
    }
  ];

  for (const strategy of readStrategies) {
    try {
      console.log(`📖 Testando ${strategy.name}...`);
      const { data, error } = await strategy.query();
      
      solutions.push({
        method: strategy.name,
        success: !error,
        description: `${strategy.name}: ${error ? 'Falhou' : `Sucesso - ${data?.length || 0} registros`}`,
        data: data?.length ? { count: data.length, sample: data[0] } : null,
        error: error?.message
      });
    } catch (err) {
      solutions.push({
        method: strategy.name,
        success: false,
        description: `Erro na ${strategy.name}`,
        error: err instanceof Error ? err.message : 'Erro desconhecido'
      });
    }
  }

  console.log('✅ Resolução de RLS concluída:', solutions);
  return solutions;
}

// Função para criar dados de teste com diferentes usuários
export async function createTestDataMultiUser(): Promise<RLSSolution> {
  try {
    console.log('👥 Criando dados de teste para múltiplos usuários...');
    
    const testUsers = [
      '123e4567-e89b-12d3-a456-426614174000', // UUID mock
      '987fcdeb-51d3-12b4-a456-426614174001', // UUID mock 2
    ];

    // Verificar se há usuário autenticado
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      testUsers.push(session.user.id);
    }

    const allTestData = [];
    const today = new Date();

    for (const userId of testUsers) {
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        
        allTestData.push({
          user_id: userId,
          date: date.toISOString().split('T')[0],
          messages_sent: Math.floor(Math.random() * 40) + 10,
          messages_received: Math.floor(Math.random() * 35) + 5,
          active_sessions: Math.floor(Math.random() * 5) + 1,
          new_contacts: Math.floor(Math.random() * 3)
        });
      }
    }

    // Limpar dados antigos primeiro
    for (const userId of testUsers) {
      await supabase.from('usage_stats').delete().eq('user_id', userId);
    }

    // Inserir novos dados
    const { data, error } = await supabase
      .from('usage_stats')
      .insert(allTestData)
      .select();

    if (error) {
      return {
        method: 'Criação Multi-usuário',
        success: false,
        description: 'Falha ao criar dados de teste para múltiplos usuários',
        error: error.message
      };
    }

    return {
      method: 'Criação Multi-usuário',
      success: true,
      description: `Dados criados para ${testUsers.length} usuários (${allTestData.length} registros)`,
      data: { users: testUsers.length, records: allTestData.length, inserted: data?.length }
    };

  } catch (err) {
    return {
      method: 'Criação Multi-usuário',
      success: false,
      description: 'Erro ao criar dados multi-usuário',
      error: err instanceof Error ? err.message : 'Erro desconhecido'
    };
  }
}
