"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { socket, ChatMessage, SocketEvent, RoomParticipant } from "@/lib/socket";
import { generateRoomCode } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";
import { FloatingDecorations } from "@/components/ui/FloatingDecorations";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { AboutSection } from "@/components/landing/AboutSection";
import { ClosingCta } from "@/components/landing/ClosingCta";
import { Footer } from "@/components/landing/Footer";
import { JoinRoomModal } from "@/components/room/JoinRoomModal";
import { ChatView } from "@/components/chat/ChatView";

function normalizeParticipant(p: RoomParticipant | string): RoomParticipant {
  if (typeof p === "string") {
    return {
      id: p,
      name: p,
      isOnline: true,
    };
  }
  return {
    id: p.id || p.name || "unknown",
    name: p.name || "Anonymous",
    joinedAt: p.joinedAt,
    isOnline: p.isOnline !== false,
  };
}

type ViewState = "landing" | "join" | "chat";

interface UserInfo {
  name: string;
  room: string;
}

export default function Home() {
  const [view, setView] = useState<ViewState>("landing");
  const [userInfo, setUserInfo] = useState<UserInfo>({ name: "", room: "" });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [sendError, setSendError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Persistence: Check Session Storage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem("chitchat_auth");
    if (saved) {
      try {
        const data = JSON.parse(saved) as UserInfo;
        if (data.room && data.name) {
          joinRoom(data.room, data.name);
        }
      } catch {
        sessionStorage.removeItem("chitchat_auth");
      }
    }
  }, []);

  // Cleanup on tab close / reload (allow transport disconnect grace period on refresh)
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Do not explicitly leave room on reload; transport disconnect grace period will hold
      // membership for 15s to allow seamless refresh without destroying room session.
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [view]);

  // Handle Escape key and body scroll lock for mobile sidebar drawer
  useEffect(() => {
    if (!isSidebarOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsSidebarOpen(false);
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSidebarOpen]);

  // Close mobile drawer on desktop resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Socket Listener
  useEffect(() => {
    if (!socket || view !== "chat") return;
    const s = socket;

    const unsubscribe = s.on((event: SocketEvent) => {
      if (event.type === "MESSAGE") {
        setMessages((prev) => {
          // Avoid duplicate messages if reconnection / retry occurs
          if (prev.some((m) => m.id === event.message.id)) {
            return prev;
          }
          return [...prev, event.message];
        });
      } else if (event.type === "ROSTER") {
        setParticipants(event.users.map(normalizeParticipant));
      } else if (event.type === "JOIN") {
        if (event.participant) {
          const newP = normalizeParticipant(event.participant);
          setParticipants((prev) => {
            const exists = prev.some((p) => p.id === newP.id);
            if (exists) {
              return prev.map((p) => (p.id === newP.id ? { ...p, ...newP, isOnline: true } : p));
            }
            return [...prev, newP];
          });
        } else if (event.user) {
          setParticipants((prev) => {
            if (prev.some((p) => p.name === event.user)) return prev;
            return [...prev, { id: event.user, name: event.user, isOnline: true }];
          });
        }
      } else if (event.type === "PRESENCE") {
        if (event.participant) {
          const updatedP = normalizeParticipant(event.participant);
          setParticipants((prev) =>
            prev.map((p) => (p.id === updatedP.id ? { ...p, ...updatedP, isOnline: true } : p))
          );
        }
      } else if (event.type === "LEAVE") {
        setParticipants((prev) =>
          prev.filter((p) => (event.participantId ? p.id !== event.participantId : p.name !== event.user))
        );
      } else if (event.type === "ROOM_CLOSED") {
        setError(`This room has ended: ${event.reason}`);
        leaveRoom();
      } else if (event.type === "ERROR") {
        setSendError(event.error);
        const timer = setTimeout(() => setSendError(""), 5000);
        return () => clearTimeout(timer);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [view]);

  const joinRoom = async (room: string, name: string) => {
    setLoading(true);
    setError("");
    try {
      if (!socket) {
        throw new Error("Real-time network connection is unavailable");
      }
      const response = await socket.join(room, name);
      setUserInfo({ name: response.name, room: response.room });
      if (response.messages && Array.isArray(response.messages)) {
        setMessages(response.messages);
      } else {
        setMessages([]);
      }
      const initialRoster = (response.participants || []).map(normalizeParticipant);
      setParticipants(
        initialRoster.length > 0
          ? initialRoster
          : [{ id: response.participantId || response.name, name: response.name, isOnline: true }]
      );
      sessionStorage.setItem("chitchat_auth", JSON.stringify({ name: response.name, room: response.room }));
      setView("chat");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to join room";
      setError(msg);
      setView("join");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = () => {
    const code = generateRoomCode();
    setUserInfo({ ...userInfo, room: code });
    setError("");
    setView("join");
  };

  const handleJoinClick = () => {
    setError("");
    setView("join");
  };

  const handleGenerateFreshCode = () => {
    const code = generateRoomCode();
    setUserInfo((prev) => ({ ...prev, room: code }));
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const name = userInfo.name.trim();
    const room = userInfo.room.trim().toUpperCase();

    if (!name) {
      setError("Please enter your display name");
      return;
    }
    if (name.length > 30) {
      setError("Display name must be 30 characters or fewer");
      return;
    }

    const roomCodeRegex = /^[A-Z0-9]{6}$/;
    if (!roomCodeRegex.test(room)) {
      setError("Please enter a valid 6-digit alphanumeric room code (A-Z, 0-9)");
      return;
    }

    joinRoom(room, name);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const textToSend = inputMessage.trim();
    if (!textToSend || isSending) return;

    if (textToSend.length > 1000) {
      setSendError("Message exceeds 1,000 characters limit");
      return;
    }

    setIsSending(true);
    setSendError("");

    try {
      const res = await socket?.sendMessage(textToSend);
      if (res && !res.success) {
        setSendError(res.error || "Failed to deliver message");
      } else {
        setInputMessage("");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Delivery failed";
      setSendError(msg);
    } finally {
      setIsSending(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(userInfo.room);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const leaveRoom = async () => {
    try {
      await socket?.leave();
    } catch {
      // Ignore
    }
    sessionStorage.removeItem("chitchat_auth");
    setView("landing");
    setUserInfo({ name: "", room: "" });
    setMessages([]);
    setParticipants([]);
    setSendError("");
    setIsSidebarOpen(false);
  };

  // Loading Screen
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#FFFCFF] text-[#172B59] gap-4 relative z-20">
        <div className="relative w-20 h-20 rounded-3xl overflow-hidden shadow-cute border-2 border-white animate-bounce">
          <Image
            src="/assets/panda-avatar.jpg"
            alt="Loading ChitChat"
            fill
            sizes="80px"
            className="object-cover"
          />
        </div>
        <div className="flex items-center gap-2 text-sm font-bold text-[#7957F5]">
          <div className="w-4 h-4 border-2 border-[#7957F5] border-t-transparent rounded-full animate-spin" />
          <span>Entering Cozy Room...</span>
        </div>
      </div>
    );
  }

  // View: Join Room
  if (view === "join") {
    return (
      <div className="relative min-h-screen">
        <FloatingDecorations />
        <JoinRoomModal
          name={userInfo.name}
          room={userInfo.room}
          error={error}
          loading={loading}
          onNameChange={(val) => setUserInfo((prev) => ({ ...prev, name: val }))}
          onRoomChange={(val) => setUserInfo((prev) => ({ ...prev, room: val }))}
          onSubmit={handleJoinSubmit}
          onBack={() => setView("landing")}
          onGenerateNewCode={handleGenerateFreshCode}
        />
      </div>
    );
  }

  // View: Active Chat
  if (view === "chat") {
    return (
      <ChatView
        roomCode={userInfo.room}
        userName={userInfo.name}
        currentUserId={socket?.getParticipantId()}
        messages={messages}
        participants={participants}
        inputMessage={inputMessage}
        isSending={isSending}
        sendError={sendError}
        copied={copied}
        isSidebarOpen={isSidebarOpen}
        onCopyCode={copyCode}
        onLeaveRoom={leaveRoom}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        onCloseSidebar={() => setIsSidebarOpen(false)}
        onInputChange={setInputMessage}
        onSendMessage={handleSendMessage}
        onClearSendError={() => setSendError("")}
      />
    );
  }

  // View: Landing Page (Default)
  return (
    <div className="relative min-h-screen flex flex-col">
      <FloatingDecorations />
      <Navbar onNavigateHome={() => setView("landing")} />
      
      <main className="flex-1 flex flex-col">
        <HeroSection
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinClick}
        />
        <FeaturesSection />
        <HowItWorksSection />
        <AboutSection />
        <ClosingCta onCreateRoom={handleCreateRoom} />
      </main>

      <Footer />
    </div>
  );
}
