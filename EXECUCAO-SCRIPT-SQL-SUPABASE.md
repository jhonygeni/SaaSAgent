# 🗄️ EXECUÇÃO DO SCRIPT SQL NO SUPABASE DASHBOARD

## 🚨 AÇÃO CRÍTICA NECESSÁRIA

O script `CORRECAO-ESTRUTURAL-COMPLETA.sql` deve ser executado **MANUALMENTE** no Supabase Dashboard para corrigir a estrutura do banco de dados.

## 📋 PASSO A PASSO PARA EXECUÇÃO

### 1. **Acessar o Supabase Dashboard**
- Acesse: https://supabase.com/dashboard
- Faça login com sua conta
- Selecione o projeto **SaaSAgent**

### 2. **Navegar para SQL Editor**
- No menu lateral, clique em **"SQL Editor"**
- Ou acesse diretamente: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql

### 3. **Executar o Script de Correção**
- Clique em **"New Query"**
- Copie todo o conteúdo do arquivo `CORRECAO-ESTRUTURAL-COMPLETA.sql` **(CORRIGIDO)**
- Cole no editor SQL
- Clique em **"Run"** ou pressione `Ctrl+Enter`

⚠️ **IMPORTANTE:** O arquivo foi corrigido para resolver o erro da coluna `prompt` que não existia na estrutura antiga.

### 4. **Verificar Execução Bem-Sucedida**
O script deve executar sem erros e mostrar:
```
✅ agents_backup criado
✅ whatsapp_instances recriada
✅ agents recriada  
✅ Dados migrados
✅ RLS habilitado
✅ Políticas criadas
✅ Triggers configurados
```

### 5. **Confirmar Estrutura Final**
Execute esta query para verificar:
```sql
SELECT 
  'whatsapp_instances' as tabela,
  COUNT(*) as registros
FROM public.whatsapp_instances
UNION ALL
SELECT 
  'agents' as tabela,
  COUNT(*) as registros  
FROM public.agents;
```

## 🔄 APÓS EXECUÇÃO DO SQL

1. **Reativar código corrigido**: Substituir `agentService.ts` pela versão corrigida
2. **Atualizar tipos TypeScript**: Regenerar tipos do Supabase
3. **Testar criação de nova instância**: Validar que dados são salvos corretamente
4. **Deploy para produção**: Configurar environment variables na Vercel

## ⚠️ IMPORTANTE

- **BACKUP AUTOMÁTICO**: O script faz backup na tabela `agents_backup`
- **EXECUÇÃO SEGURA**: Operações são reversíveis
- **SEM PERDA DE DADOS**: Migração automática preserva todos os dados existentes

## 📞 SUPORTE

Se houver algum erro durante a execução, salve o log completo e entre em contato.
