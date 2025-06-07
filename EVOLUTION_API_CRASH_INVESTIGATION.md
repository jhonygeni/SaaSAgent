# Evolution API Serverless Function Crash Investigation

## Status: INVESTIGANDO CAUSA RAIZ

### Problema Identificado
- As funções serverless estão retornando `FUNCTION_INVOCATION_FAILED` 
- O erro ocorre especificamente no endpoint `/api/evolution/instances`
- Apesar de todas as correções aplicadas, o problema persiste

### Correções Já Aplicadas
1. ✅ Removido conflito de arquivos JS/TS
2. ✅ Corrigido vercel.json (rewrite rules)
3. ✅ Aplicado sanitização de URLs
4. ✅ Adicionado node-fetch para compatibilidade
5. ✅ Removido Promise.race complexo
6. ✅ Simplificado tratamento de erros
7. ✅ Adicionado logging extensivo

### Arquivos de Teste Criados
- `/api/evolution/minimal-test.ts` - Teste básico sem HTTP calls
- `/api/evolution/environment-test.ts` - Teste de ambiente Node.js
- `/api/evolution/test-mock.ts` - Dados mock para teste
- `/api/evolution/instances-simple.ts` - Versão simplificada do endpoint

### Hipóteses Investigadas
1. **Conflito de Módulos**: ❌ Resolvido (removido api/package.json)
2. **Problema com fetch()**: ❌ Adicionado node-fetch 
3. **Timeout Issues**: ❌ Removido Promise.race
4. **TypeScript Compilation**: ❌ Sem erros de compilação
5. **Environment Variables**: ❌ Verificado e funcionando

### Próximos Passos
1. **Teste Local**: Usar Vercel CLI local para reproduzir o erro
2. **Logging Detalhado**: Adicionar mais pontos de log
3. **Teste Gradual**: Testar endpoint mais simples primeiro
4. **Memory/Timeout**: Verificar limites de função serverless

### Código Atual das Funções

#### instances.ts (Principais modificações)
```typescript
import fetch from 'node-fetch';

export default async function handler(req: any, res: any) {
  // Simplified version with basic fetch
  const response = await fetch(evolutionUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'apikey': apiKey,
    }
  });
  
  const data = await response.json();
  return res.status(response.ok ? 200 : response.status).json(data);
}
```

#### instances-simple.ts
```typescript
import fetch from 'node-fetch';

export default async function handler(req: any, res: any) {
  // Even simpler version without complex error handling
  const response = await fetch(url, { headers: { apikey } });
  const data = await response.json();
  return res.status(200).json(data);
}
```

### Possíveis Causas Remanescentes
1. **Runtime Incompatibility**: Node.js version mismatch
2. **Memory Limit**: Função excedendo limite de memória
3. **Network Issues**: Problema na chamada para Evolution API
4. **Import Issues**: Problema com import do node-fetch
5. **Vercel Configuration**: Configuração específica necessária

### Observações
- Funções compilam sem erros TypeScript
- Testes locais preparados mas precisam ser executados
- Arquivos de teste criados para diagnóstico gradual
- Documentação completa das tentativas de correção

## Recomendação
Antes do próximo deploy, executar todos os testes locais criados para identificar a causa raiz específica.
