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
  useEffect(() => {
    if (!ref.current) return;

    // Don't try to play if no URL
    if (!songUrl) {
      console.log('No song URL available, skipping playback');
      return;
    }

    if (isPlaying && songUrl) {
      const playPromise = ref.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          // Only log if it's not an abort error (which is expected during transitions)
          if (error.name !== "AbortError") {
            console.error("Error playing audio:", error);
            // If autoplay is blocked, we'll need user interaction
            if (
              error.name === "NotAllowedError" ||
              error.name === "NotSupportedError"
            ) {
              console.log("Autoplay blocked - need user interaction");
            }
          }
        });
      }
    } else {
      ref.current.pause();
    }
  }, [isPlaying, songUrl]);

  useEffect(() => {
    if (ref.current) {
      ref.current.volume = volume;
    }
  }, [volume]);

  // Update seek time
  useEffect(() => {
    if (ref.current && songUrl) {
      ref.current.currentTime = seekTime;
    }
  }, [seekTime]);

  // Log when audio source changes
  useEffect(() => {
    console.log("Audio source changed:", songUrl);
    console.log("Active song details:", activeSong);
  }, [songUrl, activeSong]);

  // Don't render audio element if no URL
  if (!songUrl) {
    return null;
  }

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
        console.log("Error type:", e.target.error?.code);
        console.log("Error message:", e.target.error?.message);
      }}
    />
  );
};

export default Player;