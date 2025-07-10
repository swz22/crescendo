import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { HiX, HiChevronDown, HiOutlineTrash } from "react-icons/hi";
import { BsFillPlayFill, BsFillPauseFill, BsShuffle, BsArrowRepeat, BsMusicNoteList } from "react-icons/bs";
import { MdSkipNext, MdSkipPrevious } from "react-icons/md";
import { HiOutlineClock, HiOutlineQueueList } from "react-icons/hi2";
import { CgMenuLeft } from "react-icons/cg";
import { RiDraggable } from "react-icons/ri";
import {
  removeFromContext,
  navigateInContext,
  playPause,
  playFromContext,
  toggleShuffle,
  toggleRepeat,
  switchContext,
  clearQueue,
  reorderQueue,
  reorderPlaylistTracks,
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
import ConfirmDialog from "./ConfirmDialog";

const NowPlaying = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { activeContext, currentTrack, currentIndex, isPlaying, shuffle, repeat } = useSelector(
    (state) => state.player
  );

  const tracks = useSelector(selectCurrentContextTracks);
  const contextName = useSelector(selectCurrentContextName);
  const allContexts = useSelector(selectAllContexts);
  const canModify = useSelector(selectCanModifyContext);

  const { duration, currentTime, seek } = useAudioState();
  const { handleNextSong, handlePrevSong, isNavigating } = useSongNavigation();
  const { getPreviewUrl } = usePreviewUrl();

  const [isDragging, setIsDragging] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [isRemoving, setIsRemoving] = useState({});
  const [showClearQueueDialog, setShowClearQueueDialog] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  const dismissZoneHeight = 100;
  const sheetRef = useRef(null);
  const startYRef = useRef(0);
  const scrollRef = useRef(null);

  // Mobile drag state
  const [mobileDragIndex, setMobileDragIndex] = useState(null);
  const [mobileDragOverIndex, setMobileDragOverIndex] = useState(null);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [touchStartTime, setTouchStartTime] = useState(null);

  // Interactive reordering state
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [initialTouchOffset, setInitialTouchOffset] = useState({ x: 0, y: 0 });
  const [trackPositions, setTrackPositions] = useState({});

  // Mouse drag state for tablet
  const [mouseStartTime, setMouseStartTime] = useState(null);
  const [isMouseDragging, setIsMouseDragging] = useState(false);
  const isTabletView = window.innerWidth >= 640;

  // Add touch event listeners to prevent scroll while dragging
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleTouchMoveNonPassive = (e) => {
      // Only prevent default if actively dragging
      if (mobileDragIndex !== null) {
        e.preventDefault();
      }
    };

    container.addEventListener("touchmove", handleTouchMoveNonPassive, { passive: false });

    return () => {
      container.removeEventListener("touchmove", handleTouchMoveNonPassive);
    };
  }, [mobileDragIndex]);

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      setDragY(0);
    } else {
      const timer = setTimeout(() => {
        setIsMounted(false);
        setDragY(0);
        setIsRemoving({});
        setShowContextMenu(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Auto-scroll to center current track
  useEffect(() => {
    if (currentIndex >= 0 && currentIndex < tracks.length && scrollRef.current) {
      const trackHeight = 76;
      const containerHeight = scrollRef.current.clientHeight;
      const trackTop = currentIndex * trackHeight;
      const scrollTarget = trackTop - containerHeight / 2 + trackHeight / 2;

      // Smooth scroll
      scrollRef.current.scrollTo({
        top: Math.max(0, scrollTarget),
        behavior: "smooth",
      });
    }
  }, [currentIndex, tracks.length]);

  // Initialize track positions
  useEffect(() => {
    const positions = {};
    tracks.forEach((_, index) => {
      positions[index] = index * 76;
    });
    setTrackPositions(positions);
  }, [tracks.length]);

  // Calculate dynamic positions during drag
  const getAnimatedPosition = (index) => {
    if (mobileDragIndex === null) return trackPositions[index] || 0;

    let position = index;

    if (mobileDragIndex !== null && mobileDragOverIndex !== null) {
      if (index === mobileDragIndex) {
        return null;
      }

      // Calculate shifted positions for other items
      if (mobileDragIndex < mobileDragOverIndex) {
        // Dragging down
        if (index > mobileDragIndex && index <= mobileDragOverIndex) {
          position = index - 1;
        }
      } else if (mobileDragIndex > mobileDragOverIndex) {
        // Dragging up
        if (index >= mobileDragOverIndex && index < mobileDragIndex) {
          position = index + 1;
        }
      }
    }

    return position * 76;
  };

  const handleTrackTouchStart = (e, index, track) => {
    const touch = e.touches[0];
    const element = e.currentTarget;
    const rect = element.getBoundingClientRect();

    // Store touch position relative to the element
    const offsetX = touch.clientX - rect.left;
    const offsetY = touch.clientY - rect.top;

    setInitialTouchOffset({ x: offsetX, y: offsetY });
    setTouchStartTime(Date.now());

    // Store initial touch position for move detection
    setDragOffset({ x: touch.clientX, y: touch.clientY });

    if (!canModify) return;

    const timer = setTimeout(() => {
      // Start drag on long press
      setMobileDragIndex(index);
      setMobileDragOverIndex(index);

      if (navigator.vibrate) {
        navigator.vibrate([30, 50, 30]);
      }
    }, 250);

    setLongPressTimer(timer);
  };

  const handleTrackTouchMove = (e) => {
    const touch = e.touches[0];

    if (mobileDragIndex === null) {
      // Cancel long press if moved too much
      const moveThreshold = 10;
      const deltaX = Math.abs(touch.clientX - dragOffset.x);
      const deltaY = Math.abs(touch.clientY - dragOffset.y);

      if ((deltaX > moveThreshold || deltaY > moveThreshold) && longPressTimer) {
        clearTimeout(longPressTimer);
        setLongPressTimer(null);
      }
    } else {
      setDragOffset({ x: touch.clientX, y: touch.clientY });

      const scrollTop = scrollRef.current?.scrollTop || 0;
      const containerRect = scrollRef.current?.getBoundingClientRect();

      if (containerRect) {
        const relativeY = touch.clientY - containerRect.top + scrollTop;
        const overIndex = Math.floor(relativeY / 76);
        const clampedIndex = Math.max(0, Math.min(tracks.length - 1, overIndex));

        if (clampedIndex !== mobileDragOverIndex) {
          setMobileDragOverIndex(clampedIndex);
          if (navigator.vibrate) {
            navigator.vibrate(10);
          }
        }
      }

      // Auto-scroll if near edges
      if (containerRect) {
        const scrollSpeed = 5;
        if (touch.clientY < containerRect.top + 50) {
          scrollRef.current.scrollTop -= scrollSpeed;
        } else if (touch.clientY > containerRect.bottom - 50) {
          scrollRef.current.scrollTop += scrollSpeed;
        }
      }
    }
  };

  const handleTrackTouchEnd = (e, track) => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }

    const touchDuration = Date.now() - touchStartTime;
    const wasTap = touchDuration < 250 && mobileDragIndex === null;

    if (wasTap) {
      handlePlayTrack(track);
    } else if (mobileDragIndex !== null && mobileDragOverIndex !== null && mobileDragIndex !== mobileDragOverIndex) {
      if (navigator.vibrate) {
        navigator.vibrate(20);
      }

      if (activeContext === "queue") {
        dispatch(reorderQueue({ oldIndex: mobileDragIndex, newIndex: mobileDragOverIndex }));
      } else if (activeContext.startsWith("playlist_")) {
        dispatch(
          reorderPlaylistTracks({
            playlistId: activeContext,
            oldIndex: mobileDragIndex,
            newIndex: mobileDragOverIndex,
          })
        );
      }
    }
    setMobileDragIndex(null);
    setMobileDragOverIndex(null);
    setDragOffset({ x: 0, y: 0 });
    setInitialTouchOffset({ x: 0, y: 0 });
    setTouchStartTime(null);
  };
  const handleTrackMouseDown = (e, index, track) => {
    if (!isTabletView || !canModify) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    setInitialTouchOffset({ x: offsetX, y: offsetY });
    setMouseStartTime(Date.now());
    setDragOffset({ x: e.clientX, y: e.clientY });
    setIsMouseDragging(true);

    // Start drag immediately for mouse
    setMobileDragIndex(index);
    setMobileDragOverIndex(index);

    // Prevent text selection
    e.preventDefault();
  };

  const handleTrackMouseMove = (e) => {
    if (!isMouseDragging || mobileDragIndex === null) return;

    setDragOffset({ x: e.clientX, y: e.clientY });

    const scrollTop = scrollRef.current?.scrollTop || 0;
    const containerRect = scrollRef.current?.getBoundingClientRect();

    if (containerRect) {
      const relativeY = e.clientY - containerRect.top + scrollTop;
      const overIndex = Math.floor(relativeY / 76);
      const clampedIndex = Math.max(0, Math.min(tracks.length - 1, overIndex));

      if (clampedIndex !== mobileDragOverIndex) {
        setMobileDragOverIndex(clampedIndex);
      }
    }

    // Auto-scroll if near edges
    if (containerRect) {
      const scrollSpeed = 5;
      if (e.clientY < containerRect.top + 50) {
        scrollRef.current.scrollTop -= scrollSpeed;
      } else if (e.clientY > containerRect.bottom - 50) {
        scrollRef.current.scrollTop += scrollSpeed;
      }
    }
  };

  const handleTrackMouseUp = (e, track) => {
    if (!isMouseDragging) {
      const mouseDuration = Date.now() - mouseStartTime;
      if (mouseDuration < 250) {
        handlePlayTrack(track);
      }
    } else if (mobileDragIndex !== null && mobileDragOverIndex !== null && mobileDragIndex !== mobileDragOverIndex) {
      if (activeContext === "queue") {
        dispatch(reorderQueue({ oldIndex: mobileDragIndex, newIndex: mobileDragOverIndex }));
      } else if (activeContext.startsWith("playlist_")) {
        dispatch(
          reorderPlaylistTracks({
            playlistId: activeContext,
            oldIndex: mobileDragIndex,
            newIndex: mobileDragOverIndex,
          })
        );
      }
    }

    // Reset state
    setMobileDragIndex(null);
    setMobileDragOverIndex(null);
    setDragOffset({ x: 0, y: 0 });
    setInitialTouchOffset({ x: 0, y: 0 });
    setMouseStartTime(null);
    setIsMouseDragging(false);
  };

  // Global mouse event listeners for tablet
  useEffect(() => {
    if (!isTabletView) return;

    const handleGlobalMouseMove = (e) => {
      handleTrackMouseMove(e);
    };

    const handleGlobalMouseUp = (e) => {
      if (isMouseDragging) {
        handleTrackMouseUp(e, null);
      }
    };

    if (isMouseDragging) {
      document.addEventListener("mousemove", handleGlobalMouseMove);
      document.addEventListener("mouseup", handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isMouseDragging, mobileDragIndex, mobileDragOverIndex, isTabletView]);

  const handlePlayTrack = async (track) => {
    const trackWithPreview = await getPreviewUrl(track);
    if (trackWithPreview?.preview_url) {
      const trackIndex = tracks.findIndex(
        (t) => (t.key || t.id || t.track_id) === (track.key || track.id || track.track_id)
      );
      dispatch(
        playFromContext({
          contextType: activeContext,
          trackIndex: trackIndex >= 0 ? trackIndex : 0,
          trackWithPreview,
        })
      );
    }
  };

  const handleTouchStart = (e) => {
    const touchY = e.touches[0].clientY;

    if (touchY < dismissZoneHeight) {
      setIsDragging(true);
      startYRef.current = touchY;
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const deltaY = e.touches[0].clientY - startYRef.current;
    setDragY(Math.max(0, deltaY));
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (dragY > 150) {
      onClose();
    } else {
      setDragY(0);
    }
  };

  const handlePlayPause = () => {
    dispatch(playPause(!isPlaying));
  };

  const handleRemoveTrack = (index, e) => {
    e.stopPropagation();
    const trackId = tracks[index]?.key || tracks[index]?.id;
    if (!trackId) return;

    setIsRemoving({ [trackId]: true });

    setTimeout(() => {
      dispatch(removeFromContext({ trackId, contextType: activeContext }));
      setIsRemoving({ [trackId]: false });
    }, 300);
  };

  const handleContextSwitch = (contextId) => {
    dispatch(switchContext({ contextType: contextId }));
    setShowContextMenu(false);
  };

  const handleClearQueue = () => {
    dispatch(clearQueue());
    setShowClearQueueDialog(false);
  };

  const getContextIcon = (icon) => {
    switch (icon) {
      case "queue":
        return <HiOutlineQueueList className="w-3.5 h-3.5 text-white/70" />;
      case "clock":
        return <HiOutlineClock className="w-3.5 h-3.5 text-white/70" />;
      default:
        return <BsMusicNoteList className="w-3.5 h-3.5 text-white/70" />;
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const seekToPosition = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    seek(newTime);
  };

  if (!isMounted && !isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
        style={{
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 0.4s ease-out",
        }}
        onClick={onClose}
      />

      {/* Full Screen Sheet */}
      <div
        ref={sheetRef}
        className="fixed inset-0 z-[70] bg-gradient-to-b from-[#1e1b4b] via-[#2d2467]/95 to-[#0f172a] will-change-transform"
        style={{
          transform: `translateY(${isOpen && isMounted ? dragY : window.innerHeight || 1000}px)`,
          transition: isDragging ? "none" : "transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          touchAction: "pan-x pan-down",
        }}
      >
        {/* Glass overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-32 bg-[#14b8a6] rounded-full filter blur-3xl" />
          <div className="absolute bottom-40 right-10 w-40 h-40 bg-[#0891b2] rounded-full filter blur-3xl" />
        </div>

        {/* Header */}
        <div
          className="relative z-10"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ touchAction: "pan-y" }}
        >
          {/* Safe area padding and Drag Handle */}
          <div className="pt-6 pb-4">
            <div className="flex items-center justify-center">
              <div className="w-12 h-1 bg-white/50 rounded-full shadow-lg" />
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
                  {getContextIcon(allContexts.find((c) => c.id === activeContext)?.icon)}
                </div>
                <span className="font-semibold text-white">{contextName}</span>
                <span className="text-xs text-white/50 font-medium">({tracks.length})</span>
                <HiChevronDown
                  className={`w-3 h-3 text-white/50 transition-transform duration-200 ${
                    showContextMenu ? "rotate-180" : ""
                  }`}
                />
              </button>

              <div className="flex items-center gap-2">
                {activeContext === "queue" && tracks.length > 0 && (
                  <button
                    onClick={() => setShowClearQueueDialog(true)}
                    className="flex items-center gap-2 px-3.5 py-2 bg-white/[0.08] backdrop-blur-xl hover:bg-white/[0.12] rounded-full transition-all border border-white/10 shadow-lg shadow-black/20"
                  >
                    <HiOutlineTrash className="w-4 h-4 text-white/70" />
                    <span className="text-sm font-medium text-white">Clear All</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="hidden sm:flex p-2.5 bg-white/[0.08] backdrop-blur-xl hover:bg-white/[0.12] rounded-full transition-all border border-white/10 shadow-lg shadow-black/20"
                >
                  <HiX className="w-5 h-5 text-white/70" />
                </button>
              </div>
            </div>

            {/* Context Menu Dropdown */}
            {showContextMenu && (
              <div className="absolute left-4 right-4 mt-2 bg-gradient-to-b from-[#2d2467]/98 to-[#1e1b4b]/98 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden z-20 animate-slideInDown">
                {allContexts.map((context) => (
                  <button
                    key={context.id}
                    onClick={() => handleContextSwitch(context.id)}
                    className={`w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/10 transition-all ${
                      context.id === activeContext ? "bg-white/10" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-white/10 rounded-full">{getContextIcon(context.icon)}</div>
                      <span className="font-medium text-white text-sm">{context.name}</span>
                    </div>
                    <span className="text-xs text-white/50">({context.trackCount})</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Current Track */}
        {currentTrack && (
          <div className="px-4 pb-6">
            <div className="bg-gradient-to-r from-white/[0.08] to-white/[0.05] backdrop-blur-xl rounded-2xl p-4 border border-white/10 shadow-xl">
              <div className="flex items-center gap-4">
                <img
                  src={currentTrack.images?.coverart || currentTrack.album?.images?.[0]?.url}
                  alt={currentTrack.title}
                  className="w-16 h-16 rounded-xl shadow-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-lg truncate">{currentTrack.title}</p>
                  <p className="text-white/60 text-sm truncate">{currentTrack.subtitle}</p>
                </div>
              </div>

              {/* Seek Bar */}
              <div className="mt-3 relative">
                <div className="flex justify-between text-xs text-white/50 mb-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden cursor-pointer" onClick={seekToPosition}>
                  <div
                    className="h-full bg-gradient-to-r from-[#14b8a6] to-[#0891b2] rounded-full transition-all duration-300"
                    style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-center gap-3 mt-4">
                <button
                  onClick={() => dispatch(toggleRepeat())}
                  className={`p-2 rounded-lg transition-all ${
                    repeat ? "text-[#14b8a6]" : "text-white/40 hover:text-white/60"
                  }`}
                >
                  <BsArrowRepeat className="w-5 h-5" />
                </button>
                <button
                  onClick={handlePrevSong}
                  disabled={isNavigating}
                  className="p-2 text-white/70 hover:text-white transition-all hover:scale-110 active:scale-95 disabled:opacity-50"
                >
                  <MdSkipPrevious className="w-7 h-7" />
                </button>
                <button
                  onClick={handlePlayPause}
                  className="p-3.5 bg-gradient-to-r from-[#14b8a6] to-[#0891b2] rounded-full text-white shadow-xl shadow-[#14b8a6]/30 hover:shadow-[#14b8a6]/50 transition-all hover:scale-110 active:scale-95"
                >
                  {isPlaying ? <BsFillPauseFill className="w-7 h-7" /> : <BsFillPlayFill className="w-7 h-7" />}
                </button>
                <button
                  onClick={handleNextSong}
                  disabled={isNavigating}
                  className="p-2 text-white/70 hover:text-white transition-all hover:scale-110 active:scale-95 disabled:opacity-50"
                >
                  <MdSkipNext className="w-7 h-7" />
                </button>
                <button
                  onClick={() => dispatch(toggleShuffle())}
                  className={`p-2 rounded-lg transition-all ${
                    shuffle ? "text-[#14b8a6]" : "text-white/40 hover:text-white/60"
                  }`}
                >
                  <BsShuffle className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Track List */}
        <div className="flex-1 overflow-hidden px-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">{activeContext === "queue" ? "Up Next" : "Tracks"}</h3>
            <span className="text-sm text-white/50">{tracks.length} tracks</span>
          </div>

          {tracks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <CgMenuLeft className="w-16 h-16 text-white/20 mb-4" />
              <p className="text-white/50 text-center">No tracks in {contextName.toLowerCase()}</p>
            </div>
          ) : (
            <div
              ref={scrollRef}
              className="overflow-y-auto h-[calc(100vh-360px)] custom-scrollbar"
              style={{ touchAction: mobileDragIndex !== null ? "none" : "auto" }}
            >
              <div className="relative" style={{ height: tracks.length * 76 }}>
                {tracks.map((track, index) => {
                  if (!track) return null;

                  const isActive = currentIndex === index;
                  const trackId = track.key || track.id || track.track_id;
                  const isBeingRemoved = isRemoving[trackId];
                  const animatedPosition = getAnimatedPosition(index);
                  const isDraggedItem = mobileDragIndex === index;

                  // Calculate dragged item position
                  let draggedTransform = "";
                  if (isDraggedItem && dragOffset.x && dragOffset.y) {
                    const scrollTop = scrollRef.current?.scrollTop || 0;
                    const containerRect = scrollRef.current?.getBoundingClientRect() || { top: 0 };
                    const dragY = dragOffset.y - containerRect.top - initialTouchOffset.y + scrollTop;
                    draggedTransform = `translate3d(0, ${dragY}px, 0) scale(1.05)`;
                  }

                  return (
                    <div
                      key={trackId || `track-${index}`}
                      data-track-index={index}
                      onTouchStart={(e) => handleTrackTouchStart(e, index, track)}
                      onTouchMove={handleTrackTouchMove}
                      onTouchEnd={(e) => handleTrackTouchEnd(e, track)}
                      onTouchCancel={(e) => handleTrackTouchEnd(e, track)}
                      onMouseDown={(e) => handleTrackMouseDown(e, index, track)}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        transform: isDraggedItem ? draggedTransform : `translate3d(0, ${animatedPosition}px, 0)`,
                        zIndex: isDraggedItem ? 1000 : 1,
                        opacity: isBeingRemoved ? 0 : isDraggedItem ? 0.9 : 1,
                        transition: isDraggedItem
                          ? "none"
                          : "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease",
                        touchAction: isDraggedItem ? "none" : "auto",
                        cursor: canModify && isTabletView ? (isDraggedItem ? "grabbing" : "grab") : "pointer",
                      }}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl h-[60px] ${
                        isActive
                          ? "bg-gradient-to-r from-[#14b8a6]/30 via-[#14b8a6]/20 to-transparent"
                          : isDraggedItem
                          ? "bg-[#2d2467] shadow-2xl shadow-black/50"
                          : "bg-white/[0.03] hover:bg-white/[0.08]"
                      }`}
                    >
                      {/* Drag Handle */}
                      {canModify && (
                        <div className="text-white/30">
                          <RiDraggable className="w-5 h-5" />
                        </div>
                      )}

                      {/* Track Number */}
                      <div className="w-8 text-center">
                        <span className={`text-sm font-medium ${isActive ? "text-[#14b8a6]" : "text-white/50"}`}>
                          {index + 1}
                        </span>
                      </div>

                      {/* Album Art */}
                      <img
                        src={track.images?.coverart || track.album?.images?.[0]?.url}
                        alt={track.title}
                        className="w-12 h-12 rounded-lg object-cover shadow-md"
                      />

                      {/* Track Info */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-medium truncate select-none ${
                            isActive ? "text-[#14b8a6] drop-shadow-sm" : "text-white/90"
                          }`}
                        >
                          {track.title}
                        </p>
                        <p
                          className={`text-sm truncate select-none ${isActive ? "text-[#14b8a6]/70" : "text-white/60"}`}
                        >
                          {track.subtitle}
                        </p>
                      </div>

                      {/* Remove Button */}
                      {canModify && !isDraggedItem && (
                        <button
                          onClick={(e) => handleRemoveTrack(index, e)}
                          className="p-2 rounded-full hover:bg-white/10 transition-all"
                        >
                          <HiX className="w-5 h-5 text-white/40 hover:text-white/60" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={showClearQueueDialog}
        onClose={() => setShowClearQueueDialog(false)}
        onConfirm={handleClearQueue}
        title="Clear entire queue?"
        message="This will remove all tracks from your queue. You'll need to add songs again to continue playing."
        confirmText="Clear Queue"
        cancelText="Cancel"
        variant="warning"
        icon={HiOutlineQueueList}
        details={[
          `${tracks.length} tracks will be removed`,
          "Currently playing track will stop",
          "This action cannot be undone",
        ]}
      />
    </>
  );
};

export default NowPlaying;
