'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface AuthContextType {
  user: any;
  loading: boolean;
  openAuthModal: (customMessage?: string) => void;
  closeAuthModal: () => void;
  isAuthModalOpen: boolean;
  authMessage: string | null;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  openAuthModal: () => {},
  closeAuthModal: () => {},
  isAuthModalOpen: false,
  authMessage: null,
  signOut: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  const fetchUserProfile = async (authUser: any) => {
    if (!authUser) return null;
    try {
      const queryParam = authUser.id ? `id=${encodeURIComponent(authUser.id)}` : `email=${encodeURIComponent(authUser.email)}`;
      const res = await fetch(`/api/profiles?${queryParam}`);
      const data = await res.json();
      if (data.success && data.profile) {
        return {
          ...authUser,
          phone: data.profile.phone || authUser.phone,
          profile: data.profile,
          user_metadata: {
            ...authUser.user_metadata,
            phone: data.profile.phone || authUser.user_metadata?.phone,
          },
        };
      }
    } catch (e) {}
    return authUser;
  };

  const handleInitAuth = async () => {
    try {
      // 1. Get initial session from Supabase implicit/stored session
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const enriched = await fetchUserProfile(session.user);
        setUser(enriched);
        setLoading(false);
        return;
      }

      // 2. Fallback check for local storage session
      const cached = localStorage.getItem('raj_user_session') || localStorage.getItem('atelier_user');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setUser({
            id: parsed.id,
            email: parsed.email,
            user_metadata: { full_name: parsed.name || parsed.full_name, avatar_url: parsed.avatar || parsed.avatar_url },
            profile: parsed,
          });
        } catch (e) {}
      }
    } catch (err) {
      console.error('Auth initialization error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleInitAuth();

    // Realtime listener for hash tokens or sign in/out
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Supabase Auth Event:', event, session?.user?.email);
        if (session?.user) {
          const enriched = await fetchUserProfile(session.user);
          setUser(enriched);
          const fullName = enriched.user_metadata?.full_name || enriched.profile?.full_name || enriched.email?.split('@')[0] || 'Patron';
          const avatarUrl = enriched.user_metadata?.avatar_url || enriched.user_metadata?.picture || enriched.profile?.avatar_url;
          
          localStorage.setItem('raj_user_session', JSON.stringify({
            id: enriched.id,
            email: enriched.email,
            name: fullName,
            avatar: avatarUrl,
          }));

          if (enriched.profile?.phone) {
            localStorage.setItem('raj_user_phone', enriched.profile.phone);
          }
          setIsAuthModalOpen(false);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          localStorage.removeItem('raj_user_session');
          localStorage.removeItem('atelier_user');
          localStorage.removeItem('raj_user_phone');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    localStorage.removeItem('raj_user_session');
    localStorage.removeItem('atelier_user');
    localStorage.removeItem('raj_user_phone');
    setUser(null);
    window.location.reload();
  };

  const openAuthModal = (customMessage?: string) => {
    setAuthMessage(customMessage || null);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setAuthMessage(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        openAuthModal,
        closeAuthModal,
        isAuthModalOpen,
        authMessage,
        signOut,
        refreshUser: handleInitAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
