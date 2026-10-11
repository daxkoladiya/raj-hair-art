'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, User, Mail, Sparkles, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (userProfile: any) => void;
  customMessage?: string | null;
}

export default function AuthModal({ isOpen, onClose, onSuccess, customMessage }: AuthModalProps) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Google OAuth Flow (Implicit Flow with exact origin redirect & prompt select_account)
  const handleGoogleLogin = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    try {
      setLoading(true);
      setErrorMsg('');
      const redirectOrigin = typeof window !== 'undefined' ? `${window.location.origin}/` : 'http://localhost:3000/';
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectOrigin,
          queryParams: {
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        console.error('Google Sign-In Error:', error.message);
        setErrorMsg('Google Sign-In failed: ' + error.message);
        setLoading(false);
        return;
      }

      // Force browser navigation if OAuth URL is returned directly
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error('Unexpected Google Auth error:', err);
      setErrorMsg(err.message || 'Google authentication encountered an issue.');
      setLoading(false);
    }
  };

  // 2. Direct Mobile / Name Account Creation & Login
  const handleManualAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const cleanPhone = phone.trim().replace(/\D/g, '').slice(-10);

    if (cleanPhone.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number');
      return;
    }

    setLoading(true);
    try {
      // Check existing customer profile via API
      const checkRes = await fetch(`/api/profiles?phone=${encodeURIComponent(cleanPhone)}`);
      const checkData = await checkRes.json();

      if (checkData.success && checkData.profile) {
        localStorage.setItem('atelier_user', JSON.stringify(checkData.profile));
        localStorage.setItem('raj_user_phone', cleanPhone);
        localStorage.setItem('raj_user_session', JSON.stringify({
          id: checkData.profile.id,
          name: checkData.profile.full_name,
          phone: checkData.profile.phone,
          email: checkData.profile.email,
          avatar: checkData.profile.avatar_url,
        }));
        onSuccess(checkData.profile);
        onClose();
        return;
      }

      // If signing up / new user
      if (!fullName.trim()) {
        setErrorMsg('Please provide your Full Name to complete your atelier profile.');
        setLoading(false);
        return;
      }

      const newProfile = {
        full_name: fullName.trim(),
        phone: cleanPhone,
        email: email.trim() || null,
        avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName.trim())}`,
      };

      const createRes = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProfile),
      });

      const createData = await createRes.json();
      if (!createData.success) {
        throw new Error(createData.error || 'Failed to register profile');
      }

      localStorage.setItem('atelier_user', JSON.stringify(createData.profile));
      localStorage.setItem('raj_user_phone', cleanPhone);
      localStorage.setItem('raj_user_session', JSON.stringify({
        id: createData.profile.id,
        name: createData.profile.full_name,
        phone: createData.profile.phone,
        email: createData.profile.email,
        avatar: createData.profile.avatar_url,
      }));
      onSuccess(createData.profile);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-md cursor-pointer"
        />

        {/* Modal Window / iOS Bottom Sheet on Mobile */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ type: 'spring', damping: 28, stiffness: 350 }}
          className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 sm:p-7 text-white z-10 shadow-[0_24px_50px_rgba(0,0,0,0.85)] max-h-[90vh] overflow-y-auto"
          style={{
            backgroundColor: 'rgba(22, 24, 29, 0.96)',
            backdropFilter: 'blur(32px) saturate(200%)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            boxShadow: 'inset 0 1.5px 1px 0 rgba(255, 255, 255, 0.35)',
          }}
        >
          {/* iOS Sheet Handle for mobile */}
          <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-3 sm:hidden" />

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-5 sm:right-5 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/20 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <span className="font-oleo text-base text-[#E63946]">Exclusive Patron Access</span>
            <h3 className="font-bebas text-3xl tracking-wide mt-0.5 text-white">RAJ HAIR ART ATELIER</h3>
            <p className="font-playfair italic text-xs text-zinc-400 mt-1">Manage your grooming reservations & bespoke experiences</p>
          </div>

          {/* Custom Banner if opened during booking flow */}
          {customMessage && (
            <div className="mb-4 p-3 rounded-xl bg-[#C8102E]/20 border border-[#C8102E]/50 text-white text-xs font-mono flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#E63946] flex-shrink-0" />
              <span>{customMessage}</span>
            </div>
          )}

          {/* Google 1-Click Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl font-semibold text-xs text-zinc-900 bg-white hover:bg-zinc-100 transition-all active:scale-98 shadow-sm mb-4 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="relative flex py-2 items-center mb-4">
            <div className="flex-grow border-t border-white/10" />
            <span className="flex-shrink mx-3 text-[10px] uppercase font-bold tracking-widest text-zinc-500">Or with Mobile</span>
            <div className="flex-grow border-t border-white/10" />
          </div>

          {/* Form */}
          <form onSubmit={handleManualAuth} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Dax Koladiya"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-[#E63946] focus:bg-white/10 transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                10-Digit Mobile Number
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs text-zinc-400 font-medium font-mono">+91</span>
                <input
                  type="tel"
                  maxLength={10}
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="83475 78288"
                  className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-[#E63946] focus:bg-white/10 transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                Email Address <span className="text-zinc-500 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="client@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-[#E63946] focus:bg-white/10 transition-all font-mono"
                />
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-400 bg-rose-950/40 border border-rose-800/40 p-2.5 rounded-xl text-center font-mono">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold uppercase tracking-wider text-xs text-white bg-gradient-to-r from-[#E63946] to-[#C8102E] hover:from-[#f04856] hover:to-[#db1434] transition-all shadow-[0_4px_16px_rgba(230,57,70,0.4)] active:scale-98 cursor-pointer"
            >
              {loading ? 'Verifying Patron Profile...' : 'Access My Atelier Account'}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
