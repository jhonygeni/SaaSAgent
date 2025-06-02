# 🚀 Passos para Deploy em Produção

## Status Atual
✅ **Implementação Completa** - A correção da barra de progresso está 100% implementada e testada em desenvolvimento.
✅ **Código Funcionando** - Todos os arquivos modificados estão sem erros e funcionando corretamente.
✅ **Supabase CLI Instalado** - O CLI está configurado e conectado ao projeto `hpovwcaskorzzrpphgkc`.

## ⚠️ Próximo Passo Obrigatório: Deploy da Função Edge

A função `check-subscription` foi atualizada para incluir o campo `message_count`, mas ainda precisa ser deployada para produção.

### 1. Instalar Docker Desktop
```bash
# Baixe e instale Docker Desktop para macOS em:
# https://docs.docker.com/desktop/install/mac-install/
```

### 2. Deploy da Função Atualizada
```bash
cd /Users/jhonymonhol/Desktop/SaaSAgent-main
npx supabase functions deploy check-subscription
```

### 3. Verificar Deploy
```bash
# Teste a função em produção
curl -X POST 'https://hpovwcaskorzzrpphgkc.supabase.co/functions/v1/check-subscription' \
  -H 'Authorization: Bearer YOUR_USER_JWT_TOKEN' \
  -H 'Content-Type: application/json'
```

## 📋 Checklist Pós-Deploy

### Após o deploy da função:

1. **✅ Testar em Produção**
   - [ ] Fazer login no aplicativo
   - [ ] Verificar se a barra de progresso mostra valores corretos
   - [ ] Enviar algumas mensagens e verificar se o contador atualiza

2. **✅ Remover Sistema Mock**
   - [ ] Desabilitar o DebugPanel em produção
   - [ ] Remover imports do sistema mock
   - [ ] Limpar código de debug

3. **✅ Monitoramento**
   - [ ] Verificar logs da função no dashboard do Supabase
   - [ ] Confirmar que não há erros 500
   - [ ] Validar que `message_count` está sendo retornado

## 🔧 Arquivos Modificados

### Função Edge (Pronta para Deploy)
- `supabase/functions/check-subscription/index.ts` - Adicionada query de `message_count`

### Frontend (Já Deployado)
- `src/context/UserContext.tsx` - Processa o campo `message_count`
- `src/components/DebugPanel.tsx` - Sistema de debug (remover em produção)
- `src/lib/mock-subscription-data.ts` - Sistema mock (remover em produção)
- `src/App.tsx` - Import do DebugPanel (remover em produção)

## 🎯 Resultado Esperado

Após o deploy, a barra de progresso no `AgentChat.tsx` irá:
- ✅ Mostrar o número real de mensagens enviadas (ex: "25 / 100")
- ✅ Atualizar automaticamente após cada mensagem
- ✅ Refletir os limites corretos por plano (Free: 100, Starter: 1000, Growth: 5000)

## 🐛 Troubleshooting

Se após o deploy a barra ainda mostrar "0 / 100":

1. **Verificar logs da função**:
   ```bash
   npx supabase functions logs check-subscription
   ```

2. **Verificar resposta da API**:
   - Abra DevTools → Network
   - Procure por chamadas para `check-subscription`
   - Verifique se `message_count` está na resposta

3. **Verificar dados no banco**:
   ```sql
   SELECT user_id, message_count 
   FROM usage_stats 
   WHERE user_id = 'SEU_USER_ID';
   ```

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs da função no dashboard do Supabase
2. Confirme que o usuário tem registros na tabela `usage_stats`
3. Teste primeiro com o sistema mock para isolar o problema
