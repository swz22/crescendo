import { useNavigate } from "react-router-dom";
import Tooltip from "./Tooltip";

const AlbumCard = ({ album, showTrackCount = false }) => {
  const navigate = useNavigate();
  const albumImage =
    album.images?.[0]?.url ||
    "https://via.placeholder.com/400x400.png?text=No+Image";
  const artistNames =
    album.artists?.map((artist) => artist.name).join(", ") || "Unknown Artist";
  const releaseDate = album.release_date
    ? new Date(album.release_date).getFullYear()
    : "";

  const handleClick = () => {
    navigate(`/albums/${album.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="flex flex-col w-full max-w-[250px] p-4 bg-white/5 bg-opacity-80 backdrop-blur-sm animate-slideup rounded-lg cursor-pointer card-hover transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-[#14b8a6]/20 hover:bg-white/10 group"
    >
      <div className="relative w-full aspect-square group">
        <img
          alt="album_cover"
          src={albumImage}
          className="w-full h-full rounded-lg object-cover"
        />
        {showTrackCount && (
          <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm rounded-full px-3 py-1 border border-white/20 group-hover:bg-black/90 transition-all">
            <p className="text-xs text-white font-medium">
              {album.total_tracks} tracks
            </p>
          </div>
        )}
      </div>
      <div className="mt-4 flex flex-col">
        <Tooltip text={album.name}>
          <p className="font-semibold text-sm sm:text-base lg:text-lg text-white truncate">
            {album.name}
          </p>
        </Tooltip>
        <Tooltip text={artistNames}>
          <p className="text-xs sm:text-sm truncate text-gray-300 mt-1">
            {artistNames}
          </p>
        </Tooltip>
        <p className="text-xs text-gray-400 mt-1">{releaseDate}</p>
      </div>
    </div>
  );
};

export default AlbumCard;
