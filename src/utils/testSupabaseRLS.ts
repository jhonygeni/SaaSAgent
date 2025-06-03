// Utilitário para testar e resolver problemas de RLS no Supabase
import { supabase } from '@/integrations/supabase/client';

export interface TestResult {
  method: string;
  success: boolean;
  data?: any;
  error?: string;
  description: string;
}

export async function testSupabaseRLS(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // 1. Testar acesso direto à tabela usage_stats
  try {
    const { data, error } = await supabase
      .from('usage_stats')
      .select('*')
      .limit(5);

    results.push({
      method: 'Direct Access',
      success: !error,
      data: data,
      error: error?.message,
      description: 'Tentativa de acesso direto à tabela usage_stats'
    });
  } catch (err) {
    results.push({
      method: 'Direct Access',
      success: false,
      error: err instanceof Error ? err.message : 'Erro desconhecido',
      description: 'Tentativa de acesso direto à tabela usage_stats'
    });
  }

  // 2. Testar com user mock
  try {
    const { data, error } = await supabase
      .from('usage_stats')
      .select('*')
      .eq('user_id', '123e4567-e89b-12d3-a456-426614174000')
      .limit(5);

    results.push({
      method: 'Mock User ID',
      success: !error,
      data: data,
      error: error?.message,
      description: 'Acesso com UUID mock de usuário'
    });
  } catch (err) {
    results.push({
      method: 'Mock User ID',
      success: false,
      error: err instanceof Error ? err.message : 'Erro desconhecido',
      description: 'Acesso com UUID mock de usuário'
    });
  }

  // 3. Testar se conseguimos ver a sessão atual
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    results.push({
      method: 'Auth Session',
      success: !error,
      data: { session: session ? 'Existe' : 'Não existe', user: session?.user?.id },
      error: error?.message,
      description: 'Verificar se existe sessão de autenticação ativa'
    });
  } catch (err) {
    results.push({
      method: 'Auth Session',
      success: false,
      error: err instanceof Error ? err.message : 'Erro desconhecido',
      description: 'Verificar se existe sessão de autenticação ativa'
    });
  }

  // 4. Testar se conseguimos fazer login anônimo (se habilitado)
  try {
    const { data, error } = await supabase.auth.signInAnonymously();
    
    if (!error && data.user) {
      results.push({
        method: 'Anonymous Auth',
        success: true,
        data: { user_id: data.user.id },
        description: 'Login anônimo bem-sucedido'
      });

      // Tentar acessar a tabela com usuário anônimo
      const { data: usageData, error: usageError } = await supabase
        .from('usage_stats')
        .select('*')
        .eq('user_id', data.user.id)
        .limit(5);

      results.push({
        method: 'Anonymous Access',
        success: !usageError,
        data: usageData,
        error: usageError?.message,
        description: 'Acesso à tabela com usuário anônimo'
      });
    } else {
      results.push({
        method: 'Anonymous Auth',
        success: false,
        error: error?.message || 'Login anônimo não disponível',
        description: 'Tentativa de login anônimo'
      });
    }
  } catch (err) {
    results.push({
      method: 'Anonymous Auth',
      success: false,
      error: err instanceof Error ? err.message : 'Erro desconhecido',
      description: 'Tentativa de login anônimo'
    });
  }

  return results;
}

// Função para inserir dados de teste se conseguirmos resolver a autenticação
export async function insertTestData(userId: string): Promise<TestResult> {
  try {
    const testData = [];
    const today = new Date();
    
    // Criar dados para os últimos 7 dias
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      testData.push({
        user_id: userId,
        date: date.toISOString().split('T')[0],
        messages_sent: Math.floor(Math.random() * 50) + 10,
        messages_received: Math.floor(Math.random() * 40) + 8,
        active_sessions: Math.floor(Math.random() * 5) + 1,
        new_contacts: Math.floor(Math.random() * 3)
      });
    }

    const { data, error } = await supabase
      .from('usage_stats')
      .insert(testData)
      .select();

    return {
      method: 'Insert Test Data',
      success: !error,
      data: data,
      error: error?.message,
      description: `Inserir dados de teste para usuário ${userId}`
    };
  } catch (err) {
    return {
      method: 'Insert Test Data',
      success: false,
      error: err instanceof Error ? err.message : 'Erro desconhecido',
      description: `Inserir dados de teste para usuário ${userId}`
    };
  }
}
