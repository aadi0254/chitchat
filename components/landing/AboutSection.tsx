import React from "react";
import Image from "next/image";
import { Shield, Sparkles, Heart } from "lucide-react";

export function AboutSection() {
  return (
    <section id="about" className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-16 z-10">
      <div className="glass-card rounded-4xl p-8 sm:p-12 border border-white/90 relative overflow-hidden">
        {/* Ambient background blob */}
        <div 
          className="absolute -right-20 -bottom-20 w-80 h-80 bg-gradient-to-br from-[#FFE0F0]/60 via-[#E7DFFF]/40 to-transparent rounded-full blur-3xl pointer-events-none" 
          aria-hidden="true" 
        />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-100 text-[#7957F5] text-xs font-bold">
              <Sparkles size={13} />
              <span>About ChitChat</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#172B59] tracking-tight">
              A Safe, Ephemeral Sanctuary for Real Conversations 💜
            </h2>

            <p className="text-sm sm:text-base text-[#52658D] leading-relaxed">
              We built ChitChat because everyday communication apps have become cluttered with surveillance, ads, and permanent logs. ChitChat was designed from the ground up as a private haven: in-memory rooms, zero database writes, and complete deletion the moment everyone leaves.
            </p>

            <div className="pt-2 flex flex-wrap gap-4 text-xs font-semibold text-[#172B59]">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 border border-purple-100">
                <Shield size={14} className="text-[#7957F5]" /> No permanent logs
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 border border-pink-100">
                <Heart size={14} className="text-[#F28BCB]" /> Always free & private
              </div>
            </div>
          </div>

          <div className="md:col-span-4 flex justify-center">
            <div className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-3xl overflow-hidden shadow-cute border-4 border-white bg-purple-50">
              <Image
                src="/assets/bunny-avatar.jpg"
                alt="ChitChat Cute Bunny Mascot"
                fill
                sizes="(max-width: 640px) 160px, 192px"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
