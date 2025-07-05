import React, { useEffect, useState } from "react";
import MusicLoadingSpinner from "./MusicLoadingSpinner";

const LoadingState = ({
  variant = "inline",
  size = "md",
  title,
  subtitle,
  text,
  className = "",
}) => {
  const [showSubtitle, setShowSubtitle] = useState(false);

  useEffect(() => {
    if (subtitle && variant === "page") {
      const timer = setTimeout(() => {
        setShowSubtitle(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [subtitle, variant]);

  // Page variant - full page loading
  if (variant === "page") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <MusicLoadingSpinner size="lg" />
          <div className="text-center space-y-2">
            {title && <p className="text-white font-medium text-lg">{title}</p>}
            {showSubtitle && subtitle && (
              <p className="text-gray-300 text-sm animate-fadeIn">{subtitle}</p>
            )}
          </div>
          {/* Progress indicator */}
          <div className="w-48 h-1 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full animate-loading-progress" />
          </div>
        </div>
      </div>
    );
  }

  // Button variant - indicator on button
  if (variant === "button") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <MusicLoadingSpinner size="sm" />
        {text && <span>{text}</span>}
      </div>
    );
  }

  // Inline variant - small inline indicator
  if (variant === "inline") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <MusicLoadingSpinner size={size} />
        {text && <span className="text-white/80 text-sm">{text}</span>}
      </div>
    );
  }

  // Overlay variant - for cards/images
  if (variant === "overlay") {
    return (
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center rounded-lg ${className}`}
      >
        <MusicLoadingSpinner size={size} />
      </div>
    );
  }

  return null;
};

export default LoadingState;
