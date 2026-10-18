import React from "react";
import Image from "next/image";
import { Plus, Users, ArrowRight } from "lucide-react";

interface RoomActionCardProps {
  type: "create" | "join";
  onClick: () => void;
}

export function RoomActionCard({ type, onClick }: RoomActionCardProps) {
  const isCreate = type === "create";

  return (
    <div
      onClick={onClick}
      className={`group relative flex-1 cursor-pointer rounded-3xl p-6 sm:p-7 transition-all duration-300 select-none ${
        isCreate
          ? "glass-card hover:shadow-[0_20px_40px_rgba(121,87,245,0.22)]"
          : "glass-card hover:shadow-[0_20px_40px_rgba(242,139,203,0.25)]"
      }`}
    >
      {/* Soft Glow Background Layer */}
      <div
        className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ${
          isCreate
            ? "bg-gradient-to-br from-[#7957F5]/10 via-transparent to-[#B9DDFF]/20"
            : "bg-gradient-to-br from-[#F28BCB]/15 via-transparent to-[#C8B5FF]/20"
        }`}
      />

      {/* Top Mascot Avatar Badge */}
      <div className="flex items-center justify-center mb-5">
        <div className="relative">
          {/* Circular mascot frame with ambient glow */}
          <div
            className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl p-1 bg-white/95 shadow-md border border-white/80 overflow-hidden transform group-hover:scale-105 group-hover:rotate-1 transition-transform duration-300 ${
              isCreate ? "shadow-[0_8px_20px_rgba(121,87,245,0.2)]" : "shadow-[0_8px_20px_rgba(242,139,203,0.25)]"
            }`}
          >
            <div className="relative w-full h-full rounded-xl overflow-hidden bg-purple-50">
              <Image
                src={isCreate ? "/assets/fox-avatar.jpg" : "/assets/panda-avatar.jpg"}
                alt={isCreate ? "Cute Fox Mascot" : "Cute Panda Mascot"}
                fill
                priority
                sizes="(max-width: 640px) 80px, 96px"
                className="object-cover"
              />
            </div>
          </div>

          {/* Sparkles around mascot */}
          <span 
            className={`absolute -top-1 -right-2 text-sm transform group-hover:scale-125 transition-transform ${
              isCreate ? "text-[#7957F5]" : "text-[#F28BCB]"
            }`}
          >
            ✦
          </span>
          <span 
            className={`absolute -bottom-1 -left-2 text-xs transform group-hover:scale-125 transition-transform ${
              isCreate ? "text-[#B9DDFF]" : "text-[#C8B5FF]"
            }`}
          >
            ✧
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="text-center space-y-2 mb-6">
        <h3 className="text-xl sm:text-2xl font-extrabold text-[#172B59] tracking-tight group-hover:text-[#7957F5] transition-colors">
          {isCreate ? "Create a Room" : "Join a Room"}
        </h3>
        <p className="text-xs sm:text-sm text-[#52658D] leading-relaxed max-w-xs mx-auto">
          {isCreate
            ? "Start a new private session and chat with your friends."
            : "Enter an existing chat code and continue the conversation."}
        </p>
      </div>

      {/* Action CTA Button */}
      <button
        type="button"
        className={`w-full py-3.5 px-5 rounded-2xl font-bold text-white text-sm sm:text-base flex items-center justify-center gap-2 shadow-md transition-all duration-300 transform group-hover:translate-y-[-1px] active:translate-y-[1px] active:scale-[0.98] ${
          isCreate
            ? "bg-gradient-to-r from-[#7957F5] to-[#9171F8] hover:from-[#6A46F4] hover:to-[#835FF7] shadow-[0_6px_20px_rgba(121,87,245,0.35)]"
            : "bg-gradient-to-r from-[#F07BB8] to-[#F28BCB] hover:from-[#EC65AC] hover:to-[#EF7ABC] shadow-[0_6px_20px_rgba(240,123,184,0.35)]"
        }`}
      >
        <span>{isCreate ? "Create Room" : "Join Room"}</span>
        <ArrowRight size={18} className="transform group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
}
