# ✅ CHECKLIST MANUAL DE VERIFICAÇÃO - CONVERSA AI BRASIL

## 🎯 VERIFICAÇÕES CRÍTICAS A SEREM FEITAS

### 1. 🏗️ VERIFICAR ESTRUTURA DO BANCO (Dashboard Supabase)

**Acesse:** Dashboard Supabase → Database → Tables

**Tabelas que DEVEM existir:**
- [ ] `auth.users` (gerenciada pelo Supabase)
- [ ] `public.profiles` 
- [ ] `public.subscription_plans`
- [ ] `public.subscriptions`
- [ ] `public.whatsapp_instances`
- [ ] `public.messages`
- [ ] `public.agents`
- [ ] `public.contacts`
- [ ] `public.payments`
- [ ] `public.usage_stats`

**✅ SUCESSO:** Todas as tabelas aparecem na lista  
**❌ PROBLEMA:** Alguma tabela está faltando

---

### 2. 💳 VERIFICAR PLANOS DE ASSINATURA

**Acesse:** Dashboard → Database → Table `subscription_plans`

**Deve conter EXATAMENTE:**
- [ ] **1 plano "Free"** (sem duplicatas)
- [ ] **1 plano "Starter"** - R$ 199,00
- [ ] **1 plano "Growth"** - R$ 249,00

**SQL para verificar:**
```sql
SELECT name, price, message_limit, COUNT(*) as quantidade
FROM subscription_plans 
GROUP BY name, price, message_limit;
```

**✅ SUCESSO:** 3 planos únicos, apenas 1 Free  
**❌ PROBLEMA:** Múltiplos planos "Free" ou faltando planos

---

### 3. ⚡ VERIFICAR TRIGGERS DE USUÁRIO

**Acesse:** Dashboard → Database → Functions

**Deve existir:**
- [ ] Função `handle_new_user_signup`
- [ ] Trigger `on_auth_user_created` na tabela `auth.users`

**Teste manual:**
1. Vá em Authentication → Users → Invite User
2. Convide um email de teste
3. Verifique se automaticamente criou:
   - Registro em `profiles`
   - Registro em `subscriptions` com plano Free

**✅ SUCESSO:** Usuário criado com perfil e assinatura automaticamente  
**❌ PROBLEMA:** Usuário criado sem perfil ou assinatura

---

### 4. 🔒 VERIFICAR POLÍTICAS RLS

**Acesse:** Dashboard → Database → Authentication → Policies

**Tabelas com RLS ativado:**
- [ ] `profiles` - Políticas para visualizar/editar próprio perfil
- [ ] `subscriptions` - Políticas para visualizar própria assinatura
- [ ] `subscription_plans` - Política para todos visualizarem
- [ ] `whatsapp_instances` - Políticas para próprias instâncias
- [ ] `messages` - Políticas para mensagens das próprias instâncias
- [ ] `agents` - Políticas para próprios agentes
- [ ] `contacts` - Políticas para próprios contatos
- [ ] `payments` - Políticas para próprios pagamentos
- [ ] `usage_stats` - Políticas para próprias estatísticas

**✅ SUCESSO:** Todas as tabelas têm RLS ativado e políticas criadas  
**❌ PROBLEMA:** RLS desativado ou políticas faltando

---

### 5. 📊 VERIFICAR ÍNDICES DE PERFORMANCE

**Acesse:** Dashboard → Database → Indexes

**Índices que DEVEM existir:**
- [ ] `idx_messages_instance_id`
- [ ] `idx_messages_created_at`
- [ ] `idx_messages_phone_number`
- [ ] `idx_contacts_user_id`
- [ ] `idx_contacts_phone_number`
- [ ] `idx_usage_stats_user_date`
- [ ] `idx_whatsapp_instances_user_id`
- [ ] `idx_agents_user_id`
- [ ] `idx_payments_user_id`

**✅ SUCESSO:** Índices criados e aparecem na lista  
**❌ PROBLEMA:** Índices faltando

---

### 6. 🔗 VERIFICAR RESTRIÇÕES DE INTEGRIDADE

**Acesse:** Dashboard → Database → Table → cada tabela → Constraints

**Restrições que DEVEM existir:**
- [ ] `contacts`: `unique_user_phone` (user_id, phone_number)
- [ ] `usage_stats`: `unique_user_date` (user_id, date)
- [ ] `whatsapp_instances`: `unique_user_instance_name` (user_id, name)

**✅ SUCESSO:** Restrições aparecem na lista de constraints  
**❌ PROBLEMA:** Restrições faltando

---

### 7. 📧 VERIFICAR CONFIGURAÇÃO DE EMAIL

**Acesse:** Dashboard → Authentication → Settings → Auth Hooks

**Deve estar configurado:**
- [ ] **Send Email Hook** ativado
- [ ] URL: `https://hpovwcaskorzrpphgkc.supabase.co/functions/v1/send-welcome-email`
- [ ] HTTP Headers com Authorization configurado

**Teste manual:**
1. Crie um novo usuário
2. Verifique se recebeu email de boas-vindas
3. Confirme que o email está personalizado

**✅ SUCESSO:** Email enviado automaticamente  
**❌ PROBLEMA:** Sem email ou email genérico

---

### 8. 🔍 VERIFICAR DADOS ÓRFÃOS

**Execute as consultas SQL:**

```sql
-- 1. Usuários sem perfil
SELECT u.email 
FROM auth.users u 
LEFT JOIN profiles p ON u.id = p.id 
WHERE p.id IS NULL;

-- 2. Usuários sem assinatura
SELECT u.email 
FROM auth.users u 
LEFT JOIN subscriptions s ON u.id = s.user_id 
WHERE s.user_id IS NULL;

-- 3. Assinaturas sem plano válido
SELECT s.id 
FROM subscriptions s 
LEFT JOIN subscription_plans sp ON s.plan_id = sp.id 
WHERE sp.id IS NULL;

-- 4. Instâncias sem usuário válido
SELECT wi.name 
FROM whatsapp_instances wi 
LEFT JOIN auth.users u ON wi.user_id = u.id 
WHERE u.id IS NULL;
```

**✅ SUCESSO:** Todas as consultas retornam 0 resultados  
**❌ PROBLEMA:** Encontrados dados órfãos

---

## 🧪 TESTE END-TO-END COMPLETO

### Cenário: Novo usuário se cadastra

1. **Cadastro:**
   - [ ] Usuário acessa a aplicação
   - [ ] Clica em "Criar conta"
   - [ ] Preenche email e senha
   - [ ] Submete o formulário

2. **Automação deve funcionar:**
   - [ ] Trigger cria perfil automaticamente
   - [ ] Trigger cria assinatura Free automaticamente
   - [ ] Auth Hook envia email de boas-vindas
   - [ ] Usuário é redirecionado para dashboard

3. **Verificação manual:**
   - [ ] Verificar registro em `auth.users`
   - [ ] Verificar registro em `profiles`
   - [ ] Verificar registro em `subscriptions`
   - [ ] Verificar email recebido

**✅ SUCESSO:** Fluxo completo funciona sem intervenção manual  
**❌ PROBLEMA:** Algum passo falha ou requer intervenção manual

---

## 📋 RELATÓRIO DE STATUS

### ✅ ITENS CONCLUÍDOS:
- [x] Triggers de criação de usuário aplicados
- [x] Reparação de usuários órfãos
- [x] Políticas RLS básicas aplicadas
- [x] Script de limpeza completa executado
- [x] Validação do sistema via API

### ❌ ITENS PENDENTES:
- [ ] Configuração manual de Auth Hooks no dashboard
- [ ] Verificação de duplicatas de planos removidas
- [ ] Confirmação de índices de performance criados
- [ ] Validação de RLS completo em todas as tabelas
- [ ] Teste end-to-end do fluxo de cadastro

### ⚠️ BLOQUEADORES CRÍTICOS:
1. **Auth Hooks:** Emails automáticos dependem de configuração manual
2. **Conectividade:** Testes automatizados falharam por problemas de rede
3. **Validação manual:** Necessária verificação via dashboard Supabase

---

## 🎯 PRÓXIMOS PASSOS IMEDIATOS

### 🔴 FAZER AGORA (5 minutos):
1. Acessar dashboard Supabase
2. Ir em Authentication → Settings → Auth Hooks
3. Configurar Send Email Hook
4. Testar criação de um usuário

### 🟡 FAZER HOJE (30 minutos):
1. Executar todas as verificações deste checklist
2. Documentar quais itens estão funcionando
3. Corrigir eventuais problemas encontrados

### 🟢 FAZER ESTA SEMANA:
1. Monitorar performance das consultas
2. Implementar logs de auditoria
3. Configurar backup automático

---

## 📞 SUPORTE

**Em caso de problemas:**
1. Verificar logs do Supabase Dashboard
2. Consultar arquivos de correção em `/Users/jhonymonhol/Desktop/conversa-ai-brasil/`
3. Executar `node quick-check.cjs` para diagnóstico rápido
4. Revisar `RELATORIO-FINAL-BANCO-DADOS.md` para contexto completo

**Status atual:** Sistema operacional com melhorias pendentes ✅
