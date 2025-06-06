# 🔐 CORREÇÃO DE SEGURANÇA - Evolution API

## ⚠️ PROBLEMA DE SEGURANÇA IDENTIFICADO E CORRIGIDO

### 🚨 Problema Crítico
O código anterior estava tentando fazer chamadas **DIRETAS** da Evolution API no frontend, o que **EXPORIA A API KEY** no navegador do usuário.

### ❌ Código Problemático (ANTES):
```typescript
async callEvolutionAPIViaVercel<T>(endpoint: string, method: string = 'GET', data?: any): Promise<T> {
  const baseUrl = 'https://cloudsaas.geni.chat';
  
  // 🚨 PROBLEMA: Chamada direta com API key exposta
  const url = `${baseUrl}${endpoint}`;
  const fetchOptions: RequestInit = { 
    method, 
    headers: { 
      'Content-Type': 'application/json',
      'apikey': import.meta.env.VITE_EVOLUTION_API_KEY || '' // ❌ EXPOSTA NO FRONTEND!
    } 
  };
  
  // 🚨 Chamada direta = API key no navegador
  const response = await fetch(url, fetchOptions);
}
```

### ✅ Código Seguro (DEPOIS):
```typescript
async callEvolutionAPIViaVercel<T>(endpoint: string, method: string = 'GET', data?: any): Promise<T> {
  const baseUrl = window.location.origin; // Frontend domain
  
  // ✅ Mapeamento para endpoints Vercel (proxy seguro)
  let url = '';
  if (endpoint === '/instance/create') {
    url = `${baseUrl}/api/evolution/create-instance`;
  } else if (endpoint === '/instance/fetchInstances') {
    url = `${baseUrl}/api/evolution/instances`;
  }
  // ... outros mapeamentos
  
  // ✅ Chamada via proxy - API key fica no backend
  const response = await fetch(url, fetchOptions);
}
```

## 🛡️ ARQUITETURA DE SEGURANÇA

### Como Funciona o Proxy Seguro:

```
Frontend (ia.geni.chat)
    ↓ [SEM API KEY]
    /api/evolution/instances
    ↓
Vercel API Route
    ↓ [COM API KEY do process.env]
    https://cloudsaas.geni.chat/instance/fetchInstances
    ↓
Evolution API Server
    ↓
Response volta via proxy
    ↓
Frontend recebe dados
```

### 🔒 Proteções Implementadas:

1. **API Key no Backend Apenas**: 
   - `process.env.EVOLUTION_API_KEY` (servidor)
   - ❌ ~~`VITE_EVOLUTION_API_KEY`~~ (removida do .env)

2. **Proxy Seguro**:
   - Frontend → `/api/evolution/*` (Vercel API Routes)
   - Vercel → `https://cloudsaas.geni.chat` (com API key)

3. **Mapeamento de Endpoints**:
   - `/instance/fetchInstances` → `/api/evolution/instances`
   - `/instance/create` → `/api/evolution/create-instance`
   - `/instance/connect/{name}` → `/api/evolution/connect`
   - `/instance/info/{name}` → `/api/evolution/info?instance={name}`
   - `/instance/qrcode/{name}` → `/api/evolution/qrcode?instance={name}`
   - `/instance/connectionState/{name}` → `/api/evolution/status?instance={name}`
   - `/instance/delete/{name}` → `/api/evolution/delete`

## 📊 VERIFICAÇÃO DE ENDPOINTS

### Endpoints Vercel Existentes:
- ✅ `/api/evolution/create-instance.ts`
- ✅ `/api/evolution/connect.ts`
- ✅ `/api/evolution/instances.ts`
- ✅ `/api/evolution/info.ts`
- ✅ `/api/evolution/qrcode.ts`
- ✅ `/api/evolution/status.ts`
- ✅ `/api/evolution/delete.ts`

### Exemplo de Endpoint Seguro:
```typescript
// /api/evolution/instances.ts
export default async function handler(req: any, res: any) {
  // ✅ API key segura no backend
  const apiKey = process.env.EVOLUTION_API_KEY;
  const apiUrl = process.env.EVOLUTION_API_URL || 'https://cloudsaas.geni.chat';
  
  if (!apiKey) {
    return res.status(500).json({ error: 'EVOLUTION_API_KEY não configurada no backend' });
  }

  // ✅ Proxy seguro para Evolution API
  const response = await fetch(`${apiUrl}/instance/fetchInstances`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'apikey': apiKey, // ✅ Segura no backend
    },
  });
}
```

## 🧪 TESTES DE SEGURANÇA

### Arquivo de Teste:
- **`test-security-evolution-api.html`** - Valida que nenhuma API key é exposta

### Checklist de Segurança:
- [x] ✅ API key removida do frontend (`VITE_EVOLUTION_API_KEY` removida)
- [x] ✅ API key mantida apenas no backend (`EVOLUTION_API_KEY`)
- [x] ✅ Todas as chamadas passam por proxy Vercel
- [x] ✅ Endpoints mapeados corretamente
- [x] ✅ Nenhuma chamada direta da Evolution API no frontend

## 🚀 FLUXO CORRETO EM PRODUÇÃO

### Frontend (ia.geni.chat):
```javascript
// ✅ Chamada segura
secureApiClient.fetchInstances()
  ↓
callEvolutionAPIViaVercel('/instance/fetchInstances')
  ↓
fetch(`${window.location.origin}/api/evolution/instances`)
  ↓ 
// Vai para: https://ia.geni.chat/api/evolution/instances
```

### Backend (Vercel API Route):
```javascript
// ✅ Proxy seguro
/api/evolution/instances.ts
  ↓
fetch('https://cloudsaas.geni.chat/instance/fetchInstances', {
  headers: { 'apikey': process.env.EVOLUTION_API_KEY } // ✅ SEGURA
})
```

## ✅ RESULTADO FINAL

### Antes (❌ INSEGURO):
- API key exposta no frontend
- Chamadas diretas para Evolution API
- Vulnerabilidade de segurança crítica

### Depois (✅ SEGURO):
- API key apenas no backend
- Todas as chamadas via proxy Vercel
- Arquitetura de segurança robusta

---

**Status**: ✅ **SEGURANÇA IMPLEMENTADA**
**Próximo Passo**: Deploy e teste em produção
**Validação**: Verificar que as chamadas vão para `/api/evolution/*` e não diretamente para `cloudsaas.geni.chat`
