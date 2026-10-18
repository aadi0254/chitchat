import React, { useRef, useEffect } from "react";
import { Send, Sparkles } from "lucide-react";

interface MessageInputProps {
  inputMessage: string;
  isSending: boolean;
  onInputChange: (val: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
}

export function MessageInput({
  inputMessage,
  isSending,
  onInputChange,
  onSendMessage,
}: MessageInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <footer className="p-3 sm:p-4 bg-white/70 backdrop-blur-md border-t border-purple-100 shrink-0">
      <form
        onSubmit={onSendMessage}
        className="flex items-center gap-2 p-1.5 sm:p-2 rounded-2xl glass-input shadow-md border border-purple-200/60 focus-within:border-[#7957F5] focus-within:shadow-[0_0_0_3px_rgba(121,87,245,0.15)] transition-all bg-white/90"
      >
        <input
          ref={inputRef}
          type="text"
          placeholder="Type a happy message... ✨"
          maxLength={1000}
          value={inputMessage}
          onChange={(e) => onInputChange(e.target.value)}
          disabled={isSending}
          className="flex-1 bg-transparent px-3 py-2 text-sm sm:text-base text-[#172B59] placeholder-[#52658D]/40 outline-none"
        />

        {/* Character count when approaching limit */}
        {inputMessage.length > 800 && (
          <span className="text-[11px] font-mono text-[#52658D] pr-1">
            {1000 - inputMessage.length}
          </span>
        )}

        {/* Send Button */}
        <button
          type="submit"
          disabled={!inputMessage.trim() || isSending}
          className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-r from-[#7957F5] to-[#9B7BFA] hover:from-[#6A46F4] hover:to-[#8E6DF8] text-white shadow-md disabled:opacity-40 disabled:hover:from-[#7957F5] disabled:hover:to-[#9B7BFA] transition-all transform active:scale-95 flex items-center justify-center shrink-0"
          aria-label="Send Message"
        >
          <Send size={18} />
        </button>
      </form>
    </footer>
  );
}
