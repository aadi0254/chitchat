import React from "react";
import Image from "next/image";

export function LaptopMockup() {
  return (
    <div className="relative w-full max-w-xl mx-auto lg:max-w-none flex items-center justify-center p-2 select-none">
      {/* Decorative Floating Script: "Good Friends Better Chats ♡" */}
      <div 
        className="absolute -top-6 -left-2 z-20 hidden sm:block animate-float"
        aria-hidden="true"
      >
        <div className="bg-white/80 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white shadow-cute transform -rotate-6">
          <p className="text-xs sm:text-sm font-extrabold text-[#7957F5] tracking-tight flex items-center gap-1.5">
            <span>✨</span> Good Friends Better Chats <span className="text-[#F28BCB]">♡</span>
          </p>
        </div>
      </div>

      {/* Main 3D Hero Scene Frame */}
      <div className="relative w-full rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(121,87,245,0.18)] border-4 border-white/90 bg-gradient-to-b from-white/90 to-[#FAF5FF] group">
        <div className="relative w-full aspect-[4/3] sm:aspect-[16/11]">
          <Image
            src="/assets/hero-laptop-scene.jpg"
            alt="Cute baby panda, bunny, and fox around a laptop chatting on ChitChat"
            fill
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
            className="object-cover object-center transform transition-transform duration-700 ease-out group-hover:scale-[1.02]"
          />
        </div>

        {/* Floating Mini Interactive Message Badges Overlaid for extra realism and tactile feel */}
        <div 
          className="absolute bottom-16 left-4 sm:left-6 z-20 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-lg border border-white/80 hidden sm:flex items-center gap-2 animate-float"
          style={{ animationDelay: "1s" }}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-bold text-[#172B59]">Let&apos;s chat! 💜</span>
        </div>

        <div 
          className="absolute top-1/3 right-4 z-20 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-lg border border-white/80 hidden sm:flex items-center gap-2 animate-float-reverse"
          style={{ animationDelay: "2s" }}
        >
          <span className="text-xs font-bold text-[#7957F5]">Sounds great! 🐻</span>
        </div>
      </div>

      {/* Subtle Ambient Shadow Glow beneath laptop base */}
      <div 
        className="absolute -bottom-4 w-4/5 h-8 bg-gradient-to-r from-[#B9DDFF]/40 via-[#C8B5FF]/50 to-[#FFE0F0]/40 blur-xl rounded-full -z-10" 
        aria-hidden="true"
      />
    </div>
  );
}
