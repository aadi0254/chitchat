import React from "react";
import Image from "next/image";
import { ChatMessage } from "@/lib/socket";
import { formatDate } from "@/lib/utils";
import { getParticipantAvatar } from "@/lib/avatar";
import { Sparkles } from "lucide-react";

interface MessageBubbleProps {
  message: ChatMessage;
  isCurrentUser: boolean;
}

export function MessageBubble({ message, isCurrentUser }: MessageBubbleProps) {
  // 1. System Notification Messages
  if (message.type === "system") {
    return (
      <div className="flex justify-center my-3 animate-fade-in select-none">
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-purple-100/70 border border-purple-200/50 text-[#7957F5] text-xs font-bold shadow-sm">
          <Sparkles size={12} className="text-[#F28BCB]" />
          <span>{message.text}</span>
        </div>
      </div>
    );
  }

  const avatarSrc = getParticipantAvatar(message.sender);

  // 2. Current User's Outgoing Message
  if (isCurrentUser) {
    return (
      <div className="flex flex-col items-end my-2 max-w-[85%] sm:max-w-[70%] ml-auto animate-fade-in group">
        <div className="flex items-center gap-1.5 mb-1 px-1">
          <span className="text-[11px] font-bold text-[#7957F5]">You</span>
          <span className="text-[10px] text-[#52658D]/60">{formatDate(message.timestamp)}</span>
        </div>

        <div className="relative px-4 py-2.5 rounded-2xl rounded-tr-none bg-gradient-to-r from-[#7957F5] via-[#8B6DF8] to-[#9B7BFA] text-white text-sm sm:text-base leading-relaxed shadow-[0_4px_16px_rgba(121,87,245,0.25)] break-words max-w-full">
          {message.text}
        </div>
      </div>
    );
  }

  // 3. Other Participants' Incoming Message
  return (
    <div className="flex items-start gap-2.5 my-2 max-w-[85%] sm:max-w-[70%] mr-auto animate-fade-in group">
      {/* Sender Avatar */}
      <div className="relative w-8 h-8 rounded-xl overflow-hidden border border-white shadow-sm shrink-0 mt-1 bg-white">
        <Image
          src={avatarSrc}
          alt={message.sender}
          fill
          sizes="32px"
          className="object-cover"
        />
      </div>

      <div className="flex flex-col items-start min-w-0">
        <div className="flex items-center gap-1.5 mb-1 px-1">
          <span className="text-[11px] font-bold text-[#172B59] truncate max-w-[120px]">
            {message.sender}
          </span>
          <span className="text-[10px] text-[#52658D]/60">{formatDate(message.timestamp)}</span>
        </div>

        <div className="relative px-4 py-2.5 rounded-2xl rounded-tl-none bg-white/95 backdrop-blur-md border border-purple-100 text-[#172B59] text-sm sm:text-base leading-relaxed shadow-sm break-words max-w-full">
          {message.text}
        </div>
      </div>
    </div>
  );
}
