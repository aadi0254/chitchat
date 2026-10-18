import React from "react";
import Image from "next/image";
import { ArrowLeft, User, Hash, ChevronRight, Sparkles, AlertCircle } from "lucide-react";

interface JoinRoomModalProps {
  name: string;
  room: string;
  error: string;
  loading: boolean;
  onNameChange: (val: string) => void;
  onRoomChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
  onGenerateNewCode?: () => void;
}

export function JoinRoomModal({
  name,
  room,
  error,
  loading,
  onNameChange,
  onRoomChange,
  onSubmit,
  onBack,
  onGenerateNewCode,
}: JoinRoomModalProps) {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative z-10">
      <div className="w-full max-w-md glass-card rounded-4xl p-6 sm:p-8 border-2 border-white/90 shadow-2xl space-y-6 animate-slide-up relative overflow-hidden">
        {/* Soft top gradient accent */}
        <div 
          className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#7957F5] via-[#F28BCB] to-[#B9DDFF]" 
          aria-hidden="true" 
        />

        {/* Back Button */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#52658D] hover:text-[#7957F5] transition-colors py-1 px-2.5 rounded-full hover:bg-purple-50"
          >
            <ArrowLeft size={16} /> Back to Home
          </button>

          <span className="text-xs font-bold text-[#7957F5] bg-purple-100/70 px-2.5 py-1 rounded-full">
            Private Session
          </span>
        </div>

        {/* Cute Mascot Avatar Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl p-1 bg-white shadow-cute border-2 border-white overflow-hidden">
              <div className="relative w-full h-full rounded-2xl overflow-hidden">
                <Image
                  src="/assets/panda-avatar.jpg"
                  alt="Cute Panda Mascot"
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>
            </div>
            <span className="absolute -top-1 -right-2 text-base text-[#F28BCB] animate-pulse">
              ✨
            </span>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172B59] tracking-tight">
              Access Chat Room
            </h2>
            <p className="text-xs sm:text-sm text-[#52658D] max-w-xs mx-auto pt-1">
              Pick your nickname and enter your 6-digit room code to join.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-4">
          {/* Display Name Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#172B59] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <User size={14} className="text-[#7957F5]" /> Your Display Name
              </span>
              <span className="text-[11px] text-[#52658D] font-normal">Max 30 chars</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Aadi, Alex, Luna..."
              maxLength={30}
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl glass-input text-sm text-[#172B59] font-medium placeholder-[#52658D]/40 outline-none transition-all"
              autoFocus
              required
            />
          </div>

          {/* Room Code Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#172B59] flex items-center gap-1.5">
                <Hash size={14} className="text-[#7957F5]" /> 6-Digit Room Code
              </label>
              {onGenerateNewCode && (
                <button
                  type="button"
                  onClick={onGenerateNewCode}
                  className="text-[11px] font-bold text-[#7957F5] hover:underline"
                >
                  Generate fresh code
                </button>
              )}
            </div>
            <input
              type="text"
              placeholder="CODE12"
              maxLength={6}
              value={room}
              onChange={(e) => onRoomChange(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 rounded-2xl glass-input text-base text-[#172B59] font-black tracking-[0.25em] font-mono text-center uppercase placeholder-[#52658D]/30 outline-none transition-all"
              required
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-xs animate-shake">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#7957F5] via-[#8B6DF8] to-[#F28BCB] hover:from-[#6B46F4] hover:to-[#EB74BA] text-white font-extrabold text-sm sm:text-base shadow-[0_8px_25px_rgba(121,87,245,0.35)] hover:shadow-[0_12px_30px_rgba(121,87,245,0.45)] transform active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Entering Room...</span>
              </>
            ) : (
              <>
                <span>Enter Chat Room</span>
                <ChevronRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
