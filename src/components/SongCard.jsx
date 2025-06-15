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
import { BsFillPlayFill } from "react-icons/bs";
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
  const isCurrentSong =
    currentTrack?.key === song?.key ||
    currentTrack?.title === song?.title ||
    (currentTrack?.key && song?.key && currentTrack.key === song.key);

  useEffect(() => {
    const isCached = isPreviewCached(song) || isPrefetched;
    setShowCacheIndicator(isCached);
  }, [song, isPreviewCached, isPrefetched]);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
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

    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    hoverTimeoutRef.current = setTimeout(async () => {
      if (!isPreviewCached(song) && !hasNoPreview(song)) {
        const prefetchSuccess = await prefetchPreviewUrl(song, {
          priority: "high",
        });

        if (prefetchSuccess) {
          setIsPrefetched(true);
        }
      }

      if (songId && !isAudioReady(songId)) {
        try {
          const songWithPreview = await getPreviewUrl(song);
          const previewUrl = songWithPreview?.preview_url;

          if (previewUrl) {
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
    }
  }, []);

  const handlePlayClick = useCallback(async () => {
    setIsLoading(true);

    try {
      const songWithPreview = await getPreviewUrl(song);

      if (songWithPreview.preview_url) {
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
      showToast("Error loading track", "error");
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
        <div className="sm:hidden w-full flex items-center p-3 hover:bg-white/10 rounded-lg transition-all duration-200">
          <div
            className="relative w-14 h-14 mr-3 flex-shrink-0"
            onClick={() =>
              !isLoading &&
              (isCurrentSong && isPlaying
                ? handlePauseClick()
                : handlePlayClick())
            }
          >
            {showCacheIndicator && (
              <div className="absolute -top-1 -right-1 z-20 bg-black/60 backdrop-blur-sm rounded-full p-0.5">
                <HiLightningBolt className="w-2.5 h-2.5 text-[#14b8a6]" />
              </div>
            )}
            {coverArt ? (
              <img
                alt="song_img"
                src={coverArt}
                className="w-full h-full object-cover rounded-lg"
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
          </div>

          <div
            className="flex-1 min-w-0"
            onClick={() =>
              !isLoading &&
              (isCurrentSong && isPlaying
                ? handlePauseClick()
                : handlePlayClick())
            }
          >
            <p className="font-medium text-base text-white truncate">
              {songTitle}
            </p>
            <p className="text-sm text-gray-400 truncate">{artistName}</p>
          </div>

          <div className="ml-3 mr-2">
            {isLoading ? (
              <div className="w-6 h-6 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-[#14b8a6] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : isCurrentSong && isPlaying ? (
              <div className="flex items-center gap-0.5 pr-1">
                <div className="w-1 h-4 bg-[#14b8a6] rounded-full animate-pulse" />
                <div className="w-1 h-5 bg-[#14b8a6] rounded-full animate-pulse delay-75" />
                <div className="w-1 h-4 bg-[#14b8a6] rounded-full animate-pulse delay-150" />
              </div>
            ) : (
              <BsFillPlayFill className="w-6 h-6 text-white/60" />
            )}
          </div>

          <SongMenu song={song}>
            <button className="p-2 -mr-2">
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
            <div className="absolute top-2 left-2 z-20 bg-black/60 backdrop-blur-sm rounded-full p-1.5">
              <HiLightningBolt
                className="w-4 h-4 text-[#14b8a6] drop-shadow-[0_0_8px_rgba(20,184,166,0.8)]"
                title="Instant playback ready"
              />
            </div>
          )}

          {isCurrentSong && (
            <div className="absolute top-3 left-3 z-10 bg-[#14b8a6]/20 backdrop-blur-sm rounded-full px-2 py-1">
              <span className="text-xs text-[#14b8a6] font-semibold">
                Now Playing
              </span>
            </div>
          )}

          <div className="relative w-full aspect-square group overflow-hidden rounded-lg">
            {isLoading && (
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center z-30">
                <MusicLoadingSpinner size="md" />
                <span className="text-white text-xs font-medium mt-2 animate-pulse">
                  Loading...
                </span>
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
            <p className="font-semibold text-sm sm:text-base lg:text-lg text-white truncate">
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
            className="absolute bottom-4 right-3 z-30 opacity-0 group-hover:opacity-90 transition-all duration-300"
          >
            <button
              className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm hover:scale-110 flex items-center justify-center ring-1 ring-[#14b8a6]/40 hover:ring-[#14b8a6]/60 shadow-[0_0_8px_rgba(20,184,166,0.4)] hover:shadow-[0_0_12px_rgba(20,184,166,0.6)]"
              aria-label="More options"
            >
              <div className="flex items-center gap-0.5">
                <div className="w-[2.5px] h-[2.5px] bg-[#14b8a6] rounded-full"></div>
                <div className="w-[2.5px] h-[2.5px] bg-[#14b8a6] rounded-full"></div>
                <div className="w-[2.5px] h-[2.5px] bg-[#14b8a6] rounded-full"></div>
              </div>
            </button>
          </SongMenu>

          {isLoading && (
            <div className="absolute bottom-2 right-2 z-30">
              <div className="bg-black/70 backdrop-blur-sm rounded-full p-1.5">
                <div className="w-3 h-3 border-2 border-[#14b8a6] border-t-transparent rounded-full animate-spin" />
              </div>
            </div>
          )}
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
