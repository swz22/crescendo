import React from "react";
import { useSelector } from "react-redux";
import { selectCurrentContextTracks } from "../redux/features/playerSelectors";
import { HiOutlineQueueList } from "react-icons/hi2";

const FloatingQueueButton = ({ onClick }) => {
  const { isPlaying, currentTrack } = useSelector((state) => state.player);
  const currentTracks = useSelector(selectCurrentContextTracks);

  if (currentTracks.length === 0 || !currentTrack) return null;

  return (
    <>
      {/* Mobile Floating Action Button */}
      <div className="fixed bottom-24 right-4 z-[35] tablet:hidden">
        <button
          onClick={onClick}
          className="w-14 h-14 bg-gradient-to-r from-[#14b8a6] to-[#0891b2] text-white rounded-full shadow-lg transition-all duration-300 flex items-center justify-center active:scale-95 hover:scale-105"
        >
          <div className="relative">
            <HiOutlineQueueList className="w-6 h-6" />
            <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {currentTracks.length > 99 ? "99+" : currentTracks.length}
            </span>
            {isPlaying && (
              <span className="absolute -bottom-1 -left-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            )}
          </div>
        </button>
      </div>

      {/* Tablet Fixed Button - positioned to avoid overlap */}
      <div className="hidden tablet:block desktop:hidden fixed bottom-32 right-6 z-[35]">
        <button
          onClick={onClick}
          className="bg-gradient-to-r from-[#14b8a6] to-[#0891b2] text-white rounded-full shadow-lg transition-all duration-300 px-4 py-3 flex items-center gap-2 hover:scale-105 active:scale-95"
        >
          <HiOutlineQueueList className="w-5 h-5" />
          <span className="font-medium">Queue</span>
          <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm font-bold">
            {currentTracks.length}
          </span>
        </button>
      </div>
    </>
  );
};

export default FloatingQueueButton;
