import React from "react";
import Image from "next/image";
import { Users, X, Copy, Check, Sparkles } from "lucide-react";
import { RoomParticipant } from "@/lib/socket";
import { formatDate } from "@/lib/utils";
import { getParticipantAvatar } from "@/lib/avatar";

interface ParticipantSidebarProps {
  participants: RoomParticipant[];
  currentUserName: string;
  currentUserId?: string | null;
  roomCode: string;
  copied: boolean;
  isOpen: boolean;
  onCopyCode: () => void;
  onClose: () => void;
}

export function ParticipantSidebar({
  participants,
  currentUserName,
  currentUserId,
  roomCode,
  copied,
  isOpen,
  onCopyCode,
  onClose,
}: ParticipantSidebarProps) {
  const onlineParticipants = participants.filter((p) => p.isOnline !== false);

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className={`fixed inset-0 bg-[#172B59]/30 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar Container */}
      <aside
        id="chat-sidebar"
        className={`fixed inset-y-0 left-0 z-40 w-72 sm:w-80 max-w-[85vw] h-full flex flex-col bg-white/85 backdrop-blur-xl border-r border-purple-100 shadow-2xl transition-transform duration-300 ease-in-out md:static md:translate-x-0 md:w-72 lg:w-80 md:h-full md:z-auto md:shadow-none md:border-r md:border-purple-100/80 md:bg-white/50 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header Block */}
        <div className="p-5 border-b border-purple-100 space-y-4 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#7957F5] flex items-center justify-center font-bold">
                <Users size={16} />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#172B59]">Friends in Room</h3>
                <p className="text-[11px] text-[#52658D]">
                  {onlineParticipants.length} online now
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="md:hidden p-1.5 rounded-xl hover:bg-purple-50 text-[#52658D]"
              aria-label="Close sidebar"
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick Code Sharing Box */}
          <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-200/60 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#52658D]">
              <span>INVITE CODE</span>
              <span className="text-[#7957F5] flex items-center gap-1">
                <Sparkles size={11} /> 6-digit
              </span>
            </div>
            <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-xl border border-purple-100">
              <span className="font-mono font-black tracking-widest text-[#7957F5] text-sm">
                {roomCode}
              </span>
              <button
                onClick={onCopyCode}
                className="p-1 rounded-md text-[#52658D] hover:text-[#7957F5] hover:bg-purple-50 transition-all active:scale-90"
                title="Copy code"
              >
                {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        </div>

        {/* Participants Roster List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {participants.map((p) => {
            const isCurrentUser =
              (currentUserId && p.id === currentUserId) || p.name === currentUserName;
            const displayName = p.name || "Anonymous Friend";
            const avatarSrc = getParticipantAvatar(displayName);

            return (
              <div
                key={p.id}
                className={`flex items-center gap-3 p-2.5 rounded-2xl border transition-all ${
                  isCurrentUser
                    ? "bg-purple-50/80 border-purple-200 shadow-sm"
                    : "bg-white/70 hover:bg-white border-purple-50 hover:border-purple-200"
                }`}
              >
                {/* 3D Mascot Avatar */}
                <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-white shadow-sm shrink-0 bg-purple-50">
                  <Image
                    src={avatarSrc}
                    alt={displayName}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs font-bold truncate ${
                        isCurrentUser ? "text-[#7957F5]" : "text-[#172B59]"
                      }`}
                    >
                      {displayName}
                    </span>
                    {isCurrentUser && (
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-[#7957F5] text-white">
                        You
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] text-[#52658D]/70 font-mono truncate">
                    <span>#{p.id.slice(0, 6)}</span>
                    {p.joinedAt && (
                      <>
                        <span>•</span>
                        <span>{formatDate(p.joinedAt)}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Presence Status Dot */}
                <div className="shrink-0 flex items-center pr-1">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      p.isOnline !== false
                        ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                        : "bg-zinc-300"
                    }`}
                    title={p.isOnline !== false ? "Online" : "Away"}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Info Banner */}
        <div className="p-4 border-t border-purple-100 bg-white/40 text-[11px] text-[#52658D] text-center font-medium">
          Zero database footprint • In-memory only
        </div>
      </aside>
    </>
  );
}
