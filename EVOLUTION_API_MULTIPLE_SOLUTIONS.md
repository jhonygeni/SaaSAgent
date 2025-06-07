# Evolution API Serverless Function - Diagnóstico e Soluções

## Status Atual: TESTANDO MÚLTIPLAS ABORDAGENS

### Problema
- Função serverless `/api/evolution/instances` retorna `FUNCTION_INVOCATION_FAILED`
- Erro persiste apesar de múltiplas correções aplicadas

### Versões de Teste Criadas

#### 1. `instances.ts` (Principal - Versão Robusta)
- **Localização**: `/api/evolution/instances.ts`
- **Características**: 
  - Múltiplos fallbacks para fetch (globalThis.fetch → fetch → node-fetch)
  - Logging detalhado para cada método
  - Error handling robusto
  - Sem import estático de node-fetch

#### 2. `instances-ultra-simple.ts` (Versão Simplificada)
- **Localização**: `/api/evolution/instances-ultra-simple.ts`
- **Características**:
  - Import dinâmico de node-fetch
  - Logging extensivo
  - Tratamento de erro básico

#### 3. `instances-mock-only.ts` (Teste Básico)
- **Localização**: `/api/evolution/instances-mock-only.ts`
- **Características**:
  - **SEM chamadas HTTP** - apenas dados mock
  - Testa se o problema é na estrutura da função ou nas chamadas HTTP
  - Versão mais simples possível

#### 4. `instances-native-https.ts` (HTTPS Nativo)
- **Localização**: `/api/evolution/instances-native-https.ts`
- **Características**:
  - Usa módulo `https` nativo do Node.js
  - Elimina dependências externas
  - Timeout configurável
  - Logging detalhado da requisição

#### 5. `instances-simple.ts` (Versão Anterior)
- **Localização**: `/api/evolution/instances-simple.ts`
- **Características**:
  - Import estático de node-fetch
  - Versão intermediária de complexidade

### Estratégia de Teste

#### Fase 1: Teste de Estrutura Básica
1. **Testar `instances-mock-only.ts`**
   - Se falhar: problema na estrutura da função serverless
   - Se passar: problema nas chamadas HTTP

#### Fase 2: Teste de Conectividade
2. **Testar `instances-native-https.ts`**
   - Elimina problemas com node-fetch
   - Usa apenas módulos nativos do Node.js

#### Fase 3: Teste de Métodos Fetch
3. **Testar `instances.ts` (versão robusta)**
   - Múltiplos fallbacks para diferentes ambientes
   - Logging para identificar qual método funciona

#### Fase 4: Versões Alternativas
4. **Testar outras versões conforme necessário**

### Possíveis Causas Identificadas

#### ✅ Descartadas
- Conflito de arquivos JS/TS
- Problemas no vercel.json
- Configuração de TypeScript
- Variáveis de ambiente

#### 🔍 Investigando
1. **Import/Export Issues**
   - Problema com `import fetch from 'node-fetch'`
   - Conflito entre ESM/CommonJS

2. **Runtime Environment**
   - Vercel usando Node.js version incompatível
   - Fetch não disponível no runtime

3. **Memory/Timeout Limits**
   - Função excedendo limites de memória
   - Timeout na execução

4. **Network Connectivity**
   - Problema na conexão com Evolution API
   - Firewall/proxy bloqueando requests

### Arquivos de Diagnóstico
- `diagnose-crash.js` - Diagnóstico local completo
- `test-functions-direct.mjs` - Teste direto das funções
- `EVOLUTION_API_CRASH_INVESTIGATION.md` - Documentação do processo

### Próximos Passos

1. **Testar versão mock-only primeiro**
   - Confirmar se estrutura básica funciona
   
2. **Se mock funcionar, testar HTTPS nativo**
   - Eliminar dependências externas
   
3. **Comparar logs de diferentes versões**
   - Identificar onde exatamente falha
   
4. **Implementar solução robusta**
   - Usar a versão que funcionar mais consistentemente

### Observações Importantes
- Todas as versões têm logging extensivo
- Cada versão testa uma hipótese diferente
- Mantido fallbacks múltiplos na versão principal
- Pronto para teste incremental sem risk
