import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { SubscriptionPlan } from '../types';
import { getMessageLimitByPlan } from '../lib/utils';
import { resetSubscriptionCache } from "@/lib/subscription-throttle";

interface UserContextType {
  user: SupabaseUser | null;
  isLoading: boolean;
  error: string | null;
  logout: () => Promise<void>;
  checkSubscriptionStatus: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const storageKey = `sb-${import.meta.env.VITE_SUPABASE_URL.split('//')[1].split('.')[0]}-auth-token`;

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Refs para controle
  const initializationAttempted = useRef(false);
  const lastCheckTime = useRef(0);
  const checkInProgress = useRef(false);
  const subscriptionRef = useRef<any>(null);

  // Função para verificar sessão com throttling
  const checkSession = useCallback(async (force = false) => {
    // Prevenir múltiplas chamadas simultâneas
    if (checkInProgress.current && !force) {
      console.log("Verificação de sessão já em andamento");
      return;
    }

    // Throttling: permitir apenas uma chamada a cada 2 segundos
    const now = Date.now();
    if (!force && now - lastCheckTime.current < 2000) {
      console.log("Throttling: muito cedo para nova verificação");
      return;
    }

    try {
      console.log("Iniciando verificação de sessão");
      checkInProgress.current = true;
      lastCheckTime.current = now;

      // Verificar token armazenado
      const storedSession = localStorage.getItem(storageKey);
      if (!storedSession) {
        console.log("Nenhuma sessão armazenada encontrada");
        setUser(null);
        setError(null);
        return;
      }

      // Tentar recuperar a sessão
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Erro ao obter sessão:", sessionError);
        throw sessionError;
      }

      if (session?.user) {
        console.log("Sessão encontrada, atualizando usuário");
        setUser(session.user);
        setError(null);
        
        // Tentar atualizar o token de acesso
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.warn("Erro ao atualizar token:", refreshError);
        } else if (refreshData.session) {
          console.log("Token atualizado com sucesso");
          // O cliente Supabase cuidará do armazenamento do token
        }
      } else {
        console.log("Nenhuma sessão ativa encontrada");
        setUser(null);
        // Limpar tokens antigos
        localStorage.removeItem(storageKey);
        localStorage.removeItem('auth_token');
      }
    } catch (err) {
      console.error('Erro ao verificar sessão:', err);
      setError('Erro ao verificar sessão');
      setUser(null);
      // Limpar tokens em caso de erro
      localStorage.removeItem(storageKey);
      localStorage.removeItem('auth_token');
    } finally {
      checkInProgress.current = false;
      setIsLoading(false);
    }
  }, []);

  // Verificar sessão inicial - apenas uma vez
  useEffect(() => {
    const initializeAuth = async () => {
      if (initializationAttempted.current) {
        console.log("Inicialização já tentada, ignorando");
        return;
      }

      console.log("Iniciando verificação inicial de sessão");
      initializationAttempted.current = true;

      try {
        // Tentar recuperar sessão existente
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        if (session?.user) {
          console.log("Sessão inicial encontrada:", session.user.email);
          setUser(session.user);
          setError(null);
          
          // Atualizar token
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) {
            console.warn("Erro ao atualizar token:", refreshError);
          } else if (refreshData.session) {
            console.log("Token atualizado com sucesso");
          }
        } else {
          console.log("Nenhuma sessão inicial encontrada");
          setUser(null);
          // Limpar tokens antigos
          localStorage.removeItem(storageKey);
          localStorage.removeItem('auth_token');
        }
      } catch (err) {
        console.error("Erro na inicialização:", err);
        setError("Erro ao inicializar autenticação");
        // Limpar tokens em caso de erro
        localStorage.removeItem(storageKey);
        localStorage.removeItem('auth_token');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Evento de autenticação:", event, session ? "com sessão" : "sem sessão");
      
      // Limpar estado anterior
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }

      if (event === 'SIGNED_IN' && session?.user) {
        console.log("Usuário logado, atualizando estado");
        setUser(session.user);
        setError(null);
        setIsLoading(false);
      } else if (event === 'SIGNED_OUT') {
        console.log("Usuário deslogado");
        setUser(null);
        setError(null);
        setIsLoading(false);
        // Limpar tokens
        localStorage.removeItem(storageKey);
        localStorage.removeItem('auth_token');
      } else if (event === 'TOKEN_REFRESHED' && session) {
        console.log("Token atualizado, atualizando estado");
        setUser(session.user);
      }
    });

    subscriptionRef.current = subscription;

    // Cleanup
    return () => {
      console.log("Limpando listener de autenticação");
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, []);

  // Função de logout com limpeza de estado
  const logout = async () => {
    try {
      console.log("Iniciando processo de logout");
      setIsLoading(true);
      
      // Limpar subscription antes do logout
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }

      // Limpar tokens
      localStorage.removeItem(storageKey);
      localStorage.removeItem('auth_token');
      
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      
      // Limpar estado
      setUser(null);
      setError(null);
      initializationAttempted.current = false;
      lastCheckTime.current = 0;
      
      console.log("Logout concluído com sucesso");
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
      setError('Erro ao fazer logout');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para verificar status da assinatura com throttling
  const checkSubscriptionStatus = async () => {
    if (!user) {
      console.log("Sem usuário, ignorando verificação de assinatura");
      return;
    }

    if (checkInProgress.current) {
      console.log("Verificação de assinatura já em andamento");
      return;
    }

    try {
      console.log("Iniciando verificação de assinatura");
      checkInProgress.current = true;
      setIsLoading(true);

      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (subError) throw subError;

      setUser(prev => prev ? { ...prev, subscription } : null);
      setError(null);
    } catch (err) {
      console.error('Erro ao verificar assinatura:', err);
      setError('Erro ao verificar status da assinatura');
    } finally {
      checkInProgress.current = false;
      setIsLoading(false);
    }
  };

  return (
    <UserContext.Provider value={{ 
      user, 
      isLoading, 
      error,
      logout,
      checkSubscriptionStatus
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
