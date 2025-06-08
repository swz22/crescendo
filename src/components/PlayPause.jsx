import { FaPauseCircle, FaPlayCircle } from "react-icons/fa";

const PlayPause = ({ isPlaying, activeSong, song, handlePause, handlePlay }) =>
  isPlaying && activeSong?.title === song.title ? (
    <FaPauseCircle 
      size={45} 
      className="text-white drop-shadow-lg cursor-pointer hover:scale-110 transition-all duration-200" 
      onClick={handlePause} 
    />
  ) : (
    <FaPlayCircle 
      size={45} 
      className="text-white drop-shadow-lg cursor-pointer hover:scale-110 transition-all duration-200" 
      onClick={handlePlay} 
    />
  );

export default PlayPause;