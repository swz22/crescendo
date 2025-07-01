import React, { useEffect, useRef, useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import PlayPause from "./PlayPause";
import SongMenu from "./SongMenu";
import { playPause, playTrack } from "../redux/features/playerSlice";
import { usePreviewUrl } from "../hooks/usePreviewUrl";
import { useAudioPreload } from "../hooks/useAudioPreload";
import MusicLoadingSpinner from "./MusicLoadingSpinner";
import { HiLightningBolt, HiDotsVertical } from "react-icons/hi";
import { BsFillPlayFill, BsFillPauseFill } from "react-icons/bs";
import { useToast } from "../context/ToastContext";

const SongCard = ({ song, isPlaying, activeSong, data, i }) => {
  const dispatch = useDispatch();
  const { getPreviewUrl, prefetchPreviewUrl, isPreviewCached, hasNoPreview } =
    usePreviewUrl();
  const { preloadAudio, isAudioReady } = useAudioPreload();
  const cardRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCacheIndicator, setShowCacheIndicator] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPrefetched, setIsPrefetched] = useState(false);
  const hoverTimeoutRef = useRef(null);
  const { showToast } = useToast();
  const songId = song?.key || song?.id || song?.track_id;

  // Get current track from Redux
  const currentTrack = useSelector((state) => state.player.currentTrack);
  const { queue } = useSelector((state) => state.player);

  const isCurrentSong =
    currentTrack?.key === song?.key ||
    currentTrack?.title === song?.title ||
    (currentTrack?.key && song?.key && currentTrack.key === song.key);

  useEffect(() => {
    const isCached = isPreviewCached(song) || isPrefetched;
    setShowCacheIndicator(isCached);
  }, [song, isPreviewCached, isPrefetched]);

  useEffect(() => {
    // Cleanup timeout on unmount
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (isCurrentSong && currentTrack?.preview_url) {
      setIsPrefetched(true);
    }
  }, [isCurrentSong, currentTrack]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);

    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    hoverTimeoutRef.current = setTimeout(async () => {
      // Check if component is still mounted
      if (!cardRef.current) return;

      if (!isPreviewCached(song) && !hasNoPreview(song)) {
        const prefetchSuccess = await prefetchPreviewUrl(song, {
          priority: "high",
        });

        if (prefetchSuccess && cardRef.current) {
          setIsPrefetched(true);
        }
      }

      if (songId && !isAudioReady(songId) && cardRef.current) {
        try {
          const songWithPreview = await getPreviewUrl(song);
          const previewUrl = songWithPreview?.preview_url;

          if (previewUrl && cardRef.current) {
            await preloadAudio(songId, previewUrl);
          }
        } catch (error) {
          console.error("Error preloading audio:", error);
        }
      }
    }, 100);
  }, [
    song,
    songId,
    isPreviewCached,
    hasNoPreview,
    prefetchPreviewUrl,
    preloadAudio,
    isAudioReady,
    getPreviewUrl,
  ]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  }, []);

  const handlePlayClick = useCallback(async () => {
    if (!song) {
      console.error("No song data available");
      return;
    }

    setIsLoading(true);

    try {
      const songWithPreview = await getPreviewUrl(song);

      if (songWithPreview?.preview_url) {
        dispatch(
          playTrack({
            track: songWithPreview,
          })
        );
      } else {
        showToast("No preview available for this track", "error");
      }
    } catch (error) {
      console.error("Error playing track:", error);
      showToast("Error playing track", "error");
    } finally {
      setIsLoading(false);
    }
  }, [song, dispatch, getPreviewUrl, showToast]);

  const handlePauseClick = useCallback(() => {
    dispatch(playPause(false));
  }, [dispatch]);

  const coverArt =
    song?.images?.coverart ||
    song?.share?.image ||
    song?.images?.background ||
    song?.hub?.image ||
    "";

  const songTitle = song?.title || "Unknown Title";
  const artistName =
    song?.subtitle || song?.artists?.[0]?.name || "Unknown Artist";
  const artistId = song?.artists?.[0]?.adamid || song?.artists?.[0]?.id;

  return (
    <>
      <div
        ref={cardRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="group"
      >
        {/* Mobile List View - Only visible on mobile */}
        <div className="sm:hidden w-full flex items-center p-3 hover:bg-white/10 rounded-lg transition-all duration-200 active:bg-white/20">
          <div
            className="relative w-14 h-14 mr-3 flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              !isLoading &&
                (isCurrentSong && isPlaying
                  ? handlePauseClick()
                  : handlePlayClick());
            }}
          >
            {coverArt ? (
              <img
                alt="song_img"
                src={coverArt}
                className="w-full h-full object-cover rounded-lg"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src =
                    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNGE1NTY4Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2EwYWVjMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==";
                }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#14b8a6] to-[#0891b2] rounded-lg flex items-center justify-center">
                <span className="text-white/50 text-xl">♪</span>
              </div>
            )}
            {isLoading && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <MusicLoadingSpinner size="sm" />
              </div>
            )}
            {/* Play/Pause overlay for mobile */}
            <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center opacity-0 active:opacity-100 transition-opacity">
              {isCurrentSong && isPlaying ? (
                <BsFillPauseFill className="w-6 h-6 text-white" />
              ) : (
                <BsFillPlayFill className="w-6 h-6 text-white translate-x-0.5" />
              )}
            </div>
          </div>

          <div
            className="flex-1 min-w-0"
            onClick={(e) => {
              e.stopPropagation();
              !isLoading &&
                (isCurrentSong && isPlaying
                  ? handlePauseClick()
                  : handlePlayClick());
            }}
          >
            <div className="flex items-center gap-1.5">
              <p className="font-medium text-base text-white truncate">
                {songTitle}
              </p>
              {showCacheIndicator && (
                <HiLightningBolt className="w-3 h-3 text-[#14b8a6] flex-shrink-0" />
              )}
            </div>
            <p className="text-sm text-gray-400 truncate">{artistName}</p>
          </div>

          <div className="ml-3 mr-2">
            {isCurrentSong && isPlaying && (
              <div className="flex items-center gap-[3px] pr-1">
                <div
                  className="w-[3px] bg-[#14b8a6] rounded-full"
                  style={{
                    height: "12px",
                    animation: "scale-y 1.2s ease-in-out infinite",
                    animationDelay: "0s",
                  }}
                />
                <div
                  className="w-[3px] bg-[#14b8a6] rounded-full"
                  style={{
                    height: "18px",
                    animation: "scale-y 1.2s ease-in-out infinite",
                    animationDelay: "0.2s",
                  }}
                />
                <div
                  className="w-[3px] bg-[#14b8a6] rounded-full"
                  style={{
                    height: "14px",
                    animation: "scale-y 1.2s ease-in-out infinite",
                    animationDelay: "0.4s",
                  }}
                />
              </div>
            )}
          </div>

          <SongMenu song={song}>
            <button className="p-2 -mr-2 touch-manipulation">
              <HiDotsVertical className="w-5 h-5 text-white/60" />
            </button>
          </SongMenu>
        </div>

        {/* Desktop Card View - Always rendered, hidden on mobile */}
        <div
          className={`hidden sm:flex flex-col w-full sm:max-w-[250px] p-4 bg-white/5 bg-opacity-80 backdrop-blur-sm rounded-lg cursor-pointer relative transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-[#14b8a6]/20 hover:bg-white/10
          ${isCurrentSong ? "ring-2 ring-[#14b8a6] ring-opacity-50" : ""}`}
        >
          {showCacheIndicator && (
            <div className="absolute top-1.5 right-1.5 z-20">
              <HiLightningBolt
                className="w-3 h-3 text-[#14b8a6] drop-shadow-[0_0_8px_rgba(20,184,166,0.8)]"
                title="Instant playback ready"
              />
            </div>
          )}

          <div className="relative w-full aspect-square group overflow-hidden rounded-lg">
            {isLoading && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
                <div className="relative w-16 h-16">
                  {/* Orbiting container */}
                  <div className="absolute inset-0 animate-spin">
                    {/* Pink dot */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3">
                      <div className="w-full h-full bg-pink-500 rounded-full shadow-[0_0_10px_rgba(236,72,153,0.8)]" />
                    </div>
                    {/* Purple dot */}
                    <div className="absolute top-1/2 right-0 -translate-y-1/2 w-3 h-3">
                      <div className="w-full h-full bg-purple-500 rounded-full shadow-[0_0_10px_rgba(139,92,246,0.8)]" />
                    </div>
                    {/* Blue dot */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3">
                      <div className="w-full h-full bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                    </div>
                    {/* Teal dot */}
                    <div className="absolute top-1/2 left-0 -translate-y-1/2 w-3 h-3">
                      <div className="w-full h-full bg-[#14b8a6] rounded-full shadow-[0_0_10px_rgba(20,184,166,0.8)]" />
                    </div>
                  </div>

                  {/* Center pulse */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white/80 rounded-full animate-pulse" />
                  </div>
                </div>
              </div>
            )}
            {(isHovered || isCurrentSong) && !isLoading && (
              <div
                className="absolute inset-0 flex items-center justify-center z-20 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  isCurrentSong && isPlaying
                    ? handlePauseClick()
                    : handlePlayClick();
                }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(circle at center, transparent 30%, rgba(0, 0, 0, 0.6) 100%)",
                  }}
                />
                <PlayPause
                  isPlaying={isPlaying}
                  activeSong={currentTrack}
                  song={song}
                  handlePause={handlePauseClick}
                  handlePlay={handlePlayClick}
                  size={50}
                />
              </div>
            )}

            {coverArt ? (
              <img
                alt="song_img"
                src={coverArt}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#14b8a6] to-[#0891b2] flex items-center justify-center">
                <span className="text-white/50 text-6xl">♪</span>
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-col pr-10">
            <p className="font-semibold text-xs sm:text-sm lg:text-base text-white truncate">
              <Link
                to={`/songs/${song?.key || song?.id}`}
                className="hover:text-[#14b8a6] transition-colors duration-200"
              >
                {songTitle}
              </Link>
            </p>
            <p className="text-xs sm:text-sm truncate text-gray-300 mt-1">
              {artistId ? (
                <Link
                  to={`/artists/${artistId}`}
                  className="hover:text-[#14b8a6] transition-colors"
                >
                  {artistName}
                </Link>
              ) : (
                artistName
              )}
            </p>
          </div>

          <SongMenu
            song={song}
            className="absolute bottom-4 right-3 z-30 opacity-40 hover:opacity-100 transition-all duration-200"
          >
            <button
              className="relative p-1.5 rounded-lg hover:bg-white/[0.08] transition-all duration-200 group/menu"
              aria-label="More options"
            >
              {/* Vertical three dot button */}
              <div className="flex flex-col items-center gap-0.5">
                <div className="w-1 h-1 bg-white rounded-full transition-all duration-200 group-hover/menu:bg-[#14b8a6] group-hover/menu:scale-110"></div>
                <div className="w-1 h-1 bg-white rounded-full transition-all duration-200 group-hover/menu:bg-[#14b8a6] group-hover/menu:scale-110"></div>
                <div className="w-1 h-1 bg-white rounded-full transition-all duration-200 group-hover/menu:bg-[#14b8a6] group-hover/menu:scale-110"></div>
              </div>
            </button>
          </SongMenu>
        </div>
      </div>
    </>
  );
};

export default React.memo(SongCard, (prevProps, nextProps) => {
  return (
    prevProps.song.key === nextProps.song.key &&
    prevProps.i === nextProps.i &&
    prevProps.isPlaying === nextProps.isPlaying &&
    prevProps.activeSong?.key === nextProps.activeSong?.key
  );
});
