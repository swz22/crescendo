import { useNavigate } from "react-router-dom";
import { useState } from "react";

const placeholderImage =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQwIiBoZWlnaHQ9IjI0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNGE1NTY4Ii8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyMCIgZmlsbD0iI2EwYWVjMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkFydGlzdDwvdGV4dD4KPC9zdmc+";

const ArtistCard = ({ track }) => {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);

  const artist = track?.artists?.[0];
  if (!artist) return null;

  const artistId = artist.adamid || artist.id;
  const artistName = artist.alias || artist.name || "Unknown Artist";

  // Get artist image with fallbacks
  const getArtistImage = () => {
    if (imageError) {
      return placeholderImage;
    }

    if (artist.avatar) return artist.avatar;
    if (artist.coverart) return artist.coverart;
    if (track?.images?.background) return track.images.background;
    if (track?.images?.coverart) return track.images.coverart;
    if (track?.share?.avatar) return track.share.avatar;
    return placeholderImage;
  };

  const handleImageError = (e) => {
    if (!imageError) {
      setImageError(true);
      e.target.src = placeholderImage;
    }
  };

  return (
    <div
      className="flex flex-col w-full p-3 sm:p-4 bg-white/5 bg-opacity-80 backdrop-blur-sm animate-slideup rounded-lg cursor-pointer card-hover transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-[#14b8a6]/20 hover:bg-white/10 group"
      onClick={() => navigate(`/artists/${artistId}`)}
    >
      <img
        alt="song_img"
        src={getArtistImage()}
        onError={handleImageError}
        className="w-full aspect-square rounded-lg object-cover"
      />
      <p className="mt-3 sm:mt-4 font-semibold text-xs sm:text-sm lg:text-base text-white truncate group-hover:text-[#14b8a6] transition-colors duration-200">
        {artistName}
      </p>
    </div>
  );
};

export default ArtistCard;
