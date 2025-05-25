# 🚨 CORREÇÃO URGENTE - EXECUTE AGORA

## O QUE FAZER:

### 1. ABRIR CONSOLE SQL DO SUPABASE
👉 Acesse: https://app.supabase.com/project/hpovwcaskorzzrpphgkc/sql

### 2. EXECUTAR SEÇÕES DO SCRIPT

**Arquivo para usar:** `EXECUTE-FIXES-SIMPLE-v2.sql`

**EXECUTE SEÇÃO POR SEÇÃO** (não tudo de uma vez):

#### SEÇÃO 1 - CRÍTICO ⚠️
```sql
-- Copie e cole tudo da SEÇÃO 1 (linhas 12-119)
-- Esta seção corrige o trigger que cria usuários automaticamente
```

#### SEÇÃO 2 - REPARAR USUÁRIOS
```sql  
-- Copie e cole tudo da SEÇÃO 2 (linhas 121-207)
-- Esta seção repara usuários que já existem sem perfil/assinatura
```

#### SEÇÃO 3 - PERFORMANCE (Opcional)
```sql
-- Copie e cole SEÇÃO 3 (linhas 209-239) 
-- Melhora a performance das consultas
```

#### SEÇÃO 4 - SEGURANÇA (Opcional)
```sql
-- Copie e cole SEÇÃO 4 (linhas 241-273)
-- Adiciona políticas de segurança RLS
```

#### SEÇÃO 5 - VALIDAR TUDO
```sql
-- Copie e cole SEÇÃO 5 (linhas 275-fim)
-- Verifica se tudo funcionou
```

## RESULTADO ESPERADO:
- ✅ Trigger de usuários funcionando
- ✅ Usuários existentes reparados  
- ✅ Plano "Free" criado e ativo
- ✅ Novos usuários terão perfil + assinatura automaticamente

## SE DER ERRO:
1. Anote qual seção deu erro
2. Pule para a próxima seção  
3. Execute até o final
4. Me informe quais erros ocorreram

## TESTE FINAL:
Após executar tudo, teste criando um novo usuário para ver se funciona automaticamente.

---
**TEMPO ESTIMADO:** 5-10 minutos
**PRIORIDADE:** CRÍTICA - Execute o quanto antes!
