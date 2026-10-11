'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Quote, ShieldCheck, UserCheck, ChevronLeft, ChevronRight } from 'lucide-react';

const REVIEWS = [
  {
    id: '1',
    name: 'Vikramaditya S.',
    tag: 'Regular Patron • Classic Fade & Beard Combo',
    rating: 5,
    date: 'Verified Visit • 3 days ago',
    feedback:
      'The precision fade and beard sculpt by Anil is on another level. The ambiance is elite, private, and relaxing. Hands down the best atelier experience in the city.',
    initials: 'VS',
  },
  {
    id: '2',
    name: 'Rohan Patel',
    tag: 'Verified Patron • Royal Shave & De-Tan',
    rating: 5,
    date: 'Verified Visit • 1 week ago',
    feedback:
      'Zero waiting time. You book your slot, arrive, and the artisan is ready for you. Sanitized tools, razor accuracy, and supreme hospitality from start to finish.',
    initials: 'RP',
  },
  {
    id: '3',
    name: 'Dr. Aman Verma',
    tag: 'First-time Patron • Hair Sculpt & Head Massage',
    rating: 5,
    date: 'Verified Visit • 2 weeks ago',
    feedback:
      'Worth every single rupee. Rajesh gave honest styling advice tailored to my face structure rather than rushing through the cut. Exceptional attention to detail.',
    initials: 'AV',
  },
  {
    id: '4',
    name: 'Kabir Mehta',
    tag: 'Executive Patron • Executive Grooming Package',
    rating: 5,
    date: 'Verified Visit • 1 month ago',
    feedback:
      'A true sanctuary for men who take their grooming seriously. The hot towel treatment and straight razor finish are perfection.',
    initials: 'KM',
  },
];

export default function ReviewsSection() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section id="reviews" className="py-16 sm:py-24 px-4 sm:px-6 relative max-w-6xl mx-auto border-t border-white/10">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[500px] h-[300px] bg-[#E63946]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
        <span className="font-oleo text-base sm:text-lg text-[#E63946]">Voices of Distinction</span>
        <h2 className="font-bebas text-3xl sm:text-6xl tracking-wider uppercase text-white mt-0.5">
          PATRON EXPERIENCES
        </h2>
        <p className="font-playfair italic text-xs sm:text-base text-zinc-300 mt-1 sm:mt-2 px-2">
          Refined grooming trusted by discerning gentlemen across the city.
        </p>

        {/* Overall Rating Banner */}
        <div className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full bg-white/5 border border-white/10 mt-5 backdrop-blur-md shadow-lg">
          <div className="flex items-center gap-1 text-amber-400">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
            ))}
          </div>
          <span className="text-xs sm:text-sm font-mono font-bold text-white">4.9 / 5.0</span>
          <span className="text-[11px] sm:text-xs font-mono text-zinc-400 border-l border-white/10 pl-2">
            Based on 450+ verified patron visits
          </span>
        </div>
      </div>

      {/* Reviews: Desktop 3-Column Grid / Mobile Horizontal Swipe Carousel */}
      <div className="flex md:grid md:grid-cols-3 gap-4 sm:gap-6 overflow-x-auto md:overflow-x-visible pb-4 md:pb-0 snap-x snap-mandatory scrollbar-none -mx-4 px-4 md:mx-0 md:px-0">
        {REVIEWS.slice(0, 3).map((rev, index) => (
          <motion.div
            key={rev.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
            className="min-w-[285px] sm:min-w-[320px] md:min-w-0 snap-center rounded-3xl p-6 sm:p-7 flex flex-col justify-between relative transition-all duration-300 hover:border-[#E63946]/40 group"
            style={{
              backgroundColor: 'rgba(18, 20, 24, 0.82)',
              backdropFilter: 'blur(28px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.7)',
            }}
          >
            {/* Top Quote Icon & Stars */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 text-[#E63946] fill-[#E63946]" />
                  ))}
                </div>
                <Quote className="w-5 h-5 text-zinc-600 group-hover:text-[#E63946]/60 transition-colors" />
              </div>

              {/* Feedback Text */}
              <p className="font-playfair italic text-sm text-zinc-200 leading-relaxed mb-6">
                "{rev.feedback}"
              </p>
            </div>

            {/* Author Footer */}
            <div className="pt-4 border-t border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E63946]/30 to-black border border-[#E63946]/40 flex items-center justify-center font-bebas text-base text-white flex-shrink-0">
                {rev.initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bebas text-lg text-white tracking-wide truncate">
                    {rev.name}
                  </h4>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                </div>
                <p className="text-[10px] font-mono text-zinc-400 truncate">
                  {rev.tag}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Trust Badges Footer */}
      <div className="mt-12 sm:mt-16 pt-8 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="space-y-1">
          <p className="font-bebas text-xl sm:text-2xl text-white">100%</p>
          <p className="text-[10px] sm:text-xs font-mono uppercase text-zinc-400">Sanitized Cutlery</p>
        </div>
        <div className="space-y-1">
          <p className="font-bebas text-xl sm:text-2xl text-white">0 MINS</p>
          <p className="text-[10px] sm:text-xs font-mono uppercase text-zinc-400">Queue Time</p>
        </div>
        <div className="space-y-1">
          <p className="font-bebas text-xl sm:text-2xl text-white">12+ YRS</p>
          <p className="text-[10px] sm:text-xs font-mono uppercase text-zinc-400">Master Artistry</p>
        </div>
        <div className="space-y-1">
          <p className="font-bebas text-xl sm:text-2xl text-white">10,000+</p>
          <p className="text-[10px] sm:text-xs font-mono uppercase text-zinc-400">Gentlemen Styled</p>
        </div>
      </div>
    </section>
  );
}
