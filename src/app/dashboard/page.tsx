'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Scissors,
  Calendar,
  Clock,
  User,
  ArrowLeft,
  XCircle,
  Download,
  LogOut,
  Sparkles,
  Phone,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { differenceInHours } from 'date-fns';
import { Appointment } from '@/types';

export default function DashboardPage() {
  const [phone, setPhone] = useState<string>('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    const savedPhone = localStorage.getItem('raj_user_phone');
    if (savedPhone) {
      const normalized = String(savedPhone).trim().replace(/\s+/g, '');
      setPhone(normalized);
      fetchUserAppointments(normalized);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUserAppointments = async (userPhone: string) => {
    setIsLoading(true);
    try {
      const normalizedPhone = String(userPhone).trim().replace(/\s+/g, '');
      const res = await fetch(`/api/appointments?phone=${encodeURIComponent(normalizedPhone)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.appointments)) {
        setAppointments(data.appointments);
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    const cleanPhone = String(phone).trim().replace(/\s+/g, '');
    localStorage.setItem('raj_user_phone', cleanPhone);
    setPhone(cleanPhone);
    fetchUserAppointments(cleanPhone);
  };

  const handleLogout = () => {
    localStorage.removeItem('raj_user_phone');
    setPhone('');
    setAppointments([]);
  };

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
        fetchUserAppointments(phone);
        setTimeout(() => setActionMessage(null), 4000);
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
    <div className="min-h-screen bg-gradient-to-b from-[#F5F5F7] via-[#212429] to-[#121316] text-white px-4 sm:px-6 py-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="bg-white/80 hover:bg-white text-[#111111] border border-black/10 px-4 py-2 rounded-full text-xs font-mono uppercase tracking-wider flex items-center gap-2 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Atelier</span>
          </Link>

          {phone && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fetchUserAppointments(phone)}
                className="bg-white/80 hover:bg-white text-[#111111] border border-black/10 px-3.5 py-2 rounded-full text-xs font-mono uppercase flex items-center gap-1.5 cursor-pointer shadow-sm"
                title="Refresh Reservations"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Refresh Visits</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="bg-white/80 hover:bg-white text-red-600 border border-black/10 px-4 py-2 rounded-full text-xs font-mono uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>

        {/* Action Alert */}
        {actionMessage && (
          <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* If Not Logged In, show Login Form */}
        {!phone ? (
          <div className="max-w-md mx-auto glass-modal p-8 rounded-3xl border border-white/10 text-center space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-[#C8102E]/20 text-[#C8102E] border border-[#C8102E]/40 flex items-center justify-center mx-auto">
              <Scissors className="w-7 h-7" />
            </div>
            <div>
              <h2 className="font-bebas text-3xl tracking-wide text-white">Client Portal</h2>
              <p className="font-playfair italic text-xs text-[#CED4DA] mt-1">
                Enter your mobile number to view your reservation history and download invoice slips.
              </p>
            </div>

            <form onSubmit={handleManualLogin} className="space-y-4">
              <div className="relative">
                <Phone className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  placeholder="8347578288"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#16181C] border border-white/10 rounded-xl px-4 py-3 pl-10 text-sm text-white focus:outline-none focus:border-[#C8102E] font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full btn-crimson py-3.5 rounded-xl font-bebas text-lg tracking-wider uppercase cursor-pointer"
              >
                Access My Dashboard
              </button>
            </form>
          </div>
        ) : (
          /* Logged In Dashboard View */
          <div className="space-y-8">
            {/* User Profile Header */}
            <div className="glass-modal p-6 sm:p-8 rounded-3xl border border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="font-oleo text-[#C8102E] text-lg">Patron Account</div>
                <h1 className="font-bebas text-3xl sm:text-4xl tracking-wide text-white">
                  My Atelier Reservations
                </h1>
                <p className="font-mono text-xs text-[#CED4DA] mt-1">
                  Registered Mobile: <span className="font-bold underline text-white">{phone}</span>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fetchUserAppointments(phone)}
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/15 px-4 py-2.5 rounded-xl font-bebas text-base uppercase tracking-wider flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh</span>
                </button>

                <Link
                  href="/#booking-wizard"
                  className="btn-crimson px-5 py-2.5 rounded-xl font-bebas text-base uppercase tracking-wider flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Reserve New Session</span>
                </Link>
              </div>
            </div>

            {/* Bookings List */}
            {isLoading ? (
              <div className="text-center py-16 text-xs font-mono text-[#CED4DA] animate-pulse flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-[#C8102E]" />
                <span>Loading your atelier reservations...</span>
              </div>
            ) : appointments.length === 0 ? (
              <div className="glass-card p-12 rounded-3xl border border-white/10 text-center space-y-4">
                <Calendar className="w-10 h-10 text-[#8E8E93] mx-auto" />
                <h3 className="font-bebas text-2xl text-white">No Reservations Found</h3>
                <p className="font-playfair italic text-xs text-[#CED4DA] max-w-sm mx-auto">
                  No appointments found under phone number <span className="font-bold text-white">{phone}</span>.
                </p>
                <Link
                  href="/#booking-wizard"
                  className="btn-crimson inline-flex px-6 py-2.5 rounded-xl font-bebas text-base uppercase"
                >
                  Book Your First Session
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((appt) => {
                  const isCancelled = appt.status === 'cancelled';
                  const isCompleted = appt.status === 'completed';

                  return (
                    <div
                      key={appt.id}
                      className={`glass-card p-6 rounded-3xl border transition-all ${
                        isCancelled
                          ? 'border-red-900/30 opacity-60'
                          : 'border-white/10'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        {/* Info Block */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <span
                              className={`px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider font-bold ${
                                isCancelled
                                  ? 'bg-red-950 text-red-400 border border-red-800'
                                  : isCompleted
                                  ? 'bg-blue-950 text-blue-400 border border-blue-800'
                                  : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              }`}
                            >
                              {appt.status}
                            </span>
                            <span className="text-xs font-mono text-[#8E8E93]">
                              Ref: {appt.id?.slice(0, 10).toUpperCase()}
                            </span>
                          </div>

                          <h3 className="font-bebas text-2xl text-white">
                            {Array.isArray(appt.service_names)
                              ? appt.service_names.join(' + ')
                              : appt.service_names}
                          </h3>

                          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#CED4DA]">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-[#C8102E]" />
                              <span>{appt.booking_date}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-[#C8102E]" />
                              <span>{appt.time_slot}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-[#C8102E]" />
                              <span>
                                {appt.barbers ? appt.barbers.name : 'Assigned Stylist'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Amount & Actions */}
                        <div className="flex flex-col md:items-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-white/10">
                          <div className="font-bebas text-3xl text-white">
                            ₹{appt.total_amount}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleDownloadInvoice(appt)}
                              className="bg-white/10 hover:bg-white/20 text-white border border-white/15 px-3.5 py-1.5 rounded-xl text-xs font-mono uppercase flex items-center gap-1.5 cursor-pointer"
                              title="Download Invoice"
                            >
                              <Download className="w-3.5 h-3.5 text-[#C8102E]" />
                              <span>Invoice Slip</span>
                            </button>

                            {!isCancelled && !isCompleted && (
                              <button
                                type="button"
                                onClick={() => handleCancelAppointment(appt)}
                                className="bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/40 px-3.5 py-1.5 rounded-xl text-xs font-mono uppercase flex items-center gap-1.5 cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Cancel</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
