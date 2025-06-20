import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  playPause,
  playFromContext,
  playTrack,
  toggleShuffle,
  toggleRepeat,
  removeFromContext,
  clearQueue,
  setVolume as setVolumeAction,
} from "../redux/features/playerSlice";
import {
  selectCurrentContextTracks,
  selectCurrentContextName,
  selectCanModifyContext,
} from "../redux/features/playerSelectors";
import { usePreviewUrl } from "../hooks/usePreviewUrl";
import { useSongNavigation } from "../hooks/useSongNavigation";
import { useAudioState } from "../hooks/useAudioState";
import PlaylistDropdown from "./PlaylistDropdown";
import PlaylistManager from "./PlaylistManager";
import { showOnboardingModal } from "./OnboardingModal";
import {
  BsFillPlayFill,
  BsFillPauseFill,
  BsShuffle,
  BsArrowRepeat,
  BsFillSkipEndFill,
  BsFillSkipStartFill,
  BsVolumeDown,
  BsVolumeMute,
  BsVolumeUp,
} from "react-icons/bs";
import { HiOutlineLightBulb } from "react-icons/hi";
import { HiOutlineQueueList } from "react-icons/hi2";

const SidebarPlayer = () => {
  const dispatch = useDispatch();
  const {
    currentTrack,
    currentIndex,
    isPlaying,
    activeContext,
    shuffle,
    repeat,
  } = useSelector((state) => state.player);

  const volume = useSelector((state) => state.player.volume);
  const tracks = useSelector(selectCurrentContextTracks);
  const contextName = useSelector(selectCurrentContextName);
  const canModify = useSelector(selectCanModifyContext);

  const { handleNextSong, handlePrevSong, isNavigating } = useSongNavigation();
  const { getPreviewUrl, prefetchPreviewUrl, isPreviewCached } =
    usePreviewUrl();

  const [showManagePanel, setShowManagePanel] = useState(false);
  const scrollContainerRef = useRef(null);
  const activeTrackRef = useRef(null);
  const { duration, currentTime, seek } = useAudioState();

  // Auto-scroll to active track
  useEffect(() => {
    if (
      activeTrackRef.current &&
      scrollContainerRef.current &&
      currentIndex >= 0
    ) {
      requestAnimationFrame(() => {
        const container = scrollContainerRef.current;
        const activeElement = activeTrackRef.current;

        if (container && activeElement) {
          const containerRect = container.getBoundingClientRect();
          const activeRect = activeElement.getBoundingClientRect();

          const isAbove = activeRect.top < containerRect.top;
          const isBelow = activeRect.bottom > containerRect.bottom;

          if (isAbove || isBelow) {
            const scrollTop =
              activeElement.offsetTop -
              container.offsetTop -
              container.clientHeight / 2 +
              activeElement.clientHeight / 2;

            container.scrollTo({
              top: scrollTop,
              behavior: "smooth",
            });
          }
        }
      });
    }
  }, [currentIndex, activeContext]);

  // Prefetch next tracks
  useEffect(() => {
    if (tracks.length > 0 && currentIndex >= 0) {
      const prefetchNext = async () => {
        const nextTracks = tracks.slice(currentIndex + 1, currentIndex + 4);

        for (let i = 0; i < nextTracks.length; i++) {
          const track = nextTracks[i];
          if (track && !isPreviewCached(track)) {
            setTimeout(() => {
              prefetchPreviewUrl(track, { priority: i === 0 ? "high" : "low" });
            }, i * 1000);
          }
        }
      };

      prefetchNext();
    }
  }, [currentIndex, tracks, prefetchPreviewUrl, isPreviewCached]);

  const handlePlayClick = async (track, index) => {
    if (!track) return;

    try {
      const songWithPreview = await getPreviewUrl(track);
      if (songWithPreview?.preview_url) {
        // If we're in recently played, use special handling
        if (activeContext === "recently_played") {
          dispatch(
            playTrack({
              track: songWithPreview,
              fromContext: "recently_played",
            })
          );
        } else {
          // Pass the track with preview URL to playFromContext
          dispatch(
            playFromContext({
              contextType: activeContext,
              trackIndex: index,
              trackWithPreview: songWithPreview, // Pass the track with preview
            })
          );
        }
      } else {
        console.warn("No preview URL available for track:", track.title);
      }
    } catch (error) {
      console.error("Error getting preview URL:", error);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const placeholderImage =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNGE1NTY4Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2EwYWVjMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==";

  return (
    <div className="w-full h-full bg-gradient-to-b from-[#0f0e2e]/95 to-[#1a1848]/95 backdrop-blur-xl border-l border-white/5 hidden lg:flex lg:flex-col">
      {/* Header with context info */}
      <div className="p-6 border-b border-white/5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <PlaylistDropdown onManageClick={() => setShowManagePanel(true)} />
          <button
            onClick={() => showOnboardingModal()}
            className="p-2 bg-white/10 hover:bg-amber-400/20 rounded-lg transition-all duration-200 group"
          >
            <HiOutlineLightBulb className="w-5 h-5 text-white/50 group-hover:text-amber-400 transition-colors" />
          </button>
        </div>

        {/* Now Playing Section */}
        {currentTrack?.title ? (
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="relative w-20 h-20">
                <img
                  src={currentTrack?.images?.coverart || placeholderImage}
                  alt={currentTrack?.title || "Unknown"}
                  className={`w-full h-full rounded-lg shadow-lg object-cover transition-all duration-300 ${
                    isNavigating ? "scale-95 opacity-60" : ""
                  }`}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = placeholderImage;
                  }}
                />

                {/* 4-Dot Loading Animation */}
                {isNavigating && (
                  <>
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-lg" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative w-12 h-12">
                        {/* Orbiting container */}
                        <div
                          className="absolute inset-0 animate-spin"
                          style={{ animationDuration: "0.9s" }}
                        >
                          {/* Pink dot */}
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2">
                            <div className="w-full h-full bg-pink-500 rounded-full shadow-[0_0_6px_rgba(236,72,153,0.8)]" />
                          </div>
                          {/* Purple dot */}
                          <div className="absolute top-1/2 right-0 -translate-y-1/2 w-2 h-2">
                            <div className="w-full h-full bg-purple-500 rounded-full shadow-[0_0_6px_rgba(139,92,246,0.8)]" />
                          </div>
                          {/* Blue dot */}
                          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2">
                            <div className="w-full h-full bg-blue-500 rounded-full shadow-[0_0_6px_rgba(59,130,246,0.8)]" />
                          </div>
                          {/* Teal dot */}
                          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-2 h-2">
                            <div className="w-full h-full bg-[#14b8a6] rounded-full shadow-[0_0_6px_rgba(20,184,166,0.8)]" />
                          </div>
                        </div>

                        {/* Center pulse */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-white/80 rounded-full animate-pulse" />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-white font-semibold truncate">
                  {currentTrack?.title || "Unknown Title"}
                </h4>
                <p className="text-white/60 text-sm truncate">
                  {currentTrack?.subtitle || "Unknown Artist"}
                </p>

                {isPlaying && (
                  <div className="flex items-end gap-1 mt-2 h-6">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-gradient-to-t from-[#14b8a6] to-[#0d9488] rounded-full animate-pulse"
                        style={{
                          height: `${60 + (i % 3) * 20}%`,
                          animationDelay: `${i * 150}ms`,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Playback controls */}
            <div className="mt-4 flex items-center justify-center gap-4">
              <button
                onClick={() => dispatch(toggleRepeat())}
                className={`p-2 rounded-full transition-all ${
                  repeat
                    ? "text-[#14b8a6] bg-white/10"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <BsArrowRepeat size={18} />
              </button>

              <button
                onClick={handlePrevSong}
                className="p-2 text-white hover:bg-white/10 rounded-full transition-all hover:scale-110"
                disabled={tracks.length === 0}
              >
                <BsFillSkipStartFill size={20} />
              </button>

              <button
                onClick={() => dispatch(playPause(!isPlaying))}
                className="p-3 bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-full transition-all hover:scale-110 shadow-lg shadow-[#14b8a6]/25"
              >
                {isPlaying ? (
                  <BsFillPauseFill size={24} />
                ) : (
                  <BsFillPlayFill size={24} className="translate-x-0.5" />
                )}
              </button>

              <button
                onClick={handleNextSong}
                className="p-2 text-white hover:bg-white/10 rounded-full transition-all hover:scale-110"
                disabled={tracks.length === 0}
              >
                <BsFillSkipEndFill size={20} />
              </button>

              <button
                onClick={() => dispatch(toggleShuffle())}
                className={`p-2 rounded-full transition-all ${
                  shuffle
                    ? "text-[#14b8a6] bg-white/10"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <BsShuffle size={18} />
              </button>
            </div>

            {/* Seek bar */}
            <div className="mt-4 px-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/50 w-8">
                  {formatTime(currentTime || 0)}
                </span>
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime || 0}
                  onChange={(e) => seek(parseFloat(e.target.value))}
                  className="flex-1 h-1 bg-white/20 rounded-full appearance-none cursor-pointer 
                           [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 
                           [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[#14b8a6] 
                           [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer 
                           hover:[&::-webkit-slider-thumb]:bg-[#0d9488] [&::-webkit-slider-thumb]:transition-all"
                  style={{
                    background: `linear-gradient(to right, #14b8a6 0%, #14b8a6 ${
                      duration > 0 ? (currentTime / duration) * 100 : 0
                    }%, rgba(255,255,255,0.2) ${
                      duration > 0 ? (currentTime / duration) * 100 : 0
                    }%, rgba(255,255,255,0.2) 100%)`,
                  }}
                />
                <span className="text-xs text-white/50 w-8 text-right">
                  {formatTime(duration || 0)}
                </span>
              </div>
            </div>

            {/* Volume control */}
            <div className="mt-3 px-2">
              <div className="flex items-center gap-2">
                <button
                  className="text-white/60 hover:text-white transition-colors w-8 flex justify-start pl-0.5"
                  onClick={() =>
                    dispatch(setVolumeAction(volume === 0 ? 0.7 : 0))
                  }
                >
                  {volume === 0 ? (
                    <BsVolumeMute size={20} />
                  ) : volume < 0.5 ? (
                    <BsVolumeDown size={20} />
                  ) : (
                    <BsVolumeUp size={20} />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) =>
                    dispatch(setVolumeAction(parseFloat(e.target.value)))
                  }
                  className="flex-1 h-1 bg-white/20 rounded-full appearance-none cursor-pointer 
                           [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 
                           [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[#14b8a6] 
                           [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer 
                           hover:[&::-webkit-slider-thumb]:bg-[#0d9488] [&::-webkit-slider-thumb]:transition-all"
                  style={{
                    background: `linear-gradient(to right, #14b8a6 0%, #14b8a6 ${
                      volume * 100
                    }%, rgba(255,255,255,0.2) ${
                      volume * 100
                    }%, rgba(255,255,255,0.2) 100%)`,
                  }}
                />
                <span className="text-xs text-white/50 w-8 text-right">
                  {Math.round(volume * 100)}%
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-xl p-8 border border-white/10 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-[#14b8a6]/20 to-[#0d9488]/10 rounded-lg flex items-center justify-center group hover:scale-110 transition-transform cursor-pointer">
              <BsFillPlayFill
                size={32}
                className="text-[#14b8a6] group-hover:text-[#0d9488] transition-colors"
              />
            </div>
            <p className="text-white font-medium mb-2">Ready to play</p>
            <p className="text-white/60 text-sm">
              Click any song to start your queue
            </p>
          </div>
        )}
      </div>

      {/* Track List */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="px-6 py-4 flex items-center justify-between border-b border-white/5 bg-black/20">
          <h4 className="text-white/90 font-medium text-base flex items-center gap-2.5">
            <div className="w-5 h-5 flex items-center justify-center">
              <div className="w-[3px] h-[3px] bg-[#14b8a6] rounded-full animate-pulse" />
              <div className="w-[3px] h-[14px] bg-[#14b8a6] rounded-full mx-[2px]" />
              <div className="w-[3px] h-[10px] bg-[#14b8a6] rounded-full" />
              <div className="w-[3px] h-[18px] bg-[#14b8a6] rounded-full mx-[2px]" />
              <div className="w-[3px] h-[8px] bg-[#14b8a6] rounded-full" />
            </div>
            {contextName}
          </h4>
          <div className="flex items-center gap-3">
            <span className="text-white/40 text-sm tabular-nums">
              {tracks.length} tracks
            </span>
            {activeContext === "queue" && tracks.length > 0 && (
              <>
                <div className="w-px h-4 bg-white/10" />
                <button
                  onClick={() => {
                    if (confirm("Clear entire queue?")) {
                      dispatch(clearQueue());
                    }
                  }}
                  className="text-white/40 hover:text-red-400 text-sm font-medium transition-all duration-200 px-3 py-1 rounded-lg bg-white/10 hover:bg-red-400/20"
                >
                  Clear All
                </button>
              </>
            )}
          </div>
        </div>

        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto custom-scrollbar px-3 py-2"
        >
          {tracks.length > 0 ? (
            <>
              <div className="space-y-1">
                {tracks.map((track, index) => {
                  if (!track) return null;

                  const isActive = currentIndex === index;
                  const isCurrentSong =
                    currentTrack?.key === track.key ||
                    currentTrack?.id === track.id ||
                    (currentTrack?.title === track.title &&
                      currentTrack?.subtitle === track.subtitle);

                  const trackId = track.key || track.id || track.track_id;

                  return (
                    <div
                      key={trackId || `track-${index}`}
                      ref={isActive ? activeTrackRef : null}
                      className={`group flex items-center gap-3 p-4 rounded-xl transition-all duration-200 cursor-pointer relative overflow-hidden ${
                        isActive
                          ? "bg-gradient-to-r from-[#14b8a6]/30 via-[#14b8a6]/20 to-transparent border-l-4 border-[#14b8a6] shadow-lg shadow-[#14b8a6]/10"
                          : "hover:bg-white/10 hover:pl-5 border-l-4 border-transparent"
                      }`}
                      onMouseEnter={() => {
                        if (!isPreviewCached(track)) {
                          prefetchPreviewUrl(track, { priority: "high" });
                        }
                      }}
                    >
                      <span
                        className={`text-sm w-8 text-center flex-shrink-0 font-medium ${
                          isCurrentSong
                            ? "text-[#14b8a6]"
                            : "text-gray-500 group-hover:text-gray-300"
                        }`}
                      >
                        {isCurrentSong && isPlaying ? (
                          <div className="flex justify-center gap-[2px]">
                            {[...Array(3)].map((_, i) => (
                              <div
                                key={i}
                                className="w-[2px] h-3 bg-[#14b8a6] rounded-full animate-pulse"
                                style={{ animationDelay: `${i * 75}ms` }}
                              />
                            ))}
                          </div>
                        ) : (
                          index + 1
                        )}
                      </span>

                      <div
                        className="relative w-12 h-12 flex-shrink-0 group/art"
                        onClick={() => handlePlayClick(track, index)}
                      >
                        <img
                          src={track.images?.coverart || placeholderImage}
                          alt={track.title || "Unknown"}
                          className={`w-full h-full rounded-lg object-cover shadow-lg transition-all duration-300 ${
                            isCurrentSong
                              ? "ring-2 ring-[#14b8a6] ring-offset-2 ring-offset-[#0f0e2e]"
                              : ""
                          }`}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = placeholderImage;
                          }}
                        />
                        <div className="absolute inset-0 bg-black/60 rounded-lg opacity-0 group-hover/art:opacity-100 transition-opacity flex items-center justify-center">
                          {isCurrentSong && isPlaying ? (
                            <BsFillPauseFill className="text-white w-5 h-5" />
                          ) : (
                            <BsFillPlayFill className="text-white w-5 h-5" />
                          )}
                        </div>
                      </div>

                      <div
                        className="flex-1 min-w-0"
                        onClick={() => handlePlayClick(track, index)}
                      >
                        <p
                          className={`font-medium truncate transition-colors ${
                            isActive
                              ? "text-[#14b8a6]"
                              : "text-white group-hover:text-[#14b8a6]"
                          }`}
                        >
                          {track.title || "Unknown Title"}
                        </p>
                        <p className="text-gray-400 text-sm truncate group-hover:text-gray-300 transition-colors">
                          {track.subtitle || "Unknown Artist"}
                        </p>
                      </div>

                      <span className="text-gray-400 text-sm font-medium bg-black/20 px-2.5 py-1 rounded-lg group-hover:bg-black/30 transition-all">
                        {formatTime((track.duration_ms || 0) / 1000)}
                      </span>

                      {canModify && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            dispatch(removeFromContext({ trackIndex: index }));
                          }}
                          className="opacity-70 hover:opacity-100 transition-all duration-200 p-1.5 bg-white/10 hover:bg-red-500/20 rounded-lg group/remove"
                        >
                          <svg
                            className="w-4 h-4 text-gray-400 group-hover/remove:text-red-400 transition-colors"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      )}
                      {isCurrentSong && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#14b8a6] animate-pulse" />
                      )}
                    </div>
                  );
                })}
              </div>
              {activeContext === "queue" && tracks.length > 0 && (
                <div className="mt-6 mx-3">
                  <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-4" />
                  <div className="flex items-center justify-center gap-8 text-center">
                    <div>
                      <div className="text-2xl font-light text-white/90">
                        {tracks.length}
                      </div>
                      <div className="text-[10px] uppercase tracking-[0.2em] text-white/30 mt-1">
                        tracks
                      </div>
                    </div>
                    <div className="h-8 w-px bg-white/10" />
                    <div>
                      <div className="text-2xl font-light text-white/90">
                        {Math.floor(
                          tracks.reduce(
                            (acc, t) => acc + (t?.duration_ms || 0),
                            0
                          ) / 60000
                        )}
                      </div>
                      <div className="text-[10px] uppercase tracking-[0.2em] text-white/30 mt-1">
                        minutes
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center px-6">
              <div className="w-24 h-24 mb-6 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#14b8a6]/20 to-[#0d9488]/10 rounded-full animate-pulse"></div>
                <div className="absolute inset-2 bg-gradient-to-br from-[#14b8a6]/30 to-[#0d9488]/20 rounded-full animate-pulse animation-delay-200"></div>
                <div className="absolute inset-4 bg-gradient-to-br from-[#14b8a6]/40 to-[#0d9488]/30 rounded-full flex items-center justify-center">
                  <HiOutlineQueueList size={32} className="text-[#14b8a6]" />
                </div>
              </div>
              <p className="text-white font-semibold text-lg mb-2">
                {activeContext === "queue"
                  ? "Your queue is empty"
                  : "No tracks in context"}
              </p>
              <p className="text-white/60 text-sm mb-4">
                {activeContext === "queue"
                  ? "Start playing songs to build your queue"
                  : "Switch to a different context or start playing music"}
              </p>
              <div className="flex items-center gap-2 text-white/40">
                <div className="w-1 h-1 bg-white/40 rounded-full"></div>
                <div className="w-1 h-1 bg-white/40 rounded-full"></div>
                <div className="w-1 h-1 bg-white/40 rounded-full"></div>
              </div>
            </div>
          )}
        </div>
      </div>

      <PlaylistManager
        isOpen={showManagePanel}
        onClose={() => setShowManagePanel(false)}
      />
    </div>
  );
};

export default SidebarPlayer;
