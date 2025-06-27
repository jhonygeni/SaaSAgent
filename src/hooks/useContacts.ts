import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/context/UserContext';
import { logger } from '@/lib/safeLog';

// Interface para representar um contato do Supabase adaptado para o componente
export interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
  summary: string;
  date: string;
  status: ClientStatus;
  purchaseAmount?: number;
  email?: string;
  tags?: string[];
  customFields?: any;
}

// Tipos de status para clientes
export type ClientStatus = "Contacted" | "Negotiating" | "Purchased" | "Lost";

export interface ContactsResponse {
  contacts: Contact[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  totalContacts: number;
}

export function useContacts(): ContactsResponse {
  const { user } = useUser();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalContacts, setTotalContacts] = useState<number>(0);
  
  // Refs para controle
  const isMounted = useRef(true);
  const isFetching = useRef(false);

  // Cleanup no desmonte
  useEffect(() => {
    isMounted.current = true;
    return () => {
      console.log('🧹 useContacts: Cleanup no desmonte');
      isMounted.current = false;
      isFetching.current = false;
    };
  }, []);

  // Função para mapear dados do Supabase para interface do componente
  const mapSupabaseContact = useCallback((supabaseContact: any): Contact => {
    // Usar o campo resume diretamente da tabela
    let summary = supabaseContact.resume || 'Cliente interessado em nossos serviços.';
    
    // Usar o campo status diretamente da tabela
    let status: ClientStatus = 'Contacted';
    if (supabaseContact.status && ['Contacted', 'Negotiating', 'Purchased', 'Lost'].includes(supabaseContact.status)) {
      status = supabaseContact.status as ClientStatus;
    }
    
    // Usar o campo valor diretamente da tabela
    let purchaseAmount: number | undefined;
    if (supabaseContact.valor && !isNaN(Number(supabaseContact.valor))) {
      purchaseAmount = Number(supabaseContact.valor);
    }

    return {
      id: supabaseContact.id,
      name: supabaseContact.name || 'Nome não informado',
      phoneNumber: supabaseContact.phone_number,
      summary,
      date: supabaseContact.created_at || new Date().toISOString(),
      status,
      purchaseAmount,
      email: supabaseContact.email,
      tags: supabaseContact.tags,
      customFields: supabaseContact.custom_fields
    };
  }, []);

  // Função principal de busca
  const fetchContacts = useCallback(async () => {
    if (!isMounted.current || isFetching.current) {
      return;
    }

    if (!user?.id) {
      console.log('⚠️ useContacts: Usuário não logado');
      setIsLoading(false);
      setContacts([]);
      setTotalContacts(0);
      setError(null);
      return;
    }

    logger.sensitive('useContacts: Buscando contatos para usuário', { userId: user.id });

    isFetching.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!isMounted.current) return;

      if (error) {
        console.error('❌ useContacts: Erro ao buscar contatos:', error);
        throw error;
      }

      console.log('✅ useContacts: Dados recebidos:', data?.length || 0, 'contatos');
      
      const mappedContacts = data?.map(mapSupabaseContact) || [];

      setContacts(mappedContacts);
      setTotalContacts(mappedContacts.length);

    } catch (err) {
      if (!isMounted.current) return;
      
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('💥 useContacts: Erro:', errorMessage);
      setError(errorMessage);
      setContacts([]);
      setTotalContacts(0);
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
        isFetching.current = false;
      }
    }
  }, [user?.id]);

  // Função de refetch manual
  const refetch = useCallback(() => {
    console.log('🔄 useContacts: Refetch manual');
    if (isMounted.current && !isFetching.current) {
      fetchContacts();
    }
  }, []);

  // Efeito principal - executar apenas quando user.id mudar
  useEffect(() => {
    fetchContacts();
  }, [user?.id]); // Apenas user?.id como dependência

  return {
    contacts,
    isLoading,
    error,
    refetch,
    totalContacts
  };
}
