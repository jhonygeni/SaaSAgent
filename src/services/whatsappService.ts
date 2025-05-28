import { 
  EVOLUTION_API_URL, 
  EVOLUTION_API_KEY, 
  USE_MOCK_DATA,
  ENDPOINTS 
} from '@/constants/api';
import { 
  WebhookConfigResponse, 
  ConnectionStateResponse, 
  QrCodeResponse,
  InstanceInfo,
  InstancesListResponse,
  WhatsAppInstanceRequest,
  WhatsAppInstanceResponse
} from '@/services/whatsapp/types';
import { apiClient, formatEndpoint } from '@/services/whatsapp/apiClient';
import { supabase } from '@/integrations/supabase/client';

/**
 * Service for WhatsApp API interactions
 */
const whatsappService = {
  /**
   * Configure webhook for an instance
   * Must be called immediately after successful instance creation
   * Updated to use Evolution API v2 format
   */
  configureWebhook: async (instanceName: string): Promise<WebhookConfigResponse> => {
    try {
      console.log(`Configuring webhook for instance: ${instanceName}`);
      if (USE_MOCK_DATA) {
        console.warn("MOCK MODE IS ACTIVE - This should never be used in production!");
        return {
          status: "success",
          message: "Webhook configured successfully (mock)",
          webhook: {
            enabled: true,
            url: "https://webhooksaas.geni.chat/webhook/principal",
            events: ["MESSAGES_UPSERT"]
          }
        };
      }
      const endpoint = formatEndpoint(ENDPOINTS.webhookConfig, { instanceName });
      console.log("Webhook configuration URL:", `${apiClient.baseUrl}${endpoint}`);
      // Padronizar payload para Evolution API v2 (sem campos legados)
      const webhookConfig = {
        webhook: {
          url: "https://webhooksaas.geni.chat/webhook/principal",
          byEvents: true,
          base64: false,
          events: ["MESSAGES_UPSERT", "MESSAGE_UPDATE"]
        }
      };
      const data = await apiClient.post<WebhookConfigResponse>(endpoint, webhookConfig);
      console.log("Webhook configuration successful:", data);
      return data;
    } catch (error) {
      console.error("Error configuring webhook:", error);
      throw error;
    }
  },

  /**
   * Configure instance settings with recommended defaults
   * Must be called after successful instance creation and connection
   * Configures settings like rejectCall, alwaysOnline, readMessages, etc.
   */
  configureInstanceSettings: async (instanceName: string): Promise<any> => {
    try {
      console.log(`Configuring instance settings for: ${instanceName}`);
      
      if (USE_MOCK_DATA) {
        console.warn("MOCK MODE IS ACTIVE - This should never be used in production!");
        return {
          status: "success",
          message: "Instance settings configured successfully (mock)",
          settings: {
            rejectCall: true,
            alwaysOnline: true,
            readMessages: true
          }
        };
      }

      const endpoint = formatEndpoint(ENDPOINTS.settingsConfig, { instanceName });
      console.log("Instance settings configuration URL:", `${apiClient.baseUrl}${endpoint}`);
      
      // Configurações recomendadas para todas as instâncias
      const instanceSettings = {
        rejectCall: true,
        msgCall: "Chamadas não são aceitas neste número. Por favor, envie uma mensagem de texto.",
        groupsIgnore: true,
        alwaysOnline: true,
        readMessages: true,
        readStatus: true,
        syncFullHistory: true
      };

      let response;
      
      // Primary attempt with apiClient
      try {
        response = await apiClient.post(endpoint, instanceSettings);
        console.log("Instance settings configuration successful via apiClient:", response);
      } catch (apiError) {
        console.warn("API client post failed for settings, trying direct fetch:", apiError);
        
        // Check if this was an authentication error (401/403)
        if (apiError.name === 'AuthenticationError' || 
            (apiError instanceof Error && 
             (apiError.message.includes('401') || apiError.message.includes('403')))) {
          throw new Error(
            `Falha na autenticação com Evolution API ao configurar settings. Verifique se seu token está correto e ativo no painel Evolution API. ` +
            `Status: ${apiError.status || 401}. ` +
            `Detalhes: Por favor, verifique a variável de ambiente EVOLUTION_API_KEY.`
          );
        }
        
        // Fallback: Direct fetch with 'apikey' header (Evolution API v2 standard)
        const directResponse = await fetch(`${EVOLUTION_API_URL}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': EVOLUTION_API_KEY,
            'Accept': 'application/json'
          },
          body: JSON.stringify(instanceSettings)
        });
        
        if (!directResponse.ok) {
          // Special handling for 401/403 errors
          if (directResponse.status === 401 || directResponse.status === 403) {
            throw new Error(
              `Falha na autenticação com Evolution API (${directResponse.status}) ao configurar settings. ` +
              `Verifique seu token no painel Evolution API e atualize a variável de ambiente EVOLUTION_API_KEY.`
            );
          }
          throw new Error(`API error: ${directResponse.status} ${directResponse.statusText}`);
        }
        
        response = await directResponse.json();
        console.log("Instance settings configuration successful via direct fetch:", response);
      }
      
      return response;
    } catch (error) {
      console.error("Error configuring instance settings:", error);
      throw error;
    }
  },

  // Função utilitária para normalizar resposta de QR code
  normalizeQrCodeResponse: (response: any) => {
    // Padroniza o campo do QR code para sempre ser 'qrcode' e 'base64' se disponível
    let normalized = { ...response };
    
    // Extract QR code data from various possible fields
    let qrCodeData = null;
    
    if (normalized.qrcode) {
      qrCodeData = normalized.qrcode;
    } else if (normalized.qr) {
      qrCodeData = normalized.qr;
      normalized.qrcode = normalized.qr;
    } else if (normalized.qrCode) {
      qrCodeData = normalized.qrCode;
      normalized.qrcode = normalized.qrCode;
    } else if (normalized.data?.qrcode) {
      qrCodeData = normalized.data.qrcode;
      normalized.qrcode = normalized.data.qrcode;
    } else if (normalized.data?.base64) {
      qrCodeData = normalized.data.base64;
      normalized.qrcode = normalized.data.base64;
    }
    
    // Validate QR code data
    if (qrCodeData && typeof qrCodeData === 'string') {
      // Check for reasonable length (QR codes shouldn't be extremely long)
      if (qrCodeData.length > 2000) {
        console.warn(`QR code data suspiciously long (${qrCodeData.length} chars). Possible API error.`);
        console.warn('QR data preview:', qrCodeData.substring(0, 100) + '...');
        
        // Try to extract actual QR data if it's embedded in a larger response
        const qrMatch = qrCodeData.match(/^[A-Za-z0-9+/]+=*$/);
        if (qrMatch) {
          normalized.qrcode = qrMatch[0];
        } else {
          // If no valid QR pattern found, mark as invalid
          console.error('QR code data does not match expected format');
          normalized.qrcode = null;
          normalized.error = 'Invalid QR code format received from API';
        }
      } else {
        normalized.qrcode = qrCodeData;
      }
    }
    
    // Handle base64 field
    if (!normalized.base64 && normalized.data?.base64) {
      normalized.base64 = normalized.data.base64;
    }
    
    return normalized;
  },

  // Check API health by using multiple methods
  checkApiHealth: async (): Promise<boolean> => {
    try {
      console.log("Checking API health with multiple fallback mechanisms");
      
      // Try method 1: Use apiClient to check root endpoint
      try {
        const rootResponse = await apiClient.get<any>(""); // Root endpoint with explicit any type
        if (rootResponse) {
          console.log("API health check passed using root endpoint");
          return true;
        }
      } catch (error1) {
        console.log("Method 1 failed, trying next method");
      }
      
      // Try method 2: Direct fetch with minimal options
      try {
        const directResponse = await fetch(EVOLUTION_API_URL, {
          method: 'GET',
          headers: { 
            'apikey': EVOLUTION_API_KEY,
            'Accept': 'application/json'
          }
        });
        
        if (directResponse.ok) {
          console.log("API health check passed using direct fetch");
          return true;
        }
      } catch (error2) {
        console.log("Method 2 failed, trying next method");
      }
      
      // Try method 3: Fetch instances as a final check
      try {
        const endpoint = ENDPOINTS.fetchInstances;
        const instancesResponse = await apiClient.get<any>(endpoint); // Add explicit any type
        if (instancesResponse) {
          console.log("API health check passed using instances endpoint");
          return true;
        }
      } catch (error3) {
        console.log("Method 3 failed, API is likely down");
      }
      
      // If we get here, all methods failed
      console.error("API health check failed with all methods");
      return false;
    } catch (error) {
      console.error("API health check failed with unexpected error:", error);
      return false;
    }
  },

  // Get connection status for an instance
  getConnectionState: async (instanceName: string): Promise<ConnectionStateResponse> => {
    try {
      const endpoint = formatEndpoint(ENDPOINTS.connectionState, { instanceName });
      console.log(`Getting connection state from endpoint: ${endpoint}`);
      
      const response = await apiClient.get<ConnectionStateResponse>(endpoint);
      console.log(`Connection state response for ${instanceName}:`, response);
      
      // Store connection state in Supabase if possible
      try {
        // Check if user is logged in
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          // Extract state from any of the possible response formats
          const state = response?.state || 
                      (response?.instance?.state) || 
                      response?.status || 
                      "unknown";
                      
          const { error } = await supabase
            .from('whatsapp_instances')
            .update({ 
              status: state,
              updated_at: new Date().toISOString()
            })
            .eq('name', instanceName)
            .eq('user_id', user.id);
            
          if (error) {
            console.error("Error updating connection state in Supabase:", error);
          }
        }
      } catch (saveError) {
        console.error("Failed to save connection state to Supabase:", saveError);
      }
      
      return response;
    } catch (error) {
      console.error(`Error getting connection state for ${instanceName}:`, error);
      throw error;
    }
  },

  // Create a new WhatsApp instance
  createInstance: async (instanceName: string, userId?: string) => {
    try {
      console.log(`Attempting to create WhatsApp instance: ${instanceName}`);
      
      const endpoint = ENDPOINTS.instanceCreate;
      const instanceData: WhatsAppInstanceRequest = {
        instanceName,
        // IMPORTANTE: Use exatamente o valor correto para o parâmetro de integração
        integration: "WHATSAPP-BAILEYS", 
        token: userId || "default_user",
        qrcode: true,
        webhook: {
          enabled: true,
          url: "https://webhooksaas.geni.chat/webhook/principal",
          events: ["MESSAGES_UPSERT"]
        }
      };
      
      console.log("Creating instance with exact data:", JSON.stringify(instanceData, null, 2));
      console.log("API URL:", EVOLUTION_API_URL);
      console.log("API Key (first 4 chars):", EVOLUTION_API_KEY ? EVOLUTION_API_KEY.substring(0, 4) + "..." : "Missing");
      
      // Try to create instance using corrected Evolution API v2 authentication
      let response: WhatsAppInstanceResponse;
      
      // Primary attempt with apiClient (uses correct 'Authorization: Bearer' header)
      try {
        response = await apiClient.post<WhatsAppInstanceResponse>(endpoint, instanceData);
      } catch (apiError) {
        console.warn("API client post failed, trying direct fetch:", apiError);
        
        // Check if this was an authentication error (401/403)
        if (apiError.name === 'AuthenticationError' || 
            (apiError instanceof Error && 
             (apiError.message.includes('401') || apiError.message.includes('403')))) {
          throw new Error(
            `Falha na autenticação com Evolution API. Verifique se seu token está correto e ativo no painel Evolution API. ` +
            `Status: ${apiError.status || 401}. ` +
            `Detalhes: Por favor, verifique a variável de ambiente EVOLUTION_API_KEY.`
          );
        }
        
        // Fallback: Direct fetch with 'apikey' header (Evolution API v2 standard)
        const directResponse = await fetch(`${EVOLUTION_API_URL}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': EVOLUTION_API_KEY,
            'Accept': 'application/json'
          },
          body: JSON.stringify(instanceData)
        });
        
        if (!directResponse.ok) {
          // Special handling for 401/403 errors
          if (directResponse.status === 401 || directResponse.status === 403) {
            throw new Error(
              `Falha na autenticação com Evolution API (${directResponse.status}). ` +
              `Verifique seu token no painel Evolution API e atualize a variável de ambiente EVOLUTION_API_KEY.`
            );
          }
          throw new Error(`API error: ${directResponse.status} ${directResponse.statusText}`);
        }
        
        response = await directResponse.json();
      }
      
      // ETAPA ADICIONAL: Configurar automaticamente as configurações da instância
      try {
        console.log(`Configuring instance settings automatically for: ${instanceName}`);
        await whatsappService.configureInstanceSettings(instanceName);
        console.log(`Instance settings configured successfully for: ${instanceName}`);
      } catch (settingsError) {
        console.warn(`Failed to configure instance settings for ${instanceName}:`, settingsError);
        // Não falhar a criação da instância se as configurações falharem
        // A instância ainda foi criada com sucesso, apenas as configurações não foram aplicadas
        console.log("Instance creation was successful, but settings configuration failed. The instance will work with default settings.");
      }

      // Store instance data in Supabase if possible
      if (userId) {
        try {
          // Convert the complex object to a JSON-compatible structure
          const sessionData = JSON.parse(JSON.stringify(response));
          
          const { error } = await supabase
            .from('whatsapp_instances')
            .upsert({
              name: instanceName,
              user_id: userId,
              status: 'created',
              evolution_instance_id: response.instance?.instanceId || null,
              session_data: sessionData,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
            
          if (error) {
            console.error("Error saving instance data to Supabase:", error);
          }
        } catch (saveError) {
          console.error("Failed to save instance data to Supabase:", saveError);
        }
      }
      
      return response;
    } catch (error) {
      console.error(`Error creating instance ${instanceName}:`, error);
      throw error;
    }
  },

  // Get the QR code for an instance using the correct connect endpoint
  getQrCode: async (instanceName: string): Promise<QrCodeResponse> => {
    try {
      const endpoint = formatEndpoint(ENDPOINTS.instanceConnectQR, { instanceName });
      console.log(`Getting QR code using connect endpoint: ${endpoint}`);
      let response;
      const authHeaders = {
        'apikey': EVOLUTION_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      try {
        response = await apiClient.get<QrCodeResponse>(endpoint);
      } catch (apiError) {
        console.warn(`Failed to get QR code using apiClient: ${apiError}`);
        
        // Check if this was an authentication error (401/403)
        if (apiError.name === 'AuthenticationError' || 
            (apiError instanceof Error && 
             (apiError.message.includes('401') || apiError.message.includes('403')))) {
          throw new Error(
            `Falha na autenticação com Evolution API. Seu token não foi aceito pelo servidor. ` +
            `Status: ${apiError.status || 401}. ` +
            `Por favor, verifique se o token está correto e ativo no painel Evolution API.`
          );
        }
        
        // Try direct fetch with all auth headers at once
        try {
          console.log(`Trying comprehensive fetch approach for QR code`);
          const directResponse = await fetch(`${EVOLUTION_API_URL}${endpoint}`, {
            method: 'GET',
            headers: authHeaders
          });
          
          if (!directResponse.ok) {
            // Special handling for 401/403 errors
            if (directResponse.status === 401 || directResponse.status === 403) {
              throw new Error(
                `Falha na autenticação com Evolution API (${directResponse.status}). ` +
                `Seu token não é válido ou expirou. Verifique-o no painel Evolution e atualize a variável EVOLUTION_API_KEY.`
              );
            }
            throw new Error(`Direct fetch failed: ${directResponse.status}`);
          }
          
          response = await directResponse.json();
        } catch (directError) {
          console.warn(`All fetch attempts failed: ${directError}`);
          throw new Error(`Failed to get QR code: ${directError.message}`);
        }
      }
      // Normalizar resposta do QR code
      response = whatsappService.normalizeQrCodeResponse(response);
      console.log(`QR code response for ${instanceName}:`, JSON.stringify(response, null, 2));
      
      // Ensure we have a valid QR code in the response
      if (!response.qrcode && !response.base64 && !response.code) {
        console.warn(`No QR code found in response for ${instanceName}. Response keys:`, Object.keys(response));
      }
      
      // Save QR code to Supabase if possible
      try {
        // Check if user is logged in
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id && (response.code || response.qrcode || response.base64)) {
          const qrCode = response.code || response.qrcode || response.base64;
          
          const { error } = await supabase
            .from('whatsapp_instances')
            .update({ 
              qr_code: qrCode,
              updated_at: new Date().toISOString()
            })
            .eq('name', instanceName)
            .eq('user_id', user.id);
            
          if (error) {
            console.error("Error saving QR code to Supabase:", error);
          }
        }
      } catch (saveError) {
        console.error("Failed to save QR code to Supabase:", saveError);
      }
      
      return response;
    } catch (error) {
      console.error(`Error getting QR code for ${instanceName}:`, error);
      throw error;
    }
  },

  // Get information about an instance with anti-loop protection
  getInstanceInfo: async (instanceName: string, attempt = 1, maxAttempts = 3): Promise<InstanceInfo> => {
    try {
      console.log(`Getting instance info for ${instanceName} (attempt ${attempt}/${maxAttempts})`);
      
      // Anti-loop: verificar se já excedeu tentativas máximas
      if (attempt > maxAttempts) {
        console.warn(`Máximo de tentativas (${maxAttempts}) excedido para ${instanceName}. Retornando dados parciais.`);
        // Retorna objeto vazio mas com estrutura válida para não quebrar UI
        return {
          instance: {
            name: instanceName,
            status: "disconnected",
            isConnected: false
          }
        } as InstanceInfo;
      }
      
      const endpoint = formatEndpoint(ENDPOINTS.instanceInfo, { instanceName });
      
      // Timeout maior para instâncias novas
      const timeoutMs = 8000 + (attempt * 2000); // 8s, 10s, 12s...
      
      try {
        const response = await apiClient.get<InstanceInfo>(endpoint);
        
        // Verificar se temos dados reais ou resposta vazia
        if (!response || !response.instance) {
          throw new Error("Resposta sem dados válidos da instância");
        }
        
        // If we have a phone number, update Supabase
        if (response?.instance?.user?.id) {
          try {
            // Extract phone number from user.id (format: "number@s.whatsapp.net")
            const phoneNumber = response.instance.user.id.split('@')[0];
            
            // Check if user is logged in
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.id && phoneNumber) {
              const { error } = await supabase
                .from('whatsapp_instances')
                .update({ 
                  phone_number: phoneNumber,
                  status: 'connected',
                  updated_at: new Date().toISOString()
                })
                .eq('name', instanceName)
                .eq('user_id', user.id as string);
                
              if (error) {
                console.error("Error saving phone number to Supabase:", error);
              }
            }
          } catch (saveError) {
            console.error("Failed to save phone number to Supabase:", saveError);
          }
        }
        
        return response;
      } catch (apiError) {
        // Se for erro 404 para instância nova, podemos esperar e tentar novamente
        // Isso acontece quando a instância ainda está inicializando
        if (apiError.status === 404 || 
            (apiError instanceof Error && apiError.message.includes("404"))) {
          
          console.warn(`Instância ${instanceName} não encontrada (404). Pode estar inicializando.`);
          
          // Backoff exponencial antes da próxima tentativa
          const delayMs = Math.min(1000 * Math.pow(2, attempt), 8000); // 1s, 2s, 4s, 8s máx
          console.log(`Aguardando ${delayMs}ms antes da próxima tentativa...`);
          
          await new Promise(resolve => setTimeout(resolve, delayMs));
          
          // Tentar novamente com incremento do contador
          return whatsappService.getInstanceInfo(instanceName, attempt + 1, maxAttempts);
        }
        
        // Outros erros, repassar
        throw apiError;
      }
    } catch (error) {
      console.error(`Error getting instance info for ${instanceName}:`, error);
      
      // Se já estamos na última tentativa, retornar objeto mínimo para não quebrar UI
      if (attempt >= maxAttempts) {
        console.warn(`Retornando objeto mínimo para ${instanceName} após falhas múltiplas`);
        return {
          instance: {
            name: instanceName,
            status: "error",
            isConnected: false,
            errorMessage: error instanceof Error ? error.message : "Erro desconhecido"
          }
        } as InstanceInfo;
      }
      
      throw error;
    }
  },

  // Fetch all instances with enhanced error handling and multiple fallbacks
  fetchInstances: async (): Promise<InstancesListResponse> => {
    try {
      console.log("Fetching WhatsApp instances list...");
      
      // First attempt: Use regular apiClient
      try {
        const endpoint = ENDPOINTS.fetchInstances;
        console.log(`Using endpoint: ${EVOLUTION_API_URL}${endpoint}`);
        
        const instances = await apiClient.get<InstancesListResponse>(endpoint);
        console.log(`Successfully fetched ${instances?.length || 0} instances`);
        return instances;
      } catch (apiError) {
        // Primary method failed, try second method
        console.warn("Primary API client fetch failed, trying fallback method:", apiError);
        
        // Check if this was an authentication error (401/403)
        if (apiError.name === 'AuthenticationError' || 
            (apiError instanceof Error && 
             (apiError.message.includes('401') || apiError.message.includes('403')))) {
          console.error("Authentication error detected, stopping further attempts");
          throw new Error(
            `Falha na autenticação com Evolution API. ` +
            `Status: ${apiError.status || 401}. ` +
            `Detalhes: Seu token não foi aceito pelo servidor. Verifique no painel Evolution API se o token está ativo e com permissões corretas.`
          );
        }
        
        try {
          // Second attempt: Use direct fetch with proper apikey header
          const response = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
            method: 'GET',
            headers: { 
              'apikey': EVOLUTION_API_KEY,
              'Accept': 'application/json' 
            }
          });
          
          if (!response.ok) {
            // Special handling for 401/403 errors
            if (response.status === 401 || response.status === 403) {
              throw new Error(
                `Falha na autenticação com Evolution API (${response.status}). ` +
                `Seu token não foi aceito. Verifique-o no painel Evolution e atualize a variável EVOLUTION_API_KEY.`
              );
            }
            throw new Error(`Direct fetch failed with status ${response.status}: ${response.statusText}`);
          }
          
          const instances = await response.json();
          console.log(`Successfully fetched ${instances?.length || 0} instances via direct fetch`);
          return instances;
        } catch (directError) {
          // Second method failed, try third method
          console.warn("Direct fetch failed, trying emergency method:", directError);
          
          // Third attempt: Import and use emergencyFetchInstances
          const { emergencyFetchInstances } = await import('@/services/directApiClient');
          const instances = await emergencyFetchInstances();
          console.log(`Emergency fetch retrieved ${instances?.length || 0} instances`);
          return instances;
        }
      }
    } catch (error) {
      console.error("Error fetching instances (all attempts failed):", error);
      // Return empty array instead of throwing to avoid breaking validation
      return [];
    }
  },

  // Logout/disconnect an instance
  logoutInstance: async (instanceName: string) => {
    try {
      const endpoint = formatEndpoint(ENDPOINTS.instanceLogout, { instanceName });
      const response = await apiClient.delete(endpoint);
      
      // Update status in Supabase
      try {
        // Check if user is logged in
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          const { error } = await supabase
            .from('whatsapp_instances')
            .update({ 
              status: 'disconnected',
              updated_at: new Date().toISOString()
            })
            .eq('name', instanceName)
            .eq('user_id', user.id);
            
          if (error) {
            console.error("Error updating logout status in Supabase:", error);
          }
        }
      } catch (saveError) {
        console.error("Failed to update logout status in Supabase:", saveError);
      }
      
      return response;
    } catch (error) {
      console.error(`Error logging out instance ${instanceName}:`, error);
      throw error;
    }
  },

  /**
   * Delete a WhatsApp instance from Evolution API
   * This will permanently remove the instance from the Evolution API server
   */
  deleteInstance: async (instanceName: string): Promise<boolean> => {
    try {
      console.log(`Attempting to delete WhatsApp instance: ${instanceName}`);
      
      if (USE_MOCK_DATA) {
        console.warn("MOCK MODE IS ACTIVE - This should never be used in production!");
        console.log(`Mock: Instance ${instanceName} would be deleted`);
        return true;
      }

      const endpoint = formatEndpoint(ENDPOINTS.instanceDelete, { instanceName });
      console.log("Delete instance URL:", `${apiClient.baseUrl}${endpoint}`);

      try {
        // Primary attempt with apiClient
        await apiClient.delete(endpoint);
        console.log(`Instance ${instanceName} deleted successfully via apiClient`);
        
        // Update Supabase to reflect deletion
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user?.id) {
            const { error } = await supabase
              .from('whatsapp_instances')
              .update({ 
                status: 'deleted',
                updated_at: new Date().toISOString()
              })
              .eq('name', instanceName)
              .eq('user_id', user.id);
              
            if (error) {
              console.error("Error updating instance status in Supabase:", error);
            }
          }
        } catch (saveError) {
          console.error("Failed to update instance status in Supabase:", saveError);
        }

        return true;
      } catch (apiError) {
        console.warn("API client delete failed, trying direct fetch:", apiError);
        
        // Check if this was an authentication error (401/403)
        if (apiError.name === 'AuthenticationError' || 
            (apiError instanceof Error && 
             (apiError.message.includes('401') || apiError.message.includes('403')))) {
          throw new Error(
            `Falha na autenticação com Evolution API. Verifique se seu token está correto e ativo no painel Evolution API. ` +
            `Status: ${apiError.status || 401}. ` +
            `Detalhes: Por favor, verifique a variável de ambiente EVOLUTION_API_KEY.`
          );
        }
        
        // Fallback: Direct fetch with 'apikey' header (Evolution API v2 standard)
        const directResponse = await fetch(`${EVOLUTION_API_URL}${endpoint}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'apikey': EVOLUTION_API_KEY,
            'Accept': 'application/json'
          }
        });
        
        if (!directResponse.ok) {
          // Special handling for 401/403 errors
          if (directResponse.status === 401 || directResponse.status === 403) {
            throw new Error(
              `Falha na autenticação com Evolution API (${directResponse.status}). ` +
              `Verifique seu token no painel Evolution API e atualize a variável de ambiente EVOLUTION_API_KEY.`
            );
          }
          
          // If instance not found (404), consider it already deleted
          if (directResponse.status === 404) {
            console.log(`Instance ${instanceName} not found (404), considering it already deleted`);
            return true;
          }
          
          throw new Error(`API error: ${directResponse.status} ${directResponse.statusText}`);
        }
        
        console.log(`Instance ${instanceName} deleted successfully via direct fetch`);
        
        // Update Supabase to reflect deletion
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user?.id) {
            const { error } = await supabase
              .from('whatsapp_instances')
              .update({ 
                status: 'deleted',
                updated_at: new Date().toISOString()
              })
              .eq('name', instanceName)
              .eq('user_id', user.id);
              
            if (error) {
              console.error("Error updating instance status in Supabase:", error);
            }
          }
        } catch (saveError) {
          console.error("Failed to update instance status in Supabase:", saveError);
        }

        return true;
      }
    } catch (error) {
      console.error(`Error deleting instance ${instanceName}:`, error);
      
      // If the error is that the instance doesn't exist, we can consider it successful
      if (error instanceof Error && error.message.includes('404')) {
        console.log(`Instance ${instanceName} was already deleted or never existed`);
        return true;
      }
      
      throw error;
    }
  },

  // List all instances
  listInstances: async (): Promise<InstancesListResponse> => {
    try {
      return await whatsappService.fetchInstances();
    } catch (error) {
      console.error("Error listing instances:", error);
      throw error;
    }
  }
};

export default whatsappService;
export { whatsappService };
