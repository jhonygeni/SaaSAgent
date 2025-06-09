import React, { useEffect, useState } from "react";
import { useAgent } from "@/context/AgentContext";
import { useUser } from "@/context/UserContext";

export function DebugDashboard() {
  const { agents, loadAgentsFromSupabase, isLoading } = useAgent();
  const { user } = useUser();
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${info}`]);
  };

  useEffect(() => {
    addDebugInfo(`DebugDashboard mounted. User: ${user?.email || 'null'}`);
    addDebugInfo(`Initial agents count: ${agents?.length || 0}`);
    addDebugInfo(`IsLoading: ${isLoading}`);
  }, []);

  useEffect(() => {
    addDebugInfo(`Agents changed: ${agents?.length || 0} agents`);
    if (agents && agents.length > 0) {
      agents.forEach((agent, index) => {
        addDebugInfo(`Agent ${index + 1}: ${agent.nome} (${agent.status})`);
      });
    }
  }, [agents]);

  useEffect(() => {
    if (user) {
      addDebugInfo(`User found, loading agents...`);
      loadAgentsFromSupabase()
        .then(() => addDebugInfo('loadAgentsFromSupabase completed'))
        .catch(error => addDebugInfo(`loadAgentsFromSupabase error: ${error.message}`));
    }
  }, [user]);

  const handleManualReload = async () => {
    addDebugInfo('Manual reload triggered...');
    try {
      await loadAgentsFromSupabase();
      addDebugInfo('Manual reload completed');
    } catch (error) {
      addDebugInfo(`Manual reload error: ${error.message}`);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', fontSize: '14px' }}>
      <h1>🔍 Debug Dashboard</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Status Atual</h3>
        <p><strong>Usuário:</strong> {user?.email || 'Não logado'}</p>
        <p><strong>Carregando:</strong> {isLoading ? 'Sim' : 'Não'}</p>
        <p><strong>Total de Agentes:</strong> {agents?.length || 0}</p>
        <button onClick={handleManualReload} style={{ padding: '10px', marginTop: '10px' }}>
          🔄 Recarregar Agentes
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Agentes Encontrados</h3>
        {agents && agents.length > 0 ? (
          <div>
            {agents.map((agent, index) => (
              <div key={agent.id || index} style={{ 
                border: '1px solid #ccc', 
                padding: '10px', 
                margin: '5px 0',
                backgroundColor: agent.status === 'ativo' ? '#e8f5e8' : '#fff'
              }}>
                <p><strong>Nome:</strong> {agent.nome || 'Sem nome'}</p>
                <p><strong>ID:</strong> {agent.id || 'Sem ID'}</p>
                <p><strong>Status:</strong> {agent.status || 'Sem status'}</p>
                <p><strong>Site:</strong> {agent.site || 'Sem site'}</p>
                <p><strong>Conectado:</strong> {agent.connected ? 'Sim' : 'Não'}</p>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'red' }}>❌ Nenhum agente encontrado</p>
        )}
      </div>

      <div>
        <h3>Log de Debug</h3>
        <div style={{ 
          backgroundColor: '#f5f5f5', 
          padding: '10px', 
          maxHeight: '300px', 
          overflowY: 'auto',
          border: '1px solid #ccc'
        }}>
          {debugInfo.map((info, index) => (
            <div key={index} style={{ margin: '2px 0' }}>{info}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
