import React, { useEffect, useRef, useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import PlayPause from "./PlayPause";
import SongMenu from "./SongMenu";
import { playPause, playTrack } from "../redux/features/playerSlice";
import { usePreviewUrl } from "../hooks/usePreviewUrl";
import { useAudioPreload } from "../hooks/useAudioPreload";
import MusicLoadingSpinner from "./MusicLoadingSpinner";
import { HiLightningBolt } from "react-icons/hi";
import { BsFillPlayFill, BsFillPauseFill } from "react-icons/bs";
import { useToast } from "../context/ToastContext";
import {
  isSameTrack,
  getTrackId,
  getTrackImage,
  getTrackTitle,
  getTrackArtist,
  getTrackArtistId,
} from "../utils/trackUtils";

const SongCard = ({ song, isPlaying, i }) => {
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
  const isMountedRef = useRef(true);
  const { showToast } = useToast();
  const songId = getTrackId(song);

  // Get current track from Redux
  const currentTrack = useSelector((state) => state.player.currentTrack);
  const { queue } = useSelector((state) => state.player);
  const isCurrentSong = isSameTrack(song, currentTrack);

  useEffect(() => {
    const isCached = isPreviewCached(song) || isPrefetched;
    setShowCacheIndicator(isCached);
  }, [song, isPreviewCached, isPrefetched]);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      // Cleanup timeout on unmount
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
      hoverTimeoutRef.current = null;
    }

    hoverTimeoutRef.current = setTimeout(async () => {
      // Check if component is still mounted
      if (!isMountedRef.current || !cardRef.current) return;

      if (!isPreviewCached(song) && !hasNoPreview(song)) {
        const prefetchSuccess = await prefetchPreviewUrl(song, {
          priority: "high",
        });

        if (prefetchSuccess && isMountedRef.current && cardRef.current) {
          setIsPrefetched(true);
        }
      }

      if (
        songId &&
        !isAudioReady(songId) &&
        isMountedRef.current &&
        cardRef.current
      ) {
        try {
          const songWithPreview = await getPreviewUrl(song);
          const previewUrl = songWithPreview?.preview_url;

          if (previewUrl && isMountedRef.current && cardRef.current) {
            await preloadAudio(songId, previewUrl);
          }
        } catch (error) {
          console.error("Error preloading audio:", error);
        }
      }
      hoverTimeoutRef.current = null;
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

      if (isMountedRef.current && songWithPreview?.preview_url) {
        dispatch(
          playTrack({
            track: songWithPreview,
          })
        );
      } else if (isMountedRef.current) {
        showToast("No preview available for this track", "error");
      }
    } catch (error) {
      console.error("Error playing track:", error);
      if (isMountedRef.current) {
        showToast("Error playing track", "error");
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [song, dispatch, getPreviewUrl, showToast]);

  const handlePauseClick = useCallback(() => {
    dispatch(playPause(false));
  }, [dispatch]);

  const coverArt = getTrackImage(song);
  const songTitle = getTrackTitle(song);
  const artistName = getTrackArtist(song);
  const artistId = getTrackArtistId(song);

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
                className="w-full h-full object-cover rounded-lg shadow-lg"
                alt={songTitle}
                src={coverArt}
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-white/10 rounded-lg animate-pulse" />
            )}

            {/* Play/Pause Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg opacity-100">
              {isLoading ? (
                <MusicLoadingSpinner size="small" />
              ) : isCurrentSong && isPlaying ? (
                <BsFillPauseFill className="text-white w-6 h-6" />
              ) : (
                <BsFillPlayFill className="text-white w-6 h-6" />
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0 mr-3">
            <Link
              to={`/songs/${songId}`}
              className="block truncate font-medium text-white hover:text-[#14b8a6] transition-colors"
            >
              {songTitle}
            </Link>
            <p className="truncate text-sm text-gray-400">
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

          <SongMenu song={song} />
        </div>

        {/* Desktop Card View - Hidden on mobile */}
        <div className="hidden sm:block relative p-4 bg-white/[0.08] bg-opacity-80 backdrop-blur-sm animate-slideup rounded-2xl cursor-pointer transition-all duration-300 hover:bg-white/[0.12] card-hover transform hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20 group">
          {/* Cache Indicator */}
          {showCacheIndicator && (
            <div className="absolute top-1.5 right-1.5 z-20">
              <HiLightningBolt
                className="w-3 h-3 text-[#14b8a6] drop-shadow-[0_0_8px_rgba(20,184,166,0.8)]"
                title="Instant playback ready"
              />
            </div>
          )}

          <div className="relative w-full h-42 sm:h-46 group">
            {/* Album Art Container */}
            <div className="relative w-full h-full overflow-hidden rounded-xl">
              {coverArt ? (
                <img
                  className="w-full h-full object-cover"
                  alt={songTitle}
                  src={coverArt}
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-white/10 animate-pulse" />
              )}

              {/* On-hover overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300" />

              {/* Now Playing Indicator */}
              {isCurrentSong && isPlaying && (
                <div className="absolute top-3 left-3 bg-[#14b8a6] px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
                  <div className="flex gap-1">
                    <div className="w-1 h-3 bg-white rounded-full animate-scale-y" />
                    <div
                      className="w-1 h-3 bg-white rounded-full animate-scale-y"
                      style={{ animationDelay: "0.2s" }}
                    />
                    <div
                      className="w-1 h-3 bg-white rounded-full animate-scale-y"
                      style={{ animationDelay: "0.4s" }}
                    />
                  </div>
                  <span className="text-xs font-medium text-white">
                    Playing
                  </span>
                </div>
              )}

              {/* Loading Animation - Orbiting Circles */}
              {isLoading && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16">
                    {/* Orbiting container */}
                    <div
                      className="absolute inset-0 animate-spin"
                      style={{ animationDuration: "1s" }}
                    >
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

              {/* Play/Pause Button */}
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
                  <PlayPause
                    isPlaying={isCurrentSong && isPlaying}
                    activeSong={{}}
                    song={song}
                    handlePause={handlePauseClick}
                    handlePlay={() => handlePlayClick()}
                    isLoading={isLoading}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Song Info */}
          <div className="mt-4 relative">
            <p className="font-semibold text-base text-white truncate hover:text-[#14b8a6] transition-colors">
              <Link to={`/songs/${songId}`}>{songTitle}</Link>
            </p>
            <p className="text-sm text-gray-400 mt-1 truncate">
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
    prevProps.song?.key === nextProps.song?.key &&
    prevProps.i === nextProps.i &&
    prevProps.isPlaying === nextProps.isPlaying
  );
});
