'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scissors,
  User,
  Clock,
  Sparkles,
  CheckCircle2,
  Phone,
  Mail,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Lock,
  RefreshCw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { format, addDays, isSameDay } from 'date-fns';
import { Service, Barber, TIME_SLOTS } from '@/types';
import { useAuth } from './AuthProvider';

interface BookingWizardProps {
  services: Service[];
  barbers: Barber[];
  selectedServiceIds: string[];
  onToggleService: (service: Service) => void;
  onClearSelectedServices: () => void;
  selectedBarberId: string | null;
  onSelectBarberId: (id: string | null) => void;
  onBookingComplete?: () => void;
}

export default function BookingWizard({
  services,
  barbers,
  selectedServiceIds,
  onToggleService,
  onClearSelectedServices,
  selectedBarberId,
  onSelectBarberId,
  onBookingComplete,
}: BookingWizardProps) {
  const { user, openAuthModal } = useAuth();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(0));
  const [next7Days, setNext7Days] = useState<Date[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);

  // Contact Form State (Pre-filled from authenticated user)
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [preferences, setPreferences] = useState('');

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccessData, setBookingSuccessData] = useState<any>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Sync contact details when user signs in
  useEffect(() => {
    if (user) {
      const meta = user.user_metadata || {};
      const name = meta.full_name || meta.name || user.profile?.full_name || user.name || '';
      const email = user.email || '';
      const phone = user.profile?.phone || user.phone || localStorage.getItem('raj_user_phone') || '';

      if (name && !customerName) setCustomerName(name);
      if (email && !customerEmail) setCustomerEmail(email);
      if (phone && !customerPhone) setCustomerPhone(phone);
    }
  }, [user]);

  // Initialize dates safely in client mount
  useEffect(() => {
    const today = new Date();
    setSelectedDate(today);
    setNext7Days(Array.from({ length: 7 }, (_, i) => addDays(today, i)));

    const savedPhone = localStorage.getItem('raj_user_phone');
    if (savedPhone && !customerPhone) {
      setCustomerPhone(savedPhone);
    }
  }, []);

  // Fetch booked slots whenever selected date or barber changes
  const fetchBookedSlots = async () => {
    if (selectedDate.getTime() === 0) return;
    setIsLoadingSlots(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      let url = `/api/appointments?date=${dateStr}`;
      if (selectedBarberId) {
        url += `&barber_id=${selectedBarberId}`;
      }
      const res = await fetch(url);
      const json = await res.json();
      if (json.success && Array.isArray(json.appointments)) {
        const booked = json.appointments
          .filter((a: any) => a.status !== 'cancelled')
          .map((a: any) => a.time_slot);
        setBookedSlots(booked);
      }
    } catch (err) {
      console.error('Error loading booked slots:', err);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  useEffect(() => {
    fetchBookedSlots();
  }, [selectedDate, selectedBarberId]);

  // Selected Services List & Total Calculation
  const selectedServices = services.filter((s) => selectedServiceIds.includes(s.id));
  const totalAmount = selectedServices.reduce((acc, curr) => acc + curr.price, 0);
  const selectedBarber = barbers.find((b) => b.id === selectedBarberId);

  // Trigger Confetti Celebration
  const triggerConfetti = () => {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#C8102E', '#E63946', '#FFFFFF', '#F8F9FA'],
    });
  };

  // Step Navigation Handlers with Mandatory Login Gate
  const handleNext = () => {
    setFormError(null);
    if (currentStep === 1) {
      if (selectedServiceIds.length === 0) {
        setFormError('Please select at least one service to continue.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!selectedTimeSlot) {
        setFormError('Please select a preferred time slot.');
        return;
      }
      if (bookedSlots.includes(selectedTimeSlot)) {
        setFormError('This slot was already booked. Please choose another.');
        fetchBookedSlots();
        return;
      }

      // STRICT LOGIN GATE: If guest user, open login modal before Step 4
      if (!user) {
        openAuthModal('Exclusive Atelier Experience: Please sign in or create an account to secure this appointment slot.');
        return;
      }

      setCurrentStep(4);
    }
  };

  const handlePrev = () => {
    setFormError(null);
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Final Booking Confirmation with verified commit & strict login gate
  const handleConfirmReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // STRICT LOGIN GATE: Ensure authenticated before submission
    if (!user) {
      openAuthModal('Exclusive Atelier Experience: Please sign in to finalize your booking.');
      return;
    }

    const cleanName = customerName.trim();
    const cleanPhone = customerPhone.trim().replace(/\s+/g, '');

    if (!cleanName || !cleanPhone) {
      setFormError('Please provide both your full name and 10-digit mobile number.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        customer_phone: cleanPhone,
        customer_name: cleanName,
        customer_email: customerEmail.trim() || user.email || null,
        barber_id: selectedBarberId || null,
        booking_date: format(selectedDate, 'yyyy-MM-dd'),
        time_slot: selectedTimeSlot,
        service_names: selectedServices.map((s) => s.name),
        total_amount: Number(totalAmount),
        preferences: preferences.trim() || null,
        status: 'confirmed'
      };

      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success || !data.appointment) {
        throw new Error(data.error || 'Failed to commit reservation to database.');
      }

      // 1. Save normalized phone to local storage for instant dashboard retrieval
      localStorage.setItem('raj_user_phone', cleanPhone);

      // 2. Set confirmation screen with actual committed data
      setBookingSuccessData(data.appointment);
      triggerConfetti();

      // 3. Clear selected services immediately
      onClearSelectedServices();

      // 4. Trigger external state notification
      if (onBookingComplete) {
        onBookingComplete();
      }
    } catch (err: any) {
      setFormError(err.message || 'An error occurred while confirming reservation.');
      alert('Booking Failed: ' + (err.message || 'Error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForNewBooking = () => {
    setBookingSuccessData(null);
    setCurrentStep(1);
    setSelectedTimeSlot('');
    onSelectBarberId(null);
    onClearSelectedServices();
    if (next7Days.length > 0) {
      setSelectedDate(next7Days[0]);
    }
  };

  return (
    <section id="booking-wizard" className="py-14 sm:py-24 px-3 sm:px-6 relative max-w-4xl mx-auto">
      {/* Title */}
      <div className="text-center max-w-xl mx-auto mb-8 sm:mb-12">
        <div className="font-oleo text-[#C8102E] text-lg sm:text-xl mb-1">Interactive Concierge</div>
        <h2 className="font-bebas text-3xl sm:text-5xl tracking-wider uppercase text-white">
          Reserve Your Experience
        </h2>
        <p className="font-playfair italic text-xs sm:text-sm text-[#CED4DA] mt-1 px-2">
          Complete the four-step reservation to secure your master slot.
        </p>
      </div>

      {/* Wizard Main Container */}
      <div className="glass-modal rounded-3xl p-4 sm:p-10 border border-white/10 shadow-2xl relative">
        {/* Step Indicator */}
        {!bookingSuccessData && (
          <div className="flex items-center justify-between mb-6 sm:mb-8 pb-4 sm:pb-6 border-b border-white/10">
            {[
              { num: 1, title: 'Services' },
              { num: 2, title: 'Artisan' },
              { num: 3, title: 'Slot' },
              { num: 4, title: 'Contact' },
            ].map((step) => {
              const isCurrent = currentStep === step.num;
              const isPassed = currentStep > step.num;

              return (
                <div key={step.num} className="flex items-center gap-1.5 sm:gap-3">
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-mono text-[11px] sm:text-xs font-bold transition-all ${
                      isCurrent
                        ? 'bg-[#C8102E] text-white ring-2 sm:ring-4 ring-[#C8102E]/20'
                        : isPassed
                        ? 'bg-[#C8102E]/40 text-white'
                        : 'bg-[#16181C] text-[#8E8E93]'
                    }`}
                  >
                    {step.num}
                  </div>
                  <span
                    className={`text-[11px] sm:text-xs font-mono uppercase hidden xs:inline sm:inline ${
                      isCurrent ? 'text-white font-bold' : 'text-[#8E8E93]'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Error Notification */}
        {formError && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span>{formError}</span>
          </div>
        )}

        {/* Step 1: Services Selection */}
        {!bookingSuccessData && currentStep === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-bebas text-2xl text-white">Step 1: Choose Desired Services</h3>
              <span className="text-xs font-mono text-[#CED4DA] font-semibold bg-white/5 px-3 py-1 rounded-full border border-white/10">
                {selectedServiceIds.length} Selected (₹{totalAmount})
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {services.map((service) => {
                const isSelected = selectedServiceIds.includes(service.id);
                return (
                  <div
                    key={service.id}
                    onClick={() => onToggleService(service)}
                    className={`p-4 rounded-2xl cursor-pointer border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#221014] border-[#C8102E] text-white shadow-[0_0_15px_rgba(200,16,46,0.25)]'
                        : 'glass-card hover:border-[#C8102E]/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${
                          isSelected ? 'bg-[#C8102E] text-white' : 'bg-white/5 text-[#8E8E93]'
                        }`}
                      >
                        <Scissors className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-bebas text-lg leading-tight text-white">{service.name}</div>
                        <div className="text-[11px] font-mono text-[#8E8E93]">
                          {service.duration_minutes} Mins
                        </div>
                      </div>
                    </div>
                    <div className="font-bebas text-xl text-white">₹{service.price}</div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Step 2: Artisan Barber Selection */}
        {!bookingSuccessData && currentStep === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <h3 className="font-bebas text-2xl text-white">
              Step 2: Select Your Preferred Stylist
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Any Available Barber Option */}
              <div
                onClick={() => onSelectBarberId(null)}
                className={`p-5 rounded-2xl cursor-pointer border transition-all flex items-center gap-4 ${
                  selectedBarberId === null
                    ? 'bg-[#221014] border-[#C8102E] text-white shadow-[0_0_15px_rgba(200,16,46,0.25)]'
                    : 'glass-card hover:border-[#C8102E]/40'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#C8102E]">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-bebas text-xl text-white">Any Available Master</div>
                  <div className="text-xs font-mono text-[#8E8E93]">
                    Assigns the fastest available artisan
                  </div>
                </div>
              </div>

              {/* Specific Barbers */}
              {barbers.map((barber) => {
                const isSelected = selectedBarberId === barber.id;
                return (
                  <div
                    key={barber.id}
                    onClick={() => onSelectBarberId(barber.id)}
                    className={`p-4 rounded-2xl cursor-pointer border transition-all flex items-center gap-4 ${
                      isSelected
                        ? 'bg-[#221014] border-[#C8102E] text-white shadow-[0_0_15px_rgba(200,16,46,0.25)]'
                        : 'glass-card hover:border-[#C8102E]/40'
                    }`}
                  >
                    <img
                      src={
                        barber.photo_url ||
                        'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=600&q=80'
                      }
                      alt={barber.name}
                      className="w-12 h-12 rounded-full object-cover border border-white/10"
                    />
                    <div>
                      <div className="font-bebas text-xl leading-tight text-white">
                        {barber.name}
                      </div>
                      <div className="text-xs font-mono text-[#8E8E93]">
                        {barber.experience_years}+ Years Experience
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Step 3: Calendar & Time Slots with Real-time Locked Slots */}
        {!bookingSuccessData && currentStep === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h3 className="font-bebas text-2xl text-white">
                Step 3: Select Date & Master Time Slot
              </h3>
              <p className="text-xs font-mono text-[#CED4DA] mt-1">
                Artisan: {selectedBarber ? selectedBarber.name : 'Any Available Specialist'}
              </p>
            </div>

            {/* 7-Day Horizontal Scrollable Calendar */}
            <div className="flex gap-3 overflow-x-auto pb-3 pt-1 scrollbar-thin">
              {next7Days.map((date) => {
                const isSelected = isSameDay(date, selectedDate);
                const isToday = isSameDay(date, new Date());

                return (
                  <button
                    key={date.toISOString()}
                    type="button"
                    onClick={() => {
                      setSelectedDate(date);
                      setSelectedTimeSlot('');
                    }}
                    className={`flex-shrink-0 w-24 py-3 px-2 rounded-2xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#C8102E] border-[#C8102E] text-white shadow-lg shadow-[#C8102E]/30'
                        : 'glass-card hover:border-[#C8102E]/40'
                    }`}
                  >
                    <div className="text-[10px] font-mono uppercase tracking-wider opacity-80">
                      {isToday ? 'Today' : format(date, 'EEE')}
                    </div>
                    <div className="font-bebas text-2xl my-0.5">{format(date, 'dd')}</div>
                    <div className="text-[10px] font-mono uppercase opacity-80">
                      {format(date, 'MMM')}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Time Slot Picker with Exact Conflict Lock */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-mono uppercase tracking-wider text-[#CED4DA]">
                  Available 30-Minute Slots ({TIME_SLOTS.length - bookedSlots.length} Open)
                </span>
                {isLoadingSlots && (
                  <span className="text-xs font-mono text-[#C8102E] animate-pulse flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Checking live slots...
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 max-h-60 overflow-y-auto pr-1">
                {TIME_SLOTS.map((slot) => {
                  const isBooked = bookedSlots.includes(slot);
                  const isSelected = selectedTimeSlot === slot;

                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={isBooked}
                      onClick={() => setSelectedTimeSlot(slot)}
                      className={`py-2.5 px-2 rounded-xl text-xs font-mono text-center transition-all flex items-center justify-center gap-1.5 ${
                        isBooked
                          ? 'opacity-40 cursor-not-allowed bg-zinc-800 text-zinc-500 line-through border border-white/5 pointer-events-none'
                          : isSelected
                          ? 'bg-[#C8102E] text-white font-bold border border-[#C8102E] shadow-md shadow-[#C8102E]/30 cursor-pointer'
                          : 'glass-card hover:border-[#C8102E]/50 cursor-pointer'
                      }`}
                    >
                      {isBooked ? (
                        <>
                          <Lock className="w-3 h-3 text-red-500" />
                          <span>ALREADY BOOKED</span>
                        </>
                      ) : (
                        <span>{slot}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 4: Contact Information (Enforced Authenticated Patron) */}
        {!bookingSuccessData && currentStep === 4 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h3 className="font-bebas text-2xl text-white">
                Step 4: Patron Credentials & Booking Summary
              </h3>
              <p className="text-xs font-mono text-[#CED4DA]">
                Reservation for {format(selectedDate, 'dd MMMM yyyy')} at {selectedTimeSlot}
              </p>
            </div>

            {/* Summary Ticket Pill */}
            <div className="p-4 rounded-2xl glass-card space-y-2 border border-white/10">
              <div className="flex justify-between text-xs font-mono text-[#CED4DA]">
                <span>Services</span>
                <span className="font-semibold text-white">
                  {selectedServices.map((s) => s.name).join(' + ')}
                </span>
              </div>
              <div className="flex justify-between text-xs font-mono text-[#CED4DA]">
                <span>Stylist</span>
                <span className="font-semibold text-white">
                  {selectedBarber ? selectedBarber.name : 'Any Available Specialist'}
                </span>
              </div>
              <div className="flex justify-between text-sm font-mono font-bold pt-2 border-t border-white/10">
                <span className="text-white">Total Amount Due at Atelier</span>
                <span className="text-[#C8102E] font-bebas text-2xl">₹{totalAmount}</span>
              </div>
            </div>

            {/* Contact Form Inputs */}
            <form onSubmit={handleConfirmReservation} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#CED4DA] mb-1.5">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Verma"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-[#16181C] border border-white/10 rounded-xl px-4 py-3 pl-10 text-sm text-white focus:outline-none focus:border-[#C8102E] transition-all font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#CED4DA] mb-1.5">
                    Phone Number (for Dashboard & Alerts) *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      placeholder="8347578288"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full bg-[#16181C] border border-white/10 rounded-xl px-4 py-3 pl-10 text-sm text-white focus:outline-none focus:border-[#C8102E] transition-all font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#CED4DA] mb-1.5">
                    Email Address (for PDF Invoice)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      placeholder="client@example.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full bg-[#16181C] border border-white/10 rounded-xl px-4 py-3 pl-10 text-sm text-white focus:outline-none focus:border-[#C8102E] transition-all font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#CED4DA] mb-1.5">
                  Special Notes / Styling Preferences (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Low fade, scissor work on top, beard oil preference..."
                  value={preferences}
                  onChange={(e) => setPreferences(e.target.value)}
                  className="w-full bg-[#16181C] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#C8102E] transition-all font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-crimson py-4 rounded-xl font-bebas text-xl tracking-wider uppercase flex items-center justify-center gap-2 mt-4 cursor-pointer"
              >
                {isSubmitting ? (
                  <span className="animate-pulse flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Committing Reservation to Database...
                  </span>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    <span>Confirm & Reserve Slot</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}

        {/* Step Navigation Buttons (Prev / Next) - Single clean inline action */}
        {!bookingSuccessData && (
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/10">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="btn-secondary px-5 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center gap-2 cursor-pointer bg-white/5 border-white/10 hover:bg-white/10 text-white"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {currentStep < 4 && (
              <button
                type="button"
                onClick={handleNext}
                disabled={currentStep === 1 && selectedServiceIds.length === 0}
                className={`px-6 py-2.5 rounded-xl font-bebas text-base tracking-wider uppercase flex items-center gap-2 transition-all ${
                  currentStep === 1 && selectedServiceIds.length === 0
                    ? 'opacity-50 pointer-events-none bg-white/10 text-[#8E8E93]'
                    : 'btn-crimson cursor-pointer shadow-md shadow-[#C8102E]/30'
                }`}
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Success Sheet Confirmation */}
        {bookingSuccessData && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-6 space-y-6"
          >
            <div className="w-20 h-20 rounded-full bg-[#C8102E]/20 border-2 border-[#C8102E] text-[#C8102E] flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(200,16,46,0.5)]">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <div className="font-oleo text-[#C8102E] text-xl">Reservation Confirmed</div>
              <h3 className="font-bebas text-4xl tracking-wider uppercase text-white">
                Welcome to RAJ Hair Art
              </h3>
              <p className="font-playfair italic text-xs text-[#CED4DA] max-w-md mx-auto mt-1">
                Your reservation is verified and written to the database. Reference: <span className="font-bold underline text-white">{bookingSuccessData.id}</span>
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="max-w-md mx-auto glass-card rounded-2xl p-5 text-left space-y-3 font-mono text-xs border border-white/10">
              <div className="flex justify-between text-[#CED4DA]">
                <span>Booking Reference</span>
                <span className="font-bold text-white">
                  {bookingSuccessData.id?.slice(0, 10).toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between text-[#CED4DA]">
                <span>Client Name</span>
                <span className="text-white">{bookingSuccessData.customer_name}</span>
              </div>
              <div className="flex justify-between text-[#CED4DA]">
                <span>Client Phone</span>
                <span className="text-white">{bookingSuccessData.customer_phone}</span>
              </div>
              <div className="flex justify-between text-[#CED4DA]">
                <span>Date & Time</span>
                <span className="text-white">
                  {bookingSuccessData.booking_date} at {bookingSuccessData.time_slot}
                </span>
              </div>
              <div className="flex justify-between text-[#CED4DA]">
                <span>Selected Services</span>
                <span className="text-white">
                  {Array.isArray(bookingSuccessData.service_names)
                    ? bookingSuccessData.service_names.join(', ')
                    : bookingSuccessData.service_names}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-white/10 font-bold text-sm">
                <span className="text-white">Total Due</span>
                <span className="text-[#C8102E] font-bebas text-xl">
                  ₹{bookingSuccessData.total_amount}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Link
                href="/dashboard"
                className="btn-secondary px-5 py-2.5 rounded-xl text-xs font-mono uppercase flex items-center gap-2 bg-white/5 border-white/10 text-white"
              >
                <User className="w-4 h-4 text-[#C8102E]" />
                <span>View My Reservations</span>
              </Link>

              <button
                type="button"
                onClick={handleResetForNewBooking}
                className="btn-crimson px-6 py-2.5 rounded-xl font-bebas text-base uppercase tracking-wider cursor-pointer"
              >
                Book Another Session
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
