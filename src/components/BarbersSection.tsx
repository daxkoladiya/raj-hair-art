'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Award, Check, Phone, ArrowRight } from 'lucide-react';
import { Barber } from '@/types';

interface BarbersProps {
  barbers: Barber[];
  selectedBarberId?: string | null;
  onSelectBarber: (barber: Barber) => void;
}

export default function BarbersSection({
  barbers,
  selectedBarberId,
  onSelectBarber,
}: BarbersProps) {
  return (
    <section id="barbers" className="py-14 sm:py-24 px-4 sm:px-6 relative max-w-6xl mx-auto border-t border-current/10">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-16">
        <div className="font-oleo text-[#C8102E] text-lg sm:text-xl mb-1">Master Artisans</div>
        <h2 className="font-bebas text-3xl sm:text-6xl tracking-wider uppercase">
          The Craftmasters
        </h2>
        <p className="font-playfair italic text-xs sm:text-base opacity-70 mt-1 sm:mt-2 px-2">
          Dedicated hair architects trained in classical razor techniques and modern trend sculpting.
        </p>
      </div>

      {/* Barbers Grid / Horizontal Carousel on Mobile */}
      <div className="flex sm:grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8 overflow-x-auto sm:overflow-x-visible pb-4 sm:pb-0 snap-x snap-mandatory scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        {barbers.map((barber, index) => {
          const isSelected = selectedBarberId === barber.id;

          return (
            <motion.div
              key={barber.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.4 }}
              className={`min-w-[270px] sm:min-w-0 snap-center group glass-card rounded-3xl overflow-hidden border transition-all duration-300 flex flex-col ${
                isSelected ? 'border-[#C8102E] ring-1 ring-[#C8102E]' : 'hover:border-[#C8102E]/40'
              }`}
            >
              {/* Photo Area with Compact Height on Mobile */}
              <div className="relative h-56 sm:h-auto sm:aspect-[4/5] w-full bg-black/20 overflow-hidden">
                <img
                  src={
                    barber.photo_url ||
                    'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=600&q=80'
                  }
                  alt={barber.name}
                  className="w-full h-full object-cover object-top sm:object-center group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

                {/* Experience Badge */}
                <div className="absolute top-3.5 left-3.5 glass-capsule px-2.5 py-1 rounded-full flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono text-white">
                  <Award className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-[#C8102E]" />
                  <span>{barber.experience_years}+ Years</span>
                </div>

                {/* Live Availability Dot */}
                <div className="absolute top-3.5 right-3.5 glass-capsule px-2 py-1 rounded-full flex items-center gap-1.5 text-[10px] font-mono text-white">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Available</span>
                </div>

                {/* Barber Name Overlay */}
                <div className="absolute bottom-3.5 left-3.5 right-3.5 text-white">
                  <h3 className="font-bebas text-2xl sm:text-3xl tracking-wide leading-tight">
                    {barber.name}
                  </h3>
                  <div className="font-oleo text-[11px] sm:text-xs text-[#E63946]">
                    Specialist Hair Sculptor
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="p-3.5 sm:p-5 flex items-center justify-between gap-3 glass-card border-t border-current/10 mt-auto">
                <div className="text-[11px] sm:text-xs font-mono opacity-70 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-[#C8102E]" />
                  <span className="truncate max-w-[90px] sm:max-w-none">{barber.phone}</span>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectBarber(barber)}
                  className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                    isSelected
                      ? 'bg-[#C8102E] text-white'
                      : 'btn-secondary hover:text-[#C8102E]'
                  }`}
                >
                  {isSelected ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Selected</span>
                    </>
                  ) : (
                    <>
                      <span>Choose</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
