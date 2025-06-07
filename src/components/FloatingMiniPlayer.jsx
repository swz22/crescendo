import { useSelector, useDispatch } from 'react-redux';
import { playPause, nextSong, prevSong } from '../redux/features/playerSlice';
import { MdSkipNext, MdSkipPrevious } from 'react-icons/md';
import { BsFillPauseFill, BsFillPlayFill } from 'react-icons/bs';

const FloatingMiniPlayer = ({ isVisible }) => {
  const { activeSong, currentSongs, currentIndex, isActive, isPlaying } = useSelector((state) => state.player);
  const dispatch = useDispatch();

  if (!activeSong?.title || !isVisible) return null;

  const handlePlayPause = () => {
    if (!isActive) return;
    dispatch(playPause(!isPlaying));
  };

  const handleNextSong = () => {
    dispatch(playPause(false));
    dispatch(nextSong((currentIndex + 1) % currentSongs.length));
  };

  const handlePrevSong = () => {
    if (currentIndex === 0) {
      dispatch(prevSong(currentSongs.length - 1));
    } else {
      dispatch(prevSong(currentIndex - 1));
    }
  };

  // Get song image
  const getSongImage = () => {
    if (activeSong.images?.coverart) return activeSong.images.coverart;
    if (activeSong.share?.image) return activeSong.share.image;
    if (activeSong.images?.background) return activeSong.images.background;
    return 'https://via.placeholder.com/64x64.png?text=No+Image';
  };

  return (
    <div className={`fixed bottom-8 right-8 z-[60] transition-all duration-300 ${
      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
    }`}>
      <div className="bg-gradient-to-br from-purple-900/95 to-black/95 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-white/10 min-w-[320px]">
        <div className="flex items-center gap-4">
          {/* Album Art */}
          <div className="relative group">
            <img 
              src={getSongImage()} 
              alt="cover" 
              className="w-16 h-16 rounded-lg shadow-lg"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/64x64.png?text=No+Image';
              }}
            />
            <div className={`absolute inset-0 rounded-lg bg-black/40 flex items-center justify-center ${
              isPlaying ? 'opacity-0' : 'opacity-100'
            }`}>
              <BsFillPlayFill className="text-white text-2xl" />
            </div>
          </div>

          {/* Song Info */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm truncate">
              {activeSong?.title}
            </p>
            <p className="text-gray-400 text-xs truncate">
              {activeSong?.subtitle || activeSong?.artist || 'Unknown Artist'}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevSong}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <MdSkipPrevious size={24} className="text-white" />
            </button>
            
            <button
              onClick={handlePlayPause}
              className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              {isPlaying ? (
                <BsFillPauseFill size={24} className="text-white" />
              ) : (
                <BsFillPlayFill size={24} className="text-white translate-x-0.5" />
              )}
            </button>
            
            <button
              onClick={handleNextSong}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <MdSkipNext size={24} className="text-white" />
            </button>
          </div>
        </div>

        {/* Progress indicator */}
        {isPlaying && (
          <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse" 
                 style={{ width: '45%' }} />
          </div>
        )}
      </div>
    </div>
  );
};

export default FloatingMiniPlayer;