import React, { useRef, useEffect } from "react";
import Image from "next/image";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ParticipantSidebar } from "@/components/chat/ParticipantSidebar";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { MessageInput } from "@/components/chat/MessageInput";
import { ChatMessage, RoomParticipant } from "@/lib/socket";
import { AlertCircle, Sparkles, MessageSquare } from "lucide-react";

interface ChatViewProps {
  roomCode: string;
  userName: string;
  currentUserId?: string | null;
  messages: ChatMessage[];
  participants: RoomParticipant[];
  inputMessage: string;
  isSending: boolean;
  sendError: string;
  copied: boolean;
  isSidebarOpen: boolean;
  onCopyCode: () => void;
  onLeaveRoom: () => void;
  onToggleSidebar: () => void;
  onCloseSidebar: () => void;
  onInputChange: (val: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
  onClearSendError: () => void;
}

export function ChatView({
  roomCode,
  userName,
  currentUserId,
  messages,
  participants,
  inputMessage,
  isSending,
  sendError,
  copied,
  isSidebarOpen,
  onCopyCode,
  onLeaveRoom,
  onToggleSidebar,
  onCloseSidebar,
  onInputChange,
  onSendMessage,
  onClearSendError,
}: ChatViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when messages update
  useEffect(() => {
    if (messages.length === 0) return;
    const isRapid = messages.length > 50;
    messagesEndRef.current?.scrollIntoView({ behavior: isRapid ? "auto" : "smooth" });
  }, [messages.length]);

  return (
    <div className="flex flex-col md:flex-row h-screen h-[100dvh] bg-[#FFFCFF] overflow-hidden relative selection:bg-purple-200">
      {/* Participant Sidebar */}
      <ParticipantSidebar
        participants={participants}
        currentUserName={userName}
        currentUserId={currentUserId}
        roomCode={roomCode}
        copied={copied}
        isOpen={isSidebarOpen}
        onCopyCode={onCopyCode}
        onClose={onCloseSidebar}
      />

      {/* Main Chat Content Area */}
      <main className="flex-1 flex flex-col h-full min-w-0 bg-transparent relative">
        {/* Top Chat Header */}
        <ChatHeader
          roomCode={roomCode}
          onlineCount={participants.filter((p) => p.isOnline !== false).length}
          copied={copied}
          onCopyCode={onCopyCode}
          onLeaveRoom={onLeaveRoom}
          onToggleSidebar={onToggleSidebar}
          isSidebarOpen={isSidebarOpen}
        />

        {/* Send Error Toast Notification */}
        {sendError && (
          <div className="absolute top-16 left-4 right-4 z-30 flex items-center gap-2 p-3.5 bg-red-50/95 border border-red-200 text-red-600 rounded-2xl text-xs backdrop-blur-md shadow-lg animate-slide-down">
            <AlertCircle size={16} className="shrink-0" />
            <span className="font-medium">{sendError}</span>
            <button
              onClick={onClearSendError}
              className="ml-auto text-red-400 hover:text-red-700 p-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Message Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-1 scroll-smooth">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 animate-fade-in select-none">
              <div className="relative w-24 h-24 rounded-3xl overflow-hidden shadow-cute border-2 border-white bg-purple-50">
                <Image
                  src="/assets/panda-avatar.jpg"
                  alt="Cute Panda"
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-[#172B59]">
                  Welcome to room {roomCode}! ✨
                </h3>
                <p className="text-xs sm:text-sm text-[#52658D] max-w-sm mx-auto">
                  No messages yet. Send a happy note or invite your friends to start chatting!
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center pt-2">
                <span className="px-3 py-1 rounded-full bg-purple-100 text-[#7957F5] text-xs font-semibold">
                  Hey everyone! 👋
                </span>
                <span className="px-3 py-1 rounded-full bg-pink-100 text-[#F28BCB] text-xs font-semibold">
                  Happy to be here! 💜
                </span>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isCurrentUser={msg.sender === userName}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Message Input Bar */}
        <MessageInput
          inputMessage={inputMessage}
          isSending={isSending}
          onInputChange={onInputChange}
          onSendMessage={onSendMessage}
        />
      </main>
    </div>
  );
}
