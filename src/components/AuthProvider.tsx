'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface AuthContextType {
  user: any;
  loading: boolean;
  isProfileLoaded: boolean;
  openAuthModal: (customMessage?: string) => void;
  closeAuthModal: () => void;
  isAuthModalOpen: boolean;
  authMessage: string | null;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateAuthUser: (updatedData: any) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isProfileLoaded: false,
  openAuthModal: () => {},
  closeAuthModal: () => {},
  isAuthModalOpen: false,
  authMessage: null,
  signOut: async () => {},
  refreshUser: async () => {},
  updateAuthUser: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  const fetchUserProfile = async (authUser: any) => {
    if (!authUser) return null;
    try {
      // 1. Direct Supabase profiles table query
      try {
        const { data: profileRow } = await supabase
          .from('profiles')
          .select('id, phone, full_name, email, avatar_url')
          .eq('id', authUser.id)
          .single();

        if (profileRow && profileRow.phone && profileRow.phone.trim()) {
          const cleanPhone = profileRow.phone.trim().replace(/\D/g, '').slice(-10);
          return {
            ...authUser,
            phone: cleanPhone,
            profile: { ...profileRow, phone: cleanPhone },
            user_metadata: {
              ...authUser.user_metadata,
              phone: cleanPhone,
            },
          };
        }
      } catch (err) {}

      // 2. Query API /api/profiles route with fallback
      const queryParam = authUser.id ? `id=${encodeURIComponent(authUser.id)}` : `email=${encodeURIComponent(authUser.email)}`;
      const res = await fetch(`/api/profiles?${queryParam}`);
      const data = await res.json();
      if (data.success && data.profile) {
        const phone = data.profile.phone || authUser.phone || '';
        const cleanPhone = phone ? phone.trim().replace(/\D/g, '').slice(-10) : '';
        return {
          ...authUser,
          phone: cleanPhone,
          profile: { ...data.profile, phone: cleanPhone },
          user_metadata: {
            ...authUser.user_metadata,
            phone: cleanPhone || authUser.user_metadata?.phone,
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
        setIsProfileLoaded(true);
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
            user_metadata: { full_name: parsed.name || parsed.full_name, avatar_url: parsed.avatar || parsed.avatar_url, phone: parsed.phone },
            profile: parsed,
            phone: parsed.phone || null,
          });
        } catch (e) {}
      }
    } catch (err) {
      console.error('Auth initialization error:', err);
    } finally {
      setIsProfileLoaded(true);
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
          setIsProfileLoaded(true);
          const fullName = enriched.user_metadata?.full_name || enriched.profile?.full_name || enriched.email?.split('@')[0] || 'Patron';
          const avatarUrl = enriched.user_metadata?.avatar_url || enriched.user_metadata?.picture || enriched.profile?.avatar_url;
          
          localStorage.setItem('raj_user_session', JSON.stringify({
            id: enriched.id,
            email: enriched.email,
            name: fullName,
            avatar: avatarUrl,
            phone: enriched.profile?.phone || enriched.phone || null,
          }));

          if (enriched.profile?.phone) {
            localStorage.setItem('raj_user_phone', enriched.profile.phone);
          }
          setIsAuthModalOpen(false);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsProfileLoaded(true);
          localStorage.removeItem('raj_user_session');
          localStorage.removeItem('atelier_user');
          localStorage.removeItem('raj_user_phone');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const updateAuthUser = (updatedProfile: any) => {
    if (!updatedProfile) return;
    const cleanPhone = updatedProfile.phone ? String(updatedProfile.phone).trim().replace(/\D/g, '').slice(-10) : '';
    setUser((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        phone: cleanPhone || prev.phone,
        profile: { ...(prev.profile || {}), ...updatedProfile, phone: cleanPhone || prev.profile?.phone },
        user_metadata: {
          ...(prev.user_metadata || {}),
          phone: cleanPhone || prev.user_metadata?.phone,
        },
      };
    });
    if (cleanPhone) {
      localStorage.setItem('raj_user_phone', cleanPhone);
    }
    setIsProfileLoaded(true);
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    localStorage.removeItem('raj_user_session');
    localStorage.removeItem('atelier_user');
    localStorage.removeItem('raj_user_phone');
    setUser(null);
    setIsProfileLoaded(true);
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
        isProfileLoaded,
        openAuthModal,
        closeAuthModal,
        isAuthModalOpen,
        authMessage,
        signOut,
        refreshUser: handleInitAuth,
        updateAuthUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
