import React, { useRef, useEffect, useState } from "react";

const Player = ({
  activeSong,
  isPlaying,
  volume,
  seekTime,
  onEnded,
  onTimeUpdate,
  onLoadedData,
  onCanPlay,
  onLoadStart,
  repeat,
  songUrl,
}) => {
  const ref = useRef(null);
  const currentUrlRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  // Handle source changes - optimized
  useEffect(() => {
    if (!ref.current || !songUrl) return;

    // Only change source if it's actually different
    if (currentUrlRef.current !== songUrl) {
      currentUrlRef.current = songUrl;
      setIsReady(false);
      
      // Notify parent that loading has started
      if (onLoadStart) {
        onLoadStart();
      }
      
      // Don't call load() - let browser handle it
      ref.current.src = songUrl;
      
      // For better performance, we can try to preload
      ref.current.preload = 'auto';
    }
  }, [songUrl, onLoadStart]);

  // Handle play/pause - optimized
  useEffect(() => {
    if (!ref.current || !songUrl || !isReady) return;

    if (isPlaying) {
      // Play immediately without delay
      const playPromise = ref.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          if (error.name !== "AbortError") {
            console.error("Error playing audio:", error);
          }
        });
      }
    } else {
      ref.current.pause();
    }
  }, [isPlaying, songUrl, isReady]);

  // Handle volume changes
  useEffect(() => {
    if (ref.current) {
      ref.current.volume = volume;
    }
  }, [volume]);

  // Handle seek
  useEffect(() => {
    if (ref.current && seekTime !== undefined && !isNaN(seekTime)) {
      ref.current.currentTime = seekTime;
    }
  }, [seekTime]);

  // Handle audio ready state
  const handleCanPlay = () => {
    setIsReady(true);
    
    // Notify parent
    if (onCanPlay) {
      onCanPlay();
    }
    
    // If we should be playing and we just became ready, play
    if (isPlaying && ref.current) {
      ref.current.play().catch(error => {
        if (error.name !== "AbortError") {
          console.error("Error auto-playing:", error);
        }
      });
    }
  };

  const handleLoadStart = () => {
    setIsReady(false);
    if (onLoadStart) {
      onLoadStart();
    }
  };

  const handleLoadedData = (e) => {
    if (onLoadedData) {
      onLoadedData(e);
    }
  };

  if (!songUrl) {
    return null;
  }

  return (
    <audio
      ref={ref}
      loop={repeat}
      onEnded={onEnded}
      onTimeUpdate={onTimeUpdate}
      onLoadedData={handleLoadedData}
      onCanPlay={handleCanPlay}
      onLoadStart={handleLoadStart}
      onWaiting={() => {
      }}
      onError={(e) => {
        console.error("Audio error:", e.target.error);
        setIsReady(false);
      }}
      preload="auto"
    />
  );
};

export default Player;