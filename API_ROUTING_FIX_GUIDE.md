# API Routing Fix - Production Configuration Guide

## 🚨 CRITICAL FIX APPLIED

### Problem Identified
The Evolution API routing in production was incorrectly directing calls to `https://ia.geni.chat/api/evolution/*` instead of using the correct Evolution API endpoint `https://cloudsaas.geni.chat/api/evolution/*`.

### Root Cause
In `src/services/whatsapp/secureApiClient.ts`, line 101 was using:
```typescript
const baseUrl = window.location.origin; // This resulted in "ia.geni.chat" in production
```

### Fix Applied
Changed to use environment variable with fallback:
```typescript
const baseUrl = import.meta.env.VITE_API_BASE_URL || window.location.origin;
```

## 🔧 CONFIGURATION REQUIRED

### 1. Local Development (.env.local)
```bash
# Frontend API Base URL - Controls which domain the frontend uses for API calls
VITE_API_BASE_URL=http://localhost:8080
```

### 2. Production (Vercel Environment Variables)
Set the following environment variable in your Vercel dashboard:

```bash
VITE_API_BASE_URL=https://ia.geni.chat
```

**How to set in Vercel:**
1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add new variable:
   - **Name:** `VITE_API_BASE_URL`
   - **Value:** `https://ia.geni.chat`
   - **Environment:** Production (and Preview if needed)

### 3. Understanding the Flow

#### ✅ CORRECT FLOW (After Fix):
```
Frontend (ia.geni.chat) 
  ↓ API call to: https://ia.geni.chat/api/evolution/instances
  ↓ Handled by: /api/evolution/instances.ts (Vercel API Route)
  ↓ Proxies to: https://cloudsaas.geni.chat/instance/fetchInstances
  ↓ Returns: Evolution API response
```

#### ❌ INCORRECT FLOW (Before Fix):
```
Frontend (ia.geni.chat) 
  ↓ API call to: https://ia.geni.chat/api/evolution/instances
  ↓ But window.location.origin caused: https://ia.geni.chat/api/evolution/instances
  ↓ Which tried to call Evolution API at: cloudsaas.geni.chat (WRONG routing)
```

## 🧪 TESTING

### Local Testing
1. Run the development server: `npm run dev`
2. Open `test-api-routing-fix.html` in browser
3. Click "Test API Routing" - should show localhost URLs

### Production Testing
1. Deploy to Vercel with the environment variable set
2. Open the test page on your production domain
3. Verify API calls use `ia.geni.chat` domain

## 📁 FILES MODIFIED

### 1. `src/services/whatsapp/secureApiClient.ts`
- **Line 101**: Changed from `window.location.origin` to `import.meta.env.VITE_API_BASE_URL || window.location.origin`
- **Impact**: All Evolution API calls now use configurable base URL

### 2. `.env.local` (Created/Updated)
- Added `VITE_API_BASE_URL=http://localhost:8080` for development

### 3. `.env.example` (Updated)
- Added documentation for `VITE_API_BASE_URL` variable
- Includes instructions for both development and production

## 🚀 DEPLOYMENT CHECKLIST

- [ ] **Environment Variable Set**: `VITE_API_BASE_URL=https://ia.geni.chat` in Vercel
- [ ] **Code Deployed**: Latest changes pushed and deployed
- [ ] **Testing Complete**: API routing test passes in production
- [ ] **Monitoring**: Check production logs for correct API calls

## 🔍 VERIFICATION

### Expected Production Behavior:
1. **Frontend calls**: `https://ia.geni.chat/api/evolution/instances`
2. **Vercel API Route** (`/api/evolution/instances.ts`) **receives call**
3. **Proxy forwards to**: `https://cloudsaas.geni.chat/instance/fetchInstances`
4. **Response flows back**: Evolution API → Vercel API Route → Frontend

### Signs of Success:
- ✅ No more 500 errors on Evolution API calls
- ✅ WhatsApp instance creation works
- ✅ QR code generation functions properly
- ✅ Instance status polling works correctly

### Signs of Problems:
- ❌ 500 errors on `/api/evolution/*` endpoints
- ❌ API calls still being routed incorrectly
- ❌ Evolution API authentication failures

## 💡 TECHNICAL NOTES

This fix ensures that:
1. **Development**: Uses `localhost:8080` for API calls (via `.env.local`)
2. **Production**: Uses `ia.geni.chat` for API calls (via Vercel env var)
3. **Fallback**: If environment variable not set, falls back to `window.location.origin`
4. **Security**: Evolution API key remains server-side only
5. **Flexibility**: Base URL can be changed without code modifications

The Vercel API Routes in `/api/evolution/` act as secure proxies that:
- Receive frontend requests at `ia.geni.chat/api/evolution/*`
- Add the secure `EVOLUTION_API_KEY` header
- Forward to the actual Evolution API at `cloudsaas.geni.chat`
- Return responses back to the frontend

This maintains security while fixing the routing issue.
