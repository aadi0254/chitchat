import React from "react";
import { Zap, Lock, Share2, RefreshCw } from "lucide-react";

export function FeaturesSection() {
  const features = [
    {
      icon: <Zap className="w-6 h-6 text-[#7957F5]" />,
      title: "Real-time Conversations",
      description:
        "Sub-millisecond event dispatching powered by direct WebSocket connections. Experience zero message lag.",
      bg: "bg-purple-100/70",
      accent: "hover:border-[#7957F5]/40",
    },
    {
      icon: <Lock className="w-6 h-6 text-[#F28BCB]" />,
      title: "Temporary & Ephemeral",
      description:
        "Zero database footprint. Rooms live strictly in volatile server RAM and evaporate completely when the last participant departs.",
      bg: "bg-pink-100/70",
      accent: "hover:border-[#F28BCB]/40",
    },
    {
      icon: <Share2 className="w-6 h-6 text-[#60A5FA]" />,
      title: "Simple 6-Digit Codes",
      description:
        "No complex signups or passwords. Share a memorable 6-character room code with your friends and jump straight in.",
      bg: "bg-blue-100/70",
      accent: "hover:border-[#60A5FA]/40",
    },
    {
      icon: <RefreshCw className="w-6 h-6 text-[#34D399]" />,
      title: "15s Reconnection Grace",
      description:
        "Accidental reload or flaky connection? The server reserves your identity for 15 seconds so you never miss a beat.",
      bg: "bg-emerald-100/70",
      accent: "hover:border-[#34D399]/40",
    },
  ];

  return (
    <section id="features" className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-16 z-10">
      <div className="text-center space-y-3 mb-12">
        <span className="px-3.5 py-1 rounded-full text-xs font-bold text-[#7957F5] bg-purple-100/80 border border-purple-200">
          Features
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-[#172B59] tracking-tight">
          Crafted for Privacy and Pure Connection ✨
        </h2>
        <p className="text-sm sm:text-base text-[#52658D] max-w-2xl mx-auto">
          Everything you need for an intimate, hassle-free private chat session with zero digital footprint.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((f, i) => (
          <div
            key={i}
            className={`glass-card p-6 rounded-3xl flex flex-col items-start space-y-4 border border-white/80 ${f.accent}`}
          >
            <div className={`p-3 rounded-2xl ${f.bg} shadow-sm`}>{f.icon}</div>
            <h3 className="text-lg font-bold text-[#172B59]">{f.title}</h3>
            <p className="text-xs sm:text-sm text-[#52658D] leading-relaxed">{f.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
