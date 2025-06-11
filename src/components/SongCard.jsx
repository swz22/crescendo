import React, { useEffect, useRef, useCallback, useState } from "react";
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
import { HiLightningBolt, HiPlus, HiDotsVertical } from "react-icons/hi";
import { useToast } from "../context/ToastContext";

const SongCard = ({ song, isPlaying, activeSong, data, i }) => {
  const dispatch = useDispatch();
  const { getPreviewUrl, prefetchPreviewUrl, isPreviewCached, hasNoPreview } =
    usePreviewUrl();
  const { preloadAudio, isAudioReady } = useAudioPreload();
  const cardRef = useRef(null);
  const contextMenuRef = useRef(null);
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
    setShowCacheIndicator(isPreviewCached(song) && isAudioReady(songId));
  }, [song, songId, isPreviewCached, isAudioReady]);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(event.target)
      ) {
        setShowContextMenu(false);
      }
    };

    if (showContextMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showContextMenu]);

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
        // Determine source from URL path
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

  const handleAddToQueue = useCallback(async () => {
    const songWithPreview = await getPreviewUrl(song);
    if (songWithPreview.preview_url) {
      dispatch(addToQueue({ song: songWithPreview }));
      showToast("Added to queue");
    }
    setShowContextMenu(false);
  }, [song, dispatch, getPreviewUrl, showToast]);

  const handlePlayNext = useCallback(async () => {
    const songWithPreview = await getPreviewUrl(song);
    if (songWithPreview.preview_url) {
      dispatch(playNext({ song: songWithPreview }));
      showToast("Will play next");
    }
    setShowContextMenu(false);
  }, [song, dispatch, getPreviewUrl, showToast]);

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = cardRef.current.getBoundingClientRect();
    setContextMenuPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
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
        <div className="absolute top-3 left-3 z-10">
          <HiLightningBolt
            className="w-4 h-4 text-[#14b8a6] opacity-80 animate-pulse"
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

      {/* Context menu button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleContextMenu(e);
        }}
        className="absolute top-3 right-3 z-30 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black/60 flex items-center justify-center"
      >
        <HiDotsVertical size={16} className="text-white" />
      </button>

      {/* Context menu dropdown */}
      {showContextMenu && (
        <div
          ref={contextMenuRef}
          className="absolute z-40 bg-[#1e1b4b]/98 backdrop-blur-xl rounded-lg shadow-xl border border-white/20 py-2 min-w-[160px]"
          style={{
            left: `${Math.min(contextMenuPosition.x, 90)}px`,
            top: `${contextMenuPosition.y}px`,
          }}
        >
          <button
            onClick={handlePlayNext}
            className="w-full px-4 py-2 text-left text-white hover:bg-white/10 transition-colors flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 5l7 7-7 7M5 5l7 7-7 7"
              />
            </svg>
            Play Next
          </button>
          <button
            onClick={handleAddToQueue}
            className="w-full px-4 py-2 text-left text-white hover:bg-white/10 transition-colors flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            Add to Queue
          </button>
          <div className="border-t border-white/10 my-1" />
          <AddToPlaylistDropdown track={song}>
            <button className="w-full px-4 py-2 text-left text-white hover:bg-white/10 transition-colors flex items-center gap-2">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Add to Playlist
            </button>
          </AddToPlaylistDropdown>
        </div>
      )}

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
