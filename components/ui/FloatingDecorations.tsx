import React from "react";

export function FloatingDecorations() {
  return (
    <div 
      className="fixed inset-0 overflow-hidden pointer-events-none z-0" 
      aria-hidden="true"
    >
      {/* Top Left Floating Cloud */}
      <div className="absolute -top-10 -left-12 w-64 h-40 opacity-70 animate-float-slow">
        <svg viewBox="0 0 200 120" fill="none" className="w-full h-full text-white/80 filter drop-shadow-[0_10px_20px_rgba(185,221,255,0.4)]">
          <path
            d="M50 100C30 100 15 85 15 65C15 48 28 35 45 33C52 18 68 8 85 8C108 8 128 24 132 46C137 44 142 43 148 43C168 43 185 59 185 80C185 100 168 116 148 116L50 116C36 116 28 110 24 102"
            fill="currentColor"
          />
        </svg>
      </div>

      {/* Top Right Floating Hot Air Balloon */}
      <div className="absolute top-16 right-8 md:right-24 w-16 h-24 md:w-20 md:h-28 opacity-80 animate-float">
        <svg viewBox="0 0 80 120" fill="none" className="w-full h-full filter drop-shadow-[0_8px_16px_rgba(242,139,203,0.3)]">
          {/* Balloon body */}
          <path
            d="M40 8C20 8 6 24 6 44C6 58 14 72 26 82C29 84 31 89 32 94L48 94C49 89 51 84 54 82C66 72 74 58 74 44C74 24 60 8 40 8Z"
            fill="url(#balloon-grad)"
          />
          {/* Striped pattern */}
          <path
            d="M32 8C24 18 20 30 20 44C20 58 24 72 32 86L48 86C56 72 60 58 60 44C60 30 56 18 48 8Z"
            fill="white"
            opacity="0.3"
          />
          {/* Ropes & Basket */}
          <line x1="33" y1="94" x2="35" y2="103" stroke="#B8A7E0" strokeWidth="1.5" />
          <line x1="47" y1="94" x2="45" y2="103" stroke="#B8A7E0" strokeWidth="1.5" />
          <rect x="34" y="103" width="12" height="10" rx="3" fill="#FFE2C4" stroke="#E6BF98" strokeWidth="1" />
          <defs>
            <linearGradient id="balloon-grad" x1="6" y1="8" x2="74" y2="94" gradientUnits="userSpaceOnUse">
              <stop stopColor="#B9DDFF" />
              <stop offset="0.5" stopColor="#E7DFFF" />
              <stop offset="1" stopColor="#F28BCB" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Floating Paper Airplane */}
      <div className="absolute top-28 left-[45%] w-8 h-8 opacity-60 animate-float-reverse hidden md:block">
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-[#C8B5FF] transform rotate-12">
          <path
            d="M2 12L22 2L15 22L11 13L2 12Z"
            fill="currentColor"
            opacity="0.6"
          />
          <path
            d="M11 13L22 2"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Cute Floating Cloud Mascot on the Right */}
      <div className="absolute top-48 right-4 md:right-12 w-28 h-20 opacity-80 animate-float-slow hidden sm:block">
        <svg viewBox="0 0 100 65" fill="none" className="w-full h-full filter drop-shadow-[0_6px_14px_rgba(200,181,255,0.3)]">
          <path
            d="M20 50C10 50 2 42 2 32C2 23 9 16 18 15C22 7 30 2 40 2C52 2 62 10 65 21C67 20 70 20 73 20C83 20 92 28 92 38C92 48 83 56 73 56L20 56C13 56 9 53 7 49"
            fill="white"
          />
          {/* Cute Face */}
          <circle cx="36" cy="30" r="1.8" fill="#172B59" />
          <circle cx="56" cy="30" r="1.8" fill="#172B59" />
          <circle cx="30" cy="34" r="2.2" fill="#F28BCB" opacity="0.6" />
          <circle cx="62" cy="34" r="2.2" fill="#F28BCB" opacity="0.6" />
          <path d="M43 33C44.5 35 47.5 35 49 33" stroke="#172B59" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      {/* Little Floating Stars and Sparkles */}
      <div className="absolute top-36 left-1/4 text-[#F28BCB] opacity-70 animate-sparkle-spin">
        ✦
      </div>
      <div className="absolute top-64 right-1/3 text-[#7957F5] opacity-60 text-lg animate-sparkle-spin" style={{ animationDelay: "1.5s" }}>
        ✦
      </div>
      <div className="absolute bottom-40 left-12 text-[#9B7BFA] opacity-50 text-sm animate-pulse-subtle">
        ✨
      </div>
      <div className="absolute top-20 left-[20%] text-pink-400 opacity-60 text-base animate-float">
        ♡
      </div>
      <div className="absolute bottom-28 right-16 text-purple-400 opacity-60 text-lg animate-float-reverse">
        ♡
      </div>

      {/* Bottom Subtle Cloud Band */}
      <div className="absolute -bottom-16 left-0 right-0 h-40 opacity-40 bg-gradient-to-t from-white via-white/50 to-transparent"></div>
    </div>
  );
}
