import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { playPause, setActiveSong } from "../redux/features/playerSlice";
import { useGetPlaylistTracksQuery } from "../redux/services/spotifyCore";
import { usePreviewUrl } from "../hooks/usePreviewUrl";
import PlayPause from "./PlayPause";
import { Error, Loader } from "./";

const PlaylistCard = ({ playlist }) => {
  const dispatch = useDispatch();
  const { activeSong, isPlaying } = useSelector((state) => state.player);
  const { getPreviewUrl } = usePreviewUrl();
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { data: tracks, isFetching, error } = useGetPlaylistTracksQuery(
    { playlistId: playlist.id },
    { skip: !isExpanded }
  );

  const playlistImage = playlist.images?.[0]?.url || 'https://via.placeholder.com/400x400.png?text=No+Image';
  const totalTracks = playlist.tracks?.total || 0;

  const handlePlayClick = async (song, i) => {
    const songWithPreview = await getPreviewUrl(song);
    dispatch(setActiveSong({ song: songWithPreview, data: tracks, i }));
    dispatch(playPause(true));
  };

  const handlePauseClick = () => {
    dispatch(playPause(false));
  };

  return (
    <div className="w-full p-4 bg-white/5 bg-opacity-80 backdrop-blur-sm animate-slideup rounded-lg card-hover">
      <div 
        className="flex items-center cursor-pointer gap-2 sm:gap-3"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <img
          alt="playlist_cover"
          src={playlistImage}
          className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-lg object-cover flex-shrink-0"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/80x80.png?text=No+Image';
          }}
        />
        <div className="flex-1 min-w-0 pr-2">
          <p className="font-semibold text-sm sm:text-base lg:text-lg text-white truncate">
            {playlist.name}
          </p>
          <p className="text-xs sm:text-sm text-gray-300 mt-0.5 line-clamp-2">
            by {playlist.owner?.display_name || 'Spotify'} • {totalTracks} tracks
          </p>
        </div>
        <div className="text-gray-400 text-sm flex-shrink-0">
          {isExpanded ? '▼' : '▶'}
        </div>
      </div>
      
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-600">
          {isFetching && <Loader title="Loading tracks..." />}
          {error && <Error />}
          {tracks && (
            <div className="max-h-96 overflow-y-auto custom-scrollbar">
              {tracks.slice(0, 10).map((track, i) => (
                <div key={track.key || i} className="flex items-center py-2 hover:bg-white/10 rounded px-2 gap-2 sm:gap-3">
                  <img
                    src={track.images?.coverart || 'https://via.placeholder.com/48x48.png?text=No+Image'}
                    alt={track.title}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded flex-shrink-0"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/48x48.png?text=No+Image';
                    }}
                  />
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-white text-xs sm:text-sm truncate">{track.title}</p>
                    <p className="text-gray-400 text-xs truncate">{track.subtitle}</p>
                  </div>
                  <PlayPause
                    isPlaying={isPlaying}
                    activeSong={activeSong}
                    song={track}
                    handlePause={handlePauseClick}
                    handlePlay={() => handlePlayClick(track, i)}
                  />
                </div>
              ))}
              {totalTracks > 10 && (
                <p className="text-gray-400 text-xs sm:text-sm text-center mt-2">
                  + {totalTracks - 10} more tracks
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PlaylistCard;