import { Link } from "react-router-dom";

// Create a local placeholder to avoid network requests
const createPlaceholder = (text = "No Image") => {
  const svg = `
    <svg width="500" height="500" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#4a5568"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="24" fill="#a0aec0" text-anchor="middle" dy=".3em">${text}</text>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

const DetailsHeader = ({ artistId, artistData, songData, albumData }) => {
  // Handle album image
  const getAlbumImage = () => {
    if (albumData?.images?.[0]?.url) return albumData.images[0].url;
    return createPlaceholder("Album");
  };

  // Handle artist image
  const getArtistImage = () => {
    if (artistData?.images?.[0]?.url) return artistData.images[0].url;
    if (artistData?.avatar) return artistData.avatar;
    if (artistData?.images?.background) return artistData.images.background;
    return createPlaceholder("Artist");
  };

  // Handle song image
  const getSongImage = () => {
    if (songData?.images?.coverart) return songData.images.coverart;
    if (songData?.album?.images?.[0]?.url) return songData.album.images[0].url;
    return createPlaceholder("Song");
  };

  const getTitle = () => {
    if (albumData) return albumData.name || "Unknown Album";
    if (artistId) return artistData?.name || "Unknown Artist";
    return songData?.title || "Unknown Song";
  };

  const getSubtitle = () => {
    if (albumData) {
      return (
        albumData.artists?.map((a) => a.name).join(", ") || "Unknown Artist"
      );
    }
    if (artistId) {
      return artistData?.genres?.join(", ") || "Music Artist";
    }
    return (
      songData?.subtitle || songData?.artists?.[0]?.name || "Unknown Artist"
    );
  };

  const profileImage = albumData
    ? getAlbumImage()
    : artistId
    ? getArtistImage()
    : getSongImage();

  return (
    <div className="relative w-full flex flex-col">
      <div className="w-full bg-gradient-to-l from-transparent to-black sm:h-48 h-28" />
      <div className="absolute inset-0 flex items-center">
        <img
          alt="profile"
          src={profileImage}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = createPlaceholder("No Image");
          }}
          className="sm:w-48 w-28 sm:h-48 h-28 rounded-full object-cover border-2 shadow-xl shadow-black"
        />
        <div className="ml-5">
          <p className="font-bold sm:text-3xl text-xl text-white">
            {getTitle()}
          </p>
          {albumData ? (
            <p className="text-base text-gray-400 mt-2">{getSubtitle()}</p>
          ) : !artistId && songData ? (
            <Link to={`/artists/${songData?.artists?.[0]?.id}`}>
              <p className="text-base text-gray-400 mt-2 hover:text-white">
                {getSubtitle()}
              </p>
            </Link>
          ) : (
            <p className="text-base text-gray-400 mt-2">{getSubtitle()}</p>
          )}
        </div>
      </div>
      <div className="w-full sm:h-44 h-24" />
    </div>
  );
};

export default DetailsHeader;
