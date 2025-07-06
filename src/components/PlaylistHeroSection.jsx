import { HiOutlinePlus, HiOutlineSparkles } from "react-icons/hi";
import { BsMusicNoteList, BsClock, BsCollection } from "react-icons/bs";

const PlaylistHeroSection = ({ stats, onCreatePlaylist }) => {
  const formatDuration = (ms) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} minutes`;
  };

  return (
    <div
      className="relative mb-8 p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-[#2d2467]/50 to-[#1a1848]/50 
      backdrop-blur-xl border border-white/10 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-60 h-60 bg-[#14b8a6] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob" />
        <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-[#7c3aed] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Your Music Collection
            </h2>
            <p className="text-gray-300">
              {stats.playlistCount === 0
                ? "Start building your personal library"
                : `${stats.playlistCount} playlist${
                    stats.playlistCount !== 1 ? "s" : ""
                  } created`}
            </p>
          </div>

          <button
            onClick={onCreatePlaylist}
            className="mt-4 sm:mt-0 group relative flex items-center gap-2 bg-gradient-to-r from-[#14b8a6] to-[#0d9488] 
              hover:from-[#0d9488] hover:to-[#14b8a6] text-white font-semibold py-3 px-6 rounded-full 
              transition-all transform hover:scale-105 shadow-xl shadow-[#14b8a6]/30"
          >
            <div
              className="absolute inset-0 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 
              transition-opacity duration-300 blur-xl"
            ></div>
            <HiOutlinePlus className="w-5 h-5 relative z-10" />
            <span className="relative z-10">Create Playlist</span>
          </button>
        </div>

        {/* Stats Grid */}
        {stats.playlistCount > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Total Playlists */}
            <div
              className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 
              hover:bg-white/10 transition-all duration-300 group"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#14b8a6]/20 rounded-lg group-hover:bg-[#14b8a6]/30 transition-colors">
                  <BsCollection className="w-6 h-6 text-[#14b8a6]" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Playlists</p>
                  <p className="text-2xl font-bold text-white">
                    {stats.playlistCount}
                  </p>
                </div>
              </div>
            </div>

            {/* Total Tracks */}
            <div
              className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 
              hover:bg-white/10 transition-all duration-300 group"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors">
                  <BsMusicNoteList className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Tracks</p>
                  <p className="text-2xl font-bold text-white">
                    {stats.totalTracks}
                  </p>
                </div>
              </div>
            </div>

            {/* Total Duration */}
            <div
              className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 
              hover:bg-white/10 transition-all duration-300 group"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                  <BsClock className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Time</p>
                  <p className="text-2xl font-bold text-white">
                    {formatDuration(stats.totalDuration)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Text for New Users */}
        {stats.playlistCount === 0 && (
          <div className="flex items-center gap-2 text-gray-300 mt-4">
            <HiOutlineSparkles className="w-5 h-5 text-[#14b8a6]" />
            <p>
              Create your first playlist and start organizing your favorite
              tracks!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaylistHeroSection;
