-- Criar tabela para tokens de confirmação customizados
CREATE TABLE IF NOT EXISTS custom_email_confirmations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'signup',
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (timezone('utc'::text, now()) + INTERVAL '24 hours')
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_custom_email_confirmations_token_id ON custom_email_confirmations(token_id);
CREATE INDEX IF NOT EXISTS idx_custom_email_confirmations_user_id ON custom_email_confirmations(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_email_confirmations_used ON custom_email_confirmations(used);

-- Permitir que a função Edge acesse a tabela
GRANT ALL ON custom_email_confirmations TO postgres, anon, authenticated, service_role;

-- Comentários para documentação
COMMENT ON TABLE custom_email_confirmations IS 'Armazena tokens customizados para confirmação de email';
COMMENT ON COLUMN custom_email_confirmations.token_id IS 'ID do token sem o prefixo custom-token-';
COMMENT ON COLUMN custom_email_confirmations.type IS 'Tipo de confirmação: signup, email_change, recovery';
COMMENT ON COLUMN custom_email_confirmations.used IS 'Se o token já foi usado';
COMMENT ON COLUMN custom_email_confirmations.expires_at IS 'Data de expiração do token (24h padrão)';
