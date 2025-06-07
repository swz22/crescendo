import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { playPause, setActiveSong } from "../redux/features/playerSlice";
import PlayPause from "./PlayPause";

const RecentlyPlayed = () => {
  const dispatch = useDispatch();
  const { activeSong, isPlaying, recentlyPlayed } = useSelector((state) => state.player);

  const handlePauseClick = () => {
    dispatch(playPause(false));
  };

  const handlePlayClick = (song, i) => {
    dispatch(setActiveSong({ song, data: recentlyPlayed, i }));
    dispatch(playPause(true));
  };

  // Show message if no songs played yet
  if (recentlyPlayed.length === 0) {
    return (
      <div className="xl:ml-6 ml-0 xl:mb-0 mb-6 flex-1 xl:max-w-[500px] max-w-full flex flex-col">
        <div className="w-full flex flex-col">
          <h2 className="text-white font-bold text-2xl mb-4">Recently Played</h2>
          <p className="text-gray-400 text-sm">Start playing songs to see your history</p>
        </div>
      </div>
    );
  }

  return (
    <div className="xl:ml-6 ml-0 xl:mb-0 mb-6 flex-1 xl:max-w-[500px] max-w-full flex flex-col">
      <div className="w-full flex flex-col">
        <div className="flex flex-row justify-between items-center mb-4">
          <h2 className="text-white font-bold text-2xl">Recently Played</h2>
        </div>

        <div className="flex flex-col gap-2">
          {recentlyPlayed.slice(0, 5).map((song, i) => (
            <div
              key={`recent-${song.key}-${i}`}
              className={`w-full flex items-center hover:bg-[#4c426e] ${
                activeSong?.key === song?.key ? "bg-[#4c426e]" : "bg-transparent"
              } py-2 px-3 rounded-lg cursor-pointer transition-all duration-200`}
            >
              <span className="text-gray-500 text-sm w-4 mr-3">{i + 1}</span>
              
              <img 
                className="w-12 h-12 rounded-md mr-3" 
                src={song?.images?.coverart || 'https://via.placeholder.com/48x48.png?text=No+Image'} 
                alt={song?.title} 
              />
              
              <div className="flex-1 flex flex-col justify-center">
                <Link to={`/songs/${song.key}`}>
                  <p className="text-white font-medium text-sm hover:underline truncate">
                    {song?.title}
                  </p>
                </Link>
                <p className="text-gray-400 text-xs truncate">{song?.subtitle}</p>
              </div>

              <PlayPause
                isPlaying={isPlaying}
                activeSong={activeSong}
                song={song}
                handlePause={handlePauseClick}
                handlePlay={() => handlePlayClick(song, i)}
              />
            </div>
          ))}
        </div>

        {recentlyPlayed.length > 5 && (
          <p className="text-gray-500 text-xs text-center mt-3">
            +{recentlyPlayed.length - 5} more in history
          </p>
        )}
      </div>
    </div>
  );
};

export default RecentlyPlayed;