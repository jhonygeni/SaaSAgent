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
      
      // Use the correct webhook configuration endpoint for Evolution API v2
      const response = await fetch(`${EVOLUTION_API_URL}/webhook/instance/${instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVOLUTION_API_KEY,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          url: "https://webhooksaas.geni.chat/webhook/principal",
          webhook_by_events: false,
          webhook_base64: false,
          events: [
            "QRCODE_UPDATED",
            "MESSAGES_UPSERT",
            "MESSAGES_UPDATE",
            "MESSAGES_DELETE",
            "SEND_MESSAGE",
            "CONNECTION_UPDATE"
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to configure webhook: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
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
      console.log(`Configurando instance settings for: ${instanceName}`);
      
      if (USE_MOCK_DATA) {
        console.warn("MOCK MODE IS ACTIVE - This should never be used in production!");
        return {
          status: "success",
          message: "Instance settings configured successfully (mock)",
          settings: {
            rejectCall: false,
            alwaysOnline: true,
            readMessages: true
          }
        };
      }

      // Usar o endpoint correto da Evolution API
      const settingsUrl = `${EVOLUTION_API_URL}/settings/set/${instanceName}`;
      console.log("Instance settings configuration URL:", settingsUrl);
      
      // Configurações padrão recomendadas para todas as instâncias
      const instanceSettings = {
        rejectCall: false,
        msgCall: "",
        groupsIgnore: true,
        alwaysOnline: true,
        readMessages: true,
        readStatus: true,
        syncFullHistory: false
      };

      let response;
      
      try {
        // Tentar com fetch direto primeiro
        const directResponse = await fetch(settingsUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': EVOLUTION_API_KEY,
            'Accept': 'application/json'
          },
          body: JSON.stringify(instanceSettings)
        });
        
        if (!directResponse.ok) {
          // Tratamento especial para erros de autenticação
          if (directResponse.status === 401 || directResponse.status === 403) {
            throw new Error(
              `Falha na autenticação com Evolution API (${directResponse.status}). ` +
              `Verifique seu token no painel Evolution API e atualize a variável de ambiente EVOLUTION_API_KEY.`
            );
          }
          throw new Error(`API error: ${directResponse.status} ${directResponse.statusText}`);
        }
        
        response = await directResponse.json();
        console.log("Instance settings configuration successful:", response);
      } catch (fetchError) {
        console.error("Direct fetch failed:", fetchError);
        throw fetchError;
      }
      
      // Atualizar status no Supabase
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          const { error: supabaseError } = await supabase
            .from('whatsapp_instances')
            .update({ 
              settings: instanceSettings,
              updated_at: new Date().toISOString()
            })
            .eq('name', instanceName)
            .eq('user_id', user.id)
            .headers({
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            });
            
          if (supabaseError) {
            console.error("Error saving settings to Supabase:", supabaseError);
          }
        }
      } catch (supabaseError) {
        console.error("Failed to save settings to Supabase:", supabaseError);
      }
      
      return response;
    } catch (error) {
      console.error("Error configuring instance settings:", error);
      throw error;
    }
  },

  /**
   * Configure instance settings with recommended defaults (NON-BLOCKING VERSION)
   * Executes webhook configuration in background without blocking QR code display
   * This version uses optimized timeouts and fire-and-forget pattern
   */
  configureInstanceSettingsNonBlocking: async (instanceName: string): Promise<void> => {
    setTimeout(async () => {
      try {
        console.log(`[NON-BLOCKING] Configurando instance settings for: ${instanceName}`);
        
        if (USE_MOCK_DATA) {
          console.warn("MOCK MODE IS ACTIVE - Non-blocking settings configuration (mock)");
          return;
        }

        // Usar o endpoint correto da Evolution API
        const settingsUrl = `${EVOLUTION_API_URL}/settings/set/${instanceName}`;
        console.log(`[NON-BLOCKING] Instance settings URL: ${settingsUrl}`);
        
        // Mesmas configurações da versão bloqueante
        const instanceSettings = {
          rejectCall: false,
          msgCall: "",
          groupsIgnore: true,
          alwaysOnline: true,
          readMessages: true,
          readStatus: true,
          syncFullHistory: false
        };
        
        // Usar fetch direto com timeout curto para não bloquear
        try {
          const response = await fetch(settingsUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': EVOLUTION_API_KEY,
              'Accept': 'application/json'
            },
            body: JSON.stringify(instanceSettings),
            signal: AbortSignal.timeout(5000) // 5 segundos de timeout
          });
          
          if (response.ok) {
            console.log(`[NON-BLOCKING] Instance settings configured successfully for: ${instanceName}`);
            
            // Atualizar Supabase em background
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.id) {
              await supabase
                .from('whatsapp_instances')
                .update({ 
                  settings: instanceSettings,
                  updated_at: new Date().toISOString()
                })
                .eq('name', instanceName)
                .eq('user_id', user.id)
                .headers({
                  'Accept': 'application/json',
                  'Content-Type': 'application/json',
                  'Prefer': 'return=representation'
                });
            }
          } else {
            console.warn(`[NON-BLOCKING] Settings configuration failed with status: ${response.status}`);
          }
        } catch (error) {
          console.warn(`[NON-BLOCKING] Failed to configure instance settings for ${instanceName}:`, error);
        }
      } catch (error) {
        console.warn(`[NON-BLOCKING] Exception in settings configuration for ${instanceName}:`, error);
      }
    }, 100);
  },

  /**
   * Configure webhook for an instance (NON-BLOCKING VERSION)
   * Executes webhook configuration in background without blocking main flow
   * Uses optimized timeouts and fire-and-forget pattern
   */
  configureWebhookNonBlocking: async (instanceName: string): Promise<void> => {
    // Use fire-and-forget pattern - don't wait for completion
    setTimeout(async () => {
      try {
        console.log(`[NON-BLOCKING] Configuring webhook for instance: ${instanceName}`);
        
        if (USE_MOCK_DATA) {
          console.warn("MOCK MODE IS ACTIVE - Non-blocking webhook configuration (mock)");
          return;
        }
        
        const endpoint = formatEndpoint(ENDPOINTS.webhookConfig, { instanceName });
        console.log(`[NON-BLOCKING] Webhook configuration URL: ${apiClient.baseUrl}${endpoint}`);
        
        // Padronizar payload para Evolution API v2 (sem campos legados)
        const webhookConfig = {
          webhook: {
            url: "https://webhooksaas.geni.chat/webhook/principal",
            byEvents: true,
            base64: false,
            events: ["MESSAGES_UPSERT", "MESSAGE_UPDATE"]
          }
        };
        
        // Use direct fetch with short timeout for non-blocking
        try {
          const response = await fetch(`${EVOLUTION_API_URL}${endpoint}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': EVOLUTION_API_KEY,
              'Accept': 'application/json'
            },
            body: JSON.stringify(webhookConfig),
            signal: AbortSignal.timeout(2000) // Short timeout for non-blocking
          });
          
          if (response.ok) {
            console.log(`[NON-BLOCKING] Webhook configured successfully for: ${instanceName}`);
          } else {
            console.warn(`[NON-BLOCKING] Webhook configuration failed with status: ${response.status}`);
          }
        } catch (error) {
          console.warn(`[NON-BLOCKING] Failed to configure webhook for ${instanceName}:`, error);
          // Silent failure - don't throw in non-blocking mode
        }
      } catch (error) {
        console.warn(`[NON-BLOCKING] Exception in webhook configuration for ${instanceName}:`, error);
        // Silent failure - don't throw in non-blocking mode
      }
    }, 50); // Very small delay to ensure this doesn't block the main flow
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
      // Implementar rate limiting para evitar loops infinitos
      const rateLimit = new Map<string, number>();
      const now = Date.now();
      const lastCall = rateLimit.get(instanceName) || 0;
      const minInterval = 2000; // 2 segundos entre chamadas

      if (now - lastCall < minInterval) {
        console.log(`Rate limiting: Aguardando ${minInterval}ms entre chamadas para ${instanceName}`);
        return {
          state: 'throttled',
          status: 'throttled',
          message: 'Rate limiting em efeito'
        };
      }
      rateLimit.set(instanceName, now);

      // First check Supabase for instance status
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          const { data: instanceData } = await supabase
            .from('whatsapp_instances')
            .select('status')
            .eq('name', instanceName)
            .eq('user_id', user.id)
            .single();

          // Se já estiver conectado, não precisa verificar novamente
          if (instanceData?.status === 'connected') {
            console.log(`Instance ${instanceName} já está conectada no Supabase`);
            return {
              state: 'connected',
              status: 'connected',
              message: 'Instance already connected'
            };
          }

          // If instance is marked as deleted in Supabase, return disconnected state immediately
          if (instanceData?.status === 'deleted') {
            console.log(`Instance ${instanceName} is marked as deleted in Supabase, skipping API calls`);
            return {
              state: 'deleted',
              status: 'deleted',
              message: 'Instance has been deleted'
            };
          }
        }
      } catch (supabaseError) {
        console.warn(`Could not verify instance status in Supabase: ${supabaseError}`);
      }

      // Tentar obter o estado da conexão
      const endpoint = `${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`;
      console.log(`Getting connection state from endpoint: ${endpoint}`);
      
      try {
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': EVOLUTION_API_KEY,
            'Accept': 'application/json'
          },
          signal: AbortSignal.timeout(5000) // 5 segundos de timeout
        });

        if (!response.ok) {
          // Se a instância não existe, retornar estado desconectado
          if (response.status === 404) {
            console.log(`Instance ${instanceName} not found in connectionState check`);
            
            // Atualizar Supabase para refletir o estado
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (user?.id) {
                await supabase
                  .from('whatsapp_instances')
                  .update({ 
                    status: 'disconnected',
                    updated_at: new Date().toISOString()
                  })
                  .eq('name', instanceName)
                  .eq('user_id', user.id);
              }
            } catch (supabaseError) {
              console.error("Failed to update instance status in Supabase:", supabaseError);
            }

            return {
              state: 'disconnected',
              status: 'disconnected',
              message: 'Instance not found'
            };
          }

          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const stateData = await response.json();
        console.log(`Connection state response for ${instanceName}:`, stateData);
        
        // Verificar se a instância está realmente conectada
        const isConnected = stateData?.state === 'open' || 
                          stateData?.status === 'open' || 
                          stateData?.instance?.state === 'open' || 
                          stateData?.instance?.status === 'open';

        if (isConnected) {
          // Atualizar status no Supabase apenas se estiver conectado
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.id) {
              const { error } = await supabase
                .from('whatsapp_instances')
                .update({ 
                  status: 'connected',
                  updated_at: new Date().toISOString()
                })
                .eq('name', instanceName)
                .eq('user_id', user.id);

              if (error) {
                console.error("Failed to update connected status in Supabase:", error);
              }
            }
          } catch (supabaseError) {
            console.error("Failed to update instance status in Supabase:", supabaseError);
          }

          return {
            ...stateData,
            state: 'connected',
            status: 'connected'
          };
        }
        
        return stateData;
      } catch (error) {
        if (error instanceof Error && error.name === 'TimeoutError') {
          console.warn(`Timeout ao verificar estado da conexão para ${instanceName}`);
          return {
            state: 'timeout',
            status: 'timeout',
            message: 'Connection state check timed out'
          };
        }
        console.error(`Error getting connection state for ${instanceName}:`, error);
        throw error;
      }
    } catch (error) {
      console.error(`Error in getConnectionState for ${instanceName}:`, error);
      throw error;
    }
  },

  // Create a new WhatsApp instance
  createInstance: async (instanceName: string, userId?: string) => {
    try {
      console.log(`Attempting to create WhatsApp instance: ${instanceName}`);
      
      const instanceData: WhatsAppInstanceRequest = {
        instanceName,
        integration: "baileys",
        token: userId || "default_user",
        qrcode: true,
        webhook: {
          enabled: true,
          url: "https://webhooksaas.geni.chat/webhook/principal",
          webhook_by_events: false,
          webhook_base64: false,
          events: [
            "QRCODE_UPDATED",
            "MESSAGES_UPSERT",
            "MESSAGES_UPDATE",
            "MESSAGES_DELETE",
            "SEND_MESSAGE",
            "CONNECTION_UPDATE"
          ]
        }
      };
      
      console.log("Creating instance with exact data:", JSON.stringify(instanceData, null, 2));
      
      let response: WhatsAppInstanceResponse;
      
      try {
        const createResponse = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': EVOLUTION_API_KEY,
            'Accept': 'application/json'
          },
          body: JSON.stringify(instanceData)
        });
        
        if (!createResponse.ok) {
          if (createResponse.status === 401 || createResponse.status === 403) {
            throw new Error(
              `Falha na autenticação com Evolution API (${createResponse.status}). ` +
              `Verifique seu token no painel Evolution API e atualize a variável de ambiente EVOLUTION_API_KEY.`
            );
          }
          throw new Error(`API error: ${createResponse.status} ${createResponse.statusText}`);
        }
        
        response = await createResponse.json();
        console.log("Instance created successfully:", response);

        // Apply instance settings
        console.log("Applying instance settings...");
        const instanceSettings = {
          rejectCall: false,
          msgCall: "",
          groupsIgnore: true,
          alwaysOnline: true,
          readMessages: true,
          readStatus: true,
          syncFullHistory: false
        };

        const settingsResponse = await fetch(`${EVOLUTION_API_URL}/instance/set/${instanceName}/settings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': EVOLUTION_API_KEY,
            'Accept': 'application/json'
          },
          body: JSON.stringify(instanceSettings)
        });

        if (!settingsResponse.ok) {
          console.error(`Failed to apply settings: ${settingsResponse.status} ${settingsResponse.statusText}`);
        } else {
          console.log("Settings applied successfully");
        }

        // Configure webhook
        console.log("Configuring webhook...");
        const webhookConfig = {
          enabled: true,
          url: "https://webhooksaas.geni.chat/webhook/principal",
          events: ["MESSAGES_UPSERT", "QRCODE_UPDATED", "CONNECTION_UPDATE"]
        };

        const webhookResponse = await fetch(`${EVOLUTION_API_URL}/instance/set/${instanceName}/webhook`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': EVOLUTION_API_KEY,
            'Accept': 'application/json'
          },
          body: JSON.stringify(webhookConfig)
        });

        if (!webhookResponse.ok) {
          console.error(`Failed to configure webhook: ${webhookResponse.status} ${webhookResponse.statusText}`);
        } else {
          console.log("Webhook configured successfully");
        }

      } catch (error) {
        console.error("Error during instance creation or configuration:", error);
        throw error;
      }

      // Store instance data in Supabase
      if (userId) {
        try {
          const sessionData = {
            ...response,
            settings: {
              rejectCall: false,
              msgCall: "",
              groupsIgnore: true,
              alwaysOnline: true,
              readMessages: true,
              readStatus: true,
              syncFullHistory: false
            }
          };
          
          const { error } = await supabase
            .from('whatsapp_instances')
            .upsert({
              name: instanceName,
              user_id: userId,
              status: 'created',
              evolution_instance_id: response.instance?.instanceId || null,
              session_data: sessionData,
              settings: sessionData.settings,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'name,user_id'
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

  // Get the QR code for an instance
  getQrCode: async (instanceName: string): Promise<QrCodeResponse> => {
    try {
      console.log(`Getting QR code for instance: ${instanceName}`);
      
      // First check if instance exists and is ready
      const stateResponse = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVOLUTION_API_KEY,
          'Accept': 'application/json'
        }
      });

      if (!stateResponse.ok) {
        throw new Error(`Failed to get instance state: ${stateResponse.status} ${stateResponse.statusText}`);
      }

      // Use the correct QR code endpoint for Evolution API v2.2.3
      const response = await fetch(`${EVOLUTION_API_URL}/instance/qrcode/${instanceName}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVOLUTION_API_KEY,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get QR code: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Save QR code to Supabase if possible
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id && (data.code || data.qrcode || data.base64)) {
          const qrCode = data.code || data.qrcode || data.base64;
          
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
      
      return data;
    } catch (error) {
      console.error(`Error getting QR code for ${instanceName}:`, error);
      throw error;
    }
  },

  // Get information about an instance
  getInstanceInfo: async (instanceName: string): Promise<InstanceInfo> => {
    try {
      console.log(`Getting instance info for ${instanceName}`);
      
      const response = await fetch(`${EVOLUTION_API_URL}/instance/info/${instanceName}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVOLUTION_API_KEY,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get instance info: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Update Supabase if we have a phone number
      if (data?.instance?.user?.id) {
        try {
          const phoneNumber = data.instance.user.id.split('@')[0];
          const { data: { user } } = await supabase.auth.getUser();
          if (user?.id && phoneNumber) {
            await supabase
              .from('whatsapp_instances')
              .update({ 
                phone_number: phoneNumber,
                status: 'connected',
                updated_at: new Date().toISOString()
              })
              .eq('name', instanceName)
              .eq('user_id', user.id);
          }
        } catch (error) {
          console.error("Failed to update phone number in Supabase:", error);
        }
      }
      
      return data;
    } catch (error) {
      console.error(`Error getting instance info for ${instanceName}:`, error);
      throw error;
    }
  },

  // Delete an instance
  deleteInstance: async (instanceName: string): Promise<boolean> => {
    try {
      console.log(`Attempting to delete WhatsApp instance: ${instanceName}`);
      
      // Update Supabase first
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          await supabase
            .from('whatsapp_instances')
            .update({ 
              status: 'deleted',
              updated_at: new Date().toISOString()
            })
            .eq('name', instanceName)
            .eq('user_id', user.id);
        }
      } catch (error) {
        console.error("Failed to update instance status in Supabase:", error);
      }

      const response = await fetch(`${EVOLUTION_API_URL}/instance/delete/${instanceName}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVOLUTION_API_KEY,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log(`Instance ${instanceName} not found (404), considering it already deleted`);
          return true;
        }
        throw new Error(`Failed to delete instance: ${response.status} ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error(`Error deleting instance ${instanceName}:`, error);
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
        return instances || [];
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
              'Accept': 'application/json',
              'Content-Type': 'application/json'
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
          return instances || [];
        } catch (directError) {
          // Second method failed, try third method
          console.warn("Direct fetch failed, trying emergency method:", directError);
          
          // Third attempt: Import and use emergencyFetchInstances
          const { emergencyFetchInstances } = await import('@/services/directApiClient');
          const instances = await emergencyFetchInstances();
          console.log(`Emergency fetch retrieved ${instances?.length || 0} instances`);
          return instances || [];
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

  // List all instances
  listInstances: async (): Promise<InstancesListResponse> => {
    try {
      const instances = await whatsappService.fetchInstances();
      return instances || [];
    } catch (error) {
      console.error("Error listing instances:", error);
      return [];
    }
  }
};

export default whatsappService;
export { whatsappService };
