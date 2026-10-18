import React from "react";

interface BrandLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
}

export function BrandLogo({ className = "", size = "md", onClick }: BrandLogoProps) {
  const iconSizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
  };

  const textSizes = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-4xl",
  };

  return (
    <div 
      className={`inline-flex items-center gap-2.5 cursor-pointer select-none group ${className}`}
      onClick={onClick}
    >
      {/* Cute Purple Chat Bubble with Kawaii Smiling Face */}
      <div 
        className={`${iconSizes[size]} relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#7957F5] via-[#8B6DF8] to-[#F28BCB] shadow-[0_4px_16px_rgba(121,87,245,0.35)] group-hover:scale-105 group-hover:rotate-[-2deg] transition-all duration-300`}
      >
        <svg 
          viewBox="0 0 36 36" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-3/4 h-3/4 drop-shadow-sm"
        >
          {/* Main Bubble */}
          <path 
            d="M18 4C10.268 4 4 9.82 4 17C4 20.316 5.378 23.336 7.684 25.592C7.306 27.686 6.398 29.742 5.092 31.334C4.856 31.622 5.048 32.062 5.422 32.046C8.584 31.91 11.458 30.658 13.564 29.282C14.978 29.748 16.458 30 18 30C25.732 30 32 24.18 32 17C32 9.82 25.732 4 18 4Z" 
            fill="white" 
          />
          {/* Kawaii Eyes */}
          <circle cx="13" cy="15.5" r="1.8" fill="#7957F5" />
          <circle cx="23" cy="15.5" r="1.8" fill="#7957F5" />
          {/* Eye Sparkles */}
          <circle cx="13.6" cy="14.8" r="0.6" fill="white" />
          <circle cx="23.6" cy="14.8" r="0.6" fill="white" />
          {/* Cheerful Smile */}
          <path 
            d="M16 19.2C16.8 20.4 19.2 20.4 20 19.2" 
            stroke="#7957F5" 
            strokeWidth="1.6" 
            strokeLinecap="round" 
          />
          {/* Rosy Cheeks */}
          <circle cx="10.8" cy="18" r="1.2" fill="#F28BCB" opacity="0.8" />
          <circle cx="25.2" cy="18" r="1.2" fill="#F28BCB" opacity="0.8" />
        </svg>
      </div>

      {/* Brand Text */}
      <span className={`${textSizes[size]} font-extrabold tracking-tight`}>
        <span className="text-[#172B59]">Chit</span>
        <span className="bg-gradient-to-r from-[#7957F5] via-[#8E6BF8] to-[#F28BCB] bg-clip-text text-transparent">
          Chat
        </span>
      </span>
    </div>
  );
}
