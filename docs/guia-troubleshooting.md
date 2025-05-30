# Guia de Verificação e Troubleshooting - ConversaAI Brasil

Este documento fornece instruções para verificar e solucionar problemas comuns na plataforma ConversaAI Brasil.

## 1. Problemas de Travamento na Função check-subscription

### Sintomas
- Interface trava por mais de 1 minuto durante login ou verificação de assinatura
- Mensagem "Verificando status da assinatura..." aparece no console por muito tempo
- Usuário não consegue acessar a dashboard após o login

### Soluções Implementadas
- **Timeout na chamada à API**: Limite de 8 segundos para a chamada à função Edge
- **Cacheamento de respostas**: Armazenamento local das informações de assinatura
- **Otimização da função Edge**: Redução do tempo de resposta e melhor tratamento de erros
- **Triggers de banco de dados**: Preenchimento automático de tabelas necessárias

### Como Verificar
Execute o script de diagnóstico para identificar a causa do problema:
```bash
node diagnose-check-subscription.js seu-email@exemplo.com sua-senha
```

### Como Corrigir
Execute o script que aplica todas as correções necessárias:
```bash
./apply-all-fixes.sh
```

## 2. Problemas de Registro de Usuários

### Sintomas
- Usuários se registram mas não conseguem fazer login
- Dados não aparecem nas tabelas profiles, subscriptions
- Erro ao verificar o status de assinatura de um novo usuário

### Como Verificar
Execute o script para checar se um usuário tem todos os registros necessários:
```bash
node verify-user-records.js ID_DO_USUARIO
```

### Como Corrigir
Execute o script para criar registros faltantes:
```bash
node repair-user-records.js ID_DO_USUARIO
```

Ou aplique o trigger SQL para criar registros automaticamente para novos usuários:
```bash
./apply-user-triggers.sh
```

## 3. Problemas de Envio de Email

### Sintomas
- Usuários não recebem emails de confirmação
- Link de confirmação de email não funciona
- Redirecionamento para domínio incorreto

### Como Verificar
Verifique as configurações SMTP e URL do site:
```bash
./check-edge-function-secrets.sh
```

### Como Corrigir
Atualize a URL do site na função custom-email:
```bash
./update-site-url.sh
```

Configure o webhook no console do Supabase seguindo as instruções:
```bash
./update-email-webhook-urls.sh
```

## 4. Logs e Monitoramento

### Verificar Logs das Funções Edge
```bash
supabase functions logs check-subscription
supabase functions logs custom-email
```

Para monitoramento contínuo:
```bash
supabase functions logs check-subscription --follow
```

## 5. Soluções de Emergência

Se os problemas persistirem, você pode desabilitar temporariamente a verificação de assinatura editando `UserContext.tsx`:

1. Localize a função `checkSubscriptionStatus`
2. No início da função, adicione:
```typescript
// Desativado temporariamente para debug
if (supabaseUser) {
  createUserWithDefaultPlan(supabaseUser, 'free');
  return;
}
```

## 6. Contato para Suporte

Se você precisar de assistência adicional:
- Email: suporte@conversaai.com.br
- Discord: https://discord.gg/conversaai
- GitHub: Abra uma issue em github.com/conversaai-brasil/support
