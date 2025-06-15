import React, { useState } from "react";
import { useSelector } from "react-redux";
import { selectCurrentContextTracks } from "../redux/features/playerSelectors";
import { HiOutlineViewList, HiX } from "react-icons/hi";

const FloatingQueueButton = ({ onClick }) => {
  const { isPlaying } = useSelector((state) => state.player);
  const currentTracks = useSelector(selectCurrentContextTracks);
  const [isExpanded, setIsExpanded] = useState(false);

  if (currentTracks.length === 0) return null;

  return (
    <div className="fixed bottom-32 right-4 z-40 flex flex-col-reverse items-end gap-3 hidden sm:flex">
      {/* Queue Button - Shows when expanded */}
      <button
        onClick={() => {
          onClick();
          setIsExpanded(false);
        }}
        className={`flex items-center gap-2 bg-[#1e1b4b]/95 backdrop-blur-lg text-white rounded-full shadow-lg transition-all duration-300 border border-white/20 ${
          isExpanded
            ? "translate-y-0 opacity-100 px-4 py-3"
            : "translate-y-20 opacity-0 pointer-events-none"
        }`}
      >
        <HiOutlineViewList className="w-5 h-5" />
        <span className="text-sm font-medium">
          Queue ({currentTracks.length})
        </span>
      </button>

      {/* Main FAB */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-14 h-14 bg-gradient-to-r from-[#14b8a6] to-[#0891b2] text-white rounded-full shadow-lg transition-all duration-300 flex items-center justify-center hover:shadow-xl active:scale-95 ${
          isExpanded ? "rotate-45" : ""
        }`}
      >
        {isExpanded ? (
          <HiX className="w-6 h-6" />
        ) : (
          <div className="relative">
            <HiOutlineViewList className="w-6 h-6" />
            <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {currentTracks.length}
            </span>
            {isPlaying && (
              <span className="absolute -bottom-1 -left-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            )}
          </div>
        )}
      </button>
    </div>
  );
};

export default FloatingQueueButton;
