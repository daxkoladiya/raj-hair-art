'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, CheckCircle2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface PhoneOnboardingModalProps {
  isOpen: boolean;
  user: any;
  onSuccess: (updatedProfile: any) => void;
  onClose: () => void;
}

export default function PhoneOnboardingModal({
  isOpen,
  user,
  onSuccess,
  onClose,
}: PhoneOnboardingModalProps) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const cleanPhone = phone.trim().replace(/\D/g, '').slice(-10);

    if (cleanPhone.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number');
      return;
    }

    setLoading(true);
    try {
      const updatedProfile = {
        full_name: user.full_name || 'Patron',
        phone: cleanPhone,
        email: user.email || null,
        avatar_url: user.avatar_url || null,
        user_id: user.id || null,
      };

      const res = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProfile),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to save phone number');
      }

      // Also attempt Supabase update directly if user is logged in
      try {
        await supabase
          .from('profiles')
          .upsert({ ...updatedProfile, id: user.id })
          .select();
      } catch (e) {}

      localStorage.setItem('atelier_user', JSON.stringify(data.profile));
      localStorage.setItem('raj_user_phone', cleanPhone);
      onSuccess(data.profile);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update phone number');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/75 backdrop-blur-md"
        />

        {/* Modal Card / iOS Bottom Sheet on Mobile */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ type: 'spring', damping: 28, stiffness: 350 }}
          className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 sm:p-7 text-white z-10 shadow-[0_24px_50px_rgba(0,0,0,0.85)] max-h-[90vh] overflow-y-auto"
          style={{
            backgroundColor: 'rgba(22, 24, 29, 0.96)',
            backdropFilter: 'blur(32px) saturate(200%)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: 'inset 0 1.5px 1px 0 rgba(255, 255, 255, 0.35)',
          }}
        >
          {/* iOS Sheet Handle for mobile */}
          <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-3 sm:hidden" />
          {/* Header */}
          <div className="text-center mb-6">
            <span className="font-oleo text-base text-[#E63946]">One-Time Profile Setup</span>
            <h3 className="font-bebas text-3xl tracking-wide mt-0.5 text-white">
              Complete Your Atelier Profile
            </h3>
            <p className="font-playfair italic text-xs text-zinc-300 mt-1">
              Welcome <span className="text-white font-bold">{user.full_name || 'Patron'}</span>! Enter your 10-digit mobile number for booking confirmations & barber SMS reminders.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                10-Digit Mobile Number
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-xs text-zinc-400 font-medium font-mono">+91</span>
                <input
                  type="tel"
                  maxLength={10}
                  required
                  autoFocus
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="83475 78288"
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-[#E63946] focus:bg-white/10 transition-all font-mono"
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
              className="w-full py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs text-white bg-gradient-to-r from-[#E63946] to-[#C8102E] hover:from-[#f04856] hover:to-[#db1434] transition-all shadow-[0_4px_16px_rgba(230,57,70,0.4)] active:scale-98 cursor-pointer"
            >
              {loading ? 'Saving Mobile Number...' : 'Save & Enter Atelier'}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
