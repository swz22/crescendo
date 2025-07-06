import { HiOutlinePlus, HiOutlineSparkles } from "react-icons/hi";
import { BsMusicNoteList } from "react-icons/bs";

const EmptyPlaylistsState = ({ onCreatePlaylist }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      {/* Animated Background */}
      <div className="relative mb-8">
        <div
          className="w-32 h-32 bg-gradient-to-br from-[#14b8a6]/20 to-[#7c3aed]/20 rounded-full 
          blur-2xl absolute -top-8 -left-8 animate-blob"
        ></div>
        <div
          className="w-32 h-32 bg-gradient-to-br from-[#0891b2]/20 to-[#14b8a6]/20 rounded-full 
          blur-2xl absolute -bottom-8 -right-8 animate-blob animation-delay-2000"
        ></div>

        <div
          className="relative w-40 h-40 bg-gradient-to-br from-[#2d2467]/50 to-[#1a1848]/50 
          backdrop-blur-xl rounded-full flex items-center justify-center border border-white/10"
        >
          <BsMusicNoteList className="w-20 h-20 text-white/30" />

          {/* Floating music notes */}
          <div className="absolute top-0 right-0">
            <div className="animate-float-note-1">
              <HiOutlineSparkles className="w-6 h-6 text-[#14b8a6]/60" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0">
            <div className="animate-float-note-2">
              <HiOutlineSparkles className="w-5 h-5 text-[#7c3aed]/60" />
            </div>
          </div>
          <div className="absolute top-1/2 -right-8">
            <div className="animate-float-note-3">
              <HiOutlineSparkles className="w-4 h-4 text-[#0891b2]/60" />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <h2 className="text-3xl font-bold text-white mb-4 text-center">
        Start Your Music Journey
      </h2>
      <p className="text-gray-300 text-center max-w-md mb-8 leading-relaxed">
        Create your first playlist and organize your favorite tracks. Build the
        perfect soundtrack for every moment of your day.
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={onCreatePlaylist}
          className="group relative flex items-center gap-3 bg-gradient-to-r from-[#14b8a6] to-[#0d9488] 
            hover:from-[#0d9488] hover:to-[#14b8a6] text-white font-semibold py-3 px-6 rounded-full 
            transition-all transform hover:scale-105 shadow-xl shadow-[#14b8a6]/30"
        >
          <div
            className="absolute inset-0 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 
            transition-opacity duration-300 blur-xl"
          ></div>
          <HiOutlinePlus className="w-5 h-5 relative z-10" />
          <span className="relative z-10">Create Your First Playlist</span>
        </button>
      </div>

      {/* Tips */}
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl">
        <div className="text-center">
          <div className="w-12 h-12 bg-[#14b8a6]/20 rounded-lg flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">🎵</span>
          </div>
          <h3 className="text-white font-semibold mb-1">Organize by Mood</h3>
          <p className="text-sm text-gray-400">
            Create playlists for different vibes and occasions
          </p>
        </div>

        <div className="text-center">
          <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">🎨</span>
          </div>
          <h3 className="text-white font-semibold mb-1">Custom Artwork</h3>
          <p className="text-sm text-gray-400">
            Each playlist gets unique art from your tracks
          </p>
        </div>

        <div className="text-center">
          <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">♾️</span>
          </div>
          <h3 className="text-white font-semibold mb-1">Unlimited Playlists</h3>
          <p className="text-sm text-gray-400">
            Create as many playlists as you want
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmptyPlaylistsState;
