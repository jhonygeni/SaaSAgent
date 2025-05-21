
/**
 * Configure webhook for an instance
 * Must be called immediately after successful instance creation
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
    
    // Use the endpoint for webhook configuration
    const endpoint = formatEndpoint(ENDPOINTS.webhookConfig, { instanceName });
    console.log("Webhook configuration URL:", `${apiClient.baseUrl}${endpoint}`);
    
    const webhookConfig = {
      enabled: true,
      url: "https://webhooksaas.geni.chat/webhook/principal",
      webhookByEvents: true,
      webhookBase64: true,
      events: ["MESSAGES_UPSERT"]
    };
    
    const data = await apiClient.post<WebhookConfigResponse>(endpoint, webhookConfig);
    console.log("Webhook configuration successful:", data);
    
    return data;
  } catch (error) {
    console.error("Error configuring webhook:", error);
    throw error;
  }
}
