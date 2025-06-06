import { Link } from "react-router-dom";
import PlayPause from "./PlayPause";

const SongBar = ({
  song,
  i,
  artistId,
  isPlaying,
  activeSong,
  handlePauseClick,
  handlePlayClick,
}) => {
  // Handle different image path structures
  const getCoverArt = () => {
    if (song?.images?.coverart) return song.images.coverart;
    if (song?.attributes?.artwork?.url) {
      return song.attributes.artwork.url
        .replace('{w}', '240')
        .replace('{h}', '240');
    }
    if (song?.share?.image) return song.share.image;
    return 'https://via.placeholder.com/240x240.png?text=No+Image';
  };

  // Get artist info
  const getArtistInfo = () => {
    if (song?.artists?.[0]) {
      return {
        id: song.artists[0].adamid || song.artists[0].id,
        name: song.subtitle || song.artists[0].alias || song.artists[0].name
      };
    }
    if (song?.attributes?.artistName) {
      return {
        id: artistId,
        name: song.attributes.artistName
      };
    }
    return { id: null, name: 'Unknown Artist' };
  };

  const artist = getArtistInfo();
  const songKey = song?.key || song?.id || song?.hub?.actions?.[0]?.id;

  return (
    <div
      className={`w-full flex flex-row items-center hover:bg-[#4c426e] ${
        activeSong?.title === song?.title ? "bg-[#4c426e]" : "bg-transparent"
      } py-2 p-4 rounded-lg cursor-pointer mb-2`}
    >
      <h3 className="font-bold text-base text-white mr-3">{i + 1}.</h3>
      <div className="flex-1 flex flex-row justify-between items-center">
        <img
          className="w-20 h-20 rounded-lg"
          src={getCoverArt()}
          alt={song?.title}
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/80x80.png?text=No+Image';
          }}
        />
        <div className="flex-1 flex flex-col justify-center mx-3">
          {!artistId && songKey ? (
            <Link to={`/songs/${songKey}`}>
              <p className="text-xl font-bold text-white">
                {song?.title || song?.attributes?.name || 'Unknown Title'}
              </p>
            </Link>
          ) : (
            <p className="text-xl font-bold text-white">
              {song?.title || song?.attributes?.name || 'Unknown Title'}
            </p>
          )}
          {artist.id && !artistId ? (
            <Link to={`/artists/${artist.id}`}>
              <p className="text-base text-gray-300 mt-1">{artist.name}</p>
            </Link>
          ) : (
            <p className="text-base text-gray-300 mt-1">{artist.name}</p>
          )}
        </div>
      </div>
      {songKey && (
        <PlayPause
          isPlaying={isPlaying}
          activeSong={activeSong}
          song={song}
          handlePause={handlePauseClick}
          handlePlay={() => handlePlayClick(song, i)}
        />
      )}
    </div>
  );
};

export default SongBar;