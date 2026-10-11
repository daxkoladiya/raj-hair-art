'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Scissors, Star, Shield, ArrowRight, Clock, Award } from 'lucide-react';

interface HeroProps {
  onOpenBooking: () => void;
  onExploreServices: () => void;
}

export default function HeroSection({ onOpenBooking, onExploreServices }: HeroProps) {
  return (
    <section id="hero" className="relative min-h-[85vh] md:min-h-[92vh] flex items-center justify-center pt-24 sm:pt-32 pb-14 sm:pb-20 px-4 sm:px-6 overflow-hidden">
      {/* Subtle Luxury Radial Glow */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[320px] sm:w-[700px] h-[300px] sm:h-[500px] bg-[#C8102E]/8 rounded-full blur-[90px] sm:blur-[140px] pointer-events-none" />

      <div className="relative max-w-5xl mx-auto text-center z-10 flex flex-col items-center">
        {/* Quality Seal / Badge */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-black/10 text-[10px] sm:text-xs font-mono tracking-wider sm:tracking-widest text-[#495057] shadow-sm mb-5 sm:mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-[#C8102E] animate-pulse" />
          <span className="truncate max-w-[280px] sm:max-w-none">ESTD. 2012 • BESPOKE HAIRCRAFTS & ROYAL SHAVE</span>
        </motion.div>

        {/* Grand Hero Titles */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="space-y-2 sm:space-y-3"
        >
          <div className="font-oleo text-xl sm:text-2xl md:text-3xl text-[#C8102E]">
            Artisan Precision Grooming
          </div>
          <h1 className="font-bebas text-4xl sm:text-7xl md:text-8xl tracking-wider leading-[0.95] uppercase text-[#111111]">
            RAJ HAIR ART <br />
            <span className="text-[#C8102E]">
              BY ANIL
            </span>
          </h1>
          <p className="font-playfair italic text-xs sm:text-base md:text-xl text-[#495057] max-w-2xl mx-auto pt-1 sm:pt-2 px-2">
            Where master craftsmanship meets luxury aesthetics. Experience hand-tailored cuts, razor-sharp styling, and revitalizing wellness treatments.
          </p>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mt-6 sm:mt-10 w-full sm:w-auto px-4 sm:px-0"
        >
          <button
            type="button"
            onClick={onOpenBooking}
            className="w-full sm:w-auto btn-crimson px-6 sm:px-8 py-3.5 sm:py-4 rounded-full font-bebas text-base sm:text-lg tracking-wider uppercase flex items-center justify-center gap-3 transition-transform duration-200 cursor-pointer shadow-lg shadow-[#C8102E]/25 active:scale-95"
          >
            <Scissors className="w-4 h-4 sm:w-5 sm:h-5 rotate-45" />
            <span>Book Your Session Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onExploreServices}
            className="w-full sm:w-auto bg-white/90 hover:bg-white text-[#111111] border border-black/10 shadow-sm px-6 sm:px-8 py-3.5 sm:py-4 rounded-full font-bebas text-base sm:text-lg tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-102 active:scale-95"
          >
            <span>Explore Pricing & Menu</span>
          </button>
        </motion.div>

        {/* Atelier Highlights (2x2 Grid on Mobile with compact padding) */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-6 mt-10 sm:mt-16 w-full max-w-4xl"
        >
          <div className="bg-white/80 backdrop-blur-md p-3 sm:p-5 rounded-2xl border border-black/8 shadow-sm flex flex-col items-center text-center">
            <Award className="w-5 h-5 sm:w-6 sm:h-6 text-[#C8102E] mb-1 sm:mb-2" />
            <div className="font-bebas text-lg sm:text-2xl text-[#111111]">12+ YEARS</div>
            <div className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-[#6C757D]">Master Experience</div>
          </div>

          <div className="bg-white/80 backdrop-blur-md p-3 sm:p-5 rounded-2xl border border-black/8 shadow-sm flex flex-col items-center text-center">
            <Star className="w-5 h-5 sm:w-6 sm:h-6 text-[#C8102E] mb-1 sm:mb-2 fill-[#C8102E]" />
            <div className="font-bebas text-lg sm:text-2xl text-[#111111]">4.9 / 5.0</div>
            <div className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-[#6C757D]">Client Rating</div>
          </div>

          <div className="bg-white/80 backdrop-blur-md p-3 sm:p-5 rounded-2xl border border-black/8 shadow-sm flex flex-col items-center text-center">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-[#C8102E] mb-1 sm:mb-2" />
            <div className="font-bebas text-lg sm:text-2xl text-[#111111]">0% DELAYS</div>
            <div className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-[#6C757D]">Guaranteed Slots</div>
          </div>

          <div className="bg-white/80 backdrop-blur-md p-3 sm:p-5 rounded-2xl border border-black/8 shadow-sm flex flex-col items-center text-center">
            <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-[#C8102E] mb-1 sm:mb-2" />
            <div className="font-bebas text-lg sm:text-2xl text-[#111111]">PREMIUM</div>
            <div className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-[#6C757D]">Sanitized Blades</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
