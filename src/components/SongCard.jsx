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
  playTrack,
  addToQueue,
} from "../redux/features/playerSlice";
import { usePreviewUrl } from "../hooks/usePreviewUrl";
import { useAudioPreload } from "../hooks/useAudioPreload";
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
  const [showPlaylistDropdown, setShowPlaylistDropdown] = useState(false);
  const [playlistDropdownPosition, setPlaylistDropdownPosition] = useState({
    x: 0,
    y: 0,
  });
  const [isPrefetched, setIsPrefetched] = useState(false);
  const hoverTimeoutRef = useRef(null);
  const { showToast } = useToast();

  const songId = song?.key || song?.id || song?.track_id;
  const isCurrentSong =
    activeSong?.key === song?.key ||
    activeSong?.title === song?.title ||
    (activeSong?.key && song?.key && activeSong.key === song.key);

  useEffect(() => {
    // Check if already cached or if prefetched
    const isCached = isPreviewCached(song) || isPrefetched;
    setShowCacheIndicator(isCached);
  }, [song, isPreviewCached, isPrefetched]);

  // Replace the useEffect at line 41
  useEffect(() => {
    const currentCardRef = cardRef.current;

    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      // Clean up any pending prefetch
      if (currentCardRef) {
        // Component cleanup
      }
    };
  }, []);

  useEffect(() => {
    // If this is the current song and it's playing, it must be cached
    if (isCurrentSong && activeSong?.preview_url) {
      setIsPrefetched(true);
    }
  }, [isCurrentSong, activeSong]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);

    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    hoverTimeoutRef.current = setTimeout(async () => {
      if (!song.preview_url && !isPreviewCached(song) && !hasNoPreview(song)) {
        // Await the prefetch to know when it completes
        const prefetchSuccess = await prefetchPreviewUrl(song, {
          priority: "high",
        });

        // If prefetch was successful, update state
        if (prefetchSuccess) {
          setIsPrefetched(true);
        }
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
          playTrack({
            track: songWithPreview,
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

    const rect = cardRef.current.getBoundingClientRect();
    const x = Math.min(e.clientX, window.innerWidth - 200);
    const y = e.clientY;

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

        {/* Context menu button - vertically centered with text */}
        <div className="absolute bottom-0 right-3 z-30 opacity-0 group-hover:opacity-90 transition-all duration-300">
          <div className="relative -translate-y-[12px]">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleContextMenu(e);
              }}
              className="w-6 h-6 rounded-full bg-black/50 backdrop-blur-sm hover:scale-110 flex items-center justify-center ring-1 ring-[#14b8a6]/40 hover:ring-[#14b8a6]/60 shadow-[0_0_8px_rgba(20,184,166,0.4)] hover:shadow-[0_0_12px_rgba(20,184,166,0.6)] transition-all duration-200"
            >
              {/* Three horizontal dots */}
              <div className="flex items-center gap-0.5">
                <div className="w-[2.5px] h-[2.5px] bg-[#14b8a6] rounded-full"></div>
                <div className="w-[2.5px] h-[2.5px] bg-[#14b8a6] rounded-full"></div>
                <div className="w-[2.5px] h-[2.5px] bg-[#14b8a6] rounded-full"></div>
              </div>
            </button>
          </div>
        </div>

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
      </div>

      {/* Context menu */}
      {showContextMenu && (
        <SongContextMenu
          song={song}
          position={contextMenuPosition}
          onClose={() => setShowContextMenu(false)}
          onAddToPlaylist={(pos) => {
            setPlaylistDropdownPosition(pos);
            setShowPlaylistDropdown(true);
            setShowContextMenu(false);
          }}
        />
      )}

      {/* Playlist dropdown */}
      {showPlaylistDropdown && (
        <div
          className="fixed z-50"
          style={{
            left: `${playlistDropdownPosition.x}px`,
            top: `${playlistDropdownPosition.y}px`,
          }}
        >
          <AddToPlaylistDropdown track={song} forceOpen={true}>
            <button
              className="hidden"
              onClick={() => setShowPlaylistDropdown(false)}
            />
          </AddToPlaylistDropdown>
        </div>
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
