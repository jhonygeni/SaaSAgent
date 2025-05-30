# Atualização de Variáveis de Ambiente no Supabase Dashboard - COM IMAGENS

Este guia visual mostra o passo a passo para atualizar as variáveis de ambiente (secrets) para as Edge Functions no Supabase.

## 1. Acesse o Dashboard do Supabase

![Passo 1: Login no Supabase](https://supabase.com/_next/image?url=%2Fimages%2Fcompany%2Fabout-supabase.jpg&w=1080&q=75)

- URL: https://supabase.com/dashboard
- Faça login com sua conta
- Selecione o projeto SaaSAgent na lista

## 2. Navegue até a seção de Functions

![Passo 2: Menu Functions](https://supabase.com/_next/image?url=%2Fimages%2Fproduct%2Fedge-functions%2Fedge-functions-gallery.png&w=1080&q=75)

- No menu lateral esquerdo, clique em **"Functions"**
- Esta é a área onde todas as suas Edge Functions estão listadas

## 3. Acesse a Aba "Secrets"

![Passo 3: Aba Secrets](https://supabase.com/_next/image?url=%2Fimages%2Fproduct%2Fedge-functions%2Fedge-functions-env-vars.png&w=1080&q=75)

- No topo da página, você verá várias abas
- Clique na aba **"Secrets"**
- Aqui é onde você gerencia as variáveis de ambiente para suas Edge Functions

## 4. Adicione as Novas Variáveis de Ambiente

- Na interface de Secrets, você verá um formulário para adicionar novas variáveis
- Adicione cada uma das seguintes variáveis:

```
STRIPE_STARTER_SEMIANNUAL_PRICE_ID=price_1RUGkFP1QgGAc8KHAXICojLH
STRIPE_STARTER_ANNUAL_PRICE_ID=price_1RUGkgP1QgGAc8KHctjcrt7h
STRIPE_GROWTH_SEMIANNUAL_PRICE_ID=price_1RUAt2P1QgGAc8KHr8K4uqXG
STRIPE_GROWTH_ANNUAL_PRICE_ID=price_1RUAtVP1QgGAc8KH01aRe0Um
```

- Clique em **"Save"** para salvar as alterações

## 5. Verifique as Variáveis

- Após salvar, você deverá ver as novas variáveis listadas na tabela de Secrets
- Confirme se todas foram adicionadas corretamente

## 6. Reimplante as Functions (Deploy)

- Se necessário, vá para a aba **"Functions"** e reimplante a função `create-checkout`
- Isso garantirá que suas funções usem as novas variáveis de ambiente

---

Pronto! Suas variáveis de ambiente foram atualizadas com sucesso no Supabase Dashboard.
