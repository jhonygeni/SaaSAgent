# 🔧 Ferramentas de Desenvolvimento

Esta pasta contém ferramentas de debug e desenvolvimento que **NÃO DEVEM** ser incluídas na build de produção.

## 📁 Arquivos

### `DebugPanel.tsx`
- Painel de debug para testar conectividade com Supabase
- Interface para resolver problemas de RLS (Row Level Security)
- Ferramentas para inserir dados de teste

### `testSupabaseRLS.ts`
- Utilitários para testar diferentes métodos de acesso ao RLS
- Diagnóstico de políticas de segurança
- Testes de inserção e leitura de dados

### `resolveRLS.ts`
- Funções para resolver automaticamente problemas de RLS
- Tentativas de login anônimo e verificação de sessões
- Criação de dados de teste para múltiplos usuários

### `test-rls-console.js`
- Script para executar no console do navegador
- Testes manuais de RLS e conectividade
- Diagnóstico interativo

### `debug-rls-policies.sql`
- Scripts SQL para verificar e configurar políticas RLS
- Comandos para resolver problemas de acesso
- Queries de diagnóstico do banco de dados

## 🚀 Como usar em desenvolvimento

1. **DebugPanel**: Importar temporariamente no componente que precisa de debug
2. **Scripts de teste**: Executar no console do navegador para diagnóstico
3. **Scripts SQL**: Executar no Supabase SQL Editor para verificar/corrigir RLS

## ⚠️ IMPORTANTE

**NUNCA** incluir esses arquivos na build de produção:
- Contêm ferramentas de debug sensíveis
- Podem expor informações de desenvolvimento
- São apenas para uso interno da equipe

## 📊 Status Atual

✅ **DebugPanel removido do dashboard principal**
✅ **Arquivos movidos para pasta separada**
✅ **Aplicação pronta para produção**

O sistema de sincronização de dados com Supabase está funcionando perfeitamente com fallback robusto para casos de RLS.
