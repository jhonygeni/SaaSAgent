
import { supabase } from "@/integrations/supabase/client";
import { Agent, BusinessSector, FAQ } from "@/types";
import { nanoid } from "nanoid";

/**
 * Service for agent data management in Supabase
 */
const agentService = {
  /**
   * Create a new agent in Supabase
   */
  createAgent: async (agent: Agent): Promise<Agent | null> => {
    try {
      // Set timeout for the operation
      const timeoutPromise = new Promise<null>((_, reject) => {
        setTimeout(() => reject(new Error("Tempo limite excedido - createAgent")), 15000);
      });
      
      const createPromise = (async () => {
        // First, make sure we have the current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error("No authenticated user found");
          return null;
        }

        // Generate a custom ID identifier (but don't use it for the primary key)
        const customId = agent.id || `agent-${nanoid(8)}`;
        
        // Ensure instanceName is set properly
        const instanceName = agent.instanceName || 
                              agent.nome.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        
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
        setTimeout(() => reject(new Error("Tempo limite excedido - fetchUserAgents")), 8000);
      });
      
      const fetchPromise = (async () => {
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error("No authenticated user found");
          return [];
        }

        // Fetch all agents for this user
        const { data, error } = await supabase
          .from('agents')
          .select('*')
          .eq('user_id', user.id);

        if (error) {
          console.error("Error fetching agents from Supabase:", error);
          return [];
        }

        // Transform the data to match our Agent type
        const agents: Agent[] = data.map(convertDbAgentToAppAgent);
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
        setTimeout(() => reject(new Error("Request timeout - updateAgent")), 8000);
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
        
        if (updates.nome) updatedSettings.name = updates.nome;
        if (updates.site) updatedSettings.website = updates.site;
        if (updates.areaDeAtuacao) updatedSettings.business_sector = updates.areaDeAtuacao;
        if (updates.informacoes) updatedSettings.information = updates.informacoes;
        if (updates.prompt) updatedSettings.prompt = updates.prompt;
        if (updates.faqs) updatedSettings.faqs = updates.faqs;
        if (updates.phoneNumber) updatedSettings.phone_number = updates.phoneNumber;
        if (updates.messageCount !== undefined) updatedSettings.message_count = updates.messageCount;
        if (updates.messageLimit !== undefined) updatedSettings.message_limit = updates.messageLimit;
        if (updates.connected !== undefined) updatedSettings.connected = updates.connected;
        
        // Format the data for Supabase
        const supabaseUpdates: Record<string, any> = {
          settings: updatedSettings,
          updated_at: new Date().toISOString()
        };
        
        // A few fields that are stored directly in the table
        if (updates.status) supabaseUpdates.status = updates.status;
        if (updates.instanceName) supabaseUpdates.instance_name = updates.instanceName;

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
   * Delete an agent in Supabase
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
