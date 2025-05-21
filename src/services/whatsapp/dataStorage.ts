
import { supabase } from '@/integrations/supabase/client';

/**
 * Store WhatsApp instance data in Supabase
 */
export const storeInstanceData = async (userId: string, instanceData: any): Promise<void> => {
  try {
    // Use the agents table 
    const { error } = await supabase.from('agents').upsert({
      user_id: userId,
      instance_name: instanceData.instance.instanceName,
      instance_id: instanceData.instance.instanceId,
      integration: instanceData.instance.integration,
      status: instanceData.instance.status,
      hash: instanceData.hash,
      webhook_wa_business: instanceData.instance.webhookWaBusiness,
      access_token_wa_business: instanceData.instance.accessTokenWaBusiness,
      settings: instanceData.settings
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
