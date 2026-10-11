'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function WelcomeScreen({ onFinish }: { onFinish: () => void }) {
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    const startTime = performance.now();
    const duration = 1600; // 1.6s

    const updateProgress = (now: number) => {
      const elapsed = now - startTime;
      const pct = Math.min(100, Math.floor((elapsed / duration) * 100));
      setProgress(pct);

      if (elapsed < duration) {
        requestAnimationFrame(updateProgress);
      } else {
        setTimeout(() => {
          setIsDone(true);
          setTimeout(onFinish, 600);
        }, 200);
      }
    };

    const animId = requestAnimationFrame(updateProgress);
    return () => cancelAnimationFrame(animId);
  }, [onFinish]);

  return (
    <AnimatePresence>
      {!isDone && (
        <motion.div
          key="welcome-overlay"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04, filter: 'blur(10px)' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0A0A0A] text-[#F8F9FA] select-none"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute w-96 h-96 bg-[#C8102E]/10 rounded-full blur-[120px] pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center px-6 text-center">
            {/* Animated Scissor Emblem forming the letter 'A' with crimson accents */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="relative w-28 h-28 mb-8 flex items-center justify-center"
            >
              <svg
                viewBox="0 0 100 100"
                className="w-full h-full drop-shadow-[0_0_25px_rgba(200,16,46,0.4)]"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Left Scissor Blade forming Left Leg of 'A' */}
                <motion.path
                  d="M 28 82 L 50 18 L 72 82"
                  stroke="#F8F9FA"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.2, ease: "easeInOut" }}
                />
                {/* Crossbar Blade with Royal Crimson Accent */}
                <motion.path
                  d="M 36 60 L 64 60"
                  stroke="#C8102E"
                  strokeWidth="4"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.7 }}
                />
                {/* Scissor Finger Loop Left */}
                <motion.circle
                  cx="28"
                  cy="82"
                  r="7"
                  stroke="#C8102E"
                  strokeWidth="2.5"
                  fill="#141414"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                />
                {/* Scissor Finger Loop Right */}
                <motion.circle
                  cx="72"
                  cy="82"
                  r="7"
                  stroke="#C8102E"
                  strokeWidth="2.5"
                  fill="#141414"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                />
                {/* Center Pivot Screw */}
                <circle cx="50" cy="42" r="3" fill="#F8F9FA" />
              </svg>
            </motion.div>

            {/* Atelier Brand Titles */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="space-y-1"
            >
              <div className="font-oleo text-[#C8102E] text-lg sm:text-xl tracking-wide">
                Haute Barber Atelier
              </div>
              <h1 className="font-bebas text-4xl sm:text-6xl tracking-wider text-[#F8F9FA] leading-tight">
                RAJ HAIR ART
              </h1>
              <div className="font-playfair italic text-xs sm:text-sm tracking-[0.25em] text-[#E5E5E5]/70 uppercase">
                by Anil
              </div>
            </motion.div>

            {/* Progress Bar: 0% to 100% in 1.6s */}
            <div className="w-64 max-w-xs mt-10 space-y-2">
              <div className="w-full h-[2px] bg-[#1F1F1F] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#C8102E] to-[#E63946]"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[11px] font-mono text-[#8E8E93] uppercase tracking-wider">
                <span>Entering Experience</span>
                <span className="text-[#F8F9FA] font-bold">{progress}%</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
