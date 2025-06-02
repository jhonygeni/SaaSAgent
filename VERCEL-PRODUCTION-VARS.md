# 🚨 CONFIGURAÇÃO PARA PRODUÇÃO - VERCEL
# 
# ⚠️  ESTE ARQUIVO É PARA REFERÊNCIA DAS VARIÁVEIS NECESSÁRIAS
# ⚠️  NÃO CONTÉM CREDENCIAIS REAIS - USE AS CHAVES DA PRODUÇÃO
# 
# 📋 COPIE ESTAS VARIÁVEIS PARA O VERCEL DASHBOARD
# 🔗 https://vercel.com/dashboard → Projeto → Settings → Environment Variables

# ================================
# 🎯 FRONTEND (Vite) - OBRIGATÓRIAS
# ================================
VITE_SUPABASE_URL=https://hpovwcaskorzzrpphgkc.supabase.co
VITE_SUPABASE_ANON_KEY=[PEGAR_DA_PRODUCAO_SUPABASE]
VITE_EVOLUTION_API_URL=https://cloudsaas.geni.chat
VITE_EVOLUTION_API_KEY=[PEGAR_DA_PRODUCAO_EVOLUTION]

# ================================
# 🔧 BACKEND (Edge Functions) - OBRIGATÓRIAS
# ================================
SUPABASE_URL=https://hpovwcaskorzzrpphgkc.supabase.co
SUPABASE_ANON_KEY=[PEGAR_DA_PRODUCAO_SUPABASE]
SUPABASE_SERVICE_ROLE_KEY=[PEGAR_DA_PRODUCAO_SUPABASE]

# ================================
# 💳 STRIPE - CRITICAL para billing cycle
# ================================
STRIPE_SECRET_KEY=[PEGAR_DA_PRODUCAO_STRIPE]
STRIPE_WEBHOOK_SECRET=[PEGAR_DA_PRODUCAO_STRIPE]
STRIPE_STARTER_PRICE_ID=[SEU_PRICE_ID_STARTER_MONTHLY]
STRIPE_STARTER_SEMIANNUAL_PRICE_ID=[SEU_PRICE_ID_STARTER_SEMIANNUAL]
STRIPE_STARTER_ANNUAL_PRICE_ID=[SEU_PRICE_ID_STARTER_ANNUAL]
STRIPE_GROWTH_PRICE_ID=[SEU_PRICE_ID_GROWTH_MONTHLY]
STRIPE_GROWTH_SEMIANNUAL_PRICE_ID=[SEU_PRICE_ID_GROWTH_SEMIANNUAL]
STRIPE_GROWTH_ANNUAL_PRICE_ID=[SEU_PRICE_ID_GROWTH_ANNUAL]

# ================================
# 📧 SMTP (para emails)
# ================================
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USERNAME=[PEGAR_DA_PRODUCAO_EMAIL]
SMTP_PASSWORD=[PEGAR_DA_PRODUCAO_EMAIL]

# ================================
# 🌐 SITE CONFIGURATION
# ================================
SITE_URL=https://ia.geni.chat
PROJECT_REF=hpovwcaskorzzrpphgkc

# ================================
# 🤖 EVOLUTION API
# ================================
EVOLUTION_API_URL=https://cloudsaas.geni.chat
EVOLUTION_API_KEY=[PEGAR_DA_PRODUCAO_EVOLUTION]

# ================================
# 🔒 SECURITY HEADERS (CSP)
# ================================
VITE_CSP_NONCE=conversa-ai-nonce-2024

# ================================
# 📝 INSTRUÇÕES PARA VERCEL:
# ================================
# 
# 1. Acesse: https://vercel.com/dashboard
# 2. Selecione seu projeto
# 3. Vá em Settings → Environment Variables
# 4. Adicione CADA variável acima (substitua [PEGAR_DA_PRODUCAO_*] pelas chaves reais)
# 5. Selecione os ambientes: Production + Preview + Development
# 6. Clique em "Save"
# 7. Faça um novo deploy: npx vercel --prod
# 
# ⚠️  IMPORTANTE: 
# - Use as chaves REAIS do Supabase (Project Settings → API)
# - Use as chaves REAIS do Stripe (Dashboard → Developers → API Keys)
# - Use as credenciais REAIS do SMTP
# 
# 🎯 ISSO VAI RESOLVER:
# ✅ Problema das instâncias WhatsApp
# ✅ Billing cycle defaultando para mensal
# ✅ Erros de Content Security Policy
# ✅ Conectividade com Supabase
