# Documentação da Função Edge custom-email

## Visão Geral

A função Edge `custom-email` é uma solução personalizada para enviar emails de autenticação e notificação
através do Supabase. Esta versão otimizada oferece:

1. **Suporte a múltiplos formatos de payload** - Compatibilidade com diferentes integrações
2. **Melhor tratamento de erros** - Logs detalhados e respostas informativas
3. **Tipagem forte com TypeScript** - Para garantir estabilidade e previsibilidade
4. **Sistema de logging aprimorado** - Com níveis de severidade e identificadores de requisição

## Formatos de Payload Suportados

A função aceita múltiplos formatos de payload para máxima flexibilidade:

### 1. Formato Auth Hook (Recomendado)

Este é o formato padrão enviado pelos webhooks de autenticação do Supabase:

```json
{
  "type": "auth",
  "event": "signup",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "user_metadata": {
      "name": "Nome do Usuário"
    }
  },
  "data": {
    "token": "verification_token"
  }
}
```

### 2. Formato API Direta (Legacy)

Este formato é usado para chamadas diretas à função:

```json
{
  "email": "user@example.com",
  "type": "signup",
  "token": "verification_token",
  "redirect_to": "https://app.conversaai.com.br/confirmar-email",
  "metadata": {
    "name": "Nome do Usuário"
  }
}
```

### 3. Formato de Template Personalizado

```json
{
  "email": "user@example.com",
  "template": "confirmacao",
  "data": {
    "token": "token_de_verificacao",
    "nome": "Nome do Usuário"
  }
}
```

### 4. Formato Alternativo (Sistema Legado)

```json
{
  "type": "signup",
  "user": {
    "email": "user@example.com",
    "email_confirm": "https://app.conversaai.com.br/confirmar-email?token=xxx"
  }
}
```

## Tipos de Email Suportados

A função suporta os seguintes tipos de email:

1. **Confirmação de cadastro** - `signup`, `email_signup`, `confirmacao`
2. **Alteração de email** - `email_change`, `change`
3. **Recuperação de senha** - `recovery`, `password_recovery`, `redefinir`

## Variáveis de Ambiente Necessárias

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `SMTP_HOST` | Host do servidor SMTP | `smtp.hostinger.com` |
| `SMTP_PORT` | Porta do servidor SMTP | `465` |
| `SMTP_USERNAME` | Usuário SMTP | `validar@geni.chat` |
| `SMTP_PASSWORD` | Senha SMTP | `senha_segura` |
| `SMTP_FROM` | Email de origem | `validar@geni.chat` |
| `SITE_URL` | URL base do site | `https://app.conversaai.com.br` |
| `PROJECT_REF` | Referência do projeto Supabase | `hpovwcaskorzzrpphgkc` |

## Logs e Monitoramento

A função utiliza um sistema de logs estruturado com níveis de severidade:

- `[INFO]` - Informações gerais e eventos bem-sucedidos
- `[WARN]` - Avisos e casos excepcionais tratados
- `[ERROR]` - Erros que afetam a funcionalidade
- `[EMAIL]` - Registros específicos de envio de email

Cada requisição também recebe um ID único (`requestId`) que é incluído nos logs para facilitar o rastreamento.

## Testando a Função

Para testar a função, use o script `test-custom-email-formats.js`:

```bash
node test-custom-email-formats.js
```

Este script testa todos os formatos de payload suportados e exibe os resultados.

## Implantação

Para implantar a função, use o script `deploy-optimized-email-function.sh`:

```bash
bash deploy-optimized-email-function.sh
```

Este script:
1. Faz backup da função atual
2. Instala a nova versão
3. Implanta a função no Supabase
4. Configura as variáveis de ambiente necessárias

## Configuração no Supabase

Para usar esta função com o sistema de autenticação do Supabase:

1. Acesse o dashboard do Supabase > Authentication > Email Templates
2. Desative os templates padrão
3. Vá para Authentication > URL Configuration
4. Configure o Site URL para `https://app.conversaai.com.br`
5. Vá para Authentication > Hooks
6. Configure um webhook para o evento "All Events" apontando para:
   `https://hpovwcaskorzzrpphgkc.supabase.co/functions/v1/custom-email`

## Resolução de Problemas

### O email não está sendo enviado

1. Verifique se todas as variáveis de ambiente estão configuradas
2. Confirme se a função foi implantada corretamente
3. Verifique os logs da função com:
   ```bash
   supabase functions logs custom-email --project-ref hpovwcaskorzzrpphgkc
   ```
4. Teste a função diretamente com o script de teste

### Erro "Usuário já registrado"

Se estiver recebendo o erro "Usuário já registrado", o problema pode ser que o email já existe no sistema,
mas ainda não foi confirmado. Veja a solução em `RESOLVER-ERRO-USUARIO-JA-REGISTRADO.md`.

### Problemas de tipagem no TypeScript

A função utiliza imports do Deno com `// @ts-ignore` para evitar erros de tipagem.
Isso é necessário porque o ambiente de execução da função Edge é baseado no Deno,
não no Node.js.

## Arquivos Relacionados

- `custom-email/index.ts` - Código da função Edge
- `test-custom-email-formats.js` - Script para testar a função
- `deploy-optimized-email-function.sh` - Script para implantar a função
- `GUIA-CONFIGURAR-EMAIL-SUPABASE.md` - Guia para configurar o email no Supabase
- `RESOLVER-ERRO-USUARIO-JA-REGISTRADO.md` - Solução para o erro "Usuário já registrado"
