import { BsMusicNoteList, BsClock, BsPlusCircle } from "react-icons/bs";
import { RiFolderMusicLine } from "react-icons/ri";

const PlaylistHeroSection = ({ stats, onCreatePlaylist }) => {
  const formatDuration = (ms) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} min`;
  };

  return (
    <div className="bg-gradient-to-r from-[#14b8a6]/10 via-purple-600/10 to-[#14b8a6]/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 border border-white/10">
      <div className="flex flex-col items-center gap-4 lg:gap-5">
        {/* Title  */}
        <h2 className="text-lg sm:text-lg lg:text-2xl font-bold text-white text-center">Your Music Collection</h2>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:gap-6 w-full max-w-2xl mx-auto">
          {/* Playlists Count */}
          <div className="bg-white/5 backdrop-blur-sm rounded-lg lg:rounded-xl p-3 sm:p-4 lg:p-5 border border-white/10">
            <div className="flex flex-col items-center justify-center text-center h-full">
              <div className="p-2 rounded-lg bg-gradient-to-br from-[#14b8a6]/20 to-cyan-500/20 mb-2">
                <RiFolderMusicLine className="w-5 h-5 lg:w-6 lg:h-6 text-[#14b8a6]" />
              </div>
              <p className="text-[11px] sm:text-xs lg:text-sm text-gray-400 whitespace-nowrap">Playlists</p>
              <p className="text-xl sm:text-xl lg:text-2xl xl:text-2xl font-bold text-white">{stats.playlistCount}</p>
            </div>
          </div>

          {/* Total Tracks */}
          <div className="bg-white/5 backdrop-blur-sm rounded-lg lg:rounded-xl p-3 sm:p-4 lg:p-5 border border-white/10">
            <div className="flex flex-col items-center justify-center text-center h-full">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 mb-2">
                <BsMusicNoteList className="w-5 h-5 lg:w-6 lg:h-6 text-purple-400" />
              </div>
              <p className="text-[11px] sm:text-xs lg:text-sm text-gray-400 whitespace-nowrap">Total Tracks</p>
              <p className="text-xl sm:text-xl lg:text-2xl xl:text-2xl font-bold text-white">{stats.totalTracks}</p>
            </div>
          </div>

          {/* Total Duration */}
          <div className="bg-white/5 backdrop-blur-sm rounded-lg lg:rounded-xl p-3 sm:p-4 lg:p-5 border border-white/10">
            <div className="flex flex-col items-center justify-center text-center h-full">
              <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20 mb-2">
                <BsClock className="w-5 h-5 lg:w-6 lg:h-6 text-orange-400" />
              </div>
              <p className="text-[11px] sm:text-xs lg:text-sm text-gray-400 whitespace-nowrap">Total Time</p>
              <p className="text-xl sm:text-xl lg:text-2xl xl:text-2xl font-bold text-white whitespace-nowrap">
                {formatDuration(stats.totalDuration)}
              </p>
            </div>
          </div>
        </div>

        {/* Create button */}
        <button
          onClick={onCreatePlaylist}
          className="group relative flex items-center gap-2 bg-gradient-to-r from-[#14b8a6] to-[#0d9488] hover:from-[#0d9488] hover:to-[#14b8a6] text-white font-semibold py-2.5 sm:py-3 px-6 sm:px-8 rounded-full transition-all transform hover:scale-105 shadow-xl shadow-[#14b8a6]/30 justify-center text-sm sm:text-base"
        >
          <BsPlusCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="whitespace-nowrap">Create Playlist</span>
          <div className="absolute inset-0 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
        </button>
      </div>
    </div>
  );
};

export default PlaylistHeroSection;
