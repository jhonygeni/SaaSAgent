# 📊 Documentação de Planos e Preços

## 📌 Novos Ciclos de Pagamento

O sistema agora suporta **três opções de pagamento** para cada plano:

### Plano Starter
| Ciclo | Valor Mensal | Valor Total | Economia | Price ID Stripe |
|-------|-------------|-------------|----------|-----------------|
| Mensal | R$ 199/mês | R$ 199/mês | - | `price_1RRBDsP1QgGAc8KHzueN2CJL` |
| Semestral | R$ 169/mês | R$ 1.014 | R$ 180 em 6 meses | `price_1RUGkFP1QgGAc8KHAXICojLH` |
| Anual | R$ 149/mês | R$ 1.791 | R$ 597 em 1 ano | `price_1RUGkgP1QgGAc8KHctjcrt7h` |

### Plano Growth
| Ciclo | Valor Mensal | Valor Total | Economia | Price ID Stripe |
|-------|-------------|-------------|----------|-----------------|
| Mensal | R$ 249/mês | R$ 249/mês | - | `price_1RRBEZP1QgGAc8KH71uKIH6i` |
| Semestral | R$ 211/mês | R$ 1.270 | R$ 224 em 6 meses | `price_1RUAt2P1QgGAc8KHr8K4uqXG` |
| Anual | R$ 187/mês | R$ 2.241 | R$ 747 em 1 ano | `price_1RUAtVP1QgGAc8KH01aRe0Um` |

## 🔧 Implementação Técnica

### Interface do Usuário
- `PricingPlans.tsx`: Componente principal que exibe os planos e preços
- Seletor de ciclo de pagamento na parte superior dos cards
- Valores dinâmicos com base no ciclo selecionado
- Botão "Gerenciar assinatura" para usuários com planos ativos

### Supabase Edge Functions
- `create-checkout/index.ts`: Atualizado para lidar com diferentes cycles de pagamento
- Price IDs armazenados em um objeto estruturado por plano e ciclo
- Suporte para override manual de priceId se necessário

### Variáveis de Ambiente
As seguintes variáveis de ambiente devem estar configuradas nas Edge Functions:

```
STRIPE_STARTER_PRICE_ID=price_1RRBDsP1QgGAc8KHzueN2CJL
STRIPE_GROWTH_PRICE_ID=price_1RRBEZP1QgGAc8KH71uKIH6i
STRIPE_STARTER_SEMIANNUAL_PRICE_ID=price_1RUGkFP1QgGAc8KHAXICojLH
STRIPE_STARTER_ANNUAL_PRICE_ID=price_1RUGkgP1QgGAc8KHctjcrt7h
STRIPE_GROWTH_SEMIANNUAL_PRICE_ID=price_1RUAt2P1QgGAc8KHr8K4uqXG
STRIPE_GROWTH_ANNUAL_PRICE_ID=price_1RUAtVP1QgGAc8KH01aRe0Um
```

## 🤔 Como Funciona na Prática

1. O usuário seleciona um ciclo de pagamento (mensal, semestral ou anual)
2. Os preços são atualizados dinamicamente na interface
3. O usuário clica no plano desejado
4. A Edge Function `create-checkout` é chamada com:
   - `planId`: "starter" ou "growth"
   - `billingCycle`: "monthly", "semiannual" ou "annual"
   - `priceId`: (opcional) para substituir o price ID padrão
5. A função cria uma sessão de checkout com o price ID correspondente
6. O usuário completa o pagamento no Stripe
7. É redirecionado de volta para a aplicação

## 🔍 Verificação e Testes

Para verificar se os planos e ciclos estão funcionando corretamente:

1. Acesse `/planos` na aplicação
2. Alterne entre os ciclos de pagamento
3. Verifique se os preços são atualizados corretamente
4. Selecione um plano e confirme que o valor correto é exibido no checkout
5. Verifique se a descrição do plano no Stripe corresponde ao ciclo selecionado
6. Após a assinatura, verifique se o usuário pode gerenciar via Customer Portal

---

**Última atualização:** 30 de maio de 2025
