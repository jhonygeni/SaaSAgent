/**
 * SISTEMA DE DIAGNÓSTICO AVANÇADO
 * Adiciona logs detalhados para identificar onde a aplicação está falhando
 */

interface DiagnosticInfo {
  step: string;
  success: boolean;
  data?: any;
  error?: any;
  timestamp: string;
}

class AppDiagnostic {
  private logs: DiagnosticInfo[] = [];
  
  log(step: string, success: boolean, data?: any, error?: any) {
    const logEntry: DiagnosticInfo = {
      step,
      success,
      data,
      error,
      timestamp: new Date().toISOString()
    };
    
    this.logs.push(logEntry);
    
    const emoji = success ? '✅' : '❌';
    const message = `${emoji} [${step}]`;
    
    if (success) {
      console.log(`%c${message}`, 'color: #10b981; font-weight: bold;', data);
    } else {
      console.error(`%c${message}`, 'color: #ef4444; font-weight: bold;', error);
    }
  }
  
  getAllLogs() {
    return this.logs;
  }
  
  getErrorLogs() {
    return this.logs.filter(log => !log.success);
  }
  
  printSummary() {
    console.group('📊 DIAGNÓSTICO DA APLICAÇÃO');
    console.log(`Total de logs: ${this.logs.length}`);
    console.log(`Sucessos: ${this.logs.filter(l => l.success).length}`);
    console.log(`Erros: ${this.logs.filter(l => !l.success).length}`);
    
    const errorLogs = this.getErrorLogs();
    if (errorLogs.length > 0) {
      console.group('❌ ERROS ENCONTRADOS:');
      errorLogs.forEach(log => {
        console.error(`${log.step}:`, log.error);
      });
      console.groupEnd();
    }
    
    console.groupEnd();
  }
}

// Instância global do diagnóstico
export const diagnostic = new AppDiagnostic();

// Adicionar ao window para depuração
if (typeof window !== 'undefined') {
  (window as any).appDiagnostic = diagnostic;
}

// Função helper para logs rápidos
export const logStep = (step: string, fn: () => any) => {
  try {
    diagnostic.log(`INÍCIO: ${step}`, true);
    const result = fn();
    diagnostic.log(`SUCESSO: ${step}`, true, result);
    return result;
  } catch (error) {
    diagnostic.log(`ERRO: ${step}`, false, null, error);
    throw error;
  }
};

// Função para logs assíncronos
export const logAsyncStep = async (step: string, fn: () => Promise<any>) => {
  try {
    diagnostic.log(`INÍCIO: ${step}`, true);
    const result = await fn();
    diagnostic.log(`SUCESSO: ${step}`, true, result);
    return result;
  } catch (error) {
    diagnostic.log(`ERRO: ${step}`, false, null, error);
    throw error;
  }
};
