import { Link } from "react-router-dom";

const placeholderImage =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNGE1NTY4Ii8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZmlsbD0iI2EwYWVjMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4=";

const DetailsHeader = ({ artistId, artistData, songData, albumData }) => {
  const getAlbumImage = () => {
    if (albumData?.images?.[0]?.url) return albumData.images[0].url;
    return placeholderImage;
  };

  const getArtistImage = () => {
    if (artistData?.images?.[0]?.url) return artistData.images[0].url;
    if (artistData?.avatar) return artistData.avatar;
    if (artistData?.images?.background) return artistData.images.background;
    return placeholderImage;
  };

  const getSongImage = () => {
    if (songData?.images?.coverart) return songData.images.coverart;
    if (songData?.album?.images?.[0]?.url) return songData.album.images[0].url;
    return placeholderImage;
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
            e.target.src = placeholderImage;
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
