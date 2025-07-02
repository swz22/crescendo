import React from "react";
import { useSelector } from "react-redux";
import { FaPauseCircle, FaPlayCircle } from "react-icons/fa";
import { isTrackPlaying } from "../utils/trackUtils";

const PlayPause = ({ song, handlePause, handlePlay, size = 45 }) => {
  const { currentTrack, isPlaying } = useSelector((state) => state.player);
  const isCurrentlyPlaying = isTrackPlaying(song, currentTrack, isPlaying);

  return isCurrentlyPlaying ? (
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
};

export default PlayPause;
