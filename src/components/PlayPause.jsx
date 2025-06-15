import { FaPauseCircle, FaPlayCircle } from "react-icons/fa";

const PlayPause = ({
  isPlaying,
  activeSong,
  song,
  handlePause,
  handlePlay,
  size = 45,
}) =>
  isPlaying && activeSong?.title === song.title ? (
    <FaPauseCircle
      size={size}
      className="text-white drop-shadow-lg cursor-pointer hover:scale-110 transition-all duration-200"
      onClick={handlePause}
    />
  ) : (
    <FaPlayCircle
      size={size}
      className="text-white drop-shadow-lg cursor-pointer hover:scale-110 transition-all duration-200"
      onClick={handlePlay}
    />
  );

export default PlayPause;
