import React from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import PlayPause from "./PlayPause";
import { playPause, setActiveSong } from "../redux/features/playerSlice";
import { usePreviewUrl } from "../hooks/usePreviewUrl";
import Tooltip from "./Tooltip";

const SongCard = ({ song, isPlaying, activeSong, data, i }) => {
  const dispatch = useDispatch();
  const { getPreviewUrl } = usePreviewUrl();

  const handlePauseClick = () => {
    dispatch(playPause(false));
  };

  const handlePlayClick = async () => {
    const songWithPreview = await getPreviewUrl(song);
    dispatch(setActiveSong({ song: songWithPreview, data, i }));
    dispatch(playPause(true));
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
    <div className="flex flex-col w-full max-w-[250px] p-4 bg-white/5 bg-opacity-80 backdrop-blur-sm animate-slideup rounded-lg cursor-pointer card-hover">
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