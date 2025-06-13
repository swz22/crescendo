import { useNavigate } from "react-router-dom";
import { useState } from "react";

// Create a simple placeholder as data URI to avoid network requests
const createPlaceholder = (text = "Artist") => {
  const svg = `
    <svg width="240" height="240" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#4a5568"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="20" fill="#a0aec0" text-anchor="middle" dy=".3em">${text}</text>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

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
      return createPlaceholder("Artist");
    }

    if (artist.avatar) return artist.avatar;
    if (artist.coverart) return artist.coverart;
    if (track?.images?.background) return track.images.background;
    if (track?.images?.coverart) return track.images.coverart;
    if (track?.share?.avatar) return track.share.avatar;
    return createPlaceholder("Artist");
  };

  const handleImageError = (e) => {
    if (!imageError) {
      setImageError(true);
      e.target.src = createPlaceholder("No Image");
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
      <p className="mt-3 sm:mt-4 font-semibold text-sm sm:text-base lg:text-lg text-white truncate group-hover:text-[#14b8a6] transition-colors duration-200">
        {artistName}
      </p>
    </div>
  );
};

export default ArtistCard;
