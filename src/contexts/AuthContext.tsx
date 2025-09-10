'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, AuthState } from '@/types';

interface AuthContextType extends AuthState {
  signInWithGoogle: () => Promise<boolean>;
  signOut: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');

      if (token && userStr) {
        const user = JSON.parse(userStr);
        const isValid = await verifyToken(token);

        if (isValid) {
          setAuthState({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          // Token is invalid, clear storage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setAuthState({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const verifyToken = async (token: string): Promise<boolean> => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://felicit.at/dockermanager/api';
      const response = await fetch(`${baseUrl}/auth/verify-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      return response.ok;
    } catch (error) {
      console.error('Token verification failed:', error);
      return false;
    }
  };

  const signInWithGoogle = async (): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      // For web, we'll use Google OAuth redirect
      const clientId = process.env.GOOGLE_CLIENT_ID || '509848869065-qsom2a6m7lv5uqn0l61inn3b6gh6g4ef.apps.googleusercontent.com';
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://felicit.at/dockermanager/api';
      const redirectUri = `${window.location.origin}/auth/callback`;
      const scope = 'email profile openid';

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scope)}&` +
        `response_type=code&` +
        `access_type=offline&` +
        `state=${encodeURIComponent(baseUrl)}`;

      window.location.href = authUrl;
      return true;
    } catch (error) {
      console.error('Google sign in failed:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    // Implement token refresh logic if needed
    return false;
  };

  const value: AuthContextType = {
    ...authState,
    signInWithGoogle,
    signOut,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
