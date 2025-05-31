import { useUsageStats } from "@/hooks/useUsageStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { testSupabaseRLS, insertTestData, TestResult } from '@/utils/testSupabaseRLS';
import { resolveRLSAccess, createTestDataMultiUser, RLSSolution } from '@/utils/resolveRLS';
import { useState } from 'react';

export function DebugPanel() {
  const { data, totalMessages, isLoading, error, refetch } = useUsageStats();
  const [rlsResults, setRlsResults] = useState<TestResult[]>([]);
  const [rlsSolutions, setRlsSolutions] = useState<RLSSolution[]>([]);
  const [isTestingRLS, setIsTestingRLS] = useState(false);
  const [isResolvingRLS, setIsResolvingRLS] = useState(false);

  const resolveRLS = async () => {
    setIsResolvingRLS(true);
    try {
      console.log('🔧 Iniciando resolução automática de RLS...');
      const solutions = await resolveRLSAccess();
      setRlsSolutions(solutions);
      console.log('✅ Soluções de RLS encontradas:', solutions);
      
      // Se alguma solução funcionou, tentar recarregar os dados
      const successfulSolutions = solutions.filter(s => s.success);
      if (successfulSolutions.length > 0) {
        console.log('🔄 Recarregando dados após resolução...');
        setTimeout(() => refetch(), 1000);
      }
    } catch (err) {
      console.error('❌ Erro na resolução de RLS:', err);
    } finally {
      setIsResolvingRLS(false);
    }
  };

  const createMultiUserData = async () => {
    try {
      console.log('👥 Criando dados para múltiplos usuários...');
      const result = await createTestDataMultiUser();
      console.log('✅ Resultado da criação multi-usuário:', result);
      
      if (result.success) {
        setTimeout(() => refetch(), 1000);
      }
    } catch (err) {
      console.error('❌ Erro na criação multi-usuário:', err);
    }
  };

  const testRLSMethods = async () => {
    setIsTestingRLS(true);
    try {
      console.log('🔍 Testando diferentes métodos de acesso ao RLS...');
      const results = await testSupabaseRLS();
      setRlsResults(results);
      console.log('✅ Resultados dos testes RLS:', results);
    } catch (err) {
      console.error('❌ Erro nos testes RLS:', err);
    } finally {
      setIsTestingRLS(false);
    }
  };

  const testConnection = async () => {
    try {
      console.log('🔍 Testando conexão...');
      const { data: testData, error: testError } = await supabase
        .from('usage_stats')
        .select('*')
        .limit(5);
      
      console.log('✅ Teste de conexão:', { testData, testError });
    } catch (err) {
      console.error('❌ Erro no teste:', err);
    }
  };

  const insertTestDataHandler = async () => {
    try {
      console.log('📝 Inserindo dados de teste...');
      
      // Tentar diferentes usuários para ver qual funciona
      const testUsers = [
        '123e4567-e89b-12d3-a456-426614174000', // UUID mock
        await getCurrentUserId(), // Usuário atual (se existir)
      ].filter(Boolean);

      for (const userId of testUsers) {
        const result = await insertTestData(userId);
        console.log(`Resultado para usuário ${userId}:`, result);
        
        if (result.success) {
          console.log('✅ Inserção bem-sucedida! Atualizando dados...');
          refetch(); // Usar refetch em vez de reload
          break;
        }
      }
    } catch (err) {
      console.error('❌ Erro na inserção:', err);
    }
  };

  const getCurrentUserId = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.user?.id || null;
    } catch {
      return null;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mt-4">
      <CardHeader>
        <CardTitle>🔧 Debug Panel - Dados do Supabase</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Button onClick={testConnection} variant="outline">
            Testar Conexão
          </Button>
          <Button onClick={insertTestDataHandler} variant="outline">
            Inserir Dados Teste
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <Button 
            onClick={testRLSMethods} 
            variant="outline"
            disabled={isTestingRLS}
          >
            {isTestingRLS ? 'Testando RLS...' : 'Testar RLS'}
          </Button>
          <Button 
            onClick={resolveRLS} 
            variant="secondary"
            disabled={isResolvingRLS}
          >
            {isResolvingRLS ? 'Resolvendo...' : '🔧 Resolver RLS'}
          </Button>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          <Button 
            onClick={createMultiUserData} 
            variant="outline"
            className="w-full"
          >
            👥 Criar Dados Multi-usuário
          </Button>
        </div>
        
        <div className="space-y-2">
          <h3 className="font-semibold">Status do Hook useUsageStats:</h3>
          <div className="text-sm space-y-1">
            <div>🔄 Carregando: {isLoading ? 'Sim' : 'Não'}</div>
            <div>❌ Erro: {error || 'Nenhum'}</div>
            <div>📊 Total de Mensagens: {totalMessages}</div>
            <div>📈 Dados do Gráfico: {data ? data.length : 0} pontos</div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              Erro: {error}
            </AlertDescription>
          </Alert>
        )}

        {data && data.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Dados Carregados:</h4>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}

        {!isLoading && !error && (!data || data.length === 0) && (
          <Alert>
            <AlertDescription>
              Nenhum dado encontrado. Clique em "Inserir Dados Teste" para criar dados de exemplo.
            </AlertDescription>
          </Alert>
        )}

        {rlsSolutions.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">🔧 Soluções de RLS Testadas:</h4>
            <div className="space-y-2">
              {rlsSolutions.map((solution, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded border ${
                    solution.success ? 'bg-blue-50 border-blue-200' : 'bg-yellow-50 border-yellow-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{solution.method}</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      solution.success ? 'bg-blue-200 text-blue-800' : 'bg-yellow-200 text-yellow-800'
                    }`}>
                      {solution.success ? '✅ Funcionou' : '⚠️ Limitado'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{solution.description}</p>
                  {solution.error && (
                    <p className="text-sm text-orange-600 mt-1">Observação: {solution.error}</p>
                  )}
                  {solution.data && (
                    <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto max-h-20">
                      {JSON.stringify(solution.data, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-sm text-green-700">
                💡 <strong>Próximos passos:</strong> Se alguma solução funcionou, os dados devem carregar automaticamente. 
                Se nenhuma funcionou, considere verificar as políticas RLS no Supabase.
              </p>
            </div>
          </div>
        )}

        {rlsResults.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">🔒 Resultados dos Testes RLS:</h4>
            <div className="space-y-2">
              {rlsResults.map((result, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded border ${
                    result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{result.method}</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      result.success ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                    }`}>
                      {result.success ? '✅ Sucesso' : '❌ Falhou'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{result.description}</p>
                  {result.error && (
                    <p className="text-sm text-red-600 mt-1">Erro: {result.error}</p>
                  )}
                  {result.data && (
                    <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto max-h-20">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
