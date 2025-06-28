import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { User, SubscriptionPlan } from '../types';
import { getMessageLimitByPlan } from '../lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface UserContextType {
  user: User | null;
  updateUser: (updatedUser: Partial<User>) => void;
  setPlan: (plan: SubscriptionPlan) => void;
  logout: () => void;
  login: (email: string, name: string) => void;
  isLoading: boolean;
  checkSubscriptionStatus: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  // 🚨 EMERGENCY FIX: NEVER show loading to prevent "Verificando sessão..."
  const [isLoading] = useState(false); // HARDCODED FALSE
  const [user, setUser] = useState<User | null>(null);
  
  // Simple user creation without complex checks
  const createUserWithDefaultPlan = useCallback((supabaseUser: any): User => {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: supabaseUser.user_metadata?.name || supabaseUser.email || '',
      plan: 'free',
      messageCount: 0,
      messageLimit: getMessageLimitByPlan('free'),
      agents: [],
    };
  }, []);
  
  // 🚨 EMERGENCY: Disabled to prevent loops
  const checkSubscriptionStatus = useCallback(async () => {
    console.log('🚨 EMERGENCY: checkSubscriptionStatus DISABLED');
    return;
  }, []);
  
  // Simple auth listener - NO LOADING STATES
  useEffect(() => {
    console.log('🔐 UserContext: Setup auth listener (EMERGENCY MODE)');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`🔐 Auth event: ${event}`);
        
        if (event === 'SIGNED_IN' && session?.user) {
          const newUser = createUserWithDefaultPlan(session.user);
          setUser(newUser);
          console.log('✅ User logged in:', newUser.email);
        }
        
        if (event === 'SIGNED_OUT') {
          setUser(null);
          console.log('👋 User logged out');
        }
      }
    );
    
    // Check initial session - NO LOADING
    const checkInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const newUser = createUserWithDefaultPlan(session.user);
          setUser(newUser);
          console.log('✅ Initial session found:', newUser.email);
        }
      } catch (err) {
        console.error('Error checking session:', err);
      }
    };
    
    checkInitialSession();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [createUserWithDefaultPlan]);

  const updateUser = useCallback((updatedUser: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updatedUser } : null);
  }, []);

  const login = useCallback(async (email: string, name: string) => {
    const newUser: User = {
      id: `user-${Date.now()}`,
      email,
      name,
      plan: 'free',
      messageCount: 0,
      messageLimit: getMessageLimitByPlan('free'),
      agents: [],
    };
    setUser(newUser);
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const setPlan = useCallback((plan: SubscriptionPlan) => {
    setUser(prev => prev ? { ...prev, plan, messageLimit: getMessageLimitByPlan(plan) } : null);
  }, []);

  return (
    <UserContext.Provider 
      value={{ 
        user, 
        updateUser, 
        setPlan, 
        logout, 
        login,
        isLoading, // ALWAYS FALSE
        checkSubscriptionStatus 
      }}
    >
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
