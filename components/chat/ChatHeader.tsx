import React from "react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Copy, Check, LogOut, Menu, Users, ShieldCheck } from "lucide-react";

interface ChatHeaderProps {
  roomCode: string;
  onlineCount: number;
  copied: boolean;
  onCopyCode: () => void;
  onLeaveRoom: () => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export function ChatHeader({
  roomCode,
  onlineCount,
  copied,
  onCopyCode,
  onLeaveRoom,
  onToggleSidebar,
  isSidebarOpen,
}: ChatHeaderProps) {
  return (
    <header className="p-3 sm:p-4 border-b border-purple-100/80 bg-white/70 backdrop-blur-md z-20 shrink-0 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        {/* Mobile Sidebar Button */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="md:hidden p-2 rounded-2xl bg-white border border-purple-100 text-[#172B59] hover:text-[#7957F5] hover:bg-purple-50 transition-all shadow-sm active:scale-95"
          aria-label="Toggle participants drawer"
          aria-expanded={isSidebarOpen}
        >
          <Menu size={18} />
        </button>

        {/* Logo / Brand */}
        <BrandLogo size="sm" />

        {/* Desktop Room Badge */}
        <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-purple-100">
          <span className="text-xs font-bold text-[#52658D]">Room:</span>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-50 border border-purple-200">
            <span className="font-mono font-black text-sm tracking-widest text-[#7957F5]">
              {roomCode}
            </span>
            <button
              onClick={onCopyCode}
              title="Copy room code"
              className="p-1 rounded-md text-[#52658D] hover:text-[#7957F5] hover:bg-white transition-all active:scale-90"
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            </button>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Room Code Pill */}
        <div className="sm:hidden flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-50 border border-purple-200">
          <span className="font-mono font-bold text-xs tracking-wider text-[#7957F5]">
            {roomCode}
          </span>
          <button
            onClick={onCopyCode}
            aria-label="Copy room code"
            className="p-0.5 text-[#52658D]"
          >
            {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
          </button>
        </div>

        {/* Online Count Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 shadow-sm text-xs font-bold text-emerald-800">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{onlineCount} {onlineCount === 1 ? "friend" : "friends"}</span>
        </div>

        {/* Leave Room Button */}
        <button
          type="button"
          onClick={onLeaveRoom}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-red-50 hover:bg-red-100 text-red-500 font-bold text-xs border border-red-200 transition-all active:scale-95 shadow-sm"
          title="Leave Room"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Leave</span>
        </button>
      </div>
    </header>
  );
}
