import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { HiX, HiOutlineViewList } from "react-icons/hi";
import {
  BsFillPlayFill,
  BsFillPauseFill,
  BsShuffle,
  BsArrowRepeat,
} from "react-icons/bs";
import { MdSkipNext, MdSkipPrevious } from "react-icons/md";
import {
  removeFromQueue,
  navigateSong,
  playPause,
  setActiveSong,
  toggleShuffle,
  toggleRepeat,
} from "../redux/features/playerSlice";
import { usePreviewUrl } from "../hooks/usePreviewUrl";

const MobileQueueSheet = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { queue, currentIndex, activeSong, isPlaying, shuffle, repeat } =
    useSelector((state) => state.player);
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

  const handleNextSong = () => {
    dispatch(navigateSong({ direction: "next" }));
  };

  const handlePrevSong = () => {
    dispatch(navigateSong({ direction: "prev" }));
  };

  const formatDuration = (ms) => {
    if (!ms) return "--:--";
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const placeholderImage =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNGE1NTY4Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2EwYWVjMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==";

  if (!isOpen) return null;

  return (
    <>
      {/* Full Screen Queue Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-gradient-to-b from-[#1e1b4b] to-[#0f172a] z-[100] lg:hidden animate-slideUp">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="p-2 -ml-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <HiX className="w-6 h-6 text-white" />
              </button>
              <div>
                <h3 className="text-xl font-semibold text-white">
                  Now Playing
                </h3>
                <p className="text-sm text-white/60">
                  {queue.length} tracks in queue
                </p>
              </div>
            </div>

            {/* Shuffle/Repeat Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => dispatch(toggleShuffle())}
                className={`p-2 rounded-lg ${
                  shuffle ? "bg-[#14b8a6]/20 text-[#14b8a6]" : "text-white/60"
                }`}
              >
                <BsShuffle size={20} />
              </button>
              <button
                onClick={() => dispatch(toggleRepeat())}
                className={`p-2 rounded-lg ${
                  repeat ? "bg-[#14b8a6]/20 text-[#14b8a6]" : "text-white/60"
                }`}
              >
                <BsArrowRepeat size={20} />
              </button>
            </div>
          </div>

          {/* Current Track Showcase */}
          {activeSong && (
            <div className="p-6 pb-4">
              <div className="flex flex-col items-center">
                <img
                  src={activeSong.images?.coverart || placeholderImage}
                  alt={activeSong.title}
                  className="w-48 h-48 rounded-2xl shadow-2xl mb-6"
                />
                <h2 className="text-2xl font-bold text-white text-center mb-1">
                  {activeSong.title}
                </h2>
                <p className="text-lg text-white/60 text-center">
                  {activeSong.subtitle}
                </p>
              </div>
            </div>
          )}

          {/* Queue List */}
          <div className="flex-1 overflow-y-auto pb-24">
            {queue.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8">
                <HiOutlineViewList className="w-16 h-16 text-white/20 mb-4" />
                <p className="text-white/60 text-center">
                  Your queue is empty. Start playing some music!
                </p>
              </div>
            ) : (
              <div className="px-4 space-y-2">
                <h4 className="text-sm font-medium text-white/60 uppercase tracking-wider px-2 py-2">
                  Up Next
                </h4>
                {queue.map((track, index) => {
                  const isActive = currentIndex === index;
                  const isNext = currentIndex + 1 === index;

                  return (
                    <button
                      key={track.key || index}
                      onClick={() => handlePlayClick(index)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                        isActive
                          ? "bg-[#14b8a6]/20 scale-[1.02]"
                          : isNext
                          ? "bg-white/10"
                          : "hover:bg-white/5 active:bg-white/10"
                      }`}
                    >
                      {/* Track Number */}
                      <span
                        className={`text-sm w-6 text-center ${
                          isActive
                            ? "text-[#14b8a6] font-bold"
                            : "text-white/40"
                        }`}
                      >
                        {index + 1}
                      </span>

                      {/* Track Info */}
                      <img
                        src={track.images?.coverart || placeholderImage}
                        alt={track.title}
                        className="w-12 h-12 rounded-lg"
                      />
                      <div className="flex-1 text-left">
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

                      {/* Remove Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          dispatch(removeFromQueue({ index }));
                        }}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <HiX className="w-4 h-4 text-white/40" />
                      </button>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Mini Player at Bottom */}
          <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-xl border-t border-white/20">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3 flex-1">
                <img
                  src={activeSong?.images?.coverart || placeholderImage}
                  alt="current"
                  className="w-10 h-10 rounded-lg"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {activeSong?.title}
                  </p>
                  <p className="text-white/60 text-xs truncate">
                    {activeSong?.subtitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevSong}
                  className="p-2 text-white active:scale-95"
                >
                  <MdSkipPrevious size={24} />
                </button>

                <button
                  onClick={() => dispatch(playPause(!isPlaying))}
                  className="p-2.5 bg-[#14b8a6] rounded-full text-white shadow-lg active:scale-95"
                >
                  {isPlaying ? (
                    <BsFillPauseFill size={20} />
                  ) : (
                    <BsFillPlayFill size={20} className="translate-x-0.5" />
                  )}
                </button>

                <button
                  onClick={handleNextSong}
                  className="p-2 text-white active:scale-95"
                >
                  <MdSkipNext size={24} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileQueueSheet;
