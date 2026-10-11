'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  Clock,
  User,
  Phone,
  Scissors,
  Download,
  XCircle,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Receipt,
} from 'lucide-react';
import { differenceInHours } from 'date-fns';
import { Appointment } from '@/types';
import { useAuth } from './AuthProvider';

interface VisitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenBooking?: () => void;
}

export default function VisitsModal({ isOpen, onClose, onOpenBooking }: VisitsModalProps) {
  const { user, openAuthModal } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [phoneInput, setPhoneInput] = useState('');

  // Fetch appointments whenever modal opens or user/phone changes
  const activePhone = user?.profile?.phone || user?.phone || (typeof window !== 'undefined' ? localStorage.getItem('raj_user_phone') : null);
  const activeEmail = user?.email;

  const fetchVisits = async () => {
    setIsLoading(true);
    try {
      let query = '';
      if (activePhone) {
        const clean = String(activePhone).trim().replace(/\D/g, '').slice(-10);
        query = `phone=${encodeURIComponent(clean)}`;
      } else if (activeEmail) {
        query = `email=${encodeURIComponent(activeEmail)}`;
      } else if (phoneInput.trim()) {
        const clean = String(phoneInput).trim().replace(/\D/g, '').slice(-10);
        query = `phone=${encodeURIComponent(clean)}`;
      }

      if (!query) {
        setIsLoading(false);
        return;
      }

      const res = await fetch(`/api/appointments?${query}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.appointments)) {
        setAppointments(data.appointments);
      }
    } catch (err) {
      console.error('Error loading visits:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchVisits();
    }
  }, [isOpen, user, activePhone, activeEmail]);

  const handleCancelAppointment = async (appt: Appointment) => {
    const apptDateTimeStr = `${appt.booking_date}T${
      appt.time_slot.includes('PM') && !appt.time_slot.startsWith('12')
        ? parseInt(appt.time_slot.split(':')[0]) + 12
        : appt.time_slot.split(':')[0].padStart(2, '0')
    }:${appt.time_slot.split(':')[1].slice(0, 2)}:00`;

    const apptDate = new Date(apptDateTimeStr);
    const hoursDifference = differenceInHours(apptDate, new Date());

    if (hoursDifference < 2 && hoursDifference >= 0) {
      alert('Appointments can only be cancelled at least 2 hours before the scheduled time.');
      return;
    }

    if (!confirm('Are you sure you want to cancel this reservation?')) return;

    try {
      const res = await fetch('/api/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: appt.id, status: 'cancelled' }),
      });

      const data = await res.json();
      if (data.success) {
        setActionMessage('Reservation cancelled successfully.');
        fetchVisits();
        setTimeout(() => setActionMessage(null), 3500);
      }
    } catch (err) {
      alert('Failed to cancel appointment.');
    }
  };

  const handleDownloadInvoice = (appt: Appointment) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${appt.id.slice(0, 8)} - RAJ Hair Art</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background: #0A0A0A; color: #F8F9FA; padding: 40px; margin: 0; }
          .card { max-width: 600px; margin: 0 auto; border: 1px solid #333; border-radius: 16px; padding: 32px; background: #141414; }
          .header { border-bottom: 2px solid #C8102E; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
          .title { font-size: 24px; font-weight: bold; color: #C8102E; letter-spacing: 2px; }
          .sub { font-size: 12px; color: #888; text-transform: uppercase; }
          .row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; }
          .label { color: #888; }
          .val { font-weight: 600; color: #FFF; }
          .total-box { margin-top: 24px; padding-top: 16px; border-top: 1px dashed #333; display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; }
          .footer { margin-top: 32px; text-align: center; font-size: 11px; color: #666; }
          @media print { body { background: #FFF; color: #000; } .card { background: #FFF; border-color: #DDD; } .val { color: #000; } }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <div>
              <div class="title">RAJ HAIR ART</div>
              <div class="sub">By Anil • Luxury Atelier Invoice</div>
            </div>
            <div style="text-align: right; font-size: 12px; color: #888;">
              Date: ${appt.booking_date}
            </div>
          </div>
          <div class="row"><span class="label">Invoice Ref:</span><span class="val">${appt.id}</span></div>
          <div class="row"><span class="label">Client Name:</span><span class="val">${appt.customer_name}</span></div>
          <div class="row"><span class="label">Phone:</span><span class="val">${appt.customer_phone}</span></div>
          <div class="row"><span class="label">Time Slot:</span><span class="val">${appt.time_slot}</span></div>
          <div class="row"><span class="label">Artisan Barber:</span><span class="val">${appt.barbers?.name || 'Assigned Master Stylist'}</span></div>
          <div class="row"><span class="label">Services:</span><span class="val">${Array.isArray(appt.service_names) ? appt.service_names.join(', ') : appt.service_names}</span></div>
          <div class="row"><span class="label">Status:</span><span class="val" style="color: #22c55e; text-transform: uppercase;">${appt.status}</span></div>

          <div class="total-box">
            <span>Total Investment:</span>
            <span style="color: #C8102E;">₹${appt.total_amount}</span>
          </div>

          <div class="footer">
            Thank you for choosing RAJ Hair Art by Anil.<br>
            Please present this receipt at the reception.
          </div>
        </div>
        <script>window.print();</script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Card / iOS Bottom Sheet on Mobile */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className="relative w-full max-w-2xl rounded-t-3xl sm:rounded-3xl p-5 sm:p-8 text-white z-10 shadow-[0_24px_60px_rgba(0,0,0,0.85)] max-h-[90vh] flex flex-col"
            style={{
              backgroundColor: 'rgba(20, 22, 28, 0.96)',
              backdropFilter: 'blur(36px) saturate(200%)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              boxShadow: 'inset 0 1.5px 1px 0 rgba(255, 255, 255, 0.35)',
            }}
          >
            {/* iOS Sheet Handle for mobile */}
            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-3 sm:hidden" />
            {/* Header */}
            <div className="flex items-center justify-between pb-5 border-b border-white/10 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#E63946] to-[#A00E1C] flex items-center justify-center text-white shadow-[0_0_15px_rgba(230,57,70,0.5)]">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bebas text-2xl tracking-wider text-white">MY VISITS & RESERVATIONS</h3>
                  <p className="font-playfair italic text-xs text-zinc-400">
                    {user ? `Patron: ${user.user_metadata?.full_name || user.profile?.full_name || user.email}` : 'Access your atelier booking history'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchVisits}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/20 transition-all cursor-pointer"
                  title="Refresh"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/20 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Alert Message */}
            {actionMessage && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs font-mono flex items-center gap-2 flex-shrink-0">
                <CheckCircle2 className="w-4 h-4" />
                <span>{actionMessage}</span>
              </div>
            )}

            {/* Content Area */}
            <div className="overflow-y-auto flex-1 mt-5 space-y-4 pr-1">
              {!user && !activePhone ? (
                /* Unauthenticated view */
                <div className="py-8 text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-[#E63946]">
                    <User className="w-6 h-6" />
                  </div>
                  <h4 className="font-bebas text-xl text-white">Sign In to View Your Visits</h4>
                  <p className="font-playfair italic text-xs text-zinc-400 max-w-sm mx-auto">
                    Sign in with Google or your mobile number to view and manage all your past and upcoming reservations.
                  </p>
                  <div className="flex justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        openAuthModal('Sign in to view your visit history and reservations.');
                      }}
                      className="px-6 py-2.5 rounded-full font-bebas text-sm tracking-wider uppercase bg-[#E63946] hover:bg-[#C8102E] text-white shadow-lg transition-all cursor-pointer"
                    >
                      Sign In Now
                    </button>
                  </div>
                </div>
              ) : isLoading ? (
                <div className="py-12 text-center text-zinc-400 space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#E63946]" />
                  <p className="text-xs font-mono">Loading reservation records...</p>
                </div>
              ) : appointments.length === 0 ? (
                <div className="py-12 text-center space-y-4">
                  <Scissors className="w-8 h-8 text-zinc-600 mx-auto" />
                  <h4 className="font-bebas text-xl text-white">No Visits Found</h4>
                  <p className="font-playfair italic text-xs text-zinc-400 max-w-xs mx-auto">
                    You have not reserved any appointments yet. Book an exclusive session today.
                  </p>
                  {onOpenBooking && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenBooking();
                      }}
                      className="px-6 py-2.5 rounded-full font-bebas text-sm tracking-wider uppercase bg-[#E63946] hover:bg-[#C8102E] text-white shadow-lg transition-all cursor-pointer"
                    >
                      Book a Reservation
                    </button>
                  )}
                </div>
              ) : (
                /* List of Appointments */
                <div className="space-y-3">
                  {appointments.map((appt) => (
                    <div
                      key={appt.id}
                      className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-white/20 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${
                              appt.status === 'confirmed'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : appt.status === 'completed'
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}
                          >
                            {appt.status}
                          </span>
                          <span className="text-xs font-mono text-zinc-400">Ref: #{appt.id.slice(0, 8)}</span>
                        </div>

                        <h5 className="font-bebas text-lg text-white tracking-wide truncate">
                          {Array.isArray(appt.service_names) ? appt.service_names.join(' • ') : appt.service_names}
                        </h5>

                        <div className="flex items-center gap-4 text-xs text-zinc-300 font-mono flex-wrap">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-[#E63946]" />
                            {appt.booking_date}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-[#E63946]" />
                            {appt.time_slot}
                          </span>
                          <span className="flex items-center gap-1.5 text-zinc-400">
                            <Scissors className="w-3.5 h-3.5 text-zinc-400" />
                            {appt.barbers?.name || 'Master Barber'}
                          </span>
                        </div>
                      </div>

                      {/* Pricing & Actions */}
                      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                        <div className="text-left sm:text-right">
                          <p className="font-bebas text-xl text-[#E63946] leading-none">₹{appt.total_amount}</p>
                          <p className="text-[10px] text-zinc-500 uppercase font-mono">Total</p>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleDownloadInvoice(appt)}
                            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                            title="Download Receipt"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          {appt.status !== 'cancelled' && (
                            <button
                              type="button"
                              onClick={() => handleCancelAppointment(appt)}
                              className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all cursor-pointer"
                              title="Cancel Reservation"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer info */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-zinc-500 font-mono flex-shrink-0">
              <span>Cancellations permitted &gt; 2 hrs before slot</span>
              <button
                type="button"
                onClick={onClose}
                className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
