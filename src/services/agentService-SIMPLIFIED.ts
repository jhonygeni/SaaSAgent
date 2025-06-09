import { supabase } from "@/integrations/supabase/client";
import { Agent, BusinessSector, FAQ } from "@/types";
import { nanoid } from "nanoid";
import { getAutomaticInstanceName } from "@/utils/automaticInstanceNameGenerator";

/**
 * Service for agent data management in Supabase
 * SIMPLIFIED ARCHITECTURE: Uses only the agents table for all data
 * 
 * WhatsApp data storage strategy:
 * - phoneNumber, connected, instanceName stored in settings JSON field
 * - No separate whatsapp_instances table needed
 * - Single source of truth for all agent data
 */
const agentService = {
  /**
   * Create a new agent in Supabase (SIMPLIFIED - only agents table)
   */
  createAgent: async (agent: Agent): Promise<Agent | null> => {
    try {
      const timeoutPromise = new Promise<null>((_, reject) => {
        setTimeout(() => reject(new Error("Tempo limite excedido - createAgent")), 5000);
      });
      
      const createPromise = (async () => {
        // First, make sure we have the current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error("No authenticated user found");
          return null;
        }

        // Generate unique instance name automatically
        const instanceName = await getAutomaticInstanceName();
        
        // Format the agent data for insertion - store ALL data in the settings field as JSON
        const supabaseAgent = {
          user_id: user.id,
          instance_name: instanceName,
          status: agent.status || "pendente",
          settings: JSON.stringify({
            // Agent basic info
            name: agent.nome,
            website: agent.site,
            business_sector: agent.areaDeAtuacao,
            information: agent.informacoes,
            prompt: agent.prompt,
            faqs: agent.faqs,
            
            // WhatsApp connection data (stored in same place)
            phone_number: agent.phoneNumber || null,
            connected: agent.connected || false,
            instance_name: instanceName,
            
            // Usage data
            message_count: agent.messageCount || 0,
            message_limit: agent.messageLimit || 100,
            
            // Custom identifier
            custom_id: agent.id || `agent-${nanoid(8)}`
          })
        };

        console.log("Creating agent with simplified structure:", JSON.stringify(supabaseAgent, null, 2));

        // Insert the agent data
        const { data, error } = await supabase
          .from('agents')
          .insert(supabaseAgent)
          .select();

        if (error) {
          console.error("Error creating agent in Supabase:", error);
          throw new Error(`Erro ao salvar o agente: ${error.message}`);
        }

        console.log("Agent created successfully:", data);
        
        if (!data || data.length === 0) {
          console.error("No data returned from Supabase after agent creation");
          return null;
        }
        
        // Convert back to our application Agent type
        return convertDbAgentToAppAgent(data[0]);
      })();
      
      return await Promise.race([createPromise, timeoutPromise]);
    } catch (error) {
      console.error("Exception creating agent:", error);
      throw error;
    }
  },

  /**
   * Fetch all agents for the current user
   */
  fetchUserAgents: async (): Promise<Agent[]> => {
    try {
      const timeoutPromise = new Promise<Agent[]>((_, reject) => {
        setTimeout(() => reject(new Error("Tempo limite excedido - fetchUserAgents")), 5000);
      });
      
      const fetchPromise = (async () => {
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
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Error fetching agents from Supabase:", error);
          return [];
        }

        console.log("AgentService - Found", data?.length || 0, "agents");

        // Transform the data to match our Agent type
        const agents: Agent[] = data.map(convertDbAgentToAppAgent);
        console.log("AgentService - Converted agents:", agents);
        return agents;
      })();
      
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
        
        // WhatsApp connection data updates (stored in same settings JSON)
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

        console.log("Agent updated successfully");
        return true;
      })();
      
      return await Promise.race([updatePromise, timeoutPromise]);
    } catch (error) {
      console.error("Exception updating agent:", error);
      return false;
    }
  },

  /**
   * Delete an agent by ID
   */
  deleteAgent: async (id: string): Promise<boolean> => {
    try {
      const timeoutPromise = new Promise<boolean>((_, reject) => {
        setTimeout(() => reject(new Error("Request timeout - deleteAgent")), 8000);
      });
      
      const deletePromise = (async () => {
        const { error } = await supabase
          .from('agents')
          .delete()
          .eq('id', id);

        if (error) {
          console.error("Error deleting agent from Supabase:", error);
          return false;
        }

        console.log("Agent deleted successfully from Supabase");
        return true;
      })();
      
      return await Promise.race([deletePromise, timeoutPromise]);
    } catch (error) {
      console.error("Exception deleting agent:", error);
      return false;
    }
  },

  /**
   * Get a specific agent by ID
   */
  getAgentById: async (id: string): Promise<Agent | null> => {
    try {
      const timeoutPromise = new Promise<Agent | null>((_, reject) => {
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
   * This is a convenience method for WhatsApp-specific updates
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
  
  // Map database status to Agent status type
  let status: "ativo" | "inativo" | "pendente" = "pendente";
  if (dbAgent.status === "ativo") status = "ativo";
  else if (dbAgent.status === "inativo") status = "inativo";
  
  // Map business_sector to BusinessSector type or default to "Outro"
  const businessSector: BusinessSector = 
    ["Varejo", "Saúde", "Educação", "Finanças", "Serviços", "Imobiliária", 
      "Alimentação", "Tecnologia", "Turismo", "Outro"]
      .includes(settings.business_sector) 
        ? settings.business_sector as BusinessSector 
        : "Outro";

  // Construct and return the Agent
  return {
    id: dbAgent.id,
    nome: settings.name || "",
    site: settings.website || "",
    areaDeAtuacao: businessSector,
    informacoes: settings.information || "",
    prompt: settings.prompt || "",
    faqs: parsedFaqs,
    createdAt: dbAgent.created_at,
    status: status,
    
    // WhatsApp connection data (from same settings JSON)
    connected: !!settings.connected,
    phoneNumber: settings.phone_number || "",
    instanceName: settings.instance_name || dbAgent.instance_name,
    
    // Usage data
    messageCount: settings.message_count || 0,
    messageLimit: settings.message_limit || 100
  };
}

export default agentService;
