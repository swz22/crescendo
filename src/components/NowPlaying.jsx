import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { HiX, HiChevronDown, HiOutlineTrash } from "react-icons/hi";
import {
  BsFillPlayFill,
  BsFillPauseFill,
  BsShuffle,
  BsArrowRepeat,
  BsMusicNoteList,
} from "react-icons/bs";
import { MdSkipNext, MdSkipPrevious } from "react-icons/md";
import { HiOutlineClock, HiOutlineQueueList } from "react-icons/hi2";
import { CgMenuLeft } from "react-icons/cg";
import {
  removeFromContext,
  navigateInContext,
  playPause,
  playFromContext,
  toggleShuffle,
  toggleRepeat,
  switchContext,
  clearQueue,
} from "../redux/features/playerSlice";
import {
  selectCurrentContextTracks,
  selectCurrentContextName,
  selectAllContexts,
  selectCanModifyContext,
} from "../redux/features/playerSelectors";
import { usePreviewUrl } from "../hooks/usePreviewUrl";
import { useAudioState } from "../hooks/useAudioState";
import { useSongNavigation } from "../hooks/useSongNavigation";

const NowPlaying = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const {
    activeContext,
    currentTrack,
    currentIndex,
    isPlaying,
    shuffle,
    repeat,
  } = useSelector((state) => state.player);

  const tracks = useSelector(selectCurrentContextTracks);
  const contextName = useSelector(selectCurrentContextName);
  const allContexts = useSelector(selectAllContexts);
  const canModify = useSelector(selectCanModifyContext);

  const { duration, currentTime, seek } = useAudioState();
  const { handleNextSong, handlePrevSong, isNavigating } = useSongNavigation();

  const [isDragging, setIsDragging] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [isRemoving, setIsRemoving] = useState(null);
  const [dragY, setDragY] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  const startYRef = useRef(0);
  const sheetRef = useRef(null);
  const scrollRef = useRef(null);
  const activeTrackRef = useRef(null);

  const { prefetchPreviewUrl, isPreviewCached, getPreviewUrl } =
    usePreviewUrl();

  const placeholderImage =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNGE1NTY4Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2EwYWVjMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==";

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      document.body.style.overflow = "hidden";
      // Auto-scroll to active track after animation
      setTimeout(() => {
        if (activeTrackRef.current && scrollRef.current) {
          activeTrackRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }, 900);
    } else {
      document.body.style.overflow = "";
      // Reset mounted state after close animation
      setTimeout(() => setIsMounted(false), 800);
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, currentIndex]);

  const handleTouchStart = (e) => {
    setIsDragging(true);
    startYRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const deltaY = e.touches[0].clientY - startYRef.current;
    setDragY(Math.max(0, deltaY));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (dragY > 100) {
      onClose();
    }
    setDragY(0);
  };

  const handlePlayClick = async (index) => {
    if (currentIndex === index) {
      dispatch(playPause(!isPlaying));
    } else {
      const track = tracks[index];
      if (!track) return;

      try {
        const songWithPreview = await getPreviewUrl(track);
        if (songWithPreview?.preview_url) {
          dispatch(
            playFromContext({
              contextType: activeContext,
              trackIndex: index,
              trackWithPreview: songWithPreview,
            })
          );
          dispatch(playPause(true));
        }
      } catch (error) {
        console.error("Error getting preview URL:", error);
      }
    }
  };

  const handleRemoveTrack = async (index, e) => {
    e.stopPropagation();
    if (!canModify) return;

    setIsRemoving(index);
    await new Promise((resolve) => setTimeout(resolve, 300));
    dispatch(removeFromContext({ trackIndex: index }));
    setIsRemoving(null);
  };

  const handleContextSwitch = (contextId) => {
    dispatch(switchContext({ contextType: contextId }));
    setShowContextMenu(false);
  };

  const handleClearQueue = () => {
    if (confirm("Clear entire queue?")) {
      dispatch(clearQueue());
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getContextIcon = (iconType) => {
    switch (iconType) {
      case "queue":
        return <CgMenuLeft className="w-4 h-4" />;
      case "clock":
        return <HiOutlineClock className="w-4 h-4" />;
      default:
        return <BsMusicNoteList className="w-4 h-4" />;
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60]"
        style={{
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 0.8s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
        onClick={onClose}
      />

      {/* Full Screen Sheet */}
      <div
        ref={sheetRef}
        className="fixed inset-0 z-[70] bg-gradient-to-b from-[#1e1b4b] via-[#2d2467]/95 to-[#0f172a]"
        style={{
          transform: `translateY(${
            isOpen && isMounted ? dragY : window.innerHeight || 1000
          }px)`,
          transition: isDragging
            ? "none"
            : "transform 0.8s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        {/* Glass overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-20 left-10 w-32 h-32 bg-[#14b8a6] rounded-full filter blur-3xl animate-pulse" />
            <div className="absolute bottom-40 right-10 w-40 h-40 bg-[#0891b2] rounded-full filter blur-3xl animate-pulse animation-delay-2000" />
            <div className="absolute top-1/2 left-1/3 w-36 h-36 bg-[#7c3aed] rounded-full filter blur-3xl animate-pulse animation-delay-4000" />
          </div>
        </div>

        {/* Header */}
        <div
          className="relative z-10"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Safe area padding and Drag Handle */}
          <div className="pt-6 pb-2">
            <div className="flex items-center justify-center">
              <div className="w-10 h-0.5 bg-white/30 rounded-full" />
            </div>
          </div>

          {/* Context Bar */}
          <div className="px-4 pb-3">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowContextMenu(!showContextMenu)}
                className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-white/[0.08] to-white/[0.05] backdrop-blur-xl hover:from-white/[0.12] hover:to-white/[0.08] rounded-full transition-all border border-white/10 text-sm shadow-lg shadow-black/20"
              >
                <div className="p-1 bg-white/10 rounded-full">
                  {getContextIcon(
                    allContexts.find((c) => c.id === activeContext)?.icon
                  )}
                </div>
                <span className="font-semibold text-white">{contextName}</span>
                <span className="text-xs text-white/50 font-medium">
                  ({tracks.length})
                </span>
                <HiChevronDown
                  className={`w-3 h-3 text-white/50 transition-transform duration-200 ${
                    showContextMenu ? "rotate-180" : ""
                  }`}
                />
              </button>

              <div className="flex items-center gap-2">
                {activeContext === "queue" && tracks.length > 0 && (
                  <button
                    onClick={handleClearQueue}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-white/[0.08] to-white/[0.05] hover:from-red-500/20 hover:to-red-600/20 hover:text-red-400 backdrop-blur-xl rounded-full text-white font-medium transition-all border border-white/10 hover:border-red-500/30 text-sm shadow-lg shadow-black/20"
                  >
                    <HiOutlineTrash className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Clear All</span>
                  </button>
                )}

                {/* Close button - visible on non-mobile screens */}
                <button
                  onClick={onClose}
                  className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-white/[0.08] hover:bg-white/[0.15] transition-all border border-white/10"
                >
                  <HiX className="w-5 h-5 text-white/70 hover:text-white" />
                </button>
              </div>
            </div>
          </div>

          {/* Current Track & Controls */}
          {currentTrack && (
            <div className="px-4 pb-3 border-b border-white/10">
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={currentTrack.images?.coverart || placeholderImage}
                  alt={currentTrack.title}
                  className="w-16 h-16 rounded-xl shadow-2xl shadow-black/50 ring-2 ring-white/10"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-base text-white truncate">
                    {currentTrack.title}
                  </p>
                  <p className="text-sm text-white/60 truncate">
                    {currentTrack.subtitle}
                  </p>
                </div>
              </div>

              {/* Seek Bar */}
              <div className="mb-3">
                <div className="relative w-full h-1.5 bg-black/30 rounded-full overflow-hidden group backdrop-blur-sm">
                  <div className="absolute inset-0 bg-white/10 rounded-full" />
                  <div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#14b8a6] via-[#0891b2] to-[#14b8a6] rounded-full transition-all duration-300 shadow-lg shadow-[#14b8a6]/50"
                    style={{ width: `${progressPercent}%` }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    value={currentTime || 0}
                    onChange={(e) => seek(e.target.value)}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer"
                  />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[10px] text-white/50 tabular-nums font-medium">
                    {formatTime(currentTime)}
                  </span>
                  <span className="text-[10px] text-white/50 tabular-nums font-medium">
                    {formatTime(duration)}
                  </span>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-center gap-5">
                <button
                  onClick={() => dispatch(toggleShuffle())}
                  className={`p-1.5 rounded-full transition-all ${
                    shuffle
                      ? "bg-[#14b8a6]/20 text-[#14b8a6] shadow-lg shadow-[#14b8a6]/20"
                      : "text-white/40 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <BsShuffle size={16} />
                </button>

                <button
                  onClick={handlePrevSong}
                  disabled={isNavigating}
                  className="p-1.5 text-white hover:scale-110 transition-all disabled:opacity-50"
                >
                  <MdSkipPrevious size={24} />
                </button>

                <button
                  onClick={() => dispatch(playPause(!isPlaying))}
                  className="relative p-3 bg-gradient-to-r from-[#14b8a6] to-[#0891b2] rounded-full text-white shadow-2xl shadow-[#14b8a6]/40 hover:shadow-[#14b8a6]/60 hover:scale-105 transition-all group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#14b8a6] to-[#0891b2] rounded-full blur-lg opacity-60 group-hover:opacity-80 transition-opacity" />
                  <div className="relative">
                    {isPlaying ? (
                      <BsFillPauseFill size={20} />
                    ) : (
                      <BsFillPlayFill size={20} className="translate-x-0.5" />
                    )}
                  </div>
                </button>

                <button
                  onClick={handleNextSong}
                  disabled={isNavigating}
                  className="p-1.5 text-white hover:scale-110 transition-all disabled:opacity-50"
                >
                  <MdSkipNext size={24} />
                </button>

                <button
                  onClick={() => dispatch(toggleRepeat())}
                  className={`p-1.5 rounded-full transition-all ${
                    repeat
                      ? "bg-[#14b8a6]/20 text-[#14b8a6] shadow-lg shadow-[#14b8a6]/20"
                      : "text-white/40 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <BsArrowRepeat size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Context Menu Dropdown */}
        {showContextMenu && (
          <div
            className="absolute top-28 left-4 right-4 bg-gradient-to-b from-[#1e1b4b] to-[#1a1745] backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 overflow-hidden z-50 animate-slideInDown"
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <div className="absolute inset-0 bg-white/[0.02] pointer-events-none" />
            <div className="relative max-h-72 overflow-y-auto">
              {allContexts.map((context) => (
                <button
                  key={context.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleContextSwitch(context.id);
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleContextSwitch(context.id);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 active:bg-white/20 transition-all cursor-pointer ${
                    activeContext === context.id ? "bg-[#14b8a6]/20" : ""
                  }`}
                >
                  <div
                    className={
                      activeContext === context.id
                        ? "text-[#14b8a6]"
                        : "text-white/70"
                    }
                  >
                    {getContextIcon(context.icon)}
                  </div>
                  <span
                    className={`flex-1 text-left font-medium ${
                      activeContext === context.id
                        ? "text-[#14b8a6]"
                        : "text-white"
                    }`}
                  >
                    {context.name}
                  </span>
                  <span
                    className={`text-sm ${
                      activeContext === context.id
                        ? "text-[#14b8a6]"
                        : "text-white/50"
                    }`}
                  >
                    {context.trackCount}
                  </span>
                  {activeContext === context.id && (
                    <div className="w-2 h-2 bg-[#14b8a6] rounded-full animate-pulse" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Track List */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto pb-6 pt-1"
          style={{ maxHeight: "calc(100vh - 260px)" }}
        >
          {tracks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-white/40 px-8 py-16">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                <HiOutlineQueueList className="w-10 h-10" />
              </div>
              <p className="text-xl font-semibold mb-2 text-white/60">
                {activeContext === "queue"
                  ? "Your queue is empty"
                  : "No tracks available"}
              </p>
              <p className="text-sm text-center text-white/40 max-w-xs">
                {activeContext === "queue"
                  ? "Add songs to your queue to see them here"
                  : "Select a different playlist or album to view tracks"}
              </p>
            </div>
          ) : (
            <div className="px-4 py-1 space-y-1">
              {tracks.map((track, index) => {
                if (!track) return null;
                const isActive = currentIndex === index;

                return (
                  <div
                    key={track.key || track.id || index}
                    ref={isActive ? activeTrackRef : null}
                    onClick={() => handlePlayClick(index)}
                    className={`group relative flex items-center gap-3 p-3 rounded-xl transition-all duration-300 backdrop-blur-sm ${
                      isActive
                        ? "bg-gradient-to-r from-[#14b8a6]/20 via-[#0891b2]/10 to-[#14b8a6]/20 border border-[#14b8a6]/30 shadow-lg shadow-[#14b8a6]/20"
                        : "hover:bg-white/[0.04] active:bg-white/[0.06] border border-white/5 hover:border-white/10"
                    } ${
                      isRemoving === index ? "opacity-0 translate-x-full" : ""
                    }`}
                  >
                    {/* Track Number/Playing Indicator */}
                    <div className="w-10 flex items-center justify-center">
                      {isActive && isPlaying ? (
                        <div className="flex items-center gap-[3px]">
                          <div
                            className="w-[3px] bg-[#14b8a6] rounded-full animate-scale-y"
                            style={{
                              height: "12px",
                              animationDelay: "0s",
                            }}
                          />
                          <div
                            className="w-[3px] bg-[#14b8a6] rounded-full animate-scale-y"
                            style={{
                              height: "18px",
                              animationDelay: "0.2s",
                            }}
                          />
                          <div
                            className="w-[3px] bg-[#14b8a6] rounded-full animate-scale-y"
                            style={{
                              height: "14px",
                              animationDelay: "0.4s",
                            }}
                          />
                        </div>
                      ) : (
                        <span
                          className={`text-sm tabular-nums ${
                            isActive
                              ? "text-[#14b8a6] font-bold text-base"
                              : "text-white/40"
                          }`}
                        >
                          {index + 1}
                        </span>
                      )}
                    </div>

                    {/* Album Art */}
                    <div className="relative">
                      <img
                        src={track.images?.coverart || placeholderImage}
                        alt={track.title}
                        className={`w-12 h-12 rounded-lg object-cover ${
                          isActive
                            ? "shadow-xl shadow-black/50 ring-1 ring-[#14b8a6]/50"
                            : "shadow-md shadow-black/30"
                        }`}
                      />
                      {isActive && (
                        <div className="absolute inset-0 bg-gradient-to-br from-[#14b8a6]/20 to-transparent rounded-lg" />
                      )}
                    </div>

                    {/* Track Info */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-semibold truncate ${
                          isActive
                            ? "text-[#14b8a6] drop-shadow-sm"
                            : "text-white/90"
                        }`}
                      >
                        {track.title}
                      </p>
                      <p
                        className={`text-sm truncate ${
                          isActive ? "text-[#14b8a6]/70" : "text-white/60"
                        }`}
                      >
                        {track.subtitle}
                      </p>
                    </div>

                    {/* Remove Button */}
                    {canModify && (
                      <button
                        onClick={(e) => handleRemoveTrack(index, e)}
                        className="p-2 rounded-full opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all"
                      >
                        <HiX className="w-5 h-5 text-white/40 hover:text-white/60" />
                      </button>
                    )}
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

export default NowPlaying;
