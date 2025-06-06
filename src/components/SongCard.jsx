import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import PlayPause from "./PlayPause";
import { playPause, setActiveSong } from "../redux/features/playerSlice";
import { usePreviewUrl } from "../hooks/usePreviewUrl";

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

  return (
    <div className="flex flex-col w-[250px] p-4 bg-white/5 bg-opacity-80 backdrop-blur-sm animate-slideup rounded-lg cursor-pointer">
      <div className="relative w-full h-56 group">
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
        <p className="font-semibold text-lg text-white truncate">
          <Link to={`/songs/${song?.key || song?.id}`}>
            {song.title || song.attributes?.name || "Unknown Title"}
          </Link>
        </p>
        <p className="text-sm truncate text-gray-300 mt-1">
          {artistId ? (
            <Link to={`/artists/${artistId}`}>
              {song.subtitle || song.attributes?.artistName || "Unknown Artist"}
            </Link>
          ) : (
            song.subtitle || song.attributes?.artistName || "Unknown Artist"
          )}
        </p>
      </div>
    </div>
  );
};

export default SongCard;
