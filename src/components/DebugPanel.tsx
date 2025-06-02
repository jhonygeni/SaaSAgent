import React from 'react';
import { Button } from './ui/button';
import { enableMockMode, disableMockMode, isMockModeEnabled, simulateMessageIncrement } from '../lib/mock-subscription-data';
import { useUser } from '../context/UserContext';
import { supabase } from '@/integrations/supabase/client';

interface DebugPanelProps {}

function DebugPanel(): React.JSX.Element {
  const { user, checkSubscriptionStatus, updateUser } = useUser();
  const [mockEnabled, setMockEnabled] = React.useState(isMockModeEnabled());
  const [directMessage, setDirectMessage] = React.useState(0);

  const toggleMockMode = async () => {
    if (mockEnabled) {
      disableMockMode();
      setMockEnabled(false);
    } else {
      enableMockMode();
      setMockEnabled(true);
    }
    
    // Força uma nova verificação de assinatura
    await checkSubscriptionStatus();
  };

  const refreshSubscription = async () => {
    console.log("🔄 Forçando atualização de assinatura...");
    await checkSubscriptionStatus();
  };

  const simulateMessage = () => {
    if (user && mockEnabled) {
      const newCount = simulateMessageIncrement(user.messageCount, user.plan);
      updateUser({ messageCount: newCount });
      console.log(`📨 Simulando envio de mensagem: ${user.messageCount} → ${newCount}`);
    }
  };

  const resetMessageCount = () => {
    if (user && mockEnabled) {
      updateUser({ messageCount: 0 });
      console.log("🔄 Resetando contador de mensagens para 0");
    }
  };

  // Função para testar diretamente a função edge check-subscription, sem cache
  const testDirectEdge = async () => {
    console.log("🧪 Testando função edge diretamente...");
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) {
        console.error("❌ Erro ao chamar função edge:", error);
        return;
      }
      console.log("✅ Resposta direta da função edge:", data);
      setDirectMessage(data?.message_count || 0);
      if (data?.message_count !== user?.messageCount) {
        console.warn(`⚠️ Discrepância: Edge retorna ${data?.message_count}, UserContext tem ${user?.messageCount}`);
      }
    } catch (err) {
      console.error("❌ Erro ao chamar função edge:", err);
    }
  };

  // Função para resetar o cache de throttle
  const resetThrottleCache = () => {
    console.log("🧹 Resetando cache de throttle...");
    localStorage.removeItem('subscription_throttle_cache');
    localStorage.removeItem('subscription_check_time');
    localStorage.removeItem('subscription_last_result');
    console.log("✅ Cache de throttle limpo!");
  };

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-slate-800 text-white rounded-lg shadow-lg z-50 max-w-sm">
      <h3 className="text-sm font-bold mb-2">🛠️ Debug Panel</h3>
      
      <div className="text-xs mb-2">
        <div>User ID: {user?.id?.slice(0, 8)}...</div>
        <div>Plan: {user?.plan}</div>
        <div>Messages: {user?.messageCount} / {user?.messageLimit}</div>
        <div>Progress: {user?.messageCount && user?.messageLimit ? ((user.messageCount / user.messageLimit) * 100).toFixed(1) : 0}%</div>
        {directMessage > 0 && <div className="text-green-400">Edge direto: {directMessage} msgs</div>}
      </div>

      <div className="space-y-2">
        <Button 
          onClick={toggleMockMode}
          size="sm"
          variant={mockEnabled ? "destructive" : "default"}
          className="w-full text-xs"
        >
          {mockEnabled ? "🧪 Desativar Mock" : "🧪 Ativar Mock"}
        </Button>
        
        <Button 
          onClick={refreshSubscription}
          size="sm"
          variant="secondary"
          className="w-full text-xs"
        >
          🔄 Atualizar Dados
        </Button>

        {mockEnabled && (
          <>
            <Button 
              onClick={simulateMessage}
              size="sm"
              variant="outline"
              className="w-full text-xs"
            >
              📨 Simular Mensagem
            </Button>
            
            <Button 
              onClick={resetMessageCount}
              size="sm"
              variant="outline"
              className="w-full text-xs"
            >
              🔄 Reset Contador
            </Button>
          </>
        )}
      </div>

      {mockEnabled && (
        <div className="mt-2 text-xs text-yellow-300">
          Modo Mock ativo - usando dados simulados
        </div>
      )}
    </div>
  );
}

export default DebugPanel;
