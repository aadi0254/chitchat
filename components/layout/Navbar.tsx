import React, { useState } from "react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Heart, Menu, X, Home as HomeIcon, Sparkles } from "lucide-react";

interface NavbarProps {
  onNavigateHome?: () => void;
  onNavigateSection?: (sectionId: string) => void;
}

export function Navbar({ onNavigateHome, onNavigateSection }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"home" | "about" | "features" | "how-it-works">("home");

  const handleNav = (tab: "home" | "about" | "features" | "how-it-works", sectionId?: string) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    if (tab === "home") {
      if (onNavigateHome) onNavigateHome();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (sectionId) {
      if (onNavigateSection) onNavigateSection(sectionId);
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full px-4 sm:px-6 lg:px-12 py-3 transition-all duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-5 py-2.5 rounded-full glass border border-white/80 shadow-[0_8px_30px_rgba(121,87,245,0.08)]">
        {/* Left: Brand Logo */}
        <BrandLogo onClick={() => handleNav("home")} size="sm" />

        {/* Center: Navigation Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-1.5 bg-white/50 p-1 rounded-full border border-white/60 shadow-inner">
          <button
            onClick={() => handleNav("home")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeTab === "home"
                ? "bg-[#7957F5] text-white shadow-[0_4px_12px_rgba(121,87,245,0.35)]"
                : "text-[#52658D] hover:text-[#172B59] hover:bg-white/60"
            }`}
          >
            <HomeIcon size={13} />
            <span>Home</span>
          </button>

          <button
            onClick={() => handleNav("about", "about")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === "about"
                ? "bg-[#7957F5] text-white shadow-[0_4px_12px_rgba(121,87,245,0.35)]"
                : "text-[#52658D] hover:text-[#172B59] hover:bg-white/60"
            }`}
          >
            About
          </button>

          <button
            onClick={() => handleNav("features", "features")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === "features"
                ? "bg-[#7957F5] text-white shadow-[0_4px_12px_rgba(121,87,245,0.35)]"
                : "text-[#52658D] hover:text-[#172B59] hover:bg-white/60"
            }`}
          >
            Features
          </button>

          <button
            onClick={() => handleNav("how-it-works", "how-it-works")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === "how-it-works"
                ? "bg-[#7957F5] text-white shadow-[0_4px_12px_rgba(121,87,245,0.35)]"
                : "text-[#52658D] hover:text-[#172B59] hover:bg-white/60"
            }`}
          >
            How It Works
          </button>
        </nav>

        {/* Right: Status Pill & Heart Button */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50/80 border border-emerald-200/60 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-emerald-800 tracking-tight">
              Real-time • No Database
            </span>
          </div>

          <button
            aria-label="Happy Heart"
            className="w-8 h-8 rounded-full bg-[#E7DFFF] hover:bg-[#D9CCFF] text-[#7957F5] flex items-center justify-center transition-transform hover:scale-110 active:scale-95 shadow-sm"
          >
            <Heart size={15} fill="#7957F5" />
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-xl text-[#172B59] hover:bg-purple-100/50 transition-colors"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 p-4 rounded-3xl glass border border-white/80 shadow-xl space-y-2 animate-slide-down">
          <button
            onClick={() => handleNav("home")}
            className="w-full text-left px-4 py-2.5 rounded-2xl text-sm font-bold text-[#172B59] hover:bg-purple-50 flex items-center gap-2"
          >
            <HomeIcon size={16} className="text-[#7957F5]" /> Home
          </button>
          <button
            onClick={() => handleNav("about", "about")}
            className="w-full text-left px-4 py-2.5 rounded-2xl text-sm font-semibold text-[#52658D] hover:bg-purple-50"
          >
            About
          </button>
          <button
            onClick={() => handleNav("features", "features")}
            className="w-full text-left px-4 py-2.5 rounded-2xl text-sm font-semibold text-[#52658D] hover:bg-purple-50"
          >
            Features
          </button>
          <button
            onClick={() => handleNav("how-it-works", "how-it-works")}
            className="w-full text-left px-4 py-2.5 rounded-2xl text-sm font-semibold text-[#52658D] hover:bg-purple-50"
          >
            How It Works
          </button>

          <div className="pt-2 border-t border-purple-100 flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Real-time Active
            </span>
            <div className="w-7 h-7 rounded-full bg-[#E7DFFF] text-[#7957F5] flex items-center justify-center">
              <Heart size={14} fill="#7957F5" />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
