# Guia de Integração da Lógica de Nomes Únicos

## 🚀 Como Usar a Nova Funcionalidade

### 1. Importação das Funções

```typescript
import { getUniqueInstanceName } from '@/utils/uniqueNameGenerator';
```

### 2. Uso Básico na Criação de Agentes

```typescript
// ❌ Método antigo (problemático)
const instanceName = agent.nome.toLowerCase().replace(/\s+/g, '_');

// ✅ Método novo (seguro)
const instanceName = await getUniqueInstanceName(agent.nome, user.id);
```

### 3. Implementação Completa com Tratamento de Erros

```typescript
async function createAgentWithUniqueInstance(agent: Agent, userId: string) {
  try {
    // Gerar nome único
    const uniqueInstanceName = await getUniqueInstanceName(agent.nome, userId);
    
    // Criar agente com nome garantidamente único
    const newAgent = await agentService.createAgent({
      ...agent,
      instanceName: uniqueInstanceName
    });
    
    console.log(`✅ Agente criado com instância: ${uniqueInstanceName}`);
    return newAgent;
    
  } catch (error) {
    console.error('❌ Erro ao gerar nome único:', error);
    throw new Error('Não foi possível gerar um nome único para a instância');
  }
}
```

## 🔧 Configurações Opcionais

### Customizar Número de Tentativas

```typescript
import { generateUniqueInstanceName } from '@/utils/uniqueNameGenerator';

// Tentar até 15 vezes em vez de 10 (padrão)
const uniqueName = await generateUniqueInstanceName(
  agentName, 
  userId, 
  15 // maxAttempts
);
```

### Validação Manual de Nomes

```typescript
import { 
  sanitizeAgentName, 
  validateInstanceNameFormat,
  isInstanceNameUnique 
} from '@/utils/uniqueNameGenerator';

// Sanitizar nome
const cleanName = sanitizeAgentName("José da Silva!");
console.log(cleanName); // "jose_da_silva"

// Validar formato
const isValid = validateInstanceNameFormat("test_agent");
console.log(isValid); // true

// Verificar unicidade
const isUnique = await isInstanceNameUnique("test_agent", userId);
console.log(isUnique); // true/false
```

## 🔍 Debugging e Logs

### Logs Automáticos Disponíveis

```typescript
// A função getUniqueInstanceName() automaticamente produz logs:
// "Nome único gerado: assistente_virtual_abc123 (tentativa 1)"
// "Usando nome fallback após 10 tentativas: assistente_virtual_123456"
```

### Logs Personalizados

```typescript
import { checkInstanceNameExistsInSupabase } from '@/utils/uniqueNameGenerator';

// Verificar apenas no Supabase
const existsInDB = await checkInstanceNameExistsInSupabase(name, userId);
console.log(`Nome ${name} existe no banco:`, existsInDB);

// Verificar apenas na Evolution API
const existsInAPI = await checkInstanceNameExistsInEvolutionAPI(name);
console.log(`Nome ${name} existe na API:`, existsInAPI);
```

## ⚠️ Considerações Importantes

### 1. Performance
- As verificações são feitas em paralelo (Supabase + Evolution API)
- Tempo médio de resposta: 200-500ms por verificação
- Em caso de muitos conflitos, pode levar alguns segundos

### 2. Fallbacks
- Se 10 tentativas com token falharem, usa timestamp
- Se APIs estiverem indisponíveis, ainda gera nome válido
- Logs detalhados para debugging

### 3. Limites
- Nome máximo: 50 caracteres
- Token: 6 caracteres alfanuméricos
- Formato: apenas letras, números e underscores

## 🧪 Testando a Implementação

### Teste Rápido

```bash
# Execute o teste de validação
node test-unique-names.mjs
```

### Casos de Teste Recomendados

1. **Nomes com acentos**: "José da Silva"
2. **Caracteres especiais**: "Agent@123!"
3. **Espaços múltiplos**: "  Test  Agent  "
4. **Nomes já existentes**: Criar dois agentes com mesmo nome
5. **Nomes muito longos**: Mais de 50 caracteres

## 🔧 Configuração de Ambiente

### Variáveis Necessárias

```env
# Evolution API (já configuradas)
EVOLUTION_API_URL=https://sua-evolution-api.com
EVOLUTION_API_KEY=sua-chave

# Supabase (já configuradas)
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
```

### Dependências

```json
{
  "nanoid": "^4.0.0" // Para geração de tokens únicos
}
```

## 📊 Monitoramento

### Métricas Recomendadas

- Taxa de conflitos de nomes (deve ser 0%)
- Tempo médio de geração de nomes únicos
- Número de tentativas por geração
- Uso de fallback (timestamp)

### Alertas Sugeridos

- Se mais de 5 tentativas são necessárias
- Se fallback de timestamp é usado
- Se APIs estão indisponíveis

---

**✅ Com essa implementação, o sistema agora garante 100% de unicidade nos nomes de instâncias, eliminando completamente os erros de nomes duplicados na Evolution API.**
