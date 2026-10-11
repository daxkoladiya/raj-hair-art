'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, Plus, Clock, Scissors, ArrowRight } from 'lucide-react';
import { Service } from '@/types';

interface ServicesProps {
  services: Service[];
  selectedServiceIds: string[];
  onToggleService: (service: Service) => void;
  onProceedToBooking: () => void;
}

export default function ServicesSection({
  services,
  selectedServiceIds,
  onToggleService,
  onProceedToBooking,
}: ServicesProps) {
  const totalSelectedAmount = services
    .filter((s) => selectedServiceIds.includes(s.id))
    .reduce((acc, curr) => acc + curr.price, 0);

  return (
    <section id="services" className="py-14 sm:py-24 px-4 sm:px-6 relative max-w-6xl mx-auto">
      {/* Section Title */}
      <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-16">
        <div className="font-oleo text-[#C8102E] text-lg sm:text-xl mb-1">Tailored Grooming</div>
        <h2 className="font-bebas text-3xl sm:text-6xl tracking-wider uppercase text-white">
          Curated Atelier Services
        </h2>
        <p className="font-playfair italic text-xs sm:text-base text-[#CED4DA] mt-1 sm:mt-2 px-2">
          Select one or multiple services. Each session is executed with bespoke care and surgical precision.
        </p>
      </div>

      {/* Services Grid (Compact cards on mobile) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6">
        {services.map((service, index) => {
          const isSelected = selectedServiceIds.includes(service.id);

          return (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.04, duration: 0.35 }}
              onClick={() => onToggleService(service)}
              className={`cursor-pointer rounded-2xl p-4 sm:p-6 transition-all duration-300 relative flex flex-col justify-between active:scale-[0.98] ${
                isSelected
                  ? 'bg-[#221014] border-2 border-[#C8102E] shadow-[0_0_25px_rgba(200,16,46,0.3)] text-white'
                  : 'glass-card hover:border-[#C8102E]/40'
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-2.5 sm:mb-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#C8102E]">
                    <Scissors className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div
                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-[#C8102E] text-white'
                        : 'bg-white/5 border border-white/20 text-[#8E8E93]'
                    }`}
                  >
                    {isSelected ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" /> : <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                  </div>
                </div>

                <h3 className="font-bebas text-xl sm:text-2xl tracking-wide mb-1 text-[#F8F9FA]">
                  {service.name}
                </h3>
                <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-mono text-[#CED4DA] mb-3 sm:mb-4">
                  <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#C8102E]" />
                  <span>{service.duration_minutes} Mins Duration</span>
                </div>
              </div>

              <div className="pt-3 sm:pt-4 border-t border-white/10 flex items-baseline justify-between">
                <span className="text-[10px] sm:text-xs font-mono uppercase text-[#8E8E93]">Investment</span>
                <span className="font-bebas text-2xl sm:text-3xl text-[#F8F9FA]">
                  ₹{service.price}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Section Action Button */}
      <div className="mt-8 sm:mt-12 flex justify-center px-2">
        <button
          type="button"
          onClick={onProceedToBooking}
          disabled={selectedServiceIds.length === 0}
          className={`w-full sm:w-auto px-6 sm:px-8 py-3.5 rounded-full font-bebas text-base sm:text-lg uppercase tracking-wider flex items-center justify-center gap-2 sm:gap-3 transition-all active:scale-95 ${
            selectedServiceIds.length > 0
              ? 'btn-crimson cursor-pointer shadow-lg shadow-[#C8102E]/30'
              : 'bg-white/5 text-[#8E8E93] border border-white/10 opacity-50 pointer-events-none'
          }`}
        >
          <span className="truncate">
            {selectedServiceIds.length > 0
              ? `Proceed to Booking (${selectedServiceIds.length} Selected • ₹${totalSelectedAmount})`
              : 'Select a Service to Continue'}
          </span>
          <ArrowRight className="w-4 h-4 flex-shrink-0" />
        </button>
      </div>
    </section>
  );
}
