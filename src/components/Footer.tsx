import React from 'react';
import { Scissors, MapPin, Phone, Mail, Clock } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#0A0A0A] pt-16 pb-12 px-4 sm:px-6 relative text-[#8E8E93]">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Brand Column */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-black/60 border border-white/20 flex items-center justify-center p-1 shadow-[0_0_15px_rgba(242,13,24,0.4)] overflow-hidden">
              <img
                src="/brand-emblem.jpg"
                alt="RAJ Hair Art Emblem"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="font-bebas text-2xl tracking-wider text-[#F8F9FA]">
                RAJ HAIR ART
              </span>
              <span className="font-oleo text-xs text-[#C8102E] block">
                by Anil
              </span>
            </div>
          </div>
          <p className="font-playfair italic text-sm text-[#8E8E93] max-w-sm">
            Handcrafted luxury grooming experience. Classical scissor techniques meets modern styling in an exclusive atelier ambiance.
          </p>
        </div>

        {/* Operating Hours */}
        <div className="space-y-3">
          <h4 className="font-bebas text-lg tracking-wider text-[#F8F9FA] uppercase">
            Atelier Hours
          </h4>
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex justify-between">
              <span>Monday – Saturday</span>
              <span className="text-[#F8F9FA]">10:00 AM – 10:00 PM</span>
            </div>
            <div className="flex justify-between">
              <span>Sunday</span>
              <span className="text-[#F8F9FA]">10:00 AM – 09:00 PM</span>
            </div>
          </div>
        </div>

        {/* Location & Contact */}
        <div className="space-y-3">
          <h4 className="font-bebas text-lg tracking-wider text-[#F8F9FA] uppercase">
            Direct Concierge
          </h4>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex items-center gap-2 text-[#E5E5E5]">
              <Phone className="w-3.5 h-3.5 text-[#C8102E]" />
              <span>+91 98765 43210</span>
            </div>
            <div className="flex items-center gap-2 text-[#E5E5E5]">
              <Mail className="w-3.5 h-3.5 text-[#C8102E]" />
              <span>concierge@rajhairart.com</span>
            </div>
            <div className="flex items-center gap-2 text-[#E5E5E5]">
              <MapPin className="w-3.5 h-3.5 text-[#C8102E]" />
              <span>Luxury Avenue, Near Diamond City, Surat</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center text-[11px] font-mono gap-4">
        <span>© 2026 RAJ Hair Art by Anil. All Rights Reserved.</span>
        <div className="flex items-center gap-6">
          <span className="text-[#C8102E]">Ultra-Luxury Precision</span>
          <span>Terms & Privacy</span>
        </div>
      </div>
    </footer>
  );
}
