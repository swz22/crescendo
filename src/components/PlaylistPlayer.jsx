import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  playPause,
  setActiveSong,
  toggleShuffle,
  toggleRepeat,
  removeFromQueue,
  clearQueue,
  replaceQueue,
} from "../redux/features/playerSlice";
import { usePreviewUrl } from "../hooks/usePreviewUrl";
import { usePlaylistManager } from "../hooks/usePlaylistManager";
import PlaylistDropdown from "./PlaylistDropdown";
import PlaylistManager from "./PlaylistManager";
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
  BsMusicNoteList,
  BsPlayCircle,
  BsSearch,
  BsCollection,
} from "react-icons/bs";
import { HiOutlineQueueList, HiOutlineSparkles } from "react-icons/hi2";
import { useSongNavigation } from "../hooks/useSongNavigation";
// import { useToast } from "../context/ToastContext";

const PlaylistPlayer = ({ playlist, tracks }) => {
  const dispatch = useDispatch();
  const { activeSong, isPlaying, currentIndex, shuffle, repeat, currentSongs } =
    useSelector((state) => state.player);
  const { handleNextSong, handlePrevSong } = useSongNavigation();
  const { getPreviewUrl, prefetchPreviewUrl, isPreviewCached } =
    usePreviewUrl();
  const { currentPlaylist } = usePlaylistManager();
  const [volume, setVolume] = useState(0.7);
  const [isVolumeHovered, setIsVolumeHovered] = useState(false);
  const [personalQueue, setPersonalQueue] = useState([]);
  const [showManagePanel, setShowManagePanel] = useState(false);
  const scrollContainerRef = useRef(null);
  const activeTrackRef = useRef(null);

  // Check if we're on a playlist page
  const isPlaylistPage = window.location.pathname === "/playlists";

  // Use current playlist from Redux
  useEffect(() => {
    if (currentPlaylist && currentPlaylist.tracks) {
      setPersonalQueue(currentPlaylist.tracks);
    }
  }, [currentPlaylist]);

  // Handle different queue sources
  useEffect(() => {
    if (isPlaylistPage && tracks && tracks.length > 0) {
      // On playlist page, use playlist tracks
      setPersonalQueue(tracks);
    } else if (currentSongs && currentSongs.length > 0 && !isPlaylistPage) {
      // On other pages, build personal queue from played songs
      setPersonalQueue(currentSongs);
    }
  }, [tracks, currentSongs, isPlaylistPage]);

  // Auto-scroll to active track
  useEffect(() => {
    if (activeTrackRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const activeElement = activeTrackRef.current;

      // Get positions
      const containerRect = container.getBoundingClientRect();
      const activeRect = activeElement.getBoundingClientRect();

      // Calculate if element is out of view
      const isAbove = activeRect.top < containerRect.top;
      const isBelow = activeRect.bottom > containerRect.bottom;

      if (isAbove || isBelow) {
        // Calculate scroll position to center the active element
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
  }, [currentIndex]);

  // Prefetch next tracks
  useEffect(() => {
    const timeoutIds = [];

    if (personalQueue && currentIndex >= 0) {
      const nextTracks = personalQueue.slice(
        currentIndex + 1,
        currentIndex + 4
      );
      nextTracks.forEach((track, idx) => {
        if (!isPreviewCached(track)) {
          const timeoutId = setTimeout(() => {
            prefetchPreviewUrl(track, { priority: idx === 0 ? "high" : "low" });
          }, idx * 1000);
          timeoutIds.push(timeoutId);
        }
      });
    }

    return () => {
      timeoutIds.forEach((id) => clearTimeout(id));
    };
  }, [currentIndex, personalQueue, prefetchPreviewUrl, isPreviewCached]);

  const handlePlayClick = async (track, index) => {
    if (activeSong?.key === track.key && isPlaying) {
      dispatch(playPause(false));
    } else {
      const songWithPreview = await getPreviewUrl(track);
      if (songWithPreview.preview_url) {
        dispatch(
          setActiveSong({
            song: songWithPreview,
            data: personalQueue,
            i: index,
            playlistId: currentPlaylist?.id,
          })
        );
        dispatch(playPause(true));
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDuration = (ms) => {
    if (!ms) return "--:--";
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const placeholderImage =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNGE1NTY4Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2EwYWVjMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==";

  return (
    <div className="w-full h-full bg-gradient-to-b from-[#0f0e2e]/95 to-[#1a1848]/95 backdrop-blur-xl border-l border-white/5 flex flex-col hidden lg:flex">
      {/* Header with context info */}
      <div className="p-6 border-b border-white/5">
        {/* Dropdown Integration */}
        <div className="mb-4">
          <PlaylistDropdown onManageClick={() => setShowManagePanel(true)} />
        </div>

        {/* Now Playing Section */}
        {activeSong?.title ? (
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3">
              <img
                src={activeSong?.images?.coverart || "/placeholder.png"}
                alt={activeSong?.title}
                className="w-20 h-20 rounded-lg shadow-lg"
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-semibold truncate">
                  {activeSong?.title}
                </h4>
                <p className="text-white/60 text-sm truncate">
                  {activeSong?.subtitle}
                </p>

                {/* Animated bars */}
                {isPlaying && (
                  <div className="flex items-end gap-1 mt-2 h-6">
                    <div
                      className="w-1 bg-gradient-to-t from-[#14b8a6] to-[#0d9488] rounded-full animate-pulse"
                      style={{ height: "60%", animationDelay: "0ms" }}
                    />
                    <div
                      className="w-1 bg-gradient-to-t from-[#14b8a6] to-[#0d9488] rounded-full animate-pulse"
                      style={{ height: "100%", animationDelay: "150ms" }}
                    />
                    <div
                      className="w-1 bg-gradient-to-t from-[#14b8a6] to-[#0d9488] rounded-full animate-pulse"
                      style={{ height: "80%", animationDelay: "300ms" }}
                    />
                    <div
                      className="w-1 bg-gradient-to-t from-[#14b8a6] to-[#0d9488] rounded-full animate-pulse"
                      style={{ height: "90%", animationDelay: "450ms" }}
                    />
                    <div
                      className="w-1 bg-gradient-to-t from-[#14b8a6] to-[#0d9488] rounded-full animate-pulse"
                      style={{ height: "70%", animationDelay: "600ms" }}
                    />
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
                disabled={personalQueue.length === 0}
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
                disabled={personalQueue.length === 0}
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

            {/* Volume control */}
            <div
              className="mt-3 flex items-center gap-2 px-2"
              onMouseEnter={() => setIsVolumeHovered(true)}
              onMouseLeave={() => setIsVolumeHovered(false)}
            >
              <button className="text-white/60 hover:text-white transition-colors">
                {volume === 0 ? (
                  <BsVolumeMute size={20} />
                ) : volume < 0.5 ? (
                  <BsVolumeDown size={20} />
                ) : (
                  <BsVolumeUp size={20} />
                )}
              </button>
              <div
                className={`flex-1 transition-all duration-300 ${
                  isVolumeHovered ? "opacity-100" : "opacity-60"
                }`}
              >
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[#14b8a6] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer hover:[&::-webkit-slider-thumb]:bg-[#0d9488] [&::-webkit-slider-thumb]:transition-all"
                  style={{
                    background: `linear-gradient(to right, #14b8a6 0%, #14b8a6 ${
                      volume * 100
                    }%, rgba(255,255,255,0.2) ${
                      volume * 100
                    }%, rgba(255,255,255,0.2) 100%)`,
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          // Empty state
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

      {/* Queue */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="px-6 py-3 flex items-center justify-between border-b border-white/5">
          <h4 className="text-white font-semibold flex items-center gap-2">
            <HiOutlineQueueList size={20} />
            Track List
          </h4>
          <span className="text-white/60 text-sm">
            {personalQueue.length > 0
              ? `${currentIndex + 1} / ${personalQueue.length}`
              : "0 / 0"}
          </span>
        </div>

        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto custom-scrollbar px-3 py-2"
        >
          {personalQueue && personalQueue.length > 0 ? (
            <>
              {/* Track List with enhanced controls */}
              <div className="space-y-1">
                {personalQueue.map((track, index) => {
                  const isActive = currentIndex === index;
                  const isCurrentSong = activeSong?.key === track.key;

                  return (
                    <div
                      key={track.key || index}
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
                      {/* Track number/playing indicator */}
                      <span
                        className={`text-sm w-8 text-center flex-shrink-0 font-medium ${
                          isCurrentSong
                            ? "text-[#14b8a6]"
                            : "text-gray-500 group-hover:text-gray-300"
                        }`}
                      >
                        {isCurrentSong && isPlaying ? (
                          <div className="flex justify-center gap-[2px]">
                            <div className="w-[2px] h-3 bg-[#14b8a6] rounded-full animate-pulse" />
                            <div className="w-[2px] h-3 bg-[#14b8a6] rounded-full animate-pulse delay-75" />
                            <div className="w-[2px] h-3 bg-[#14b8a6] rounded-full animate-pulse delay-150" />
                          </div>
                        ) : (
                          index + 1
                        )}
                      </span>

                      {/* Album art with play overlay */}
                      <div
                        className="relative w-12 h-12 flex-shrink-0 group/art"
                        onClick={() => handlePlayClick(track, index)}
                      >
                        <img
                          src={track.images?.coverart || placeholderImage}
                          alt={track.title}
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
                        {/* Play overlay on hover */}
                        <div className="absolute inset-0 bg-black/60 rounded-lg opacity-0 group-hover/art:opacity-100 transition-opacity flex items-center justify-center">
                          {isCurrentSong && isPlaying ? (
                            <BsFillPauseFill className="text-white w-5 h-5" />
                          ) : (
                            <BsFillPlayFill className="text-white w-5 h-5" />
                          )}
                        </div>
                      </div>

                      {/* Track info */}
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
                          {track.title}
                        </p>
                        <p className="text-gray-400 text-sm truncate group-hover:text-gray-300 transition-colors">
                          {track.subtitle}
                        </p>
                      </div>

                      {/* Duration */}
                      <span className="text-gray-400 text-sm font-medium bg-black/20 px-2.5 py-1 rounded-lg group-hover:bg-black/30 transition-all">
                        {track.duration_ms
                          ? formatTime(track.duration_ms / 1000)
                          : "--:--"}
                      </span>

                      {/* Remove button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          dispatch(removeFromQueue({ index }));
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-all p-2 hover:bg-white/10 rounded-lg"
                        title="Remove from queue"
                      >
                        <svg
                          className="w-4 h-4 text-gray-400 hover:text-red-400 transition-colors"
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

                      {/* Position indicator for current song */}
                      {isCurrentSong && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#14b8a6] animate-pulse" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add a queue summary at the bottom */}
              {personalQueue.length > 0 && (
                <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#14b8a6]/20 to-[#0d9488]/10 rounded-lg flex items-center justify-center">
                        <HiOutlineQueueList className="w-5 h-5 text-[#14b8a6]" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Queue Summary</p>
                        <p className="text-gray-400 text-sm">
                          {personalQueue.length} tracks •{" "}
                          {Math.floor(
                            personalQueue.reduce(
                              (acc, t) => acc + (t.duration_ms || 0),
                              0
                            ) / 60000
                          )}{" "}
                          minutes
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm("Clear entire queue?")) {
                          dispatch(clearQueue());
                        }
                      }}
                      className="text-gray-400 hover:text-red-400 text-sm font-medium transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            // Empty queue state
            <div className="flex flex-col items-center justify-center h-full py-12 text-center px-6">
              <div className="w-24 h-24 mb-6 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#14b8a6]/20 to-[#0d9488]/10 rounded-full animate-pulse"></div>
                <div className="absolute inset-2 bg-gradient-to-br from-[#14b8a6]/30 to-[#0d9488]/20 rounded-full animate-pulse animation-delay-200"></div>
                <div className="absolute inset-4 bg-gradient-to-br from-[#14b8a6]/40 to-[#0d9488]/30 rounded-full flex items-center justify-center">
                  <HiOutlineQueueList size={32} className="text-[#14b8a6]" />
                </div>
              </div>
              <p className="text-white font-semibold text-lg mb-2">
                {isPlaylistPage ? "No playlist loaded" : "Your queue is empty"}
              </p>
              <p className="text-white/60 text-sm mb-4">
                {isPlaylistPage
                  ? "Click on a playlist card to load tracks"
                  : "Start playing songs to build your queue"}
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

      {/* Playlist Management Panel */}
      <PlaylistManager
        isOpen={showManagePanel}
        onClose={() => setShowManagePanel(false)}
      />
    </div>
  );
};

export default PlaylistPlayer;
