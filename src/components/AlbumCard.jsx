import { useNavigate } from "react-router-dom";

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

  const handleAlbumClick = (e) => {
    // Only navigate to album if not clicking on artist link
    if (!e.target.closest(".artist-link")) {
      navigate(`/albums/${album.id}`);
    }
  };

  const handleArtistClick = (e, artistId) => {
    e.stopPropagation();
    navigate(`/artists/${artistId}`);
  };

  return (
    <div
      onClick={handleAlbumClick}
      className="flex flex-col w-full p-2 xs:p-3 sm:p-4 bg-white/5 bg-opacity-80 backdrop-blur-sm animate-slideup 
        rounded-lg cursor-pointer transition-all duration-300 
        hover:scale-105 hover:shadow-2xl hover:shadow-[#14b8a6]/20 hover:bg-white/10 
        group"
    >
      <div className="relative w-full aspect-square group">
        <img
          alt="album_cover"
          src={albumImage}
          className="w-full h-full rounded-md xs:rounded-lg object-cover shadow-lg"
        />
        {/* Subtle overlay on hover */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 
          group-hover:opacity-100 transition-opacity duration-300 rounded-md xs:rounded-lg"
        />
      </div>
      <div className="mt-2 xs:mt-3 sm:mt-4 flex flex-col">
        <p
          className="font-semibold text-[11px] xs:text-xs sm:text-sm lg:text-base text-white 
          truncate xs:whitespace-normal xs:line-clamp-2 leading-tight"
        >
          {album.name}
        </p>
        <div className="text-[10px] xs:text-xs sm:text-sm truncate text-gray-300 mt-0.5 xs:mt-1">
          {album.artists?.length === 1 ? (
            <span
              className="artist-link hover:text-[#14b8a6] transition-colors duration-200 cursor-pointer"
              onClick={(e) => handleArtistClick(e, album.artists[0].id)}
            >
              {album.artists[0].name}
            </span>
          ) : (
            <span className="block truncate">{artistNames}</span>
          )}
        </div>
        <p className="text-[10px] xs:text-xs text-gray-400 mt-0.5">
          {releaseDate}
        </p>
      </div>
    </div>
  );
};

export default AlbumCard;
