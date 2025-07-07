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
    <div className="bg-gradient-to-r from-[#14b8a6]/10 via-purple-600/10 to-[#14b8a6]/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border border-white/10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
        {/* Title and stats */}
        <div className="w-full sm:w-auto">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3 sm:mb-4">
            Your Music Collection
          </h2>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {/* Playlists Count */}
            <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/10">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-[#14b8a6]/20 to-cyan-500/20">
                  <RiFolderMusicLine className="w-4 h-4 sm:w-5 sm:h-5 text-[#14b8a6]" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-gray-400">
                    Playlists
                  </p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                    {stats.playlistCount}
                  </p>
                </div>
              </div>
            </div>

            {/* Total Tracks */}
            <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/10">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                  <BsMusicNoteList className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-gray-400">
                    Total Tracks
                  </p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                    {stats.totalTracks}
                  </p>
                </div>
              </div>
            </div>

            {/* Total Duration */}
            <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/10 col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20">
                  <BsClock className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-gray-400">
                    Total Time
                  </p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                    {formatDuration(stats.totalDuration)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Create button */}
        <button
          onClick={onCreatePlaylist}
          className="group relative flex items-center gap-2 bg-gradient-to-r from-[#14b8a6] to-[#0d9488] hover:from-[#0d9488] hover:to-[#14b8a6] text-white font-semibold py-2.5 sm:py-3 px-4 sm:px-6 rounded-full transition-all transform hover:scale-105 shadow-xl shadow-[#14b8a6]/30 w-full sm:w-auto justify-center text-sm sm:text-base"
        >
          <BsPlusCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Create Playlist</span>
          <div className="absolute inset-0 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
        </button>
      </div>
    </div>
  );
};

export default PlaylistHeroSection;
