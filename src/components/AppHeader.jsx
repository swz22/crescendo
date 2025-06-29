import React, { memo, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { selectCurrentContextTracks } from "../redux/features/playerSelectors";
import Searchbar from "./Searchbar";
import QueueButton from "./QueueButton";
import MobileQueueSheet from "./MobileQueueSheet";
import { HiOutlineMenu } from "react-icons/hi";

const AppHeader = memo(
  ({
    title,
    subtitle,
    action,
    showSearch = true,
    transparent = false,
    className = "",
  }) => {
    const { setMobileMenuOpen } = useApp();
    const [mobileQueueOpen, setMobileQueueOpen] = useState(false);
    const currentTracks = useSelector(selectCurrentContextTracks);
    const location = useLocation();

    // Don't show queue button on certain pages
    const hideQueueButton =
      location.pathname.includes("/albums/") ||
      location.pathname.includes("/artists/") ||
      location.pathname.includes("/songs/");

    return (
      <>
        {/* Header Container */}
        <div
          className={`
        ${
          transparent
            ? ""
            : "bg-gradient-to-b from-white/[0.02] to-transparent backdrop-blur-sm"
        }
        ${className}
      `}
        >
          {/* Mobile Layout - Extended to 768px */}
          <div className="md:hidden">
            {/* Row 1: Menu, Title, Action */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 -ml-2 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Open menu"
              >
                <HiOutlineMenu className="w-6 h-6 text-white" />
              </button>

              <h1 className="text-xl font-bold text-white truncate flex-1 mx-3">
                {title}
              </h1>

              {action && <div className="flex-shrink-0">{action}</div>}
            </div>

            {/* Row 2: Search and Queue */}
            {showSearch && (
              <div className="px-4 pb-4">
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <Searchbar />
                  </div>
                  {!hideQueueButton && currentTracks.length > 0 && (
                    <div className="flex-shrink-0">
                      <QueueButton onClick={() => setMobileQueueOpen(true)} />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Tablet Layout - New Stacked Design for 768px to 1024px */}
          <div className="hidden md:block lg:hidden">
            <div className="px-6 py-4">
              {/* Title Row - Centered */}
              <div className="text-center mb-4">
                <h1 className="text-2xl font-bold text-white">{title}</h1>
              </div>

              {/* Search and Action Row */}
              <div className="flex items-center justify-center gap-4">
                {showSearch && (
                  <div className="flex-1 max-w-md">
                    <Searchbar />
                  </div>
                )}
                {action && <div className="flex-shrink-0">{action}</div>}
              </div>
            </div>
          </div>

          {/* Desktop Layout - Original Side-by-Side (1024px+) */}
          <div className="hidden lg:block">
            <div className="pl-3 pr-6 py-4">
              <div className="flex items-center justify-between gap-6">
                {/* Left Section - Title and Subtitle */}
                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl lg:text-3xl font-bold text-white truncate">
                    {title}
                  </h1>
                  {subtitle && (
                    <p className="text-sm text-gray-400 mt-1 truncate">
                      {subtitle}
                    </p>
                  )}
                </div>

                {/* Right Section - Actions and Search */}
                <div className="flex items-center gap-6 flex-shrink-0">
                  {action && (
                    <div className="flex items-center gap-2">{action}</div>
                  )}
                  {showSearch && (
                    <div className="w-64 lg:w-80">
                      <Searchbar />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Queue Sheet */}
        <MobileQueueSheet
          isOpen={mobileQueueOpen}
          onClose={() => setMobileQueueOpen(false)}
        />
      </>
    );
  }
);

AppHeader.displayName = "AppHeader";

export default AppHeader;
