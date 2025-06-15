import React from "react";

const MusicLoadingSpinner = ({ size = "md" }) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  return (
    <div className="relative">
      {/* Outer ring */}
      <div className={`${sizeClasses[size]} relative`}>
        <svg className="animate-spin" viewBox="0 0 50 50">
          <circle
            cx="25"
            cy="25"
            r="20"
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="80 40"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ec4899" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center pulse */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
        </div>
      </div>

      {/* Musical notes floating animation */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-full h-full">
          <span
            className="absolute text-white/40 animate-float-note-1"
            style={{ fontSize: "10px", left: "50%", top: "50%" }}
          >
            ♪
          </span>
          <span
            className="absolute text-white/30 animate-float-note-2"
            style={{ fontSize: "8px", left: "45%", top: "45%" }}
          >
            ♫
          </span>
          <span
            className="absolute text-white/20 animate-float-note-3"
            style={{ fontSize: "12px", left: "55%", top: "55%" }}
          >
            ♪
          </span>
        </div>
      </div>
    </div>
  );
};

export default MusicLoadingSpinner;
