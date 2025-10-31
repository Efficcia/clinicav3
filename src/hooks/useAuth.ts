'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isSupabaseEnabled } from '@/lib/supabaseClient';
import { useSupabaseAuth } from './useSupabaseAuth';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'doctor' | 'receptionist' | 'user';
  avatar?: string;
}

export const useAuth = () => {
  // Check if we should use Supabase or mock auth
  const shouldUseSupabase = isSupabaseEnabled();
  const supabaseAuth = useSupabaseAuth();

  // Mock auth state
  const [mockUser, setMockUser] = useState<User | null>(null);
  const [mockIsLoading, setMockIsLoading] = useState(true);
  const [mockIsAuthenticated, setMockIsAuthenticated] = useState(false);
  const router = useRouter();

  // If Supabase is enabled, use real auth
  if (shouldUseSupabase) {
    return supabaseAuth;
  }

  // Otherwise, use mock auth (backwards compatible)
  useEffect(() => {
    // Check if user is logged in on mount
    checkMockAuthStatus();
  }, []);

  // Load remember me preference
  useEffect(() => {
    const rememberMe = localStorage.getItem('clinictech_remember_me') === 'true';
    if (!rememberMe) {
      // If remember me is false, check session storage instead
      const sessionUser = sessionStorage.getItem('clinictech_user');
      const sessionToken = sessionStorage.getItem('clinictech_token');
      if (sessionUser && sessionToken) {
        setMockUser(JSON.parse(sessionUser));
        setMockIsAuthenticated(true);
      }
    }
  }, []);

  const checkMockAuthStatus = () => {
    try {
      const userData = localStorage.getItem('clinictech_user');
      const token = localStorage.getItem('clinictech_token');

      if (userData && token) {
        setMockUser(JSON.parse(userData));
        setMockIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setMockIsLoading(false);
    }
  };

  const mockLogin = async (email: string, password: string, rememberMe = false) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock users database
      const mockUsers = [
        {
          id: '1',
          name: 'Administrador',
          email: 'admin@clinicia.com',
          password: '123456',
          role: 'admin' as const
        },
        {
          id: '2',
          name: 'Dr. João Silva',
          email: 'doutor@clinicia.com',
          password: '123456',
          role: 'doctor' as const
        },
        {
          id: '3',
          name: 'Maria Recepcionista',
          email: 'recepcao@clinicia.com',
          password: '123456',
          role: 'receptionist' as const
        },
        {
          id: '4',
          name: 'Admin Teste',
          email: 'admin@teste.com',
          password: '123456',
          role: 'admin' as const
        }
      ];

      // Find user by email and password
      const foundUser = mockUsers.find(user =>
        user.email.toLowerCase() === email.toLowerCase() && user.password === password
      );

      if (foundUser) {
        const userData: User = {
          id: foundUser.id,
          name: foundUser.name,
          email: foundUser.email,
          role: foundUser.role
        };

        // Store based on remember me preference
        if (rememberMe) {
          localStorage.setItem('clinictech_user', JSON.stringify(userData));
          localStorage.setItem('clinictech_token', 'mock_token_123');
          localStorage.setItem('clinictech_remember_me', 'true');
        } else {
          sessionStorage.setItem('clinictech_user', JSON.stringify(userData));
          sessionStorage.setItem('clinictech_token', 'mock_token_123');
          localStorage.removeItem('clinictech_remember_me');
        }

        setMockUser(userData);
        setMockIsAuthenticated(true);

        return { success: true, user: userData };
      } else {
        // Check if email exists
        const emailExists = mockUsers.find(user =>
          user.email.toLowerCase() === email.toLowerCase()
        );

        if (emailExists) {
          return { success: false, error: 'Senha incorreta' };
        } else {
          return { success: false, error: 'Email não encontrado' };
        }
      }
    } catch {
      return { success: false, error: 'Erro ao tentar fazer login. Tente novamente.' };
    }
  };

  const mockLogout = () => {
    localStorage.removeItem('clinictech_user');
    localStorage.removeItem('clinictech_token');
    localStorage.removeItem('clinictech_remember_me');
    sessionStorage.removeItem('clinictech_user');
    sessionStorage.removeItem('clinictech_token');
    setMockUser(null);
    setMockIsAuthenticated(false);
    router.push('/login');
  };

  // Return mock auth
  return {
    user: mockUser,
    isLoading: mockIsLoading,
    isAuthenticated: mockIsAuthenticated,
    login: mockLogin,
    logout: mockLogout,
    checkAuthStatus: checkMockAuthStatus
  };
};
