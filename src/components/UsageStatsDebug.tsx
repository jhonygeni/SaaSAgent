import { useUsageStats } from "@/hooks/useUsageStats";
import { useUser } from "@/context/UserContext";

export function UsageStatsDebug() {
  const { user } = useUser();
  const { data: messagesData, totalMessages, isLoading, error } = useUsageStats();
  
  return (
    <div style={{ 
      background: '#fff3cd', 
      border: '1px solid #ffeaa7',
      padding: '15px', 
      margin: '10px 0',
      borderRadius: '5px',
      fontSize: '12px',
      fontFamily: 'monospace'
    }}>
      <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>🔍 Usage Stats Debug</h4>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>User Info:</strong><br />
        - ID: {user?.id || 'N/A'}<br />
        - Email: {user?.email || 'N/A'}
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Hook State:</strong><br />
        - Loading: {isLoading ? 'Yes' : 'No'}<br />
        - Error: {error || 'None'}<br />
        - Total Messages: {totalMessages}<br />
        - Data Length: {messagesData?.length || 0}
      </div>
      
      {messagesData && messagesData.length > 0 && (
        <div>
          <strong>Data:</strong><br />
          {messagesData.map((item, index) => (
            <div key={index}>
              - {item.dia}: {item.enviadas} enviadas, {item.recebidas} recebidas (data: {item.date})
            </div>
          ))}
        </div>
      )}
      
      {(!messagesData || messagesData.length === 0) && !isLoading && (
        <div style={{ color: '#d63031' }}>
          <strong>⚠️ Nenhum dado encontrado!</strong><br />
          Verificar se o user_id {user?.id} tem dados na tabela usage_stats.
        </div>
      )}
    </div>
  );
}
