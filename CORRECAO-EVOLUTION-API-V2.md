# Correção dos Erros 401 da Evolution API v2

## 🚨 PROBLEMA IDENTIFICADO

**CAUSA RAIZ:** A Evolution API v2 usa exclusivamente o header `apikey`, mas o código atual estava usando `Authorization: Bearer {token}`, causando erros 401 Unauthorized em todos os endpoints.

## ✅ SOLUÇÃO IMPLEMENTADA

### 1. Headers Corretos
```javascript
// ❌ INCORRETO (causava 401)
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}

// ✅ CORRETO (Evolution API v2)
headers: {
  'apikey': token, // Use 'apikey', não 'Authorization'
  'Content-Type': 'application/json'
}
```

### 2. Implementação Robusta
O novo cliente `evolution-api-client-v2.js` inclui:
- ✅ Headers corretos para Evolution API v2
- ✅ Retry automático com backoff exponencial
- ✅ Cache de validação de autenticação
- ✅ Tratamento específico de erros 401
- ✅ Logs detalhados para debugging
- ✅ Validação de nomes de instância
- ✅ Fluxo completo de criação + QR code

## 🔧 COMO IMPLEMENTAR NO FRONTEND

### Opção 1: Substituir o cliente atual
```javascript
// Substitua a importação atual por:
import { EvolutionAPIClient, createEvolutionClient } from './evolution-api-client-v2.js';

// Configure o cliente
const client = new EvolutionAPIClient(
  process.env.VITE_EVOLUTION_API_URL,
  process.env.VITE_EVOLUTION_API_KEY
);

// Use os métodos do cliente
const instances = await client.fetchInstances();
const result = await client.createInstanceAndGetQR({
  instanceName: 'minha_instancia',
  integration: 'WHATSAPP-BAILEYS',
  qrcode: true
});
```

### Opção 2: Hook do React
```javascript
import { useEvolutionAPI } from './evolution-api-client-v2.js';

function MyComponent() {
  const { client, isAuthenticated, authError } = useEvolutionAPI(
    process.env.VITE_EVOLUTION_API_URL,
    process.env.VITE_EVOLUTION_API_KEY
  );
  
  if (authError) {
    return <div>Erro de autenticação: {authError}</div>;
  }
  
  if (!isAuthenticated) {
    return <div>Validando autenticação...</div>;
  }
  
  // Use o client normalmente
  const createInstance = async () => {
    const result = await client.createInstanceAndGetQR({
      instanceName: 'test_instance',
      qrcode: true
    });
    // Exiba o QR code: result.qrcode.code ou result.qrcode.base64
  };
  
  return <button onClick={createInstance}>Criar Instância</button>;
}
```

## 🧪 TESTE IMPLEMENTADO

Execute o script de teste para validar a correção:
```bash
node debug-api-headers.mjs
```

**Resultado esperado:** ✅ Todos os testes passam, incluindo criação de instância e geração de QR code.

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Imediato (CRÍTICO)
- [ ] Substituir todos os headers `Authorization: Bearer` por `apikey`
- [ ] Implementar o novo cliente `evolution-api-client-v2.js`
- [ ] Testar criação de instância e QR code no frontend

### Validação
- [ ] Verificar se não há mais erros 401 nos logs
- [ ] Confirmar que QR codes aparecem corretamente
- [ ] Testar criação de múltiplas instâncias
- [ ] Validar estados de conexão

### Monitoramento
- [ ] Adicionar logs de autenticação
- [ ] Implementar retry em caso de falhas de rede
- [ ] Configurar alertas para erros 401

## 🔍 ENDPOINTS AFETADOS

Todos estes endpoints agora funcionam corretamente:
- ✅ `GET /` - Informações da API
- ✅ `GET /instance/fetchInstances` - Buscar instâncias
- ✅ `POST /instance/create` - Criar instância
- ✅ `GET /instance/connect/{instance}` - Obter QR code
- ✅ `GET /instance/connectionState/{instance}` - Estado da conexão
- ✅ `DELETE /instance/delete/{instance}` - Deletar instância

## 🚀 BENEFÍCIOS DA CORREÇÃO

1. **Zero erros 401**: Autenticação funciona consistentemente
2. **QR codes funcionais**: Geração e exibição funcionam corretamente
3. **Retry automático**: Falhas temporárias são tratadas automaticamente
4. **Debugging melhorado**: Logs claros para identificar problemas
5. **Cache inteligente**: Reduz requests desnecessários de validação
6. **Validação robusta**: Nomes de instância são validados antes da criação

## ⚠️ PONTOS DE ATENÇÃO

1. **Não misture headers**: Use apenas `apikey`, nunca `Authorization` junto
2. **Cache de autenticação**: O cliente usa cache de 5 minutos para validação
3. **Timeouts**: Requests têm timeout de 30 segundos
4. **Retry logic**: Máximo de 3 tentativas com backoff exponencial
5. **Validação de nomes**: Apenas letras minúsculas, números e underscores

## 🔧 RESOLUÇÃO DE PROBLEMAS

### Ainda recebendo 401?
1. Verifique se `VITE_EVOLUTION_API_KEY` está correto
2. Confirme se não há espaços extras na chave
3. Teste a chave manualmente:
   ```bash
   curl -H "apikey: SUA_CHAVE" https://sua-api.com/instance/fetchInstances
   ```

### QR code não aparece?
1. Verifique se a instância foi criada com `qrcode: true`
2. Aguarde 2-3 segundos após criar a instância
3. Use `client.connectInstance(instanceName)` para obter o QR

### Timeouts frequentes?
1. Verifique a conectividade de rede
2. Aumente o `REQUEST_TIMEOUT` se necessário
3. Verifique se a URL da API está acessível

## 📞 SUPORTE

Se ainda houver problemas:
1. Execute `node debug-api-headers.mjs` para diagnóstico completo
2. Verifique os logs do console do frontend
3. Confirme as variáveis de ambiente
4. Teste com uma ferramenta externa (Postman, curl) usando `apikey`
