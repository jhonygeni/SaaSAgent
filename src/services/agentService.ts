
import { supabase } from "@/integrations/supabase/client";
import { Agent } from "@/types";
import { nanoid } from "nanoid";

/**
 * Service for agent data management in Supabase
 */
const agentService = {
  /**
   * Create a new agent in Supabase
   */
  createAgent: async (agent: Agent): Promise<string | null> => {
    try {
      // First, make sure we have the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error("No authenticated user found");
        return null;
      }

      // Generate an ID if not provided
      const agentId = agent.id || `agent-${nanoid(8)}`;
      
      // Format the agent data for insertion
      const supabaseAgent = {
        id: agentId,
        user_id: user.id,
        name: agent.nome,
        website: agent.site,
        business_sector: agent.areaDeAtuacao,
        information: agent.informacoes,
        prompt: agent.prompt,
        faqs: JSON.stringify(agent.faqs),
        status: agent.status || "pendente",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        instance_name: agent.instanceName,
        connected: agent.connected || false,
        phone_number: agent.phoneNumber,
        message_count: agent.messageCount || 0,
        message_limit: agent.messageLimit || 100
      };

      // Insert the agent data
      const { data, error } = await supabase
        .from('agents')
        .insert(supabaseAgent)
        .select()
        .single();

      if (error) {
        console.error("Error creating agent in Supabase:", error);
        return null;
      }

      console.log("Agent created successfully in Supabase:", data);
      return data.id;
    } catch (error) {
      console.error("Exception creating agent:", error);
      return null;
    }
  },

  /**
   * Update an existing agent in Supabase
   */
  updateAgent: async (id: string, updates: Partial<Agent>): Promise<boolean> => {
    try {
      // Format the data for Supabase
      const supabaseUpdates: any = {};
      
      if (updates.nome) supabaseUpdates.name = updates.nome;
      if (updates.site) supabaseUpdates.website = updates.site;
      if (updates.areaDeAtuacao) supabaseUpdates.business_sector = updates.areaDeAtuacao;
      if (updates.informacoes) supabaseUpdates.information = updates.informacoes;
      if (updates.prompt) supabaseUpdates.prompt = updates.prompt;
      if (updates.faqs) supabaseUpdates.faqs = JSON.stringify(updates.faqs);
      if (updates.status) supabaseUpdates.status = updates.status;
      if (updates.connected !== undefined) supabaseUpdates.connected = updates.connected;
      if (updates.phoneNumber) supabaseUpdates.phone_number = updates.phoneNumber;
      if (updates.messageCount !== undefined) supabaseUpdates.message_count = updates.messageCount;
      if (updates.messageLimit !== undefined) supabaseUpdates.message_limit = updates.messageLimit;
      if (updates.instanceName) supabaseUpdates.instance_name = updates.instanceName;
      
      // Always update the updated_at timestamp
      supabaseUpdates.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('agents')
        .update(supabaseUpdates)
        .eq('id', id);

      if (error) {
        console.error("Error updating agent in Supabase:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Exception updating agent:", error);
      return false;
    }
  },

  /**
   * Fetch all agents for the current user
   */
  fetchUserAgents: async (): Promise<Agent[]> => {
    try {
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
      const agents: Agent[] = data.map(item => ({
        id: item.id,
        nome: item.name,
        site: item.website,
        areaDeAtuacao: item.business_sector,
        informacoes: item.information,
        prompt: item.prompt,
        faqs: item.faqs ? JSON.parse(item.faqs) : [],
        createdAt: item.created_at,
        status: item.status,
        connected: item.connected,
        phoneNumber: item.phone_number,
        messageCount: item.message_count,
        messageLimit: item.message_limit,
        instanceName: item.instance_name
      }));

      return agents;
    } catch (error) {
      console.error("Exception fetching agents:", error);
      return [];
    }
  },

  /**
   * Delete an agent in Supabase
   */
  deleteAgent: async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('agents')
        .delete()
        .eq('id', id);

      if (error) {
        console.error("Error deleting agent from Supabase:", error);
        return false;
      }

      return true;
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
      const agent: Agent = {
        id: data.id,
        nome: data.name,
        site: data.website,
        areaDeAtuacao: data.business_sector,
        informacoes: data.information,
        prompt: data.prompt,
        faqs: data.faqs ? JSON.parse(data.faqs) : [],
        createdAt: data.created_at,
        status: data.status,
        connected: data.connected,
        phoneNumber: data.phone_number,
        messageCount: data.message_count,
        messageLimit: data.message_limit,
        instanceName: data.instance_name
      };

      return agent;
    } catch (error) {
      console.error("Exception getting agent by ID:", error);
      return null;
    }
  }
};

export default agentService;
