import { useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { store } from "../redux/store";
import PlayPause from "./PlayPause";
import AddToPlaylistDropdown from "./AddToPlaylistDropdown.jsx";
import { usePreviewUrl } from "../hooks/usePreviewUrl";

const SongBar = ({
  song,
  i,
  artistId,
  isPlaying,
  activeSong,
  handlePauseClick,
  handlePlayClick,
}) => {
  const { prefetchPreviewUrl, isPreviewCached } = usePreviewUrl();
  const barRef = useRef(null);

  const handleMouseEnter = () => {
    if (!isPreviewCached(song)) {
      prefetchPreviewUrl(song, { priority: "high" });
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isPreviewCached(song)) {
            prefetchPreviewUrl(song, { priority: "low", delay: 300 });
          }
        });
      },
      { threshold: 0.5 }
    );

    if (barRef.current) {
      observer.observe(barRef.current);
    }

    return () => {
      if (barRef.current) {
        observer.unobserve(barRef.current);
      }
    };
  }, [song, prefetchPreviewUrl, isPreviewCached]);

  const getCoverArt = () => {
    if (song?.images?.coverart) return song.images.coverart;
    if (song?.attributes?.artwork?.url) {
      return song.attributes.artwork.url
        .replace("{w}", "240")
        .replace("{h}", "240");
    }
    if (song?.share?.image) return song.share.image;
    return "https://via.placeholder.com/240x240.png?text=No+Image";
  };

  const getArtistInfo = () => {
    if (song?.artists?.[0]) {
      return {
        id: song.artists[0].adamid || song.artists[0].id,
        name: song.subtitle || song.artists[0].alias || song.artists[0].name,
      };
    }
    if (song?.attributes?.artistName) {
      return {
        id: artistId,
        name: song.attributes.artistName,
      };
    }
    return { id: null, name: "Unknown Artist" };
  };

  const artist = getArtistInfo();
  const songKey = song?.key || song?.id || song?.hub?.actions?.[0]?.id;

  const onPlayClick = () => {
    const currentQueue = store.getState().player.currentSongs || [];

    const songExists = currentQueue.some((s) => s.key === song.key);

    let newQueue;
    let newIndex;

    if (songExists) {
      newQueue = currentQueue;
      newIndex = currentQueue.findIndex((s) => s.key === song.key);
    } else {
      newQueue = [...currentQueue, song];
      newIndex = newQueue.length - 1;
    }

    handlePlayClick(song, newIndex, newQueue);
  };

  return (
    <div
      ref={barRef}
      className={`w-full flex flex-row items-center hover:bg-[#4c426e] ${
        activeSong?.title === song?.title ? "bg-[#4c426e]" : "bg-transparent"
      } py-2 p-4 rounded-lg cursor-pointer mb-2`}
      onMouseEnter={handleMouseEnter}
    >
      <h3 className="font-bold text-base text-white mr-3">{i + 1}.</h3>
      <div className="flex-1 flex flex-row justify-between items-center">
        <img
          className="w-20 h-20 rounded-lg"
          src={getCoverArt()}
          alt={song?.title}
          onError={(e) => {
            e.target.src =
              "https://via.placeholder.com/80x80.png?text=No+Image";
          }}
        />
        <div className="flex-1 flex flex-col justify-center mx-3">
          {!artistId && songKey ? (
            <Link to={`/songs/${songKey}`}>
              <p className="text-xl font-bold text-white">
                {song?.title || song?.attributes?.name || "Unknown Title"}
              </p>
            </Link>
          ) : (
            <p className="text-xl font-bold text-white">
              {song?.title || song?.attributes?.name || "Unknown Title"}
            </p>
          )}
          {artist.id && !artistId ? (
            <Link to={`/artists/${artist.id}`}>
              <p className="text-base text-gray-300 mt-1">{artist.name}</p>
            </Link>
          ) : (
            <p className="text-base text-gray-300 mt-1">{artist.name}</p>
          )}
          {song?.album?.name && song?.album?.id && (
            <div className="flex items-center gap-2 mt-1">
              <Link
                to={`/albums/${song.album.id}`}
                className="text-sm text-gray-400 hover:text-[#14b8a6] transition-colors flex items-center gap-1 group"
              >
                <svg
                  className="w-3 h-3 group-hover:scale-110 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                  />
                </svg>
                <span className="group-hover:underline">{song.album.name}</span>
              </Link>
            </div>
          )}
        </div>
      </div>
      <AddToPlaylistDropdown track={song} />
      {songKey && (
        <PlayPause
          isPlaying={isPlaying}
          activeSong={activeSong}
          song={song}
          handlePause={handlePauseClick}
          handlePlay={onPlayClick}
        />
      )}
    </div>
  );
};

export default SongBar;
