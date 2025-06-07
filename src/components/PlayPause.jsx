import { FaPauseCircle, FaPlayCircle } from "react-icons/fa";

const PlayPause = ({ isPlaying, activeSong, song, handlePause, handlePlay }) =>
  isPlaying && activeSong?.title === song.title ? (
    <FaPauseCircle size={35} className="text-gray-300 play-btn-scale" onClick={handlePause} />
  ) : (
    <FaPlayCircle size={35} className="text-gray-300 play-btn-scale" onClick={handlePlay} />
  );

export default PlayPause;