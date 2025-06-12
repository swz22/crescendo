import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { HiX, HiOutlineViewList } from "react-icons/hi";
import { BsFillPlayFill, BsFillPauseFill } from "react-icons/bs";
import {
  removeFromQueue,
  navigateSong,
  playPause,
  setActiveSong,
} from "../redux/features/playerSlice";
import { usePreviewUrl } from "../hooks/usePreviewUrl";

const MobileQueueSheet = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { queue, currentIndex, activeSong, isPlaying } = useSelector(
    (state) => state.player
  );
  const [sheetHeight, setSheetHeight] = useState(60); // Percentage
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);
  const currentYRef = useRef(0);
  const sheetRef = useRef(null);
  const { prefetchPreviewUrl, isPreviewCached } = usePreviewUrl();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleTouchStart = (e) => {
    setIsDragging(true);
    startYRef.current = e.touches[0].clientY;
    currentYRef.current = sheetHeight;
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;

    const deltaY = startYRef.current - e.touches[0].clientY;
    const windowHeight = window.innerHeight;
    const deltaPercent = (deltaY / windowHeight) * 100;
    const newHeight = Math.max(
      20,
      Math.min(90, currentYRef.current + deltaPercent)
    );

    setSheetHeight(newHeight);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);

    // Snap points
    if (sheetHeight < 40) {
      onClose();
    } else if (sheetHeight < 70) {
      setSheetHeight(60);
    } else {
      setSheetHeight(85);
    }
  };

  const handlePlayClick = (index) => {
    if (currentIndex === index) {
      dispatch(playPause(!isPlaying));
    } else {
      const song = queue[index];
      dispatch(
        setActiveSong({
          song: song,
          data: queue,
          i: index,
        })
      );
      dispatch(playPause(true));
    }
  };

  const formatDuration = (ms) => {
    if (!ms) return "--:--";
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[60] lg:hidden"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 bg-[#1e1b4b] rounded-t-3xl shadow-2xl z-[61] lg:hidden transition-transform"
        style={{
          height: `${sheetHeight}%`,
          transform: isDragging ? "none" : undefined,
          transition: isDragging ? "none" : "height 0.3s ease-out",
        }}
      >
        {/* Handle */}
        <div
          className="absolute top-0 left-0 right-0 h-12 flex items-center justify-center cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-12 h-1 bg-white/30 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between p-4 pt-8 border-b border-white/10">
          <div className="flex items-center gap-2">
            <HiOutlineViewList className="w-6 h-6 text-white" />
            <h3 className="text-lg font-semibold text-white">Queue</h3>
            <span className="text-sm text-white/60">{queue.length} tracks</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <HiX className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Queue List */}
        <div className="flex-1 overflow-y-auto">
          {queue.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8">
              <HiOutlineViewList className="w-16 h-16 text-white/20 mb-4" />
              <p className="text-white/60 text-center">
                Your queue is empty. Start playing some music!
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {queue.map((track, index) => {
                const isActive = currentIndex === index;
                const isCurrentSong = activeSong?.key === track.key;

                return (
                  <div
                    key={track.key || index}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                      isActive
                        ? "bg-[#14b8a6]/20 border border-[#14b8a6]/30"
                        : "bg-white/5 active:bg-white/10"
                    }`}
                    onTouchStart={() => {
                      if (!isPreviewCached(track)) {
                        prefetchPreviewUrl(track, { priority: "high" });
                      }
                    }}
                  >
                    {/* Play/Pause Button */}
                    <button
                      onClick={() => handlePlayClick(index)}
                      className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                    >
                      {isCurrentSong && isPlaying ? (
                        <BsFillPauseFill className="w-5 h-5 text-white" />
                      ) : (
                        <BsFillPlayFill className="w-5 h-5 text-white translate-x-0.5" />
                      )}
                    </button>

                    {/* Track Info */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-medium truncate ${
                          isActive ? "text-[#14b8a6]" : "text-white"
                        }`}
                      >
                        {track.title}
                      </p>
                      <p className="text-sm text-white/60 truncate">
                        {track.subtitle}
                      </p>
                    </div>

                    {/* Duration */}
                    <span className="text-sm text-white/60">
                      {formatDuration(track.duration_ms)}
                    </span>

                    {/* Remove Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        dispatch(removeFromQueue({ index }));
                      }}
                      className="p-2 rounded-full hover:bg-white/10 transition-colors"
                    >
                      <HiX className="w-4 h-4 text-white/60" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MobileQueueSheet;
