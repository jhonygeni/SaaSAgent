// Arquivo de diagnóstico para testar conexão com Supabase
import { supabase } from '@/integrations/supabase/client';
import React, { useState, useEffect } from 'react';

async function diagnosticoSupabase() {
  console.log("🔍 Iniciando diagnóstico do Supabase... v4"); // Alterado para v4 e aspas duplas
  
  try {
    console.log("URL do Supabase:", import.meta.env.VITE_SUPABASE_URL);
    console.log("ANON_KEY definida:", !!import.meta.env.VITE_SUPABASE_ANON_KEY);
    
    // Teste de ping/health usando uma tabela existente
    console.log(">>> DIAGNOSTICO v4: Preparando para consultar supabase.from('profiles').select('id').limit(1)"); // Log específico
    const { data: pingData, error: pingError } = await supabase
      .from('profiles') 
      .select('id')
      .limit(1)
      .maybeSingle();
    
    if (pingError) {
      console.error("❌ Erro de conexão (tentativa em 'profiles'):", pingError.message); 
      console.error("❌ Detalhes do erro (tentativa em 'profiles'):", pingError);
      // Não retorne false ainda, vamos tentar a próxima tabela para ver se o problema é específico da tabela
    } else {
      console.log("✅ Comunicação com Supabase (tabela 'profiles') estabelecida!");
    }
    
    // Teste de autenticação anônima
    console.log("Testando autenticação anônima...");
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('❌ Erro de autenticação:', authError.message);
    } else {
      console.log('✅ API de autenticação funcionando!');
      console.log('   Sessão:', authData.session ? 'Existe' : 'Não existe');
    }
    
    // Teste de acesso a instâncias WhatsApp
    console.log("Testando acesso à tabela de instâncias WhatsApp...");
    const { data: instancesData, error: instancesError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .limit(3);
    
    if (instancesError) {
      console.error("❌ Erro ao acessar tabela whatsapp_instances:", instancesError.message);
      // Se o pingError também ocorreu, então é uma falha geral
      if (pingError) return false; 
    } else {
      console.log("✅ Acesso à tabela whatsapp_instances OK!");
      console.log(`   ${instancesData?.length || 0} instâncias encontradas`); // Adicionado fallback para length
    }
    
    // Se chegou aqui e pingError não existe, ou instancesError não existe, consideramos sucesso parcial ou total
    if (!pingError || !instancesError) {
        return true;
    }
    return false; // Falha se ambos os erros ocorrerem

  } catch (error) {
    console.error('❌ Erro crítico no diagnóstico:', error);
    return false;
  }
}

export async function runDiagnostico() {
  const startTime = performance.now();
  const success = await diagnosticoSupabase();
  const endTime = performance.now();
  
  console.log(`🕒 Diagnóstico concluído em ${(endTime - startTime).toFixed(2)}ms`);
  console.log(`📊 Resultado: ${success ? '✅ SUCESSO' : '❌ FALHA'}`);
  
  return success;
}

export default function DiagnosticoSupabase() {
  const [success, setSuccess] = useState<boolean | null>(null);
  const [error, setError] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const executeDiagnostico = async () => {
      try {
        setLoading(true);
        const result = await runDiagnostico();
        setSuccess(result);
      } catch (e) {
        console.error("Erro ao executar diagnóstico no componente:", e);
        setError(e);
        setSuccess(false);
      } finally {
        setLoading(false);
      }
    };
    executeDiagnostico();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>🔍 Executando Diagnóstico de Conexão Supabase...</h1>
        <p>Aguarde...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', border: '2px solid #f44336', borderRadius: '8px', margin: '20px auto', maxWidth: '800px' }}>
        <h1>❌ Erro no Diagnóstico</h1>
        <p>Ocorreu um erro ao tentar executar o diagnóstico:</p>
        <pre>{String(error)}</pre>
      </div>
    );
  }
  
  // success não será null aqui devido ao setLoading
  const isSuccess = success === true;

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '800px',
      margin: '20px auto',
      border: `2px solid ${isSuccess ? '#4caf50' : '#f44336'}`,
      borderRadius: '8px'
    }}>
      <h1>Diagnóstico de Conexão Supabase</h1>
      <p>Status: {isSuccess ? '✅ CONECTADO' : '❌ ERRO DE CONEXÃO'}</p>
      <p>Confira os detalhes no console do navegador (F12)</p>
      
      <div style={{marginTop: '20px'}}>
        <h2>Próximos Passos:</h2>
        {isSuccess ? (
          <ul>
            <li>Verificar se o UserProvider está inicializando corretamente</li>
            <li>Verificar se as tabelas necessárias existem no Supabase</li>
            <li>Testar a conexão com o WhatsApp</li>
          </ul>
        ) : (
          <ul>
            <li>Verificar se as variáveis de ambiente estão corretas</li>
            <li>Verificar se o Supabase está online</li>
            <li>Verificar se o IP não está bloqueado</li>
          </ul>
        )}
      </div>
      
      <div style={{marginTop: '20px', fontSize: '0.8em', color: '#666'}}>
        <p>URL: {import.meta.env.VITE_SUPABASE_URL}</p>
        <p>ANON_KEY: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '[DEFINIDA]' : '[NÃO DEFINIDA]'}</p>
      </div>
    </div>
  );
}
