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
  const prefetchTimeoutRef = useRef(null);

  // All hooks must be called before any conditions or early returns
  
  // Prefetch on hover
  const handleMouseEnter = useCallback(() => {
    // Prefetch immediately on hover if not cached
    if (!isPreviewCached(song)) {
      prefetchPreviewUrl(song, { priority: 'high' });
    }
  }, [song, isPreviewCached, prefetchPreviewUrl]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (prefetchTimeoutRef.current) {
        clearTimeout(prefetchTimeoutRef.current);
      }
    };
  }, []);

  // Prefetch when card becomes visible (Intersection Observer)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isPreviewCached(song)) {
            // Prefetch with low priority when scrolled into view
            prefetchTimeoutRef.current = setTimeout(() => {
              prefetchPreviewUrl(song, { priority: 'low', delay: 1000 });
            }, 100);
          }
        });
      },
      { threshold: 0.1, rootMargin: '50px' } // Reduced root margin
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, [song, prefetchPreviewUrl, isPreviewCached]);

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