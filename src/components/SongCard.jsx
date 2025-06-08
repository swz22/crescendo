import React, { useEffect, useRef, useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import PlayPause from "./PlayPause";
import { playPause, setActiveSong } from "../redux/features/playerSlice";
import { usePreviewUrl } from "../hooks/usePreviewUrl";
import { useAudioPreload } from "../hooks/useAudioPreload";
import Tooltip from "./Tooltip";
import MusicLoadingSpinner from "./MusicLoadingSpinner";
import { HiLightningBolt } from "react-icons/hi";

const SongCard = ({ song, isPlaying, activeSong, data, i }) => {
  const dispatch = useDispatch();
  const { getPreviewUrl, prefetchPreviewUrl, isPreviewCached, hasNoPreview } = usePreviewUrl();
  const { preloadAudio, isAudioReady } = useAudioPreload();
  const cardRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCacheIndicator, setShowCacheIndicator] = useState(false);
  const hoverTimeoutRef = useRef(null);

  const songId = song?.key || song?.id || song?.track_id;
  const isCurrentSong = activeSong?.title === song.title;
  
  // Update cache indicator
  useEffect(() => {
    setShowCacheIndicator(isPreviewCached(song) && isAudioReady(songId));
  }, [song, songId, isPreviewCached, isAudioReady]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);
  
  // Hover handler with preloading
  const handleMouseEnter = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    hoverTimeoutRef.current = setTimeout(async () => {
      // First ensure we have the preview URL
      if (!song.preview_url && !isPreviewCached(song) && !hasNoPreview(song)) {
        prefetchPreviewUrl(song, { priority: 'high' });
      }
      
      // If we have a preview URL and audio isn't ready, preload it
      if (songId && !isAudioReady(songId)) {
        let previewUrl = song.preview_url || song.url;
        
        // If no preview URL but it's cached, get it
        if (!previewUrl && isPreviewCached(song)) {
          const songWithPreview = await getPreviewUrl(song);
          previewUrl = songWithPreview.preview_url;
        }
        
        if (previewUrl) {
          await preloadAudio(songId, previewUrl);
        }
      }
    }, 100); // Reduced from 200ms for faster response
  }, [song, songId, isPreviewCached, hasNoPreview, prefetchPreviewUrl, 
      preloadAudio, isAudioReady, getPreviewUrl]);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  }, []);

  const handlePauseClick = useCallback(() => {
    dispatch(playPause(false));
  }, [dispatch]);

  const handlePlayClick = useCallback(async () => {
    // Don't show loading if audio is ready
    if (!songId || !isAudioReady(songId)) {
      setIsLoading(true);
    }
    
    try {
      // Get preview URL (from cache or fetch)
      const songWithPreview = await getPreviewUrl(song);
      
      if (songWithPreview.preview_url) {
        dispatch(setActiveSong({ song: songWithPreview, data, i }));
        dispatch(playPause(true));
      }
    } catch (error) {
      console.error('Error playing song:', error);
    } finally {
      setIsLoading(false);
    }
  }, [song, songId, data, i, dispatch, getPreviewUrl, isAudioReady]);

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
  const artistName = song.subtitle || song.attributes?.artistName || "Unknown Artist";

  return (
    <div 
      ref={cardRef}
      className={`flex flex-col w-full max-w-[250px] p-4 bg-white/5 bg-opacity-80 backdrop-blur-sm animate-slideup rounded-lg cursor-pointer relative transition-all duration-300 hover:scale-105 hover:shadow-2xl group
        ${isCurrentSong ? 'ring-2 ring-purple-400 ring-opacity-50' : ''}
      `}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Cache indicator - subtle lightning icon */}
      {showCacheIndicator && (
        <div className="absolute top-3 right-3 z-10">
          <HiLightningBolt className="w-4 h-4 text-purple-400 opacity-70" title="Instant playback ready" />
        </div>
      )}
      
      {/* Now Playing indicator */}
      {isCurrentSong && (
        <div className="absolute top-3 left-3 z-10 bg-purple-400/20 backdrop-blur-sm rounded-full px-2 py-1">
          <span className="text-xs text-purple-400 font-semibold">Now Playing</span>
        </div>
      )}
      
      <div className="relative w-full aspect-square group overflow-hidden rounded-lg">
        <div
          className={`absolute inset-0 justify-center items-center bg-black bg-opacity-50 group-hover:flex ${
            isCurrentSong
              ? "flex bg-black bg-opacity-70"
              : "hidden"
          }`}
          onClick={(e) => {
            e.stopPropagation();
            if (!isLoading) {
              isCurrentSong && isPlaying ? handlePauseClick() : handlePlayClick();
            }
          }}
        >
          {isLoading ? (
            <MusicLoadingSpinner size="md" />
          ) : (
            <PlayPause
              isPlaying={isPlaying}
              activeSong={activeSong}
              song={song}
              handlePause={handlePauseClick}
              handlePlay={handlePlayClick}
            />
          )}
        </div>
        {coverArt ? (
          <img
            alt="song_img"
            src={coverArt}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
            <span className="text-white/50 text-6xl">♪</span>
          </div>
        )}
      </div>
      
      <div className="mt-4 flex flex-col">
        <Tooltip text={songTitle}>
          <p className="font-semibold text-sm sm:text-base lg:text-lg text-white truncate">
            <Link to={`/songs/${song?.key || song?.id}`}>
              {songTitle}
            </Link>
          </p>
        </Tooltip>
        <Tooltip text={artistName}>
          <p className="text-xs sm:text-sm truncate text-gray-300 mt-1">
            {artistId ? (
              <Link to={`/artists/${artistId}`}>
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
  // Only re-render if these specific props change
  return (
    prevProps.song.key === nextProps.song.key &&
    prevProps.i === nextProps.i &&
    prevProps.isPlaying === nextProps.isPlaying &&
    prevProps.activeSong?.key === nextProps.activeSong?.key
  );
});