import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    console.error('🚨 ErrorBoundary caught an error:', error);
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 ErrorBoundary details:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
    
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '2rem',
          maxWidth: '800px',
          margin: '2rem auto',
          border: '2px solid #ef4444',
          borderRadius: '8px',
          backgroundColor: '#fef2f2',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <h1 style={{ color: '#dc2626', marginBottom: '1rem' }}>
            🚨 Erro na Aplicação
          </h1>
          
          <div style={{ marginBottom: '1rem' }}>
            <strong>Erro:</strong> {this.state.error?.message}
          </div>
          
          <details style={{ marginBottom: '1rem' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
              Ver Stack Trace
            </summary>
            <pre style={{
              background: '#f3f4f6',
              padding: '1rem',
              overflow: 'auto',
              fontSize: '0.875rem',
              marginTop: '0.5rem'
            }}>
              {this.state.error?.stack}
            </pre>
          </details>
          
          <div style={{ marginBottom: '1rem' }}>
            <h3>🔧 Possíveis Soluções:</h3>
            <ul>
              <li>Verifique se todas as variáveis de ambiente estão configuradas</li>
              <li>Execute: <code>npm run check-env</code></li>
              <li>Verifique o console do navegador para mais detalhes</li>
              <li>Tente recarregar a página</li>
            </ul>
          </div>
          
          <button 
            onClick={() => this.setState({ hasError: false })}
            style={{
              background: '#10b981',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🔄 Tentar Novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
