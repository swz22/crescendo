import React, {
  useEffect,
  useRef,
  useCallback,
  useState,
  Fragment,
} from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import PlayPause from "./PlayPause";
import {
  playPause,
  addToQueueAndPlay,
  addToQueue,
  playNext,
} from "../redux/features/playerSlice";
import { usePreviewUrl } from "../hooks/usePreviewUrl";
import { useAudioPreload } from "../hooks/useAudioPreload";
import Tooltip from "./Tooltip";
import MusicLoadingSpinner from "./MusicLoadingSpinner";
import AddToPlaylistDropdown from "./AddToPlaylistDropdown";
import SongContextMenu from "./SongContextMenu";
import {
  HiLightningBolt,
  HiDotsVertical,
  HiOutlineDotsHorizontal,
} from "react-icons/hi";
import { useToast } from "../context/ToastContext";
import { dispatchQueueEvent } from "../utils/queueEvents";

const SongCard = ({ song, isPlaying, activeSong, data, i }) => {
  const dispatch = useDispatch();
  const { getPreviewUrl, prefetchPreviewUrl, isPreviewCached, hasNoPreview } =
    usePreviewUrl();
  const { preloadAudio, isAudioReady } = useAudioPreload();
  const cardRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCacheIndicator, setShowCacheIndicator] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({
    x: 0,
    y: 0,
  });
  const hoverTimeoutRef = useRef(null);
  const { showToast } = useToast();

  const songId = song?.key || song?.id || song?.track_id;
  const isCurrentSong =
    activeSong?.key === song?.key ||
    activeSong?.title === song?.title ||
    (activeSong?.key && song?.key && activeSong.key === song.key);

  useEffect(() => {
    // Check if song has a preview URL already (from API or cache)
    const hasPreviewUrl = !!(song.preview_url || song.url);

    // Check if preview URL is cached
    const cached = isPreviewCached(song);

    // Check if audio is preloaded
    const audioReady = songId ? isAudioReady(songId) : false;

    // Show indicator if any condition is true
    const shouldShow = hasPreviewUrl || cached === true || audioReady === true;
    setShowCacheIndicator(shouldShow);
  }, [song, songId, isPreviewCached, isAudioReady]);

  // Force re-check when hovering (after prefetch might complete)
  useEffect(() => {
    if (isHovered) {
      const checkInterval = setInterval(() => {
        const hasUrl = !!(song.preview_url || song.url);
        const cached = isPreviewCached(song);
        const audioReady = songId ? isAudioReady(songId) : false;

        const shouldShow = hasUrl || cached === true || audioReady === true;
        if (shouldShow && !showCacheIndicator) {
          setShowCacheIndicator(true);
          clearInterval(checkInterval);
        }
      }, 250); // Check every 250ms while hovering

      // Clear after 2 seconds to prevent infinite checking
      const timeout = setTimeout(() => clearInterval(checkInterval), 2000);

      return () => {
        clearInterval(checkInterval);
        clearTimeout(timeout);
      };
    }
  }, [
    isHovered,
    song,
    songId,
    isPreviewCached,
    isAudioReady,
    showCacheIndicator,
  ]);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);

    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    hoverTimeoutRef.current = setTimeout(async () => {
      if (!song.preview_url && !isPreviewCached(song) && !hasNoPreview(song)) {
        prefetchPreviewUrl(song, { priority: "high" });
      }

      if (songId && !isAudioReady(songId)) {
        let previewUrl = song.preview_url || song.url;

        if (!previewUrl && isPreviewCached(song)) {
          const songWithPreview = await getPreviewUrl(song);
          previewUrl = songWithPreview.preview_url;
        }

        if (previewUrl) {
          await preloadAudio(songId, previewUrl);
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

  const handlePauseClick = useCallback(() => {
    dispatch(playPause(false));
  }, [dispatch]);

  const handlePlayClick = useCallback(async () => {
    setIsLoading(true);

    try {
      const songWithPreview = await getPreviewUrl(song);

      if (songWithPreview.preview_url) {
        const path = window.location.pathname;
        let source = "manual";
        if (path === "/") source = "discover";
        else if (path.includes("/search")) source = "search";
        else if (path.includes("/top-artists")) source = "top-artists";
        else if (path.includes("/artists/")) source = "artist";

        dispatch(
          addToQueueAndPlay({
            song: songWithPreview,
            source,
          })
        );
      }
    } catch (error) {
      console.error("Error playing song:", error);
    } finally {
      setIsLoading(false);
    }
  }, [song, dispatch, getPreviewUrl]);

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Calculate position accounting for viewport and scroll
    const menuWidth = 200;
    const menuHeight = 150; // Approximate height

    let x = e.clientX;
    let y = e.clientY;

    // Prevent menu from going off screen
    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - 10;
    }

    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - 10;
    }

    setContextMenuPosition({ x, y });
    setShowContextMenu(true);
  };

  const getCoverArt = () => {
    if (song.images?.coverart) return song.images.coverart;
    if (song.share?.image) return song.share.image;
    if (song.images?.background) return song.images.background;
    if (song.attributes?.artwork?.url) {
      return song.attributes.artwork.url
        .replace("{w}", "400")
        .replace("{h}", "400");
    }
    return null;
  };

  const getArtistId = () => {
    if (song.artists?.[0]?.adamid) return song.artists[0].adamid;
    if (song.artists?.[0]?.id) return song.artists[0].id;
    if (song.relationships?.artists?.data?.[0]?.id) {
      return song.relationships.artists.data[0].id;
    }
    return null;
  };

  const artistId = getArtistId();
  const coverArt = getCoverArt();
  const songTitle = song.title || song.attributes?.name || "Unknown Title";
  const artistName =
    song.subtitle || song.attributes?.artistName || "Unknown Artist";

  return (
    <>
      <div
        ref={cardRef}
        className={`flex flex-col w-full max-w-[250px] p-4 bg-white/5 bg-opacity-80 backdrop-blur-sm animate-slideup rounded-lg cursor-pointer relative transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-[#14b8a6]/20 hover:bg-white/10 group
    ${isCurrentSong ? "ring-2 ring-[#14b8a6] ring-opacity-50" : ""}
    `}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onContextMenu={handleContextMenu}
      >
        {showCacheIndicator && (
          <div className="absolute top-5 left-5 z-10">
            <HiLightningBolt
              className="w-4 h-4 text-[#14b8a6] drop-shadow-[0_0_10px_rgba(20,184,166,0.8)]"
              title="Instant playback ready"
            />
          </div>
        )}

        {isCurrentSong && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#14b8a6] to-[#0891b2] z-10">
            <div className="h-full bg-white/30 animate-pulse" />
          </div>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleContextMenu(e);
          }}
          className="absolute bottom-4 right-4 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        >
          <div className="relative transform hover:scale-110 transition-transform duration-200">
            <div className="bg-black/70 rounded-full p-2 border border-white/20 hover:border-[#14b8a6]/50 shadow-[0_0_20px_rgba(20,184,166,0.5)]">
              <HiOutlineDotsHorizontal size={16} className="text-white" />
            </div>
          </div>
        </button>

        <div className="relative w-full aspect-square group overflow-hidden rounded-lg">
          {(isHovered || isCurrentSong) && (
            <div
              className="absolute inset-0 flex items-center justify-center z-20 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                if (!isLoading) {
                  isCurrentSong && isPlaying
                    ? handlePauseClick()
                    : handlePlayClick();
                }
              }}
            >
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(circle at center, transparent 30%, rgba(0, 0, 0, 0.6) 100%)",
                }}
              />

              {isLoading ? (
                <MusicLoadingSpinner size="md" />
              ) : (
                <PlayPause
                  isPlaying={isPlaying}
                  activeSong={activeSong}
                  song={song}
                  handlePause={handlePauseClick}
                  handlePlay={handlePlayClick}
                  size={50}
                />
              )}
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

        <div className="mt-4 flex flex-col">
          <Tooltip text={songTitle}>
            <p className="font-semibold text-sm sm:text-base lg:text-lg text-white truncate">
              <Link to={`/songs/${song?.key || song?.id}`}>{songTitle}</Link>
            </p>
          </Tooltip>
          <Tooltip text={artistName}>
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
          </Tooltip>
        </div>
      </div>

      {/* Context menu - rendered outside card for proper positioning */}
      {showContextMenu && (
        <SongContextMenu
          song={song}
          position={contextMenuPosition}
          onClose={() => setShowContextMenu(false)}
        />
      )}
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
