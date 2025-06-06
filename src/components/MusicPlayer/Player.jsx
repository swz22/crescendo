import React, { useRef, useEffect } from "react";

const Player = ({
  activeSong,
  isPlaying,
  volume,
  seekTime,
  onEnded,
  onTimeUpdate,
  onLoadedData,
  repeat,
  songUrl,
}) => {
  const ref = useRef(null);

  // Handle play/pause
  if (ref.current) {
    if (isPlaying) {
      ref.current.play().catch((error) => {
        console.error("Error playing audio:", error);
      });
    } else {
      ref.current.pause();
    }
  }

  useEffect(() => {
    if (ref.current) {
      ref.current.volume = volume;
    }
  }, [volume]);

  // Update seek time
  useEffect(() => {
    if (ref.current) {
      ref.current.currentTime = seekTime;
    }
  }, [seekTime]);

  return (
    <audio
      src={songUrl}
      ref={ref}
      loop={repeat}
      onEnded={onEnded}
      onTimeUpdate={onTimeUpdate}
      onLoadedData={onLoadedData}
      onError={(e) => {
        console.error("Audio playback error:", e);
        console.log("Failed URL:", songUrl);
        console.log("Active Song:", activeSong);
      }}
    />
  );
};

export default Player;
