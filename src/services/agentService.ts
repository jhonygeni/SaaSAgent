
import { supabase } from "@/integrations/supabase/client";
import { Agent, BusinessSector, FAQ } from "@/types";
import { nanoid } from "nanoid";
import { getAutomaticInstanceName } from "@/utils/automaticInstanceNameGenerator";
import { logger } from "@/lib/logging";
import { APILogger, withAPILogging } from "@/lib/logging/api-logger";

/**
 * Service for agent data management in Supabase
 */
const agentService = {
  /**
   * Create a new agent in Supabase
   */
  createAgent: async (agent: Agent): Promise<Agent | null> => {
    const apiLogger = new APILogger('agentService');
    
    try {
      // Log the operation start
      apiLogger.request({ 
        method: 'POST', 
        endpoint: 'createAgent', 
        requestData: { agentName: agent.name, agentType: agent.type }
      });
      
      // Set timeout for the operation
      const timeoutPromise = new Promise<null>((_, reject) => {
        setTimeout(() => reject(new Error("Tempo limite excedido - createAgent")), 5000); // Optimized from 8000ms
      });
      
      const createPromise = (async () => {
        // First, make sure we have the current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          logger.error("No authenticated user found", { operation: 'createAgent' });
          return null;
        }

        // Generate a custom ID identifier (but don't use it for the primary key)
        const customId = agent.id || `agent-${nanoid(8)}`;
        
        // Generate unique instance name automatically (independent of agent name)
        const instanceName = await getAutomaticInstanceName();
        
        // Format the agent data for insertion - store most data in the settings field as JSON
        const supabaseAgent = {
          // REMOVED id field to let Supabase generate UUID automatically
          user_id: user.id,
          instance_name: instanceName,
          status: agent.status || "pendente",
          settings: JSON.stringify({
            name: agent.nome,
            website: agent.site,
            business_sector: agent.areaDeAtuacao,
            information: agent.informacoes,
            prompt: agent.prompt,
            faqs: agent.faqs,
            phone_number: agent.phoneNumber,
            message_count: agent.messageCount || 0,
            message_limit: agent.messageLimit || 100,
            connected: agent.connected || false,
            custom_id: customId // Store the custom ID in the settings JSON
          })
        };

        console.log("Creating agent with data:", JSON.stringify(supabaseAgent, null, 2));

        // Insert the agent data with explicit returning parameter
        const { data, error } = await supabase
          .from('agents')
          .insert(supabaseAgent)
          .select();

        if (error) {
          console.error("Error creating agent in Supabase:", error);
          throw new Error(`Erro ao salvar o agente no banco de dados: ${error.message}`);
        }

        console.log("Agent created successfully in Supabase with response:", data);
        
        // Transform to Agent type
        if (!data || data.length === 0) {  // Check for empty array as well
          console.error("No data returned from Supabase after agent creation");
          return null;
        }
        
        // Convert back to our application Agent type
        return convertDbAgentToAppAgent(data[0]);  // Access the first element of the array
      })();
      
      // Race between the operation and the timeout
      return await Promise.race([createPromise, timeoutPromise]);
    } catch (error) {
      console.error("Exception creating agent:", error);
      throw error; // Rethrow to allow for retry logic
    }
  },

  /**
   * Fetch all agents for the current user
   */
  fetchUserAgents: async (): Promise<Agent[]> => {
    try {
      // Set timeout for the operation
      const timeoutPromise = new Promise<Agent[]>((_, reject) => {
        setTimeout(() => reject(new Error("Tempo limite excedido - fetchUserAgents")), 5000);
      });
      
      const fetchPromise = (async () => {
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error("No authenticated user found");
          return [];
        }

        console.log("AgentService - Fetching agents for user:", user.id);

        // Fetch all agents for this user
        const { data, error } = await supabase
          .from('agents')
          .select('*')
          .eq('user_id', user.id);

        if (error) {
          console.error("Error fetching agents from Supabase:", error);
          return [];
        }

        console.log("AgentService - Raw data from Supabase:", data);
        console.log("AgentService - Found", data?.length || 0, "agents");

        // Transform the data to match our Agent type
        const agents: Agent[] = data.map(convertDbAgentToAppAgent);
        console.log("AgentService - Converted agents:", agents);
        return agents;
      })();
      
      // Race between the operation and the timeout
      return await Promise.race([fetchPromise, timeoutPromise]);
    } catch (error) {
      console.error("Exception fetching agents:", error);
      return [];
    }
  },

  /**
   * Update an existing agent in Supabase
   */
  updateAgent: async (id: string, updates: Partial<Agent>): Promise<boolean> => {
    try {
      const timeoutPromise = new Promise<boolean>((_, reject) => {
        setTimeout(() => reject(new Error("Request timeout - updateAgent")), 5000);
      });
      
      const updatePromise = (async () => {
        // First get the current agent
        const { data: currentAgent, error: fetchError } = await supabase
          .from('agents')
          .select('*')
          .eq('id', id)
          .single();
        
        if (fetchError) {
          console.error("Error fetching agent for update:", fetchError);
          return false;
        }
        
        // Parse current settings
        let settings = {};
        try {
          settings = currentAgent.settings ? 
            (typeof currentAgent.settings === 'string' ? 
              JSON.parse(currentAgent.settings) : currentAgent.settings) : {};
        } catch (e) {
          console.error("Error parsing agent settings:", e);
          settings = {};
        }
        
        // Update settings with new values
        const updatedSettings = { ...settings } as Record<string, any>;
        
        // Agent basic info updates
        if (updates.nome) updatedSettings.name = updates.nome;
        if (updates.site) updatedSettings.website = updates.site;
        if (updates.areaDeAtuacao) updatedSettings.business_sector = updates.areaDeAtuacao;
        if (updates.informacoes) updatedSettings.information = updates.informacoes;
        if (updates.prompt) updatedSettings.prompt = updates.prompt;
        if (updates.faqs) updatedSettings.faqs = updates.faqs;
        
        // WhatsApp connection data updates (SIMPLIFIED: stored in same settings JSON)
        if (updates.phoneNumber !== undefined) updatedSettings.phone_number = updates.phoneNumber;
        if (updates.connected !== undefined) updatedSettings.connected = updates.connected;
        if (updates.instanceName !== undefined) updatedSettings.instance_name = updates.instanceName;
        
        // Usage data updates
        if (updates.messageCount !== undefined) updatedSettings.message_count = updates.messageCount;
        if (updates.messageLimit !== undefined) updatedSettings.message_limit = updates.messageLimit;
        
        // Format the data for Supabase
        const supabaseUpdates: Record<string, any> = {
          settings: updatedSettings,
          updated_at: new Date().toISOString()
        };
        
        // Fields that are stored directly in the table
        if (updates.status) supabaseUpdates.status = updates.status;
        if (updates.instanceName) supabaseUpdates.instance_name = updates.instanceName;

        console.log("Updating agent with data:", JSON.stringify(supabaseUpdates, null, 2));

        const { error } = await supabase
          .from('agents')
          .update(supabaseUpdates)
          .eq('id', id);

        if (error) {
          console.error("Error updating agent in Supabase:", error);
          return false;
        }

        return true;
      })();
      
      return await Promise.race([updatePromise, timeoutPromise]);
    } catch (error) {
      console.error("Exception updating agent:", error);
      return false;
    }
  },

  /**
   * Delete an agent and its WhatsApp instance from both Evolution API and Supabase
   */
  deleteAgent: async (id: string): Promise<boolean> => {
    try {
      const timeoutPromise = new Promise<boolean>((_, reject) => {
        setTimeout(() => reject(new Error("Request timeout - deleteAgent")), 8000); // Optimized timeout for better performance
      });
      
      const deletePromise = (async () => {
        // First, get the agent to retrieve its instance name
        const { data: agent, error: fetchError } = await supabase
          .from('agents')
          .select('*')
          .eq('id', id)
          .single();
        
        if (fetchError) {
          console.error("Error fetching agent for deletion:", fetchError);
          // Continue with database deletion even if we can't fetch the agent
        }
        
        // Try to delete the WhatsApp instance from Evolution API first
        let evolutionApiCleanupSuccess = false;
        if (agent?.instance_name) {
          try {
            console.log(`Attempting to delete Evolution API instance: ${agent.instance_name}`);
            
            // Dynamic import to avoid circular dependencies
            const { default: whatsappService } = await import('./whatsappService');
            evolutionApiCleanupSuccess = await whatsappService.deleteInstance(agent.instance_name);
            
            if (evolutionApiCleanupSuccess) {
              console.log(`Successfully deleted Evolution API instance: ${agent.instance_name}`);
            } else {
              console.warn(`Failed to delete Evolution API instance: ${agent.instance_name}`);
            }
          } catch (evolutionError) {
            console.error(`Error deleting Evolution API instance ${agent.instance_name}:`, evolutionError);
            // Don't fail the entire operation if Evolution API cleanup fails
            // The instance might already be deleted or the API might be down
          }
        } else {
          console.log("No instance name found for agent, skipping Evolution API cleanup");
        }

        // Always proceed with database deletion regardless of Evolution API result
        const { error } = await supabase
          .from('agents')
          .delete()
          .eq('id', id);

        if (error) {
          console.error("Error deleting agent from Supabase:", error);
          return false;
        }

        // If Evolution API cleanup failed but database deletion succeeded, log a warning
        if (agent?.instance_name && !evolutionApiCleanupSuccess) {
          console.warn(
            `Agent deleted from database but Evolution API instance ${agent.instance_name} may still exist. ` +
            `You may need to manually delete it from the Evolution API dashboard.`
          );
        }

        return true;
      })();
      
      return await Promise.race([deletePromise, timeoutPromise]);
    } catch (error) {
      console.error("Exception deleting agent:", error);
      return false;
    }
  },

  /**
   * Get a single agent by ID
   */
  getAgentById: async (id: string): Promise<Agent | null> => {
    try {
      const timeoutPromise = new Promise<null>((_, reject) => {
        setTimeout(() => reject(new Error("Request timeout - getAgentById")), 5000);
      });
      
      const getPromise = (async () => {
        const { data, error } = await supabase
          .from('agents')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error("Error fetching agent from Supabase:", error);
          return null;
        }

        // Transform to Agent type
        return convertDbAgentToAppAgent(data);
      })();
      
      return await Promise.race([getPromise, timeoutPromise]);
    } catch (error) {
      console.error("Exception getting agent by ID:", error);
      return null;
    }
  },

  /**
   * Update WhatsApp connection status for an agent
   * SIMPLIFIED: Convenience method for WhatsApp-specific updates
   */
  updateWhatsAppConnection: async (
    agentId: string, 
    connectionData: {
      phoneNumber?: string;
      connected?: boolean;
      instanceName?: string;
    }
  ): Promise<boolean> => {
    console.log("Updating WhatsApp connection for agent:", agentId, connectionData);
    
    return await agentService.updateAgent(agentId, {
      phoneNumber: connectionData.phoneNumber,
      connected: connectionData.connected,
      instanceName: connectionData.instanceName,
      status: connectionData.connected ? "ativo" : "pendente"
    });
  },

  /**
   * Get all connected WhatsApp agents
   * SIMPLIFIED: Filter agents by connection status
   */
  getConnectedAgents: async (): Promise<Agent[]> => {
    try {
      const allAgents = await agentService.fetchUserAgents();
      return allAgents.filter(agent => agent.connected === true);
    } catch (error) {
      console.error("Error getting connected agents:", error);
      return [];
    }
  }
};

/**
 * Helper function to convert database agent to application Agent type
 */
function convertDbAgentToAppAgent(dbAgent: any): Agent {
  // Parse settings
  let settings = {} as Record<string, any>;
  try {
    settings = dbAgent.settings ? 
      (typeof dbAgent.settings === 'string' ? 
        JSON.parse(dbAgent.settings) : dbAgent.settings) : {};
  } catch (e) {
    console.error("Error parsing agent settings:", e);
    settings = {};
  }

  // Parse FAQs
  let parsedFaqs: FAQ[] = [];
  try {
    if (settings.faqs) {
      parsedFaqs = typeof settings.faqs === 'string' ? 
        JSON.parse(settings.faqs) : settings.faqs;
    }
  } catch (e) {
    console.error("Error parsing FAQs:", e);
    parsedFaqs = [];
  }
  
  // Map database status to Agent status type based on is_active field only
  let status: "ativo" | "inativo" | "pendente" = "pendente";
  if (dbAgent.status === "ativo") status = "ativo";
  else if (dbAgent.status === "inativo") status = "inativo";
  
  // Note: Agent status is independent of WhatsApp connection status
  
  // Map business_sector to BusinessSector type or default to "Outro"
  const businessSector: BusinessSector = 
    ["Varejo", "Saúde", "Educação", "Finanças", "Serviços", "Imobiliária", 
      "Alimentação", "Tecnologia", "Turismo", "Outro"]
      .includes(settings.business_sector) 
        ? settings.business_sector as BusinessSector 
        : "Outro";

  // Construct and return the Agent
  return {
    id: dbAgent.id, // Use the Supabase-generated UUID as the primary ID
    nome: settings.name || "",
    site: settings.website || "",
    areaDeAtuacao: businessSector,
    informacoes: settings.information || "",
    prompt: settings.prompt || "",
    faqs: parsedFaqs,
    createdAt: dbAgent.created_at,
    status: status,
    connected: !!settings.connected,
    phoneNumber: settings.phone_number || "",
    messageCount: settings.message_count || 0,
    messageLimit: settings.message_limit || 100,
    instanceName: dbAgent.instance_name
  };
}

export default agentService;
