import { supabase } from "@/integrations/supabase/client";
import { Agent, BusinessSector, FAQ } from "@/types";
import { nanoid } from "nanoid";
import { getAutomaticInstanceName } from "@/utils/automaticInstanceNameGenerator";

/**
 * Service for agent data management in Supabase
 * ATUALIZADO: Usa nova estrutura separada - agents e whatsapp_instances
 */
const agentService = {
  /**
   * Create a new agent in Supabase (CORRIGIDO para nova estrutura)
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

        // PASSO 1: Criar instância WhatsApp na tabela whatsapp_instances
        const instanceName = await getAutomaticInstanceName();
        
        const { data: instanceData, error: instanceError } = await supabase
          .from('whatsapp_instances')
          .insert({
            user_id: user.id,
            name: instanceName,
            status: 'pending'
          })
          .select()
          .single();

        if (instanceError) {
          console.error("Error creating WhatsApp instance:", instanceError);
          throw new Error(`Erro ao criar instância WhatsApp: ${instanceError.message}`);
        }

        // PASSO 2: Criar agente IA na tabela agents
        const supabaseAgent = {
          user_id: user.id,
          whatsapp_instance_id: instanceData.id, // Referência à instância
          name: agent.nome,
          description: `Agente IA para ${agent.areaDeAtuacao}`,
          prompt: agent.prompt || "",
          settings: {
            website: agent.site,
            business_sector: agent.areaDeAtuacao,
            information: agent.informacoes,
            faqs: agent.faqs,
            phone_number: agent.phoneNumber,
            message_count: agent.messageCount || 0,
            message_limit: agent.messageLimit || 100,
            connected: agent.connected || false,
            custom_id: agent.id || `agent-${nanoid(8)}`
          },
          is_active: agent.status === "ativo"
        };

        console.log("Creating agent with data:", JSON.stringify(supabaseAgent, null, 2));

        const { data: agentData, error: agentError } = await supabase
          .from('agents')
          .insert(supabaseAgent)
          .select(`
            *,
            whatsapp_instances (
              id,
              name,
              status,
              phone_number
            )
          `)
          .single();

        if (agentError) {
          // Se falhar, limpar a instância WhatsApp criada
          await supabase.from('whatsapp_instances').delete().eq('id', instanceData.id);
          console.error("Error creating agent in Supabase:", agentError);
          throw new Error(`Erro ao salvar o agente no banco de dados: ${agentError.message}`);
        }

        console.log("Agent created successfully in Supabase with response:", agentData);
        
        // Convert back to our application Agent type
        return convertDbAgentToAppAgent(agentData);
      })();
      
      return await Promise.race([createPromise, timeoutPromise]);
    } catch (error) {
      console.error("Exception creating agent:", error);
      throw error;
    }
  },

  /**
   * Fetch all agents for the current user (CORRIGIDO para nova estrutura)
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

        // Fetch all agents with their WhatsApp instances
        const { data, error } = await supabase
          .from('agents')
          .select(`
            *,
            whatsapp_instances (
              id,
              name,
              status,
              phone_number,
              evolution_instance_id
            )
          `)
          .eq('user_id', user.id);

        if (error) {
          console.error("Error fetching agents from Supabase:", error);
          return [];
        }

        // Transform the data to match our Agent type
        const agents: Agent[] = data.map(convertDbAgentToAppAgent);
        return agents;
      })();
      
      return await Promise.race([fetchPromise, timeoutPromise]);
    } catch (error) {
      console.error("Exception fetching agents:", error);
      return [];
    }
  },

  /**
   * Update an existing agent in Supabase (CORRIGIDO para nova estrutura)
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
          settings = currentAgent.settings || {};
        } catch (e) {
          console.error("Error parsing agent settings:", e);
          settings = {};
        }
        
        // Update settings with new values
        const updatedSettings = { ...settings } as Record<string, any>;
        
        if (updates.site) updatedSettings.website = updates.site;
        if (updates.areaDeAtuacao) updatedSettings.business_sector = updates.areaDeAtuacao;
        if (updates.informacoes) updatedSettings.information = updates.informacoes;
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
        
        // Fields that are stored directly in the agents table
        if (updates.nome) supabaseUpdates.name = updates.nome;
        if (updates.prompt) supabaseUpdates.prompt = updates.prompt;
        if (updates.status) supabaseUpdates.is_active = updates.status === "ativo";

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
   * Delete an agent and its WhatsApp instance (CORRIGIDO para nova estrutura)
   */
  deleteAgent: async (id: string): Promise<boolean> => {
    try {
      const timeoutPromise = new Promise<boolean>((_, reject) => {
        setTimeout(() => reject(new Error("Request timeout - deleteAgent")), 15000);
      });
      
      const deletePromise = (async () => {
        // First, get the agent with its WhatsApp instance
        const { data: agent, error: fetchError } = await supabase
          .from('agents')
          .select(`
            *,
            whatsapp_instances (
              id,
              name,
              evolution_instance_id
            )
          `)
          .eq('id', id)
          .single();
        
        if (fetchError) {
          console.error("Error fetching agent for deletion:", fetchError);
          return false;
        }
        
        // Try to delete the WhatsApp instance from Evolution API first
        let evolutionApiCleanupSuccess = false;
        if (agent?.whatsapp_instances?.name) {
          try {
            console.log(`Attempting to delete Evolution API instance: ${agent.whatsapp_instances.name}`);
            
            const { default: whatsappService } = await import('./whatsappService');
            evolutionApiCleanupSuccess = await whatsappService.deleteInstance(agent.whatsapp_instances.name);
            
            if (evolutionApiCleanupSuccess) {
              console.log(`Successfully deleted Evolution API instance: ${agent.whatsapp_instances.name}`);
            } else {
              console.warn(`Failed to delete Evolution API instance: ${agent.whatsapp_instances.name}`);
            }
          } catch (evolutionError) {
            console.error(`Error deleting Evolution API instance ${agent.whatsapp_instances.name}:`, evolutionError);
          }
        }

        // Delete the agent from database (this will also delete the WhatsApp instance due to CASCADE)
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
   * Get a single agent by ID (CORRIGIDO para nova estrutura)
   */
  getAgentById: async (id: string): Promise<Agent | null> => {
    try {
      const timeoutPromise = new Promise<null>((_, reject) => {
        setTimeout(() => reject(new Error("Request timeout - getAgentById")), 5000);
      });
      
      const getPromise = (async () => {
        const { data, error } = await supabase
          .from('agents')
          .select(`
            *,
            whatsapp_instances (
              id,
              name,
              status,
              phone_number,
              evolution_instance_id
            )
          `)
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
  }
};

/**
 * Helper function to convert database agent to application Agent type
 * ATUALIZADO: Para nova estrutura com whatsapp_instances separado
 */
function convertDbAgentToAppAgent(dbAgent: any): Agent {
  // Parse settings
  let settings = {} as Record<string, any>;
  try {
    settings = dbAgent.settings || {};
  } catch (e) {
    console.error("Error parsing agent settings:", e);
    settings = {};
  }

  // Parse FAQs
  let parsedFaqs: FAQ[] = [];
  try {
    if (settings.faqs) {
      parsedFaqs = Array.isArray(settings.faqs) ? settings.faqs : [];
    }
  } catch (e) {
    console.error("Error parsing FAQs:", e);
    parsedFaqs = [];
  }
  
  // Map database status to Agent status type
  let status: "ativo" | "inativo" | "pendente" = dbAgent.is_active ? "ativo" : "inativo";
  
  // Note: Agent status is independent of WhatsApp connection status
  // WhatsApp connection status is handled separately in the UI
  
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
    nome: dbAgent.name || settings.name || "",
    site: settings.website || "",
    areaDeAtuacao: businessSector,
    informacoes: settings.information || "",
    prompt: dbAgent.prompt || "",
    faqs: parsedFaqs,
    createdAt: dbAgent.created_at,
    status: status,
    connected: !!settings.connected,
    phoneNumber: dbAgent.whatsapp_instances?.phone_number || settings.phone_number || "",
    messageCount: settings.message_count || 0,
    messageLimit: settings.message_limit || 100,
    instanceName: dbAgent.whatsapp_instances?.name || ""
  };
}

export default agentService;
