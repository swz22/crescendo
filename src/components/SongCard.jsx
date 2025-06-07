import React, { useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import PlayPause from "./PlayPause";
import { playPause, setActiveSong } from "../redux/features/playerSlice";
import { usePreviewUrl } from "../hooks/usePreviewUrl";
import Tooltip from "./Tooltip";

const SongCard = ({ song, isPlaying, activeSong, data, i }) => {
  const dispatch = useDispatch();
  const { getPreviewUrl, prefetchPreviewUrl, isPreviewCached, hasNoPreview } = usePreviewUrl();
  const cardRef = useRef(null);

  // All hooks must be called before any conditions or early returns
  
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
    
    // Always try to get preview URL (from cache or fetch)
    const songWithPreview = await getPreviewUrl(song);
    
    if (songWithPreview.preview_url) {
      console.log('Playing song with preview URL:', songWithPreview);
      dispatch(setActiveSong({ song: songWithPreview, data, i }));
      dispatch(playPause(true));
    } else {
      console.log('No preview available for:', song.title);
      // Don't play if no preview available
    }
  }, [song, data, i, dispatch, getPreviewUrl]);

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
      className="flex flex-col w-full max-w-[250px] p-4 bg-white/5 bg-opacity-80 backdrop-blur-sm animate-slideup rounded-lg cursor-pointer card-hover"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative w-full aspect-square group">
        <div
          className={`absolute inset-0 justify-center items-center bg-black bg-opacity-50 group-hover:flex ${
            activeSong?.title === song.title
              ? "flex bg-black bg-opacity-70"
              : "hidden"
          }`}
        >
          <PlayPause
            isPlaying={isPlaying}
            activeSong={activeSong}
            song={song}
            handlePause={handlePauseClick}
            handlePlay={handlePlayClick}
          />
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