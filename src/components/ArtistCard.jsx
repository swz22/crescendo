import { useNavigate } from "react-router-dom";

const ArtistCard = ({ track }) => {
  const navigate = useNavigate();
  
  const artist = track?.artists?.[0];
  if (!artist) return null;

  const artistId = artist.adamid || artist.id;
  const artistName = artist.alias || artist.name || 'Unknown Artist';
  
  // Get artist image with fallbacks
  const getArtistImage = () => {
    if (artist.avatar) return artist.avatar;
    if (artist.coverart) return artist.coverart;
    if (track?.images?.background) return track.images.background;
    if (track?.images?.coverart) return track.images.coverart;
    if (track?.share?.avatar) return track.share.avatar;
    return 'https://via.placeholder.com/240x240.png?text=Artist';
  };

  return (
    <div
      className="flex flex-col w-[250px] p-4 bg-white/5 bg-opacity-80 backdrop-blur-sm animate-slideup rounded-lg cursor-pointer"
      onClick={() => navigate(`/artists/${artistId}`)}
    >
      <img
        alt="song_img"
        src={getArtistImage()}
        onError={(e) => {
          e.target.src = 'https://via.placeholder.com/240x240.png?text=No+Image';
        }}
        className="w-full h-56 rounded-lg object-cover"
      />
      <p className="mt-4 font-semibold text-lg text-white truncate">
        {artistName}
      </p>
    </div>
  );
};

export default ArtistCard;