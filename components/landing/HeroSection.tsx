import React from "react";
import { LaptopMockup } from "@/components/landing/LaptopMockup";
import { RoomActionCard } from "@/components/landing/RoomActionCard";
import { Zap, ShieldCheck, Users, Sparkles } from "lucide-react";

interface HeroSectionProps {
  onCreateRoom: () => void;
  onJoinRoom: () => void;
}

export function HeroSection({ onCreateRoom, onJoinRoom }: HeroSectionProps) {
  return (
    <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pt-4 pb-16 lg:py-12 z-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column: 3D Laptop and Mascot Scene */}
        <div className="lg:col-span-5 flex justify-center order-2 lg:order-1 animate-fade-in">
          <LaptopMockup />
        </div>

        {/* Right Column: Hero Content & Action Cards */}
        <div className="lg:col-span-7 flex flex-col space-y-6 lg:space-y-8 order-1 lg:order-2 text-center lg:text-left">
          {/* Headline Block */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100/70 border border-purple-200/50 text-[#7957F5] text-xs font-bold shadow-sm mx-auto lg:mx-0">
              <Sparkles size={14} className="animate-sparkle-spin" />
              <span>Private • Instant • Kawaii</span>
            </div>

            <div className="pt-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#52658D] font-handwriting tracking-wide">
                Welcome to
              </h2>
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-none">
                <span className="text-[#172B59]">Chit</span>
                <span className="bg-gradient-to-r from-[#7957F5] via-[#9171F8] to-[#F28BCB] bg-clip-text text-transparent">
                  Chat
                </span>
                <span className="text-[#F28BCB] ml-1 inline-block animate-pulse">✨</span>
              </h1>
            </div>

            <p className="text-base sm:text-lg md:text-xl text-[#52658D] font-medium max-w-xl mx-auto lg:mx-0 pt-1">
              A private, real-time messaging app for <span className="text-[#7957F5] font-bold">teams</span> and{" "}
              <span className="text-[#F28BCB] font-bold">friends</span>. 💜
            </p>
          </div>

          {/* Three Compact Feature Highlights */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-6 pt-1">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl glass-pill">
              <div className="w-6 h-6 rounded-lg bg-purple-100 text-[#7957F5] flex items-center justify-center">
                <Zap size={14} />
              </div>
              <span className="text-xs sm:text-sm font-bold text-[#172B59]">Real-time Messaging</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl glass-pill">
              <div className="w-6 h-6 rounded-lg bg-purple-100 text-[#7957F5] flex items-center justify-center">
                <ShieldCheck size={14} />
              </div>
              <span className="text-xs sm:text-sm font-bold text-[#172B59]">No Data Stored</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl glass-pill">
              <div className="w-6 h-6 rounded-lg bg-pink-100 text-[#F28BCB] flex items-center justify-center">
                <Users size={14} />
              </div>
              <span className="text-xs sm:text-sm font-bold text-[#172B59]">Just You & Your People</span>
            </div>
          </div>

          {/* Side-by-Side Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-2">
            <RoomActionCard type="create" onClick={onCreateRoom} />
            <RoomActionCard type="join" onClick={onJoinRoom} />
          </div>

          {/* Bottom Security Note and Decorative Text */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#52658D]/70 border-t border-purple-100/60">
            <div className="flex items-center gap-2">
              <ShieldCheck size={15} className="text-[#7957F5]" />
              <span className="font-semibold">Powered by Secure Real-time WebSockets</span>
            </div>
            <div className="font-handwriting font-bold text-[#7957F5] text-sm">
              Chat ♡ • Connect • Be Happy ♡
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
