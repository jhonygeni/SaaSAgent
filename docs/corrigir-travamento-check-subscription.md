# Correção do problema de travamento na função check-subscription

## Problema identificado
O UserContext.tsx está travando por mais de 1 minuto durante a chamada à função Edge `check-subscription` do Supabase. Este problema afeta diretamente a experiência do usuário, fazendo com que a interface fique congelada.

## Causas prováveis

1. **Timeout na chamada à API do Stripe**: A função `check-subscription` faz chamadas à API do Stripe, que podem demorar muito ou falhar.

2. **Configuração incorreta das variáveis de ambiente**: A função pode estar tentando acessar variáveis de ambiente não configuradas, como `STRIPE_SECRET_KEY`.

3. **Problemas de rede ou conectividade**: Falhas temporárias na conexão com as APIs externas.

4. **Ausência de timeout**: Não há um timeout configurado para a chamada à função Edge, o que faz com que o código espere indefinidamente.

## Soluções implementadas

### 1. Implementação de Timeout
Foi adicionado um timeout de 8 segundos na chamada à função `check-subscription` no arquivo `UserContext.tsx`. Se a função não responder dentro desse tempo, o código continua a execução com um plano gratuito padrão.

### 2. Scripts de diagnóstico
Foram criados scripts para ajudar a diagnosticar o problema:

- `diagnose-check-subscription.js`: Testa diretamente a função `check-subscription` e reporta o tempo de resposta.
- `check-edge-function-secrets.sh`: Verifica se as variáveis de ambiente necessárias estão configuradas.

### 3. SQL Trigger para usuários
Foi criado um trigger SQL para garantir que novos usuários sempre tenham registros nas tabelas `profiles`, `subscription_plans` e `subscriptions`, mesmo que a função `check-subscription` falhe.

## Como verificar e corrigir

### Verificar as variáveis de ambiente
Execute:
```bash
./check-edge-function-secrets.sh
```

Se alguma variável estiver faltando, adicione-a:
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_sua_chave_stripe --env prod
```

### Diagnosticar a função check-subscription
Execute:
```bash
node diagnose-check-subscription.js seu-email@dominio.com sua-senha
```

### Validar o trigger SQL para novos usuários
Execute:
```bash
./apply-user-triggers.sh
```

### Testar fluxo completo
```bash
node test-signup-flow.js
```

## Recomendações adicionais

1. **Cache de assinatura**: Considere armazenar o resultado da verificação de assinatura no localStorage por um período curto (5-10 minutos) para evitar chamadas frequentes à função.

2. **Verificação assíncrona**: Mostrar a UI com plano gratuito imediatamente e atualizar o plano quando a verificação de assinatura for concluída.

3. **Health check periódico**: Criar um endpoint de health check para monitorar a função `check-subscription`.

4. **Reduzir chamadas**: Atualmente, a função é chamada várias vezes durante o login do usuário. Considere reduzir para apenas uma chamada.

## Observações

Se o problema persistir, você pode desativar temporariamente a verificação da assinatura editando o arquivo `UserContext.tsx` para retornar um plano padrão sem chamar a função Edge.
