'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Scissors, LogOut, Calendar, User, ChevronDown, Receipt, Menu, X } from 'lucide-react';
import { useAuth } from './AuthProvider';
import AuthModal from './AuthModal';
import PhoneOnboardingModal from './PhoneOnboardingModal';
import VisitsModal from './VisitsModal';

const NAV_ITEMS = [
  { id: 'barbers', label: 'Artisans', href: '#barbers', isAction: false },
  { id: 'booking-wizard', label: 'Reservations', href: '#booking-wizard', isAction: false },
  { id: 'reviews', label: 'Patron Reviews', href: '#reviews', isAction: false },
  { id: 'my-visits', label: 'My Visits', href: '#my-visits', isAction: true },
];

interface NavbarProps {
  onOpenBooking?: () => void;
  currentUserPhone?: string | null;
  onLoginPhoneSuccess?: (phone: string) => void;
}

export default function LuxuryDockNavbar({ onOpenBooking, onLoginPhoneSuccess }: NavbarProps = {}) {
  const { user, loading, isProfileLoaded, signOut, openAuthModal, closeAuthModal, isAuthModalOpen, authMessage, refreshUser, updateAuthUser } = useAuth();
  const [activeTab, setActiveTab] = useState('barbers');
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showVisitsModal, setShowVisitsModal] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check if phone number is present in user state or Supabase; ONLY show modal once for new users on first-time login
  useEffect(() => {
    // 1. If auth/profile is still resolving or not logged in, DO NOT show modal
    if (loading || !isProfileLoaded || !user) {
      setShowPhoneModal(false);
      return;
    }

    const userId = user.id || user.email || 'patron';
    const dismissedKey = `raj_phone_prompted_${userId}`;

    // 2. If the user already completed or was already prompted in this browser, never pop up again automatically
    if (typeof window !== 'undefined' && localStorage.getItem(dismissedKey)) {
      setShowPhoneModal(false);
      return;
    }

    // 3. If phone is already known in user state or cached in localStorage
    const cachedPhone = typeof window !== 'undefined' ? localStorage.getItem('raj_user_phone') : null;
    const existingPhone = user.profile?.phone || user.phone || user.user_metadata?.phone || cachedPhone;
    if (existingPhone && String(existingPhone).trim()) {
      const clean = String(existingPhone).trim().replace(/\D/g, '').slice(-10);
      localStorage.setItem('raj_user_phone', clean);
      localStorage.setItem(dismissedKey, 'true');
      if (onLoginPhoneSuccess) onLoginPhoneSuccess(clean);
      setShowPhoneModal(false);
      return;
    }

    // 4. Query Supabase profiles to verify if this user already has a phone saved
    const checkSupabaseProfile = async () => {
      try {
        const { supabase } = await import('@/lib/supabaseClient');
        const { data, error } = await supabase
          .from('profiles')
          .select('phone')
          .eq('id', user.id)
          .maybeSingle();

        if (!error && data?.phone && String(data.phone).trim()) {
          const clean = String(data.phone).trim().replace(/\D/g, '').slice(-10);
          localStorage.setItem('raj_user_phone', clean);
          localStorage.setItem(dismissedKey, 'true');
          updateAuthUser({ phone: clean });
          if (onLoginPhoneSuccess) onLoginPhoneSuccess(clean);
          setShowPhoneModal(false);
          return;
        }

        // Fallback API check
        const queryParam = user.id ? `id=${encodeURIComponent(user.id)}` : `email=${encodeURIComponent(user.email)}`;
        const res = await fetch(`/api/profiles?${queryParam}`);
        const d = await res.json();
        if (d.success && d.profile?.phone && String(d.profile.phone).trim()) {
          const clean = String(d.profile.phone).trim().replace(/\D/g, '').slice(-10);
          localStorage.setItem('raj_user_phone', clean);
          localStorage.setItem(dismissedKey, 'true');
          updateAuthUser({ phone: clean });
          if (onLoginPhoneSuccess) onLoginPhoneSuccess(clean);
          setShowPhoneModal(false);
          return;
        }

        // 5. New user on first login without phone: show onboarding modal once and mark prompted
        localStorage.setItem(dismissedKey, 'true');
        setShowPhoneModal(true);
      } catch (err) {
        console.error('Profile check error:', err);
        setShowPhoneModal(false);
      }
    };

    checkSupabaseProfile();
  }, [user, loading, isProfileLoaded]);

  // Automatic section detection during scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 220;
      for (const item of NAV_ITEMS) {
        if (item.isAction) continue;
        const el = document.getElementById(item.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveTab(item.id);
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handlePhoneOnboardingSuccess = async (updatedProfile: any) => {
    setShowPhoneModal(false);
    if (user) {
      const userId = user.id || user.email || 'patron';
      localStorage.setItem(`raj_phone_prompted_${userId}`, 'true');
    }
    updateAuthUser(updatedProfile);
    if (onLoginPhoneSuccess && updatedProfile.phone) {
      onLoginPhoneSuccess(updatedProfile.phone);
    }
    await refreshUser();
  };

  const handleNavItemClick = (e: React.MouseEvent<HTMLAnchorElement>, item: typeof NAV_ITEMS[0]) => {
    e.preventDefault();
    setActiveTab(item.id);
    setIsMobileMenuOpen(false);

    if (item.id === 'my-visits') {
      setShowVisitsModal(true);
      return;
    }

    const el = document.getElementById(item.id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Extract display name & avatar
  const userMetadata = user?.user_metadata || {};
  const displayName = userMetadata.full_name || userMetadata.name || user?.profile?.full_name || user?.name || user?.email?.split('@')[0] || 'Patron';
  const avatarUrl = userMetadata.avatar_url || userMetadata.picture || user?.profile?.avatar_url || user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`;
  const userPhone = user?.profile?.phone || user?.phone;

  return (
    <>
      <header className="fixed top-3 sm:top-5 inset-x-0 mx-auto w-[94%] sm:max-w-5xl z-40 pointer-events-none">
        <motion.nav
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-auto w-full flex items-center justify-between px-3.5 sm:px-6 py-2.5 sm:py-3 rounded-full relative transition-all duration-300"
          style={{
            backgroundColor: 'rgba(22, 24, 30, 0.65)',
            backdropFilter: 'blur(32px) saturate(210%)',
            WebkitBackdropFilter: 'blur(32px) saturate(210%)',
            border: '1px solid rgba(255, 255, 255, 0.22)',
            boxShadow: `
              inset 0 1.5px 1px 0 rgba(255, 255, 255, 0.38),
              inset 0 -1.5px 1px 0 rgba(0, 0, 0, 0.35),
              0 20px 45px -12px rgba(0, 0, 0, 0.55)
            `,
          }}
        >
          {/* Brand Identity */}
          <Link
            href="#hero"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('barbers');
              setIsMobileMenuOpen(false);
              const el = document.getElementById('hero');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center gap-2.5 sm:gap-3 group focus:outline-none cursor-pointer"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/60 border border-white/20 flex items-center justify-center p-1 shadow-[0_0_14px_rgba(242,13,24,0.45)] group-hover:scale-105 transition-transform duration-200 overflow-hidden">
              <img
                src="/brand-emblem.jpg"
                alt="RAJ Hair Art Emblem"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-bebas text-lg sm:text-xl tracking-wider text-white leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)]">
                RAJ HAIR ART
              </span>
              <span className="font-oleo text-[10px] sm:text-xs text-[#E63946] font-bold tracking-wide leading-tight -mt-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                by Anil
              </span>
            </div>
          </Link>

          {/* Desktop Center Links (Liquid Glass Indicator - 4 Main Items) */}
          <div className="hidden md:flex items-center gap-1.5 relative">
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={(e) => handleNavItemClick(e, item)}
                  className="relative px-3.5 py-2 text-xs uppercase tracking-widest font-bold transition-all duration-200 select-none z-10 cursor-pointer"
                  style={{
                    color: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.72)',
                    textShadow: '0 1px 3px rgba(0, 0, 0, 0.6)',
                  }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="iosActiveLens"
                      className="absolute inset-0 rounded-full -z-10"
                      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.18)',
                        backdropFilter: 'blur(16px)',
                        border: '1px solid rgba(255, 255, 255, 0.35)',
                        boxShadow: `
                          inset 0 1.5px 1.5px 0 rgba(255, 255, 255, 0.5),
                          0 6px 18px -4px rgba(0, 0, 0, 0.35)
                        `,
                      }}
                    />
                  )}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right Controls: Account Capsule & Book CTA / Mobile Hamburger */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* User Profile Pill or Sign In Button */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-full text-xs font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all active:scale-95 cursor-pointer"
                >
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-5 h-5 rounded-full object-cover border border-white/40"
                  />
                  <span className="hidden sm:inline max-w-[90px] truncate font-medium">{displayName.split(' ')[0]}</span>
                  <ChevronDown className="w-3 h-3 text-zinc-300" />
                </button>

                {/* Profile Glass Dropdown */}
                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-56 rounded-2xl p-3 text-white shadow-2xl z-50"
                      style={{
                        backgroundColor: 'rgba(20, 22, 28, 0.96)',
                        backdropFilter: 'blur(28px)',
                        border: '1px solid rgba(255, 255, 255, 0.16)',
                      }}
                    >
                      {/* User Info Header */}
                      <div className="px-2 py-2 border-b border-white/10 mb-2">
                        <p className="text-xs font-bold text-white truncate">{displayName}</p>
                        {userPhone ? (
                          <p className="text-[11px] text-zinc-400 mt-0.5 font-mono">+91 {userPhone}</p>
                        ) : (
                          <button
                            onClick={() => {
                              setIsDropdownOpen(false);
                              setShowPhoneModal(true);
                            }}
                            className="text-[10px] text-[#E63946] font-semibold underline mt-0.5 cursor-pointer"
                          >
                            + Link Mobile Number
                          </button>
                        )}
                        {user.email && <p className="text-[10px] text-zinc-500 truncate mt-0.5">{user.email}</p>}
                      </div>

                      {/* Log Out */}
                      <button
                        type="button"
                        onClick={() => {
                          signOut();
                          setIsDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Log Out</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => openAuthModal()}
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/15 transition-all active:scale-95 cursor-pointer"
              >
                <User className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-zinc-300" />
                <span className="hidden xs:inline">Sign In</span>
              </button>
            )}

            {/* Desktop Book Now Button */}
            <Link
              href="#booking-wizard"
              onClick={(e) => {
                if (onOpenBooking) {
                  onOpenBooking();
                } else {
                  const el = document.getElementById('booking-wizard');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="hidden sm:flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider text-white shadow-[0_4px_16px_rgba(230,57,70,0.45)] hover:scale-104 active:scale-95 transition-all duration-200 cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #E63946 0%, #B81424 100%)',
                border: '1px solid rgba(255, 255, 255, 0.32)',
                boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.45), 0 6px 20px rgba(230, 57, 70, 0.45)',
              }}
            >
              <Scissors className="w-3.5 h-3.5 text-white" />
              <span>Book Now</span>
            </Link>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white active:scale-90 transition-all cursor-pointer"
              aria-label="Toggle Mobile Navigation"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </motion.nav>

        {/* Mobile Slide-Out Frosted Drawer */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="pointer-events-auto md:hidden mt-3 w-full rounded-3xl p-4 text-white shadow-2xl border border-white/20"
              style={{
                backgroundColor: 'rgba(20, 22, 28, 0.96)',
                backdropFilter: 'blur(36px) saturate(200%)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.85)',
              }}
            >
              <div className="flex flex-col space-y-2">
                {NAV_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={(e) => handleNavItemClick(e as any, item)}
                    className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-mono uppercase tracking-wider font-bold transition-all flex items-center justify-between ${
                      activeTab === item.id
                        ? 'bg-[#E63946] text-white shadow-md shadow-[#E63946]/30'
                        : 'bg-white/5 hover:bg-white/10 text-zinc-300'
                    }`}
                  >
                    <span>{item.label}</span>
                    {item.id === 'my-visits' && <Receipt className="w-4 h-4 opacity-80" />}
                  </button>
                ))}

                {/* Mobile Book Button */}
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    if (onOpenBooking) onOpenBooking();
                  }}
                  className="w-full mt-2 py-3.5 rounded-2xl font-bebas text-base uppercase tracking-wider bg-gradient-to-r from-[#E63946] to-[#B81424] text-white shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <Scissors className="w-4 h-4" />
                  <span>Book Appointment Now</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Visits & Reservations Modal for Instant Access */}
      <VisitsModal
        isOpen={showVisitsModal}
        onClose={() => setShowVisitsModal(false)}
        onOpenBooking={onOpenBooking}
      />

      {/* Auth Modal with Custom Barrier Message Support */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        customMessage={authMessage}
        onSuccess={async () => {
          await refreshUser();
        }}
      />

      {/* One-Time Phone Onboarding Modal for Google Users */}
      <PhoneOnboardingModal
        isOpen={showPhoneModal}
        user={user ? { ...user, full_name: displayName } : null}
        onSuccess={handlePhoneOnboardingSuccess}
        onClose={() => {
          setShowPhoneModal(false);
          if (user) {
            const userId = user.id || user.email || 'patron';
            localStorage.setItem(`raj_phone_prompted_${userId}`, 'true');
          }
        }}
      />
    </>
  );
}
