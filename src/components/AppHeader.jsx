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
          {/* Mobile Layout */}
          <div className="sm:hidden">
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
              <div className="px-4 pb-4 flex items-center gap-2">
                <div className="flex-1">
                  <Searchbar />
                </div>
                {!hideQueueButton && currentTracks.length > 0 && (
                  <QueueButton onClick={() => setMobileQueueOpen(true)} />
                )}
              </div>
            )}
          </div>

          {/* Tablet/Desktop Layout */}
          <div className="hidden sm:block">
            <div className="px-6 py-6">
              <div className="flex items-center justify-between gap-6">
                {/* Title Section */}
                <div className="min-w-0">
                  <h1 className="text-2xl lg:text-3xl font-bold text-white truncate">
                    {title}
                  </h1>
                  {subtitle && (
                    <p className="text-sm text-gray-400 mt-1 truncate">
                      {subtitle}
                    </p>
                  )}
                </div>

                {/* Center Section - Search */}
                {showSearch && (
                  <div className="flex-1 max-w-2xl">
                    <Searchbar />
                  </div>
                )}

                {/* Right Section - Actions (NO QUEUE BUTTON ON DESKTOP) */}
                <div className="flex items-center gap-4 flex-shrink-0">
                  {action}
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
