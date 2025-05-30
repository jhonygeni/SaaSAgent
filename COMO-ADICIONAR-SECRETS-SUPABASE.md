# 🔄 Instruções para Adicionar Secrets no Supabase (Passo a Passo)

## Exatamente Como Aparece na sua Tela

Vejo que você já está na página de Edge Functions do Supabase. Agora vamos seguir um passo a passo detalhado com base na interface exata que você está vendo:

## 1. Clique na Opção "Secrets" no Menu Lateral

Na barra lateral, você já acessou a seção "Edge Functions". Agora:

1. No menu lateral esquerdo interno, onde já mostra "Functions" e "Secrets", clique em **"Secrets"**

![Menu Lateral com Functions e Secrets](/Users/jhonymonhol/Desktop/SaaSAgent-main/secrets-menu.png)

## 2. Adicione as Variáveis de Ambiente

Na tela de Secrets, você deverá:

1. Adicione cada uma dessas variáveis no formato CHAVE e VALOR:

```
# Primeira variável
Chave: STRIPE_STARTER_SEMIANNUAL_PRICE_ID
Valor: price_1RUGkFP1QgGAc8KHAXICojLH

# Segunda variável
Chave: STRIPE_STARTER_ANNUAL_PRICE_ID  
Valor: price_1RUGkgP1QgGAc8KHctjcrt7h

# Terceira variável
Chave: STRIPE_GROWTH_SEMIANNUAL_PRICE_ID
Valor: price_1RUAt2P1QgGAc8KHr8K4uqXG

# Quarta variável
Chave: STRIPE_GROWTH_ANNUAL_PRICE_ID
Valor: price_1RUAtVP1QgGAc8KH01aRe0Um
```

2. Clique no botão **"Save"** ou **"Add Secret"** após inserir cada variável

## 3. Verifique as Variáveis Salvas

Após adicionar todas as variáveis, você verá uma lista de todas as secrets configuradas. Confirme que as quatro novas variáveis aparecem nessa lista.

## 4. Re-implante a Function "create-checkout" (Se Necessário)

Após adicionar as secrets:

1. Volte para a seção **"Functions"** no menu lateral
2. Localize a função **"create-checkout"** na lista
3. Se houver algum botão para reimplantar essa função, clique nele para garantir que as novas variáveis sejam utilizadas

## 5. Teste a Implementação

Para verificar se as variáveis estão funcionando:

1. Acesse a página de planos em seu site
2. Selecione diferentes ciclos de cobrança (mensal, semestral e anual)
3. Faça um teste de checkout para cada ciclo para confirmar que os preços estão corretos

---

Esse processo garante que suas Edge Functions utilizem os novos price IDs para os diferentes ciclos de cobrança que foram implementados.
