# Sistema de Logging Estruturado

Este documento descreve o sistema de logging estruturado implementado no SaaSAgent usando a biblioteca Winston.

## Visão Geral

O sistema de logging foi projetado para:

1. Fornecer logs estruturados com informações contextuais
2. Suportar diferentes níveis de logging (error, warn, info, http, debug, trace)
3. Armazenar logs em arquivos separados (erros e combinados)
4. Fornecer integração com componentes React e serviços de API
5. Facilitar a observabilidade e debugging

## Estrutura de Arquivos

```
src/lib/logging/
├── logger.ts                # Configuração principal do Winston
├── index.ts                 # Exportações e funções auxiliares
├── api-logger.ts            # Classes para logging de API
└── console-migration.ts     # Utilitários para migração de console.log
```

## Níveis de Log

O sistema usa os seguintes níveis de log (em ordem decrescente de severidade):

| Nível | Uso Recomendado |
|-------|-----------------|
| error | Erros críticos que impedem o funcionamento correto do sistema |
| warn  | Avisos sobre situações potencialmente problemáticas |
| info  | Informações gerais sobre o funcionamento normal do sistema |
| http  | Logs específicos para requisições HTTP |
| debug | Informações detalhadas úteis para debugging |
| trace | Logs extremamente detalhados para rastreamento |

## Como Utilizar

### Em Componentes React

Use o hook `useLogger`:

```tsx
import { useLogger } from '@/hooks/use-logger';

function MeuComponente() {
  const log = useLogger('MeuComponente');
  
  const handleClick = () => {
    log.info('Botão clicado', { buttonId: 'meu-botao' });
  };
  
  return <button onClick={handleClick}>Clique em mim</button>;
}
```

### Em Serviços e APIs

Use o `APILogger` ou a função auxiliar `withAPILogging`:

```tsx
import { APILogger, withAPILogging } from '@/lib/logging/api-logger';

// Opção 1: APILogger
const fetchData = async () => {
  const apiLogger = new APILogger('meuServico');
  
  try {
    apiLogger.request({ 
      method: 'GET', 
      endpoint: '/api/data' 
    });
    
    const data = await fetch('/api/data');
    const json = await data.json();
    
    apiLogger.success({ 
      method: 'GET', 
      endpoint: '/api/data',
      responseData: json,
      statusCode: 200
    });
    
    return json;
  } catch (error) {
    apiLogger.error({
      method: 'GET',
      endpoint: '/api/data',
      error,
      statusCode: error.status || 500
    });
    throw error;
  }
};

// Opção 2: withAPILogging
const fetchDataSimplified = () => withAPILogging(
  async () => {
    const response = await fetch('/api/data');
    return response.json();
  },
  {
    method: 'GET',
    endpoint: '/api/data',
    service: 'meuServico'
  }
);
```

### Uso Direto do Logger

Em casos onde não se aplica usar o hook ou as classes de API:

```tsx
import { logger } from '@/lib/logging';

logger.info('Mensagem importante', { 
  contexto: 'algum contexto',
  dados: { chave: 'valor' }
});
```

## Migração de console.log

Para facilitar a migração gradual de `console.log` para logging estruturado:

```tsx
import log from '@/lib/logging/console-migration';

// Em vez de:
// console.log('Mensagem', dados);

// Use:
log.info('Mensagem', dados);
```

## Manutenção de Logs

- Os logs são armazenados no diretório `logs/`
- Logs de erro: `logs/error.log`
- Todos os logs: `logs/combined.log`

### Scripts disponíveis:

- `npm run setup:logs` - Configura o diretório de logs
- `npm run logs:clean` - Limpa todos os logs

## Boas Práticas

1. **Seja específico nas mensagens**: Use mensagens descritivas que facilitem o diagnóstico.

2. **Inclua contexto relevante**: Adicione dados estruturados úteis para debugging.

3. **Use o nível adequado**: Não use `error` para informações não críticas ou `debug` para erros importantes.

4. **Evite dados sensíveis**: Nunca logue senhas, tokens ou informações pessoais.

5. **Identifique o componente**: Sempre especifique qual componente ou módulo está gerando o log.

## Exemplos práticos

### Logging de operações assíncronas:

```tsx
const { measurePerformance } = useLogger('MeuComponente');

const resultado = await measurePerformance(
  async () => await fetchComplicatedData(),
  'busca-dados-complicados'
);
```

### Logging com contexto adicional:

```tsx
const log = useLogger('MeuComponente');

// Adicionar contexto temporário a logs específicos
const logComCtx = log.withContext({ 
  operacao: 'registro-usuario',
  fluxo: 'onboarding' 
});

logComCtx.info('Iniciando registro');
// restante do código...
logComCtx.info('Registro concluído');
```
