import React, { useEffect, useRef, useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import PlayPause from "./PlayPause";
import { playPause, setActiveSong } from "../redux/features/playerSlice";
import { usePreviewUrl } from "../hooks/usePreviewUrl";
import Tooltip from "./Tooltip";
import CacheIndicator from "./CacheIndicator";
import MusicLoadingSpinner from "./MusicLoadingSpinner";

const SongCard = ({ song, isPlaying, activeSong, data, i }) => {
  const dispatch = useDispatch();
  const { getPreviewUrl, prefetchPreviewUrl, isPreviewCached, hasNoPreview } = usePreviewUrl();
  const cardRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCacheIndicator, setShowCacheIndicator] = useState(false);
  const loadingTimeoutRef = useRef(null);

  // All hooks must be called before any conditions or early returns
  
  // Check cache status
  useEffect(() => {
    const cached = isPreviewCached(song);
    setShowCacheIndicator(cached);
  }, [song, isPreviewCached]);

  // Clean up loading timeout on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  // Monitor when this song becomes active and clear loading state
  useEffect(() => {
    if (activeSong?.key === song?.key && isPlaying && isLoading) {
      // Add a small delay before hiding spinner to ensure smooth transition
      loadingTimeoutRef.current = setTimeout(() => {
        setIsLoading(false);
      }, 500);
    }
  }, [activeSong, song, isPlaying, isLoading]);
  
  // Prefetch on hover with delay to ensure intent
  const handleMouseEnter = useCallback(() => {
    // Only prefetch on hover if not cached and user shows intent
    if (!isPreviewCached(song) && !hasNoPreview(song)) {
      // Add delay to prevent accidental hover prefetching
      const timeoutId = setTimeout(() => {
        prefetchPreviewUrl(song, { priority: 'high' });
      }, 500);
      
      // Store timeout ID for cleanup
      cardRef.current.hoverTimeout = timeoutId;
    }
  }, [song, isPreviewCached, hasNoPreview, prefetchPreviewUrl]);

  const handleMouseLeave = useCallback(() => {
    // Cancel prefetch if user leaves quickly
    if (cardRef.current?.hoverTimeout) {
      clearTimeout(cardRef.current.hoverTimeout);
    }
  }, []);

  const handlePauseClick = useCallback(() => {
    dispatch(playPause(false));
  }, [dispatch]);

  const handlePlayClick = useCallback(async () => {
    console.log('handlePlayClick called for song:', song.title);
    
    // Clear any existing loading timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    
    // Show loading state if not cached
    if (!isPreviewCached(song)) {
      setIsLoading(true);
    }
    
    try {
      // Always try to get preview URL (from cache or fetch)
      const songWithPreview = await getPreviewUrl(song);
      
      if (songWithPreview.preview_url) {
        console.log('Playing song with preview URL:', songWithPreview);
        dispatch(setActiveSong({ song: songWithPreview, data, i }));
        dispatch(playPause(true));
        
        // If cached, hide loading immediately
        if (isPreviewCached(song)) {
          setIsLoading(false);
        }
        // Otherwise, loading state will be cleared when song starts playing (see useEffect above)
      } else {
        console.log('No preview available for:', song.title);
        setIsLoading(false); // Hide loading if no preview available
      }
    } catch (error) {
      console.error('Error playing song:', error);
      setIsLoading(false);
    }
  }, [song, data, i, dispatch, getPreviewUrl, isPreviewCached]);

  const getCoverArt = () => {
    if (song.images?.coverart) return song.images.coverart;
    if (song.share?.image) return song.share.image;
    if (song.images?.background) return song.images.background;
    if (song.attributes?.artwork?.url) {
      return song.attributes.artwork.url
        .replace("{w}", "400")
        .replace("{h}", "400");
    }
    return "https://via.placeholder.com/400x400.png?text=No+Image";
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
      className="flex flex-col w-full max-w-[250px] p-4 bg-white/5 bg-opacity-80 backdrop-blur-sm animate-slideup rounded-lg cursor-pointer card-hover relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Cache indicator */}
      {showCacheIndicator && (
        <div className="absolute top-2 right-2 z-10">
          <CacheIndicator isCached={true} size="md" />
        </div>
      )}
      
      <div className="relative w-full aspect-square group">
        <div
          className={`absolute inset-0 justify-center items-center bg-black bg-opacity-50 group-hover:flex ${
            activeSong?.title === song.title
              ? "flex bg-black bg-opacity-70"
              : "hidden"
          }`}
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
        <img
          alt="song_img"
          src={coverArt}
          onError={(e) => {
            e.target.src =
              "https://via.placeholder.com/400x400.png?text=No+Image";
          }}
          className="w-full h-full rounded-lg object-cover"
        />
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