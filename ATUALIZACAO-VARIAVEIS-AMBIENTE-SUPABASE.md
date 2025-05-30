# 🔧 Instruções para Atualizar Variáveis de Ambiente no Supabase

## 1. Acessar o Dashboard do Supabase

1. Acesse [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Faça login com sua conta
3. Selecione o projeto **SaaSAgent**

## 2. Atualizar Variáveis de Ambiente para Edge Functions

### Método 1: Pela Interface Web

1. No menu lateral, clique em **"Functions"** (não "Edge Functions")
2. Na página de Functions, clique na aba **"Secrets"** no topo da página
3. Nesta seção, você verá todas as variáveis de ambiente para suas funções edge
4. Adicione as seguintes variáveis:

```
STRIPE_STARTER_SEMIANNUAL_PRICE_ID=price_1RUGkFP1QgGAc8KHAXICojLH
STRIPE_STARTER_ANNUAL_PRICE_ID=price_1RUGkgP1QgGAc8KHctjcrt7h
STRIPE_GROWTH_SEMIANNUAL_PRICE_ID=price_1RUAt2P1QgGAc8KHr8K4uqXG
STRIPE_GROWTH_ANNUAL_PRICE_ID=price_1RUAtVP1QgGAc8KH01aRe0Um
```

5. Clique em **"Save"** para salvar as alterações

### Método 2: Usando Supabase CLI (Recomendado)

1. Instale a CLI do Supabase se ainda não tiver:
```bash
brew install supabase/tap/supabase
```

2. Faça login na CLI:
```bash
supabase login
```

3. Configure as variáveis de ambiente (um comando por variável):
```bash
cd /Users/jhonymonhol/Desktop/SaaSAgent-main

# Configurar cada variável
supabase secrets set STRIPE_STARTER_SEMIANNUAL_PRICE_ID=price_1RUGkFP1QgGAc8KHAXICojLH
supabase secrets set STRIPE_STARTER_ANNUAL_PRICE_ID=price_1RUGkgP1QgGAc8KHctjcrt7h
supabase secrets set STRIPE_GROWTH_SEMIANNUAL_PRICE_ID=price_1RUAt2P1QgGAc8KHr8K4uqXG
supabase secrets set STRIPE_GROWTH_ANNUAL_PRICE_ID=price_1RUAtVP1QgGAc8KH01aRe0Um
```

4. Verificar as variáveis configuradas:
```bash
supabase secrets list
```

## 3. Fazer Deploy das Edge Functions

Após configurar as variáveis de ambiente, você precisa fazer o deploy novamente das edge functions afetadas:

```bash
cd /Users/jhonymonhol/Desktop/SaaSAgent-main
supabase functions deploy create-checkout
```

## 4. Verificação

Para verificar se as variáveis de ambiente foram configuradas corretamente:

1. Acesse uma função edge no dashboard
2. Clique na guia **"Logs"**
3. Execute um teste chamando a função
4. Verifique se os logs mostram os novos price IDs sendo utilizados

## ⚠️ Notas Importantes

- As variáveis de ambiente são específicas para cada ambiente (dev/prod)
- Se você estiver trabalhando com múltiplos ambientes, você precisará configurar as variáveis em cada um deles
- Mantenha as chaves do Stripe seguras e nunca as compartilhe em repositórios públicos

## 🔄 Alternativa: Usando o .env.local (Apenas para desenvolvimento local)

Se estiver testando localmente, você também pode criar um arquivo `.env.local` na raiz do projeto:

```bash
# Criar arquivo .env.local
cat > /Users/jhonymonhol/Desktop/SaaSAgent-main/.env.local << EOL
STRIPE_STARTER_SEMIANNUAL_PRICE_ID=price_1RUGkFP1QgGAc8KHAXICojLH
STRIPE_STARTER_ANNUAL_PRICE_ID=price_1RUGkgP1QgGAc8KHctjcrt7h
STRIPE_GROWTH_SEMIANNUAL_PRICE_ID=price_1RUAt2P1QgGAc8KHr8K4uqXG
STRIPE_GROWTH_ANNUAL_PRICE_ID=price_1RUAtVP1QgGAc8KH01aRe0Um
EOL
```

Porém, lembre-se que isso só funcionará para desenvolvimento local, não para as funções edge hospedadas no Supabase.
