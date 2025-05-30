# 🔧 CONFIGURAÇÃO CRÍTICA - AUTH HOOKS

## ⚠️ AÇÃO URGENTE NECESSÁRIA

**Status:** 🔴 BLOQUEADOR CRÍTICO  
**Tempo estimado:** 5 minutos  
**Impacto:** Sem isso, emails automáticos não funcionam  

---

## 🎯 O QUE FAZER AGORA

### 1. 🌐 ACESSAR DASHBOARD SUPABASE

**URL:** https://supabase.com/dashboard  
**Projeto:** ConversaAI Brasil  

1. Faça login no Supabase
2. Selecione o projeto ConversaAI Brasil
3. Vá para a seção **Authentication**

---

### 2. ⚙️ CONFIGURAR AUTH HOOKS

**Navegação:** `Authentication → Settings → Auth Hooks`

**Configuração necessária:**

```
🔧 SEND EMAIL HOOK

✅ Status: ENABLED
📍 URL: https://hpovwcaskorzrpphgkc.supabase.co/functions/v1/send-welcome-email
🔑 HTTP Headers:
   Authorization: Bearer [SEU_SERVICE_ROLE_KEY]
   Content-Type: application/json

🎯 Trigger: user.created
```

---

### 3. 📝 PASSOS DETALHADOS

#### Passo 1: Localizar Auth Hooks
1. No dashboard, clique em **"Authentication"** (ícone de usuário)
2. Clique em **"Settings"** (engrenagem)
3. Role para baixo até encontrar **"Auth Hooks"**

#### Passo 2: Configurar Send Email Hook
1. Clique em **"Add Hook"** ou **"Configure"**
2. Selecione **"Send Email"** ou **"Custom SMTP"**
3. Cole a URL: `https://hpovwcaskorzrpphgkc.supabase.co/functions/v1/send-welcome-email`

#### Passo 3: Configurar Headers
1. Adicione header **"Authorization"**
2. Valor: `Bearer [SUA_SERVICE_ROLE_KEY]`
3. Adicione header **"Content-Type"**
4. Valor: `application/json`

#### Passo 4: Testar
1. Clique em **"Test Hook"**
2. Se aparecer sucesso ✅, está funcionando
3. Se der erro ❌, verifique a URL e headers

---

### 4. 🧪 VALIDAR FUNCIONAMENTO

#### Teste 1: Criar usuário de teste
1. Vá em **Authentication → Users**
2. Clique **"Invite User"**
3. Digite um email de teste
4. Clique **"Send Invitation"**

#### Teste 2: Verificar automação
1. Verifique se o usuário apareceu na lista
2. Vá em **Database → Tables → profiles**
3. Confirme que foi criado um perfil automaticamente
4. Vá em **Database → Tables → subscriptions**
5. Confirme que foi criada uma assinatura Free

#### Teste 3: Confirmar email
1. Verifique a caixa de entrada do email de teste
2. Deve ter recebido um email personalizado de boas-vindas
3. O email deve conter informações sobre o plano Free

---

## 🚨 PROBLEMAS COMUNS

### ❌ Hook não funciona
**Solução:**
1. Verifique se a URL está correta
2. Confirme que os headers estão corretos
3. Teste a função diretamente no Edge Functions

### ❌ Email não enviado
**Solução:**
1. Verifique configurações SMTP no Supabase
2. Confirme que a função de email está ativa
3. Cheque logs de erro no dashboard

### ❌ Perfil não criado automaticamente
**Solução:**
1. Verifique se o trigger `on_auth_user_created` está ativo
2. Confirme que a função `handle_new_user_signup` existe
3. Teste manualmente no SQL Editor

---

## ✅ CONFIRMAÇÃO DE SUCESSO

**Quando estiver funcionando:**
1. ✅ Novos usuários recebem email automaticamente
2. ✅ Perfil é criado automaticamente na tabela `profiles`
3. ✅ Assinatura Free é criada automaticamente
4. ✅ Usuário pode fazer login imediatamente

---

## 🆘 SUPORTE

**Se algo der errado:**

1. **Logs de erro:** Dashboard → Settings → Logs → Auth
2. **Teste manual:** SQL Editor → `SELECT handle_new_user_signup('teste', 'teste@email.com')`
3. **Revisar scripts:** Pasta do projeto → `database-cleanup-complete.sql`
4. **Executar diagnóstico:** `node verificacao-final-sistema.mjs`

---

## 📞 CHECKLIST DE FINALIZAÇÃO

- [ ] Auth Hooks configurado no dashboard
- [ ] URL da função de email inserida
- [ ] Headers de autorização adicionados
- [ ] Teste de criação de usuário realizado
- [ ] Email de boas-vindas recebido
- [ ] Perfil e assinatura criados automaticamente
- [ ] Sistema funcionando end-to-end

**Quando todos os itens estiverem ✅, o sistema estará 100% operacional!**

---

## 📊 IMPACTO DESTA CONFIGURAÇÃO

**Antes:** 🔴 Usuários não recebem emails + processos manuais  
**Depois:** 🟢 Sistema completamente automatizado  

**Benefícios:**
- Emails de boas-vindas automáticos
- Criação automática de perfis
- Atribuição automática de plano Free
- Experiência de usuário perfeita
- Zero intervenção manual necessária

**Esta é a última etapa para ter um sistema 100% automatizado! 🎉**
