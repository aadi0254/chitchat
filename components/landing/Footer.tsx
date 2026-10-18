import React from "react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative w-full border-t border-purple-100/80 py-8 px-4 sm:px-6 lg:px-12 z-10 bg-white/40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <BrandLogo size="sm" />

        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6 text-xs text-[#52658D]">
          <p className="flex items-center gap-1 font-semibold">
            Made for meaningful moments <Heart size={13} className="text-[#F28BCB]" fill="#F28BCB" />
          </p>
          <span className="hidden sm:inline">•</span>
          <p>Powered by Secure Real-time WebSockets</p>
        </div>
      </div>
    </footer>
  );
}
