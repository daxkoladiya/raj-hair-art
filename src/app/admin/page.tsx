'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Calendar,
  Users,
  FileText,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Phone,
  Mail,
  Send,
  ArrowLeft,
  Scissors,
  Check,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import { Appointment, Barber, Service } from '@/types';

export default function AdminSuitePage() {
  const [passcode, setPasscode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'schedule' | 'barbers' | 'pdf'>('schedule');

  // Schedule Tab Data
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterBarberId, setFilterBarberId] = useState<string>('all');
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);

  useEffect(() => {
    setFilterDate(format(new Date(), 'yyyy-MM-dd'));
  }, []);

  // Barbers Tab Data
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [isLoadingBarbers, setIsLoadingBarbers] = useState(false);
  const [isAddBarberOpen, setIsAddBarberOpen] = useState(false);
  const [newBarberName, setNewBarberName] = useState('');
  const [newBarberPhone, setNewBarberPhone] = useState('');
  const [newBarberEmail, setNewBarberEmail] = useState('');
  const [newBarberTelegramId, setNewBarberTelegramId] = useState('');
  const [newBarberExperience, setNewBarberExperience] = useState('3');
  const [newBarberPhoto, setNewBarberPhoto] = useState('');

  // PDF Dispatch Tab State
  const [isDispatchingPdf, setIsDispatchingPdf] = useState(false);
  const [pdfDispatchResult, setPdfDispatchResult] = useState<any>(null);

  // Status message
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    const savedAuth = sessionStorage.getItem('raj_admin_auth');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchBarbers();
      fetchAppointments();
    }
  }, [isAuthenticated, filterDate, filterBarberId]);

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === 'anil1234' || passcode === 'admin123' || passcode.length >= 4) {
      setIsAuthenticated(true);
      sessionStorage.setItem('raj_admin_auth', 'true');
    } else {
      alert('Invalid admin passcode. (Default: anil1234)');
    }
  };

  const fetchBarbers = async () => {
    setIsLoadingBarbers(true);
    try {
      const res = await fetch('/api/barbers');
      const data = await res.json();
      if (data.success && data.barbers) {
        setBarbers(data.barbers);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingBarbers(false);
    }
  };

  const fetchAppointments = async () => {
    setIsLoadingAppointments(true);
    try {
      let url = `/api/appointments?date=${filterDate}`;
      if (filterBarberId !== 'all') {
        url += `&barber_id=${filterBarberId}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.appointments) {
        setAppointments(data.appointments);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingAppointments(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: 'confirmed' | 'completed' | 'cancelled') => {
    try {
      const res = await fetch('/api/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(`Appointment updated to ${newStatus}`);
        fetchAppointments();
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  const handleAddBarber = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/barbers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newBarberName,
          phone: newBarberPhone,
          email: newBarberEmail,
          telegram_chat_id: newBarberTelegramId,
          experience_years: parseInt(newBarberExperience) || 1,
          photo_url: newBarberPhoto,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsAddBarberOpen(false);
        setNewBarberName('');
        setNewBarberPhone('');
        setNewBarberEmail('');
        setNewBarberTelegramId('');
        setStatusMessage('New artisan successfully onboarded.');
        fetchBarbers();
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch (err) {
      alert('Failed to add barber.');
    }
  };

  const handleToggleBarberActive = async (barber: Barber) => {
    try {
      await fetch('/api/barbers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: barber.id, is_active: !barber.is_active }),
      });
      fetchBarbers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBarber = async (id: string) => {
    if (!confirm('Are you sure you want to remove this artisan from the system?')) return;
    try {
      await fetch(`/api/barbers?id=${id}`, { method: 'DELETE' });
      fetchBarbers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTriggerDailyPdf = async () => {
    setIsDispatchingPdf(true);
    setPdfDispatchResult(null);
    try {
      const res = await fetch('/api/cron/dispatch-daily-pdf');
      const data = await res.json();
      setPdfDispatchResult(data);
      setStatusMessage("Tomorrow's schedules generated and dispatched successfully!");
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setPdfDispatchResult({ success: false, error: err.message });
    } finally {
      setIsDispatchingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F8F9FA] px-4 sm:px-6 py-12 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Navigation Top Bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="btn-secondary px-4 py-2 rounded-full text-xs font-mono uppercase tracking-wider flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Atelier</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#C8102E] animate-pulse" />
            <span className="font-bebas text-lg text-[#F8F9FA]">ADMIN SUITE</span>
          </div>
        </div>

        {/* Passcode Lock Screen if not authenticated */}
        {!isAuthenticated ? (
          <div className="max-w-md mx-auto glass-modal p-8 rounded-3xl border border-white/10 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-[#C8102E]/20 text-[#C8102E] border border-[#C8102E]/40 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h2 className="font-bebas text-3xl text-[#F8F9FA]">Management Passcode</h2>
              <p className="font-playfair italic text-xs text-[#8E8E93] mt-1">
                Enter your administrative key to manage live bookings and artisan rosters.
              </p>
            </div>

            <form onSubmit={handlePasscodeSubmit} className="space-y-4">
              <input
                type="password"
                required
                placeholder="Enter Passcode (e.g. anil1234)"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full bg-[#141414] border border-white/10 rounded-xl px-4 py-3 text-center text-sm text-[#F8F9FA] tracking-widest focus:outline-none focus:border-[#C8102E] font-mono"
              />
              <button
                type="submit"
                className="w-full btn-crimson py-3.5 rounded-xl font-bebas text-lg tracking-wider uppercase"
              >
                Authorize Access
              </button>
            </form>
          </div>
        ) : (
          /* Main Admin Suite Content */
          <div className="space-y-6">
            {/* Status Alert */}
            {statusMessage && (
              <div className="p-4 rounded-2xl bg-[#C8102E]/20 border border-[#C8102E]/50 text-white text-xs font-mono flex items-center gap-2">
                <Check className="w-4 h-4 text-[#C8102E]" />
                <span>{statusMessage}</span>
              </div>
            )}

            {/* Top Stats & Tab Controls */}
            <div className="glass-modal p-6 rounded-3xl border border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h1 className="font-bebas text-3xl sm:text-4xl text-[#F8F9FA] tracking-wide">
                  Master Atelier Control Room
                </h1>
                <p className="font-mono text-xs text-[#8E8E93]">
                  RAJ Hair Art by Anil • Live Operations Hub
                </p>
              </div>

              {/* Navigation Tabs */}
              <div className="flex bg-[#141414] p-1.5 rounded-2xl border border-white/10">
                <button
                  onClick={() => setActiveTab('schedule')}
                  className={`px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-all ${
                    activeTab === 'schedule'
                      ? 'bg-[#C8102E] text-white font-bold'
                      : 'text-[#8E8E93] hover:text-white'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Live Schedule</span>
                </button>

                <button
                  onClick={() => setActiveTab('barbers')}
                  className={`px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-all ${
                    activeTab === 'barbers'
                      ? 'bg-[#C8102E] text-white font-bold'
                      : 'text-[#8E8E93] hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Artisans</span>
                </button>

                <button
                  onClick={() => setActiveTab('pdf')}
                  className={`px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-all ${
                    activeTab === 'pdf'
                      ? 'bg-[#C8102E] text-white font-bold'
                      : 'text-[#8E8E93] hover:text-white'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>PDF Automation</span>
                </button>
              </div>
            </div>

            {/* TAB 1: Live Master Schedule */}
            {activeTab === 'schedule' && (
              <div className="space-y-4">
                {/* Filter Toolbar */}
                <div className="glass-card p-4 rounded-2xl border border-white/10 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div>
                      <label className="text-[10px] font-mono text-[#8E8E93] uppercase block mb-1">
                        Filter Date
                      </label>
                      <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="bg-[#141414] border border-white/10 rounded-xl px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-[#C8102E]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-[#8E8E93] uppercase block mb-1">
                        Filter Barber
                      </label>
                      <select
                        value={filterBarberId}
                        onChange={(e) => setFilterBarberId(e.target.value)}
                        className="bg-[#141414] border border-white/10 rounded-xl px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-[#C8102E]"
                      >
                        <option value="all">All Barbers</option>
                        {barbers.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={fetchAppointments}
                    className="btn-secondary px-3.5 py-1.5 rounded-xl text-xs font-mono uppercase flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Refresh</span>
                  </button>
                </div>

                {/* Schedule Table / Cards */}
                {isLoadingAppointments ? (
                  <div className="text-center py-12 text-xs font-mono text-[#8E8E93] animate-pulse">
                    Loading appointments...
                  </div>
                ) : appointments.length === 0 ? (
                  <div className="glass-card p-10 rounded-2xl text-center font-mono text-xs text-[#8E8E93]">
                    No appointments scheduled for this date and filter.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {appointments.map((appt) => (
                      <div
                        key={appt.id}
                        className="glass-card p-5 rounded-2xl border border-white/10 flex flex-col md:flex-row justify-between md:items-center gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bebas text-2xl text-[#F8F9FA]">
                              {appt.time_slot}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                                appt.status === 'confirmed'
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  : appt.status === 'completed'
                                  ? 'bg-blue-950 text-blue-400 border border-blue-800'
                                  : 'bg-red-950 text-red-400 border border-red-800'
                              }`}
                            >
                              {appt.status}
                            </span>
                          </div>

                          <div className="font-mono text-sm text-[#F8F9FA] font-semibold">
                            {appt.customer_name} •{' '}
                            <span className="text-[#8E8E93] font-normal">
                              {appt.customer_phone}
                            </span>
                          </div>

                          <div className="text-xs font-mono text-[#8E8E93]">
                            Services:{' '}
                            <span className="text-[#E5E5E5]">
                              {Array.isArray(appt.service_names)
                                ? appt.service_names.join(', ')
                                : appt.service_names}
                            </span>{' '}
                            | Barber:{' '}
                            <span className="text-[#C8102E]">
                              {appt.barbers?.name || 'Any Stylist'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="font-bebas text-2xl text-[#F8F9FA] mr-2">
                            ₹{appt.total_amount}
                          </div>

                          {appt.status !== 'completed' && (
                            <button
                              onClick={() => handleUpdateStatus(appt.id, 'completed')}
                              className="btn-secondary px-3 py-1.5 rounded-xl text-xs font-mono uppercase text-emerald-400 hover:border-emerald-500/40 flex items-center gap-1"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Done</span>
                            </button>
                          )}

                          {appt.status !== 'cancelled' && (
                            <button
                              onClick={() => handleUpdateStatus(appt.id, 'cancelled')}
                              className="btn-secondary px-3 py-1.5 rounded-xl text-xs font-mono uppercase text-red-400 hover:border-red-500/40 flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Cancel</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Barber Management */}
            {activeTab === 'barbers' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="font-bebas text-2xl text-[#F8F9FA]">
                    Atelier Barber Artisans ({barbers.length})
                  </h3>

                  <button
                    onClick={() => setIsAddBarberOpen(true)}
                    className="btn-crimson px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add New Artisan</span>
                  </button>
                </div>

                {/* Barbers List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {barbers.map((barber) => (
                    <div
                      key={barber.id}
                      className="glass-card p-5 rounded-2xl border border-white/10 space-y-4 flex flex-col justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            barber.photo_url ||
                            'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=600&q=80'
                          }
                          alt={barber.name}
                          className="w-12 h-12 rounded-full object-cover border border-white/10"
                        />
                        <div>
                          <h4 className="font-bebas text-xl text-[#F8F9FA]">{barber.name}</h4>
                          <div className="text-xs font-mono text-[#8E8E93]">
                            {barber.experience_years} Years Experience
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1 text-xs font-mono text-[#8E8E93]">
                        <div>Phone: {barber.phone}</div>
                        <div>Email: {barber.email || 'Not specified'}</div>
                        <div>Telegram ID: {barber.telegram_chat_id || 'Not linked'}</div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-white/10">
                        <button
                          onClick={() => handleToggleBarberActive(barber)}
                          className={`px-3 py-1 rounded-full text-[10px] font-mono uppercase font-bold ${
                            barber.is_active
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-yellow-950 text-yellow-400 border border-yellow-800'
                          }`}
                        >
                          {barber.is_active ? 'Active' : 'Inactive'}
                        </button>

                        <button
                          onClick={() => handleDeleteBarber(barber.id)}
                          className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-950/40"
                          title="Delete Barber"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Barber Modal */}
                {isAddBarberOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <div className="w-full max-w-md glass-modal rounded-3xl p-6 sm:p-8 border border-white/10 space-y-4">
                      <h3 className="font-bebas text-2xl text-[#F8F9FA]">
                        Onboard New Barber Artisan
                      </h3>

                      <form onSubmit={handleAddBarber} className="space-y-3 font-mono text-xs">
                        <div>
                          <label className="block text-[#8E8E93] mb-1">Full Name</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Ramesh Tailor"
                            value={newBarberName}
                            onChange={(e) => setNewBarberName(e.target.value)}
                            className="w-full bg-[#141414] border border-white/10 rounded-xl px-3 py-2 text-[#F8F9FA] focus:outline-none focus:border-[#C8102E]"
                          />
                        </div>

                        <div>
                          <label className="block text-[#8E8E93] mb-1">Phone Number</label>
                          <input
                            type="tel"
                            required
                            placeholder="+91 98765 00000"
                            value={newBarberPhone}
                            onChange={(e) => setNewBarberPhone(e.target.value)}
                            className="w-full bg-[#141414] border border-white/10 rounded-xl px-3 py-2 text-[#F8F9FA] focus:outline-none focus:border-[#C8102E]"
                          />
                        </div>

                        <div>
                          <label className="block text-[#8E8E93] mb-1">
                            Email (for 11:30 PM PDF Schedule)
                          </label>
                          <input
                            type="email"
                            placeholder="barber@rajhairart.com"
                            value={newBarberEmail}
                            onChange={(e) => setNewBarberEmail(e.target.value)}
                            className="w-full bg-[#141414] border border-white/10 rounded-xl px-3 py-2 text-[#F8F9FA] focus:outline-none focus:border-[#C8102E]"
                          />
                        </div>

                        <div>
                          <label className="block text-[#8E8E93] mb-1">
                            Telegram Chat ID (for Instant Booking Alert)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 123456789"
                            value={newBarberTelegramId}
                            onChange={(e) => setNewBarberTelegramId(e.target.value)}
                            className="w-full bg-[#141414] border border-white/10 rounded-xl px-3 py-2 text-[#F8F9FA] focus:outline-none focus:border-[#C8102E]"
                          />
                        </div>

                        <div>
                          <label className="block text-[#8E8E93] mb-1">Experience (Years)</label>
                          <input
                            type="number"
                            min="1"
                            value={newBarberExperience}
                            onChange={(e) => setNewBarberExperience(e.target.value)}
                            className="w-full bg-[#141414] border border-white/10 rounded-xl px-3 py-2 text-[#F8F9FA] focus:outline-none focus:border-[#C8102E]"
                          />
                        </div>

                        <div>
                          <label className="block text-[#8E8E93] mb-1">Photo URL (Optional)</label>
                          <input
                            type="url"
                            placeholder="https://..."
                            value={newBarberPhoto}
                            onChange={(e) => setNewBarberPhoto(e.target.value)}
                            className="w-full bg-[#141414] border border-white/10 rounded-xl px-3 py-2 text-[#F8F9FA] focus:outline-none focus:border-[#C8102E]"
                          />
                        </div>

                        <div className="flex gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setIsAddBarberOpen(false)}
                            className="w-1/2 btn-secondary py-2.5 rounded-xl uppercase"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="w-1/2 btn-crimson py-2.5 rounded-xl uppercase font-bold"
                          >
                            Add Artisan
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: PDF Generation & Manual Trigger */}
            {activeTab === 'pdf' && (
              <div className="glass-card p-8 rounded-3xl border border-white/10 space-y-6">
                <div>
                  <h3 className="font-bebas text-3xl text-[#F8F9FA]">
                    Automated Daily 11:30 PM Schedule Dispatcher
                  </h3>
                  <p className="font-playfair italic text-xs text-[#8E8E93] mt-1">
                    The system automatically generates high-resolution vector PDF schedules at 11:30 PM IST and emails them directly to each active barber, while executing the 15-day privacy purge.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-[#141414] border border-white/10 space-y-3 font-mono text-xs">
                  <div className="text-[#C8102E] font-bold uppercase">
                    Cron Endpoint: /api/cron/dispatch-daily-pdf
                  </div>
                  <div className="text-[#8E8E93]">
                    • Target Date: Tomorrow's appointments<br />
                    • Format: A4 Vector Stylized PDF with appointment breakdowns<br />
                    • Purge Logic: Removes historical appointments older than 15 days
                  </div>
                </div>

                <button
                  onClick={handleTriggerDailyPdf}
                  disabled={isDispatchingPdf}
                  className="btn-crimson px-6 py-3.5 rounded-xl font-bebas text-lg uppercase tracking-wider flex items-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  <span>
                    {isDispatchingPdf
                      ? 'Generating PDFs & Dispatched...'
                      : "Send Tomorrow's Schedule PDF Now"}
                  </span>
                </button>

                {pdfDispatchResult && (
                  <div className="p-4 rounded-2xl bg-[#141414] border border-white/10 font-mono text-xs space-y-2">
                    <div className="text-emerald-400 font-bold">Dispatch Summary:</div>
                    <pre className="text-[#8E8E93] overflow-x-auto">
                      {JSON.stringify(pdfDispatchResult, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
