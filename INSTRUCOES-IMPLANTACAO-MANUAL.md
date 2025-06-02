# Instruções para Implantação Manual da Função Edge check-subscription

## Visão Geral
Este documento fornece instruções passo a passo para implantar manualmente a função edge `check-subscription` corrigida no ambiente Supabase de produção.

## Pré-requisitos
1. Docker Desktop instalado e em execução
2. CLI do Supabase instalado e configurado
3. Acesso administrativo ao projeto Supabase

## Passos para Implantação

### 1. Preparação do Ambiente
```bash
# Instalar CLI do Supabase (se ainda não estiver instalado)
npm install -g supabase

# Autenticar com o Supabase
supabase login
```

### 2. Implantação da Função Edge
```bash
# Navegar para o diretório raiz do projeto
cd /caminho/para/SaaSAgent-main

# Implantar a função check-subscription
supabase functions deploy check-subscription

# Verificar se a função foi implantada com sucesso
supabase functions list
```

### 3. Verificação Funcional
Após a implantação, é essencial verificar se o problema foi corrigido:

1. Acesse a aplicação em produção em um navegador
2. Limpe o cache do navegador ou utilize uma janela anônima/privativa
3. Faça login com uma conta de usuário normal
4. Verifique se a barra de progresso de mensagens exibe os valores corretos
   - Deve mostrar a contagem real, não "0 / 100"

### 4. Problema Conhecido (Se Ocorrer)
Se a função ainda não estiver funcionando após a implantação, pode ser necessário implantá-la sem verificação JWT:

```bash
# Implantar sem verificação JWT (use com cautela, apenas se necessário)
supabase functions deploy check-subscription --no-verify-jwt --project-ref=<proj-id>
```

### 5. Rollback (Em Caso de Problemas)
Se a nova implantação causar problemas, pode ser necessário reverter para a versão anterior:
1. Restaure o arquivo original antes da correção
2. Reimplante a função conforme as etapas acima

## O Que Foi Corrigido
- A função `getMessageCount()` na função edge `check-subscription` agora consulta corretamente as colunas `messages_sent` e `messages_received` em vez da coluna inexistente `message_count`
- O código agora soma os valores de `messages_sent` e `messages_received` para calcular o total de mensagens

## Após a Implantação
Quando a correção estiver funcionando em produção:
1. A barra de progresso exibirá a contagem correta de mensagens
2. O sistema de mock pode ser desativado para testes adicionais com dados reais
3. Não é necessário reiniciar o servidor ou fazer alterações adicionais no front-end
