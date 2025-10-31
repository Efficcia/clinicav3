'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabaseClient';
import type { User as SupabaseUser, AuthError } from '@supabase/supabase-js';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'doctor' | 'receptionist' | 'user';
}

interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

export function useSupabaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check current session
    checkAuthStatus();

    // Listen for auth changes
    if (supabaseClient) {
      const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth state changed:', event);

          if (session?.user) {
            await loadUserProfile(session.user.id, session.user.email, session.user.user_metadata);
          } else {
            setUser(null);
            setIsAuthenticated(false);
          }

          setIsLoading(false);
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const checkAuthStatus = async () => {
    try {
      if (!supabaseClient) {
        setIsLoading(false);
        return;
      }

      console.log('[AUTH] Verificando sessão...');
      const startTime = Date.now();

      const { data: { session }, error } = await supabaseClient.auth.getSession();

      const duration = Date.now() - startTime;
      console.log(`[AUTH] Sessão verificada em ${duration}ms`);

      if (error) {
        console.error('[AUTH] Erro ao verificar sessão:', error);
        setIsLoading(false);
        return;
      }

      if (session?.user) {
        await loadUserProfile(session.user.id, session.user.email, session.user.user_metadata);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('[AUTH] Erro crítico:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserProfile = async (userId: string, email?: string, metadata?: any) => {
    try {
      // Use dados já disponíveis da sessão ao invés de fazer nova chamada
      const userData: User = {
        id: userId,
        name: metadata?.name || email?.split('@')[0] || 'Usuário',
        email: email || '',
        role: (metadata?.role as User['role']) || 'admin'
      };
      setUser(userData);
      setIsAuthenticated(true);
      console.log('[AUTH] User authenticated:', userData.email);
    } catch (error) {
      console.error('Error loading user profile:', error);
      // FALLBACK: Set authenticated anyway to not block user
      setIsAuthenticated(true);
      setUser({
        id: userId,
        name: 'Usuário',
        email: '',
        role: 'admin'
      });
    }
  };

  const login = async (email: string, password: string, rememberMe = false): Promise<AuthResult> => {
    try {
      if (!supabaseClient) {
        return { success: false, error: 'Supabase não está configurado' };
      }

      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);

        // User-friendly error messages
        if (error.message.includes('Invalid login credentials')) {
          return { success: false, error: 'Email ou senha incorretos' };
        }
        if (error.message.includes('Email not confirmed')) {
          return { success: false, error: 'Por favor, confirme seu email antes de fazer login' };
        }

        return { success: false, error: error.message };
      }

      if (data.user) {
        await loadUserProfile(data.user.id, data.user.email, data.user.user_metadata);
        return { success: true, user: user || undefined };
      }

      return { success: false, error: 'Erro ao fazer login' };
    } catch (error) {
      console.error('Unexpected login error:', error);
      return { success: false, error: 'Erro inesperado ao fazer login' };
    }
  };

  const register = async (
    email: string,
    password: string,
    name: string,
    role: User['role'] = 'user'
  ): Promise<AuthResult> => {
    try {
      if (!supabaseClient) {
        return { success: false, error: 'Supabase não está configurado' };
      }

      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
          },
        },
      });

      if (error) {
        console.error('Registration error:', error);

        if (error.message.includes('already registered')) {
          return { success: false, error: 'Este email já está cadastrado' };
        }

        return { success: false, error: error.message };
      }

      if (data.user) {
        // Check if email confirmation is required
        if (data.user.identities && data.user.identities.length === 0) {
          return {
            success: true,
            error: 'Conta criada! Verifique seu email para confirmar o cadastro.'
          };
        }

        return { success: true };
      }

      return { success: false, error: 'Erro ao criar conta' };
    } catch (error) {
      console.error('Unexpected registration error:', error);
      return { success: false, error: 'Erro inesperado ao criar conta' };
    }
  };

  const logout = async () => {
    try {
      if (supabaseClient) {
        await supabaseClient.auth.signOut();
      }

      setUser(null);
      setIsAuthenticated(false);
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const resetPassword = async (email: string): Promise<AuthResult> => {
    try {
      if (!supabaseClient) {
        return { success: false, error: 'Supabase não está configurado' };
      }

      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error);
      return { success: false, error: 'Erro ao enviar email de recuperação' };
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    resetPassword,
  };
}
