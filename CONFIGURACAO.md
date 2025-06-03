# 🔐 Guia de Configuração de Variáveis de Ambiente

## Configuração na Vercel

1. Acesse o dashboard da Vercel
2. Selecione seu projeto
3. Vá para Settings > Environment Variables
4. Configure as seguintes variáveis:

### Supabase (Obrigatório)
```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon
```

### SMTP (Obrigatório)
```
VITE_SMTP_HOST=smtp.seu-provedor.com
VITE_SMTP_PORT=465
VITE_SMTP_USERNAME=seu-usuario
VITE_SMTP_PASSWORD=sua-senha
```

### Site URL (Obrigatório)
```
VITE_SITE_URL=https://seu-dominio.com
```

### Evolution API (Obrigatório)
```
VITE_EVOLUTION_API_URL=sua-url-api
VITE_EVOLUTION_API_KEY=sua-chave-api
```

### Stripe (Opcional)
```
VITE_STRIPE_PUBLISHABLE_KEY=sua-chave-publica
VITE_STRIPE_SECRET_KEY=sua-chave-secreta
```

## Configuração Local

1. Copie o arquivo `.env.example` para `.env.local`:
```bash
cp .env.example .env.local
```

2. Edite `.env.local` com suas credenciais

3. **IMPORTANTE**: Nunca comite o arquivo `.env.local`

## Configuração do Supabase

1. Configure as variáveis de ambiente no Supabase:
```bash
export SUPABASE_PROJECT_REF=seu-project-ref
export SUPABASE_ACCESS_TOKEN=seu-access-token

./supabase/setup-env.sh
```

## Verificação

Para verificar se todas as variáveis estão configuradas corretamente:

1. Na Vercel:
   - Dashboard > Settings > Environment Variables
   - Verifique se todas as variáveis estão presentes

2. No Supabase:
```bash
supabase secrets list --project-ref seu-project-ref
```

## Segurança

- ⚠️ Nunca compartilhe ou comite credenciais
- ⚠️ Use sempre HTTPS em produção
- ⚠️ Rotacione as credenciais periodicamente
- ⚠️ Mantenha as chaves de API seguras 