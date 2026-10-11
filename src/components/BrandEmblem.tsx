import React from 'react';

interface BrandEmblemProps {
  className?: string;
  size?: number;
}

export default function BrandEmblem({ className = '', size = 32 }: BrandEmblemProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background or drop glow if needed */}
      <defs>
        <filter id="emblem-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#F20D18" floodOpacity="0.6" />
        </filter>
      </defs>

      <g filter="url(#emblem-glow)">
        {/* Left Arm & Loop (White outline + Red fill) */}
        {/* Outer White Silhouette Outline */}
        <path
          d="M 32 14 C 18 14 10 24 10 38 C 10 50 18 58 30 58 C 36 58 42 55 48 49 L 34 86 L 44 80 L 52 56 L 45 46 C 40 50 36 52 30 52 C 22 52 16 46 16 38 C 16 28 22 20 32 20 C 40 20 46 26 48 34 L 56 34 C 54 22 45 14 32 14 Z"
          fill="#FFFFFF"
        />
        {/* Red Fill */}
        <path
          d="M 32 16 C 19.5 16 12 25 12 38 C 12 49 19 56 30 56 C 35 56 40 53 46 48 L 36 84 L 42 80 L 50 56 L 44 47 C 39 51 35 53 30 53 C 21 53 15 46 15 38 C 15 27 21 19 32 19 C 41 19 46 26 48 35 L 54 35 C 52 23 44 16 32 16 Z"
          fill="#F20D18"
        />

        {/* Right Arm & Loop (Symmetrical) */}
        {/* Outer White Silhouette Outline */}
        <path
          d="M 68 14 C 82 14 90 24 90 38 C 90 50 82 58 70 58 C 64 58 58 55 52 49 L 66 86 L 56 80 L 48 56 L 55 46 C 60 50 64 52 70 52 C 78 52 84 46 84 38 C 84 28 78 20 68 20 C 60 20 54 26 52 34 L 44 34 C 46 22 55 14 68 14 Z"
          fill="#FFFFFF"
        />
        {/* Red Fill */}
        <path
          d="M 68 16 C 80.5 16 88 25 88 38 C 88 49 81 56 70 56 C 65 56 60 53 54 48 L 64 84 L 58 80 L 50 56 L 56 47 C 61 51 65 53 70 53 C 79 53 85 46 85 38 C 85 27 79 19 68 19 C 59 19 54 26 52 35 L 46 35 C 48 23 56 16 68 16 Z"
          fill="#F20D18"
        />

        {/* Central Pivot Ring */}
        <circle cx="50" cy="51" r="4.5" fill="#FFFFFF" />
        <circle cx="50" cy="51" r="2.5" fill="#F20D18" />
      </g>
    </svg>
  );
}
