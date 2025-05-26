// Test script for webhook communication with n8n
import fetch from 'node-fetch';
import crypto from 'crypto';

const webhookUrl = 'https://webhooksaas.geni.chat/webhook/principal';
const webhookSecret = process.env.WEBHOOK_SECRET || 'conversa-ai-n8n-token-2024';

// Generate an idempotency key to prevent duplicate webhook processing
const generateIdempotencyKey = (instanceName, userId) => {
  return `test-${instanceName}-${userId}-${Date.now()}`;
};

// Calculate delay with exponential backoff
function calculateDelay(attempt, baseDelay, exponentialBackoff) {
  if (exponentialBackoff) {
    return baseDelay * Math.pow(2, attempt - 1);
  }
  return baseDelay;
}

// Send webhook with retries
async function sendWithRetries(url, data, options = {}) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    idempotencyKey,
    timeout = 10000,
    exponentialBackoff = true,
    instanceName,
    phoneNumber,
    headers = {}
  } = options;

  let lastError;
  const startTime = Date.now();
  let finalStatus = 0;
  let totalRetries = 0;

  console.log(`[TEST] Sending webhook to ${url}`);
  console.log(`[TEST] Payload: ${JSON.stringify(data, null, 2).substring(0, 200)}...`);

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Callback for retry (if not the first attempt)
      if (attempt > 0) {
        totalRetries = attempt;
        console.log(`[TEST] Retry attempt ${attempt + 1}/${maxRetries + 1}`);
      }

      // Delay before retry (if not the first attempt)
      if (attempt > 0) {
        const delay = calculateDelay(attempt, retryDelay, exponentialBackoff);
        console.log(`[TEST] Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      const requestHeaders = {
        "Content-Type": "application/json",
        "User-Agent": "ConverseAI-Webhook/1.0",
        "X-Webhook-Source": "conversa-ai-brasil-test",
        "Authorization": `Bearer ${webhookSecret}`,
        ...headers
      };

      if (idempotencyKey) {
        requestHeaders["X-Idempotency-Key"] = idempotencyKey;
      }

      console.log(`[TEST] Request headers: ${JSON.stringify(requestHeaders)}`);

      // Make request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify(data),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      finalStatus = response.status;

      console.log(`[TEST] Response status: ${response.status}`);

      if (response.ok) {
        let responseData;
        try {
          const textResponse = await response.text();
          console.log(`[TEST] Response body: ${textResponse}`);
          responseData = textResponse ? JSON.parse(textResponse) : {};
        } catch (e) {
          console.log(`[TEST] Warning: Could not parse response as JSON`);
          responseData = {};
        }

        const duration = Date.now() - startTime;
        console.log(`[TEST] Success in ${duration}ms (attempt ${attempt + 1})`);

        return {
          success: true,
          data: responseData
        };
      }

      lastError = {
        status: response.status,
        message: `Server responded with status ${response.status}: ${response.statusText}`
      };

      // Check if we should retry
      if (!(response.status === 408 || response.status === 429 || response.status >= 500)) {
        console.log(`[TEST] Non-retryable error (${response.status}), not retrying`);
        break;
      }

    } catch (error) {
      lastError = {
        message: error.message || "Network error occurred"
      };

      console.error(`[TEST] Attempt ${attempt + 1}/${maxRetries + 1} failed:`, error.message);
    }
  }

  const duration = Date.now() - startTime;
  console.error(`[TEST] All attempts failed in ${duration}ms:`, lastError);

  // All attempts failed
  return {
    success: false,
    error: lastError
  };
}

async function testWebhookCommunication() {
  const testPayload = {
    usuario: "test-user-id",
    plano: "premium",
    status_plano: "ativo",
    nome_instancia: "test-instance",
    telefone_instancia: "5511999999999",
    nome_agente: "Agente de Teste",
    site_empresa: "https://example.com",
    area_atuacao: "Tecnologia",
    info_empresa: "Empresa de teste para webhook",
    prompt_agente: "Este é um agente de teste para verificar a comunicação de webhooks",
    faqs: [
      { pergunta: "O que é isso?", resposta: "Um teste de webhook" },
      { pergunta: "Está funcionando?", resposta: "Estamos verificando" }
    ],
    nome_remetente: "Usuario Teste",
    telefone_remetente: "5511888888888",
    mensagem: "Esta é uma mensagem de teste para verificar a comunicação de webhooks",
    timestamp: new Date().toISOString()
  };

  console.log("[TEST] Starting webhook communication test");

  const idempotencyKey = generateIdempotencyKey("test-instance", "test-user-id");
  const result = await sendWithRetries(
    webhookUrl,
    testPayload,
    {
      maxRetries: 3,
      retryDelay: 1000,
      idempotencyKey,
      timeout: 15000,
      exponentialBackoff: true,
      instanceName: testPayload.nome_instancia,
      phoneNumber: testPayload.telefone_remetente
    }
  );

  console.log("[TEST] Test completed with result:", result);

  if (result.success) {
    console.log("[TEST] ✅ Webhook communication test PASSED");
  } else {
    console.log("[TEST] ❌ Webhook communication test FAILED");
    console.log("[TEST] Error details:", result.error);
    
    if (result.error.status === 403) {
      console.log("[TEST] 403 Forbidden suggests authentication issues. Check webhook token and Authorization header.");
    } else if (result.error.status === 400) {
      console.log("[TEST] 400 Bad Request suggests payload formatting issues. Check payload structure.");
    }
  }
}

// Run the test
testWebhookCommunication().catch(error => {
  console.error("[TEST] Unhandled error during test:", error);
  process.exit(1);
});
