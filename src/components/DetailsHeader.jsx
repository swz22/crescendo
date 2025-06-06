import { Link } from "react-router-dom";

const DetailsHeader = ({ artistId, artistData, songData }) => {
  // Handle different image path structures
  const getArtistImage = () => {
    if (artistData?.attributes?.artwork?.url) {
      return artistData.attributes.artwork.url
        .replace("{w}", "500")
        .replace("{h}", "500");
    }
    if (artistData?.avatar) return artistData.avatar;
    if (artistData?.images?.background) return artistData.images.background;
    return 'https://via.placeholder.com/500x500.png?text=Artist';
  };

  const getSongImage = () => {
    if (songData?.images?.coverart) return songData.images.coverart;
    if (songData?.share?.image) return songData.share.image;
    if (songData?.attributes?.artwork?.url) {
      return songData.attributes.artwork.url
        .replace("{w}", "500")
        .replace("{h}", "500");
    }
    return 'https://via.placeholder.com/500x500.png?text=Song';
  };

  const getArtistName = () => {
    return artistData?.attributes?.name || 
           artistData?.name || 
           'Unknown Artist';
  };

  const getSongTitle = () => {
    return songData?.title || 
           songData?.attributes?.name || 
           'Unknown Song';
  };

  const getGenre = () => {
    if (artistId) {
      return artistData?.attributes?.genreNames?.[0] || 
             artistData?.genres?.primary || 
             'Unknown Genre';
    }
    return songData?.genres?.primary || 
           songData?.genre || 
           'Unknown Genre';
  };

  const profileImage = artistId ? getArtistImage() : getSongImage();
  const title = artistId ? getArtistName() : getSongTitle();

  return (
    <div className="relative w-full flex flex-col">
      <div className="w-full bg-gradient-to-l from-transparent to-black sm:h-48 h-28" />
      <div className="absolute inset-0 flex items-center">
        <img
          alt="profile"
          src={profileImage}
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/500x500.png?text=No+Image';
          }}
          className="sm:w-48 w-28 sm:h-48 h-28 rounded-full object-cover border-2 shadow-xl shadow-black"
        />
        <div className="ml-5">
          <p className="font-bold sm:text-3xl text-xl text-white">
            {title}
          </p>
          {!artistId && songData && (
            <Link to={`/artists/${songData?.artists?.[0]?.adamid || songData?.artists?.[0]?.id}`}>
              <p className="text-base text-gray-400 mt-2">
                {songData?.subtitle || songData?.attributes?.artistName || 'Unknown Artist'}
              </p>
            </Link>
          )}
          <p className="text-base text-gray-400 mt-2">
            {getGenre()}
          </p>
        </div>
      </div>
      <div className="w-full sm:h-44 h-24" />
    </div>
  );
};

export default DetailsHeader;