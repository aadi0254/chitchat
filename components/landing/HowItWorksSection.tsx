import React from "react";
import { Sparkles, MessageCircle, Key, Users } from "lucide-react";

export function HowItWorksSection() {
  const steps = [
    {
      num: "01",
      icon: <Key className="w-6 h-6 text-[#7957F5]" />,
      title: "Create a Room",
      desc: "Hit 'Create Room' to generate a unique, cryptographically random 6-character room code in seconds.",
      bg: "bg-purple-100",
    },
    {
      num: "02",
      icon: <Users className="w-6 h-6 text-[#F28BCB]" />,
      title: "Share Your Code",
      desc: "Send your 6-digit code to your teammates or best friends via your favorite messaging app.",
      bg: "bg-pink-100",
    },
    {
      num: "03",
      icon: <MessageCircle className="w-6 h-6 text-[#60A5FA]" />,
      title: "Start Chatting",
      desc: "Enter your display name and begin exchanging instant messages with live presence and zero logging.",
      bg: "bg-blue-100",
    },
  ];

  return (
    <section id="how-it-works" className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-16 z-10">
      <div className="text-center space-y-3 mb-12">
        <span className="px-3.5 py-1 rounded-full text-xs font-bold text-[#F28BCB] bg-pink-100/80 border border-pink-200">
          Simple & Fast
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-[#172B59] tracking-tight">
          How It Works 🚀
        </h2>
        <p className="text-sm sm:text-base text-[#52658D] max-w-xl mx-auto">
          No signups, no emails, no phone numbers. Just 3 gentle steps to a private chat world.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className="glass-card p-8 rounded-3xl relative flex flex-col items-center text-center space-y-4"
          >
            {/* Step Number Tag */}
            <div className="absolute top-4 right-6 text-2xl font-black text-[#52658D]/20 select-none">
              {step.num}
            </div>

            {/* Icon Bubble */}
            <div className={`w-14 h-14 rounded-2xl ${step.bg} flex items-center justify-center shadow-sm`}>
              {step.icon}
            </div>

            <h3 className="text-xl font-bold text-[#172B59]">{step.title}</h3>
            <p className="text-xs sm:text-sm text-[#52658D] leading-relaxed max-w-xs">{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
