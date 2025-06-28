import React from 'react';

interface SafeLoadingProps {
  message?: string;
  error?: string;
}

export const SafeLoading: React.FC<SafeLoadingProps> = ({ 
  message = 'Carregando aplicação...', 
  error 
}) => {
  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        fontFamily: 'system-ui, sans-serif',
        backgroundColor: '#fef2f2'
      }}>
        <div style={{
          maxWidth: '600px',
          textAlign: 'center',
          border: '2px solid #ef4444',
          borderRadius: '8px',
          padding: '2rem',
          backgroundColor: 'white'
        }}>
          <h1 style={{ color: '#dc2626', marginBottom: '1rem' }}>
            ❌ Erro de Inicialização
          </h1>
          <p style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>
            {error}
          </p>
          <div style={{ marginBottom: '1rem' }}>
            <h3>🔧 Soluções Recomendadas:</h3>
            <ul style={{ textAlign: 'left', margin: '1rem 0' }}>
              <li>Verifique se todas as variáveis de ambiente estão configuradas</li>
              <li>Execute: <code>npm run check-env</code></li>
              <li>Verifique o console do navegador para mais detalhes</li>
              <li>Tente recarregar a página</li>
            </ul>
          </div>
          <button 
            style={{
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold'
            }}
          >
            🔄 Recarregar Página
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif',
      backgroundColor: '#f8fafc'
    }}>
      <div style={{
        textAlign: 'center',
        padding: '2rem'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          border: '4px solid #e2e8f0',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1rem'
        }}></div>
        <h2 style={{ color: '#1e293b', marginBottom: '0.5rem' }}>
          ConversaAI Brasil
        </h2>
        <p style={{ color: '#64748b', fontSize: '1.1rem' }}>
          {message}
        </p>
      </div>
      
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};
