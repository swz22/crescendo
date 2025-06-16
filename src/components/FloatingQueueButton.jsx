import React, { useState } from "react";
import { useSelector } from "react-redux";
import { selectCurrentContextTracks } from "../redux/features/playerSelectors";
import { HiOutlineViewList, HiX } from "react-icons/hi";

const FloatingQueueButton = ({ onClick }) => {
  const { isPlaying, currentTrack } = useSelector((state) => state.player);
  const currentTracks = useSelector(selectCurrentContextTracks);
  const [isExpanded, setIsExpanded] = useState(false);

  if (currentTracks.length === 0 || !currentTrack) return null;

  return (
    <div className="fixed bottom-24 right-4 z-[45] flex flex-col-reverse items-end gap-3 sm:hidden">
      {/* Main FAB */}
      <button
        onClick={() => {
          onClick();
          setIsExpanded(false);
        }}
        className="w-14 h-14 bg-gradient-to-r from-[#14b8a6] to-[#0891b2] text-white rounded-full shadow-lg transition-all duration-300 flex items-center justify-center active:scale-95 tap-target-min"
      >
        <div className="relative">
          <HiOutlineViewList className="w-6 h-6" />
          <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {currentTracks.length}
          </span>
          {isPlaying && (
            <span className="absolute -bottom-1 -left-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          )}
        </div>
      </button>
    </div>
  );
};

export default FloatingQueueButton;
