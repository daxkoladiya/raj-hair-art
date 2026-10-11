'use client';

import React, { useState, useEffect } from 'react';
import WelcomeScreen from '@/components/WelcomeScreen';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import BarbersSection from '@/components/BarbersSection';
import ReviewsSection from '@/components/ReviewsSection';
import BookingWizard from '@/components/BookingWizard';
import Footer from '@/components/Footer';
import { Service, Barber, DEFAULT_SERVICES, DEFAULT_BARBERS } from '@/types';

export default function HomePage() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [services, setServices] = useState<Service[]>(DEFAULT_SERVICES);
  const [barbers, setBarbers] = useState<Barber[]>(DEFAULT_BARBERS);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(['1']);
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);
  const [currentUserPhone, setCurrentUserPhone] = useState<string | null>(null);

  // Check if welcome was already shown in this session
  useEffect(() => {
    const hasSeenWelcome = sessionStorage.getItem('raj_welcome_shown');
    if (hasSeenWelcome) {
      setShowWelcome(false);
    }
  }, []);

  const handleFinishWelcome = () => {
    setShowWelcome(false);
    sessionStorage.setItem('raj_welcome_shown', 'true');
  };

  // Fetch live services and barbers from API
  useEffect(() => {
    async function loadData() {
      try {
        const [servicesRes, barbersRes] = await Promise.all([
          fetch('/api/services'),
          fetch('/api/barbers'),
        ]);
        const servicesData = await servicesRes.json();
        const barbersData = await barbersRes.json();

        if (servicesData.success && servicesData.services) {
          setServices(servicesData.services);
        }
        if (barbersData.success && barbersData.barbers) {
          setBarbers(barbersData.barbers);
        }
      } catch (err) {
        console.error('Error fetching initial data:', err);
      }
    }
    loadData();
  }, []);

  // Multi-select service toggle (used inside BookingWizard)
  const handleToggleService = (service: Service) => {
    setSelectedServiceIds((prev) => {
      if (prev.includes(service.id)) {
        return prev.filter((id) => id !== service.id);
      } else {
        return [...prev, service.id];
      }
    });
  };

  const handleClearSelectedServices = () => {
    setSelectedServiceIds([]);
  };

  // Scroll Helpers
  const scrollToBooking = () => {
    const el = document.getElementById('booking-wizard');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToArtisans = () => {
    const el = document.getElementById('barbers');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSelectBarber = (barber: Barber) => {
    setSelectedBarberId(barber.id);
    scrollToBooking();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5F5F7] via-[#212429] to-[#121316] text-white relative selection:bg-[#C8102E] selection:text-white">
      {/* Welcome Screen */}
      {showWelcome && <WelcomeScreen onFinish={handleFinishWelcome} />}

      {/* Floating Header Capsule */}
      <Navbar
        onOpenBooking={scrollToBooking}
        currentUserPhone={currentUserPhone}
        onLoginPhoneSuccess={(phone) => setCurrentUserPhone(phone)}
      />

      {/* Main Continuous Canvas Sections */}
      <main className="relative z-10">
        <HeroSection
          onOpenBooking={scrollToBooking}
          onExploreServices={scrollToBooking}
        />

        <BarbersSection
          barbers={barbers}
          selectedBarberId={selectedBarberId}
          onSelectBarber={handleSelectBarber}
        />

        <BookingWizard
          services={services}
          barbers={barbers}
          selectedServiceIds={selectedServiceIds}
          onToggleService={handleToggleService}
          onClearSelectedServices={handleClearSelectedServices}
          selectedBarberId={selectedBarberId}
          onSelectBarberId={(id) => setSelectedBarberId(id)}
          onBookingComplete={() => {
            const savedPhone = localStorage.getItem('raj_user_phone');
            if (savedPhone) setCurrentUserPhone(savedPhone);
          }}
        />

        <ReviewsSection />
      </main>

      <Footer />
    </div>
  );
}
