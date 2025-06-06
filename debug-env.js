// Debug das variáveis de ambiente
console.log('=== DEBUG VARIÁVEIS DE AMBIENTE ===');
console.log('VITE_EVOLUTION_API_URL:', process.env.VITE_EVOLUTION_API_URL);
console.log('EVOLUTION_API_URL:', process.env.EVOLUTION_API_URL);

// Carregando o arquivo de configuração
import { ENV_CONFIG } from './src/config/environment.ts';
console.log('ENV_CONFIG.evolution:', ENV_CONFIG.evolution);
