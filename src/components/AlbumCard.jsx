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
      className="flex flex-col w-full p-3 sm:p-4 bg-white/5 bg-opacity-80 backdrop-blur-sm animate-slideup rounded-lg cursor-pointer card-hover transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-[#14b8a6]/20 hover:bg-white/10 group"
    >
      <div className="relative w-full aspect-square group">
        <img
          alt="album_cover"
          src={albumImage}
          className="w-full h-full rounded-lg object-cover"
        />
      </div>
      <div className="mt-4 flex flex-col">
        <p className="font-semibold text-xs sm:text-sm lg:text-base text-white truncate">
          {album.name}
        </p>
        <div className="text-xs sm:text-sm truncate text-gray-300 mt-1">
          {album.artists?.length === 1 ? (
            <span
              className="artist-link hover:text-[#14b8a6] transition-colors duration-200 cursor-pointer"
              onClick={(e) => handleArtistClick(e, album.artists[0].id)}
            >
              {album.artists[0].name}
            </span>
          ) : (
            album.artists?.map((artist, index) => (
              <span key={artist.id}>
                <span
                  className="artist-link hover:text-[#14b8a6] transition-colors duration-200 cursor-pointer"
                  onClick={(e) => handleArtistClick(e, artist.id)}
                >
                  {artist.name}
                </span>
                {index < album.artists.length - 1 && ", "}
              </span>
            ))
          )}
        </div>
        <p className="text-xs text-gray-400 mt-1">{releaseDate}</p>
      </div>
    </div>
  );
};

export default AlbumCard;
