import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { MdSkipNext, MdSkipPrevious } from "react-icons/md";
import {
  BsFillPauseFill,
  BsFillPlayFill,
  BsShuffle,
  BsArrowRepeat,
  BsVolumeDown,
  BsVolumeMute,
  BsVolumeUp,
} from "react-icons/bs";
import { HiOutlineQueueList } from "react-icons/hi2";
import {
  playPause,
  toggleShuffle,
  toggleRepeat,
  setVolume as setVolumeAction,
} from "../redux/features/playerSlice";
import { selectCurrentContextTracks } from "../redux/features/playerSelectors";
import { useSongNavigation } from "../hooks/useSongNavigation";
import { useAudioState } from "../hooks/useAudioState";

const ModalPlayer = ({ onOpenNowPlaying }) => {
  const dispatch = useDispatch();
  const { currentTrack, isPlaying, shuffle, repeat, volume } = useSelector(
    (state) => state.player
  );
  const tracks = useSelector(selectCurrentContextTracks);
  const queueCount = tracks.length;
  const { handleNextSong, handlePrevSong, isNavigating } = useSongNavigation();
  const { currentTime, duration, seek } = useAudioState();

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handlePlayPause = () => {
    if (currentTrack) {
      dispatch(playPause(!isPlaying));
    }
  };

  const handleSeekChange = (e) => {
    seek(parseFloat(e.target.value));
  };

  const handleVolumeChange = (e) => {
    dispatch(setVolumeAction(parseFloat(e.target.value)));
  };

  if (!currentTrack) return null;

  return (
    <div className="sticky bottom-0 bg-gradient-to-r from-[#1e1b4b]/98 to-[#2d2467]/98 backdrop-blur-xl border-t border-white/10 p-3">
      <div className="flex items-center gap-3">
        {/* Track Info - Only show when playing */}
        {currentTrack && (
          <div className="flex items-center gap-3 min-w-0 flex-shrink-0 w-[200px]">
            <img
              src={
                currentTrack?.images?.coverart ||
                currentTrack?.album?.images?.[0]?.url ||
                ""
              }
              alt="cover"
              className="w-10 h-10 rounded shadow-lg flex-shrink-0"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
            <div className="min-w-0 flex-1">
              <p className="text-white text-sm font-medium truncate">
                {currentTrack?.title || "Unknown"}
              </p>
              <p className="text-gray-400 text-xs truncate">
                {currentTrack?.subtitle || "Unknown Artist"}
              </p>
            </div>
          </div>
        )}

        {/* Playback Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => dispatch(toggleShuffle())}
            className={`p-1.5 rounded-lg transition-all ${
              shuffle
                ? "text-[#14b8a6] bg-[#14b8a6]/10"
                : "text-gray-400 hover:text-white"
            }`}
            title="Shuffle"
          >
            <BsShuffle size={14} />
          </button>

          <button
            onClick={handlePrevSong}
            className="p-1.5 text-white/80 hover:text-white transition-all"
            disabled={isNavigating}
          >
            <MdSkipPrevious size={20} />
          </button>

          <button
            onClick={handlePlayPause}
            className="p-2 bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-full transition-all mx-1"
          >
            {isPlaying ? (
              <BsFillPauseFill size={16} />
            ) : (
              <BsFillPlayFill size={16} className="translate-x-0.5" />
            )}
          </button>

          <button
            onClick={handleNextSong}
            className="p-1.5 text-white/80 hover:text-white transition-all"
            disabled={isNavigating}
          >
            <MdSkipNext size={20} />
          </button>

          <button
            onClick={() => dispatch(toggleRepeat())}
            className={`p-1.5 rounded-lg transition-all ${
              repeat
                ? "text-[#14b8a6] bg-[#14b8a6]/10"
                : "text-gray-400 hover:text-white"
            }`}
            title="Repeat"
          >
            <BsArrowRepeat size={14} />
          </button>
        </div>

        {/* Seekbar */}
        <div className="flex-1 flex items-center gap-2">
          <span className="text-xs text-gray-400 w-10 text-right">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={currentTime}
            onChange={handleSeekChange}
            className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white hover:[&::-webkit-slider-thumb]:bg-[#14b8a6] [&::-webkit-slider-thumb]:transition-colors"
          />
          <span className="text-xs text-gray-400 w-10">
            {formatTime(duration)}
          </span>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => dispatch(setVolumeAction(volume === 0 ? 0.5 : 0))}
            className="p-1.5 text-gray-400 hover:text-white transition-all"
          >
            {volume === 0 ? (
              <BsVolumeMute size={16} />
            ) : volume < 0.5 ? (
              <BsVolumeDown size={16} />
            ) : (
              <BsVolumeUp size={16} />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.1}
            value={volume}
            onChange={handleVolumeChange}
            className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white hover:[&::-webkit-slider-thumb]:bg-[#14b8a6] [&::-webkit-slider-thumb]:transition-colors"
          />
        </div>

        {/* Now Playing Button */}
        <button
          onClick={onOpenNowPlaying}
          className="relative p-2 text-gray-400 hover:text-white transition-all rounded-lg hover:bg-white/10"
          title="Open Now Playing"
        >
          <HiOutlineQueueList size={20} />
          {queueCount > 0 && (
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[#14b8a6] rounded-full flex items-center justify-center">
              <span className="text-[9px] font-bold text-white">
                {queueCount > 99 ? "99+" : queueCount}
              </span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default ModalPlayer;
