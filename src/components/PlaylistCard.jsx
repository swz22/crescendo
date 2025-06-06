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
    <div className="flex flex-col w-full max-w-[500px] p-4 bg-white/5 bg-opacity-80 backdrop-blur-sm animate-slideup rounded-lg">
      <div 
        className="flex items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <img
          alt="playlist_cover"
          src={playlistImage}
          className="w-20 h-20 rounded-lg object-cover"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/80x80.png?text=No+Image';
          }}
        />
        <div className="flex-1 flex flex-col justify-center mx-4">
          <p className="font-semibold text-lg text-white">
            {playlist.name}
          </p>
          <p className="text-sm text-gray-300 mt-1">
            by {playlist.owner?.display_name || 'Spotify'} • {totalTracks} tracks
          </p>
        </div>
        <div className="text-gray-400">
          {isExpanded ? '▼' : '▶'}
        </div>
      </div>
      
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-600">
          {isFetching && <Loader title="Loading tracks..." />}
          {error && <Error />}
          {tracks && (
            <div className="max-h-96 overflow-y-auto">
              {tracks.slice(0, 10).map((track, i) => (
                <div key={track.key || i} className="flex items-center py-2 hover:bg-white/10 rounded px-2">
                  <img
                    src={track.images?.coverart || 'https://via.placeholder.com/48x48.png?text=No+Image'}
                    alt={track.title}
                    className="w-12 h-12 rounded mr-3"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/48x48.png?text=No+Image';
                    }}
                  />
                  <div className="flex-1">
                    <p className="text-white text-sm truncate">{track.title}</p>
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
                <p className="text-gray-400 text-sm text-center mt-2">
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