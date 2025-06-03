import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY,
  SUPABASE_JWT_SECRET,
} = process.env;

// Validar variáveis de ambiente
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !SUPABASE_JWT_SECRET) {
  throw new Error('Missing required Supabase environment variables');
}

// Criar cliente Supabase com chave de serviço
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Exportar configurações para uso em outras partes do backend
export const supabaseConfig = {
  url: SUPABASE_URL,
  jwtSecret: SUPABASE_JWT_SECRET,
}; 