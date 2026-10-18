import React from "react";
import Image from "next/image";
import { ArrowRight, Sparkles } from "lucide-react";

interface ClosingCtaProps {
  onCreateRoom: () => void;
}

export function ClosingCta({ onCreateRoom }: ClosingCtaProps) {
  return (
    <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-12 z-10">
      <div className="glass-card rounded-4xl p-8 sm:p-12 text-center relative overflow-hidden bg-gradient-to-r from-white/90 via-purple-50/60 to-pink-50/80 border-2 border-white shadow-card">
        {/* Decorative Mascot cluster */}
        <div className="flex items-center justify-center -space-x-3 mb-6">
          <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden relative shadow-sm">
            <Image src="/assets/panda-avatar.jpg" alt="Panda" fill className="object-cover" sizes="48px" />
          </div>
          <div className="w-14 h-14 rounded-full border-2 border-white overflow-hidden relative shadow-md z-10">
            <Image src="/assets/fox-avatar.jpg" alt="Fox" fill className="object-cover" sizes="56px" />
          </div>
          <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden relative shadow-sm">
            <Image src="/assets/bunny-avatar.jpg" alt="Bunny" fill className="object-cover" sizes="48px" />
          </div>
        </div>

        <h2 className="text-3xl sm:text-4xl font-extrabold text-[#172B59] tracking-tight mb-3">
          Ready to Start Chatting? ✨
        </h2>
        <p className="text-sm sm:text-base text-[#52658D] max-w-md mx-auto mb-6">
          Create your private room in one click and invite your favorite humans. No downloads or signups required.
        </p>

        <button
          onClick={onCreateRoom}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#7957F5] via-[#8B6DF8] to-[#F28BCB] text-white font-bold text-base shadow-[0_8px_25px_rgba(121,87,245,0.4)] hover:shadow-[0_12px_32px_rgba(121,87,245,0.5)] transform hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <span>Create a Room Now</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </section>
  );
}
