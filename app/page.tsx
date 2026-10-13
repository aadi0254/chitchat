"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  PlusCircle, 
  Users, 
  MessageSquare, 
  Send, 
  Copy, 
  LogOut, 
  Check, 
  Hash, 
  User as UserIcon,
  ShieldCheck,
  ChevronRight,
  AlertCircle
} from "lucide-react";
import { cn, formatDate, generateRoomCode } from "@/lib/utils";
import { socket, ChatMessage, SocketEvent } from "@/lib/socket";

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
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [sendError, setSendError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Cleanup on tab close / reload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (view === "chat" && socket) {
        socket.leave();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [view]);

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
        setOnlineUsers(event.users);
      } else if (event.type === "JOIN") {
        setOnlineUsers((prev) => Array.from(new Set([...prev, event.user])));
      } else if (event.type === "PRESENCE") {
        setOnlineUsers((prev) => Array.from(new Set([...prev, event.user])));
      } else if (event.type === "LEAVE") {
        setOnlineUsers((prev) => prev.filter((u) => u !== event.user));
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

  // Auto-scroll to bottom safely without animation frame lockup
  useEffect(() => {
    if (messages.length === 0) return;
    const isRapid = messages.length > 50;
    messagesEndRef.current?.scrollIntoView({ behavior: isRapid ? "auto" : "smooth" });
  }, [messages.length]);

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
      setOnlineUsers(response.participants || [response.name]);
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
    setView("join");
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
        inputRef.current?.focus();
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
    setOnlineUsers([]);
    setSendError("");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-secondary-foreground animate-pulse">Entering Secure Room...</p>
      </div>
    );
  }

  // --- VIEWS ---

  if (view === "landing") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-background">
        <div className="w-full max-w-lg space-y-12 text-center animate-fade-in">
          <div className="space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-primary/20 text-primary mb-4 p-4">
              <ShieldCheck size={48} />
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-balance">
              Chit<span className="text-primary italic">Chat</span>.
            </h1>
            <p className="text-secondary-foreground text-xl md:text-2xl max-w-md mx-auto">
              Private, real-time messaging for teams and friends.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleCreateRoom}
              className="group relative flex flex-col items-center gap-4 p-8 rounded-2xl bg-secondary hover:bg-accent border border-white/5 hover:border-primary/50 transition-all duration-300"
            >
              <div className="p-4 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                <PlusCircle size={32} />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold">Create a Room</h3>
                <p className="text-sm text-secondary-foreground/60">Start a new private session</p>
              </div>
              <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            <button
              onClick={() => {
                setError("");
                setView("join");
              }}
              className="group relative flex flex-col items-center gap-4 p-8 rounded-2xl bg-secondary hover:bg-accent border border-white/5 hover:border-primary/50 transition-all duration-300"
            >
              <div className="p-4 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                <Users size={32} />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold">Join a Room</h3>
                <p className="text-sm text-secondary-foreground/60">Enter an existing chat code</p>
              </div>
              <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>

          <footer className="pt-8 text-secondary-foreground/40 text-sm">
            Powered by Secure Real-time WebSockets
          </footer>
        </div>
      </main>
    );
  }

  if (view === "join") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md space-y-8 glass p-8 rounded-3xl animate-slide-up">
          <button 
            onClick={() => setView("landing")}
            className="text-secondary-foreground/60 hover:text-foreground text-sm flex items-center gap-2 mb-4"
          >
            ← Back to Home
          </button>
          
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Access Room</h2>
            <p className="text-secondary-foreground/60">Enter your credentials to join the chat.</p>
          </div>

          <form onSubmit={handleJoinSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <UserIcon size={16} /> Display Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alex"
                  maxLength={30}
                  value={userInfo.name}
                  onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-accent border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary outline-none transition-all"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Hash size={16} /> Room Code
                </label>
                <input
                  type="text"
                  placeholder="6-DIGIT CODE"
                  maxLength={6}
                  value={userInfo.room}
                  onChange={(e) => setUserInfo({ ...userInfo, room: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-3 rounded-xl bg-accent border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary outline-none transition-all uppercase tracking-widest font-mono"
                />
              </div>
            </div>

            {error && <p className="text-red-400 text-sm animate-shake">{error}</p>}

            <button
              type="submit"
              className="w-full py-4 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold transition-all transform active:scale-95 flex items-center justify-center gap-2"
            >
              Enter Chat Room <ChevronRight size={20} />
            </button>
          </form>
        </div>
      </main>
    );
  }

  // --- CHAT ROOM VIEW ---

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-full md:w-80 glass-card border-r border-white/5 flex flex-col h-auto md:h-full">
        <div className="p-6 border-b border-white/5 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tighter italic">ChitChat</h2>
            <button 
              onClick={leaveRoom}
              className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
              title="Leave Room"
            >
              <LogOut size={20} />
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-secondary-foreground/40 uppercase tracking-wider">Room Code</label>
            <div className="flex items-center justify-between p-3 rounded-xl bg-accent border border-white/10 group">
              <span className="font-mono font-bold tracking-widest text-primary">{userInfo.room}</span>
              <button 
                onClick={copyCode}
                className="p-1.5 rounded-md hover:bg-white/10 text-secondary-foreground/60 transition-all active:scale-90"
              >
                {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Users size={16} className="text-primary" /> Online Users
            </h3>
            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">
              {onlineUsers.length}
            </span>
          </div>
          
          <ul className="space-y-2">
            {onlineUsers.map((user, i) => (
              <li key={`${user}-${i}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors animate-slide-up">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold border border-white/10">
                  {user.charAt(0).toUpperCase()}
                </div>
                <span className={cn("text-sm", user === userInfo.name ? "text-primary font-medium" : "text-foreground")}>
                  {user} {user === userInfo.name && "(You)"}
                </span>
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 ml-auto shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col h-full bg-background relative">
        <header className="p-4 border-b border-white/5 flex items-center justify-between bg-background/50 backdrop-blur-md z-10">
          <div className="flex items-center gap-4">
            <div className="md:hidden flex items-center gap-2">
               <Hash size={18} className="text-primary" />
               <span className="font-mono font-bold">{userInfo.room}</span>
            </div>
            <div className="hidden md:flex flex-col">
              <h1 className="text-lg font-bold">General Room Chat</h1>
              <p className="text-xs text-secondary-foreground/60">Ephemeral In-Memory Chat • TLS Transport</p>
            </div>
          </div>
        </header>

        {/* Send Error Toast */}
        {sendError && (
          <div className="absolute top-16 left-4 right-4 z-20 flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs backdrop-blur-md animate-slide-down">
            <AlertCircle size={16} />
            <span>{sendError}</span>
            <button 
              onClick={() => setSendError("")} 
              className="ml-auto text-red-400/60 hover:text-red-400"
            >
              ✕
            </button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-20 gap-4">
              <MessageSquare size={80} />
              <p className="text-xl font-medium">No messages yet. Say hi!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div 
                key={msg.id} 
                className={cn(
                  "flex flex-col max-w-[85%] md:max-w-[70%] animate-fade-in",
                  msg.type === "system" ? "mx-auto w-full items-center py-2" : 
                  msg.sender === userInfo.name ? "ml-auto items-end" : "items-start"
                )}
              >
                {msg.type === "system" ? (
                  <span className="text-xs px-3 py-1 rounded-full bg-accent text-secondary-foreground/60 border border-white/5 italic">
                    {msg.text}
                  </span>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <span className="text-xs font-bold text-secondary-foreground/60">
                        {msg.sender === userInfo.name ? "You" : msg.sender}
                      </span>
                      <span className="text-[10px] text-secondary-foreground/40">{formatDate(msg.timestamp)}</span>
                    </div>
                    <div 
                      className={cn(
                        "px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-lg break-words",
                        msg.sender === userInfo.name 
                          ? "bg-primary text-white rounded-tr-none" 
                          : "bg-accent text-foreground rounded-tl-none border border-white/5"
                      )}
                    >
                      {msg.text}
                    </div>
                  </>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <footer className="p-4 bg-background/50 backdrop-blur-md">
          <form 
            onSubmit={handleSendMessage}
            className="flex items-center gap-2 p-1.5 rounded-2xl bg-secondary border border-white/10 group focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all shadow-2xl"
          >
            <input
              ref={inputRef}
              type="text"
              placeholder="Type your message..."
              maxLength={1000}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 bg-transparent px-4 py-3 outline-none text-sm"
              disabled={isSending}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isSending}
              className="p-3 rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary transition-all active:scale-90"
            >
              <Send size={20} />
            </button>
          </form>
        </footer>
      </main>
    </div>
  );
}
