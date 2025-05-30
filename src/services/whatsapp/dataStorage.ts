
import { supabase } from '@/integrations/supabase/client';

/**
 * Store WhatsApp instance data in Supabase
 */
export const storeInstanceData = async (userId: string, instanceData: any): Promise<void> => {
  try {
    // Use the whatsapp_instances table (CORRIGIDO - era agents antes)
    const { error } = await supabase.from('whatsapp_instances').upsert({
      user_id: userId,
      name: instanceData.instance.instanceName,
      evolution_instance_id: instanceData.instance.instanceId,
      status: instanceData.instance.status,
      session_data: {
        integration: instanceData.instance.integration,
        hash: instanceData.hash,
        webhook_wa_business: instanceData.instance.webhookWaBusiness,
        access_token_wa_business: instanceData.instance.accessTokenWaBusiness,
        settings: instanceData.settings
      },
      updated_at: new Date().toISOString()
    });

    if (error) {
      console.error("Error storing instance data in Supabase:", error);
      throw error;
    }
    
    console.log("Successfully stored instance data in Supabase for instance:", instanceData.instance.instanceName);
  } catch (error) {
    console.error("Error in storeInstanceData:", error);
    throw error;
  }
};
