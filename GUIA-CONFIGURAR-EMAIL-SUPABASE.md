# 📧 GUIA COMPLETO: CONFIGURAR EMAIL SUPABASE (PASSO A PASSO)

## 🎯 OBJETIVO
Configurar o envio de emails no Supabase para funcionar com seu provedor SMTP (Hostinger).

---

## ⚠️ PASSO 0: ANTES DE COMEÇAR (CRÍTICO!)

### 🔑 1. Trocar Senha SMTP (OBRIGATÓRIO)
**A senha atual `Vu1@+H*Mw^3` foi exposta e DEVE ser alterada!**

1. **Acesse sua conta Hostinger**
   - Vá para: https://hpanel.hostinger.com/
   - Faça login com suas credenciais

2. **Altere a senha do email `validar@geni.chat`**
   - Menu: "Email" → "Contas de Email"
   - Encontre: `validar@geni.chat`
   - Clique em "Gerenciar" ou "Configurações"
   - Altere a senha para uma nova senha segura
   - **ANOTE A NOVA SENHA** (você vai precisar dela)

---

## 📝 PASSO 1: CONFIGURAR ARQUIVO .env

### 1.1 Criar arquivo .env
```bash
# No terminal, execute:
cd /Users/jhonymonhol/Desktop/conversa-ai-brasil
cp .env.example .env
```

### 1.2 Editar arquivo .env
Abra o arquivo `.env` e configure:

```bash
# SMTP Configuration (HOSTINGER)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USERNAME=validar@geni.chat
SMTP_PASSWORD=SUA_NOVA_SENHA_AQUI
SMTP_FROM=validar@geni.chat

# Site URL
SITE_URL=https://app.conversaai.com.br

# Supabase Configuration
SUPABASE_URL=https://hpovwcaskorzzrpphgkc.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwb3Z3Y2Fza29yenpycHBoZ2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MjYzODYsImV4cCI6MjA2MzQwMjM4Nn0.3Gx3Gc5xlFKwoMvd0Zk9vELzNbrf0ar4gaM92n9dtDc
PROJECT_REF=hpovwcaskorzzrpphgkc

# Evolution API Configuration  
EVOLUTION_API_URL=https://cloudsaas.geni.chat
EVOLUTION_API_KEY=SUA_NOVA_CHAVE_EVOLUTION_AQUI
```

**⚠️ SUBSTITUA:**
- `SUA_NOVA_SENHA_AQUI` pela nova senha que você criou no Hostinger
- `SUA_NOVA_CHAVE_EVOLUTION_AQUI` por uma nova chave da Evolution API

---

## 🌐 PASSO 2: CONFIGURAR NO DASHBOARD SUPABASE

### 2.1 Acessar Dashboard Supabase
1. Vá para: https://supabase.com/dashboard
2. Faça login na sua conta
3. Selecione o projeto: **hpovwcaskorzzrpphgkc**

### 2.2 Configurar Authentication
1. **No menu lateral**, clique em: **"Authentication"**
2. Clique na aba: **"Settings"**
3. Role para baixo até: **"SMTP Settings"**

### 2.3 Configurar SMTP Settings
Preencha os campos:

```
✅ Enable custom SMTP: ATIVADO (toggle ON)

Host: smtp.hostinger.com
Port: 465  
Username: validar@geni.chat
Password: [SUA_NOVA_SENHA_HOSTINGER]
Sender name: ConversaAI Brasil
Sender email: validar@geni.chat
```

**Clique em "Save"**

### 2.4 Configurar Email Templates (Opção 1: Usando Templates do Supabase)

Se você deseja usar os templates padrão do Supabase:

1. Ainda em **"Authentication" → "Settings"**
2. Role para baixo até: **"Email Templates"**
3. Configure o **"Confirm signup"**:

```
Subject: Confirme seu cadastro - ConversaAI Brasil

Body:
<h2>Bem-vindo ao ConversaAI Brasil!</h2>
```

### 2.5 Configurar Auth Hook (Opção 2: Usando Função custom-email Otimizada - RECOMENDADO)

Se você deseja usar a função personalizada de email (recomendado):

1. No menu lateral, acesse: **"Authentication" → "Hooks"**
2. Clique em **"Create a new hook"**
3. Configure:
   - Hook type: **HTTP Request**
   - Event triggers: **All events** (ou selecione apenas "signup", "email_change" e "recovery")
   - HTTP Method: **POST**
   - URL: **https://hpovwcaskorzzrpphgkc.supabase.co/functions/v1/custom-email**
4. Clique em **"Create hook"**

---

## 🚀 PASSO 3: IMPLEMENTAR A FUNÇÃO EDGE OTIMIZADA

### 3.1 Instalar a Função Edge Otimizada (Método Automatizado)

Se você já tem o arquivo `deploy-optimized-email-function.sh`, basta executá-lo:

```bash
# No terminal, execute:
cd /Users/jhonymonhol/Desktop/conversa-ai-brasil
chmod +x deploy-optimized-email-function.sh
./deploy-optimized-email-function.sh
```

Este script irá:
1. Fazer um backup da função atual
2. Implementar a nova versão otimizada
3. Configurar todas as variáveis de ambiente necessárias
4. Implantar a função no Supabase

### 3.2 Configurar Manualmente (Se Necessário)

Se você não tem o script automatizado:

```bash
# No terminal, execute:
cd /Users/jhonymonhol/Desktop/conversa-ai-brasil/supabase
supabase functions deploy custom-email --project-ref hpovwcaskorzzrpphgkc

# Configurar variáveis de ambiente:
supabase secrets set \
  SMTP_HOST="smtp.hostinger.com" \
  SMTP_PORT="465" \
  SMTP_USERNAME="validar@geni.chat" \
  SMTP_PASSWORD="SUA_NOVA_SENHA_AQUI" \
  SMTP_FROM="validar@geni.chat" \
  SITE_URL="https://app.conversaai.com.br" \
  PROJECT_REF="hpovwcaskorzzrpphgkc" \
  --project-ref "hpovwcaskorzzrpphgkc"
```

---

## 🧪 PASSO 4: TESTAR A IMPLEMENTAÇÃO

### 4.1 Testar com Script Automatizado

```bash
# No terminal, execute:
cd /Users/jhonymonhol/Desktop/conversa-ai-brasil
node test-custom-email-formats.js
```

Este script testará a função com múltiplos formatos de payload para garantir que esteja funcionando corretamente.

### 4.2 Verificar os Logs

```bash
# No terminal, execute:
cd /Users/jhonymonhol/Desktop/conversa-ai-brasil/supabase
supabase functions logs custom-email --project-ref hpovwcaskorzzrpphgkc
```

### 4.3 Teste Manual de Cadastro

Faça um teste completo de cadastro na aplicação:
1. Acesse: https://app.conversaai.com.br/cadastro
2. Cadastre um email de teste (ex: seu-nome+teste@gmail.com)
3. Verifique se o email de confirmação chegou
4. Clique no link de confirmação e confirme que funciona

---

## 🔍 SOLUÇÃO DE PROBLEMAS COMUNS

### 1. Email "Usuário já registrado"

Se encontrar o erro "Usuário já registrado", consulte o arquivo:
- `RESOLVER-ERRO-USUARIO-JA-REGISTRADO.md`

### 2. Emails não chegam

Verifique:
1. Se as variáveis de ambiente estão configuradas corretamente
2. Se o hook de autenticação está configurado corretamente
3. Se a senha SMTP foi atualizada em todos os lugares
4. Os logs da função para erros específicos

### 3. Consultar documentação completa

Para informações detalhadas sobre a função email otimizada:
- `DOCUMENTACAO-EMAIL-PERSONALIZADO.md`

---

## ✅ CHECKLIST FINAL

### Antes de testar:
- [ ] ✅ Senha SMTP alterada no Hostinger
- [ ] ✅ Arquivo .env configurado com nova senha
- [ ] ✅ SMTP Settings configurados no Supabase
- [ ] ✅ Email Templates configurados
- [ ] ✅ Secrets configurados nas Edge Functions
- [ ] ✅ Auth Hook configurado (se usando custom-email)

### Teste final:
- [ ] ✅ Teste SMTP no dashboard funciona
- [ ] ✅ Cadastro de usuário envia email
- [ ] ✅ Email chega na caixa de entrada
- [ ] ✅ Link de confirmação funciona

---

## 📞 SUPORTE

Se algo não funcionar:
1. **Verifique os logs** no Supabase Dashboard
2. **Teste SMTP** diretamente no dashboard
3. **Confirme credenciais** no Hostinger
4. **Execute diagnóstico**: `node test-custom-email-formats.js`

---

**🎯 RESULTADO ESPERADO**: Emails de confirmação sendo enviados automaticamente quando usuários se cadastram na aplicação!

---

*Guia atualizado em 25/05/2025 - ConversaAI Brasil Security Team*
