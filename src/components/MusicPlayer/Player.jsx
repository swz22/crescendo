import React, { useRef, useEffect, useState } from "react";
import { useAudioPreload } from "../../hooks/useAudioPreload";

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
  const isMountedRef = useRef(true);
  const { setAudioElement, getPreloadedUrl } = useAudioPreload();
  const currentUrlRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Add cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Register audio element globally
  useEffect(() => {
    if (ref.current) {
      setAudioElement(ref.current);
    }
  }, [setAudioElement]);

  // Handle source changes - optimized
  useEffect(() => {
    if (!ref.current || !songUrl) return;

    // Check for preloaded URL
    const songId = activeSong?.key || activeSong?.id || activeSong?.track_id;
    const preloadedUrl = songId ? getPreloadedUrl(songId) : null;
    const urlToUse = preloadedUrl || songUrl;

    // Only change source if it's actually different
    if (currentUrlRef.current !== urlToUse) {
      currentUrlRef.current = urlToUse;
      setIsReady(false);
      setHasError(false);

      // Notify parent that loading has started
      if (onLoadStart) {
        onLoadStart();
      }

      // Clean previous source
      ref.current.pause();

      // Set new source
      ref.current.src = urlToUse;
      ref.current.load();

      // For better performance
      ref.current.preload = "auto";
    }
  }, [songUrl, activeSong, getPreloadedUrl, onLoadStart]);

  // Handle play/pause
  useEffect(() => {
    if (!ref.current || !songUrl || !isReady || hasError) return;

    if (isPlaying) {
      const playPromise = ref.current.play();

      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          if (error.name === "NotAllowedError") {
            // Browser blocked autoplay, user interaction needed
            console.log("Autoplay blocked, user interaction required");
          } else if (error.name !== "AbortError") {
            console.error("Error playing audio:", error);
            setHasError(true);
          }
        });
      }
    } else {
      ref.current.pause();
    }
  }, [isPlaying, songUrl, isReady, hasError]);

  // Handle volume changes
  useEffect(() => {
    if (ref.current) {
      ref.current.volume = Math.max(0, Math.min(1, volume));
    }
  }, [volume]);

  // Handle seek
  useEffect(() => {
    if (ref.current && seekTime !== undefined && !isNaN(seekTime) && isReady) {
      ref.current.currentTime = seekTime;
    }
  }, [seekTime, isReady]);

  // Event handlers
  const handleCanPlay = () => {
    setIsReady(true);
    setHasError(false);

    if (onCanPlay) {
      onCanPlay();
    }

    // Auto-play if should be playing
    if (isPlaying && ref.current && ref.current.paused) {
      ref.current.play().catch((error) => {
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

  const handleError = (e) => {
    console.error("Audio error:", e.target.error);
    if (isMountedRef.current) {
      setHasError(true);
      setIsReady(false);
    }
    // Try fallback to original URL if using preloaded
    const songId = activeSong?.key || activeSong?.id || activeSong?.track_id;
    const preloadedUrl = songId ? getPreloadedUrl(songId) : null;

    if (
      preloadedUrl &&
      ref.current.src === preloadedUrl &&
      songUrl !== preloadedUrl
    ) {
      console.log("Falling back to original URL");
      ref.current.src = songUrl;
      ref.current.load();
    }
  };

  const handleEnded = () => {
    if (repeat && ref.current) {
      ref.current.currentTime = 0;
      ref.current.play();
    } else if (onEnded) {
      onEnded();
    }
  };

  if (!songUrl) {
    return null;
  }

  return (
    <audio
      ref={ref}
      onEnded={handleEnded}
      onTimeUpdate={onTimeUpdate}
      onLoadedData={handleLoadedData}
      onCanPlay={handleCanPlay}
      onLoadStart={handleLoadStart}
      onError={handleError}
      onStalled={() => console.log("Audio stalled")}
      onWaiting={() => console.log("Audio waiting")}
      preload="auto"
      crossOrigin="anonymous"
    />
  );
};

export default Player;
