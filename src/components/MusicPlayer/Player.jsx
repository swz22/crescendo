import React, { useRef, useEffect, useState } from "react";
import { useAudioState } from "../../hooks/useAudioState";
import { useAudioCleanup } from "../../hooks/useAudioCleanup";

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
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const isLoadingRef = useRef(false);
  const currentUrlRef = useRef(null);
  const volumeRef = useRef(volume);
  const { setAudioElement } = useAudioState();
  const { registerAudioElement, cleanupExceptCurrent } = useAudioCleanup();

  // Update volume ref when prop changes
  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (ref.current) {
        ref.current.pause();
        ref.current.src = "";
        ref.current.load();
      }
    };
  }, []);

  // Register audio element for global state
  useEffect(() => {
    if (ref.current) {
      setAudioElement(ref.current);
      registerAudioElement(ref.current);
      // Cleanup any other audio instances
      cleanupExceptCurrent(ref.current);
      // Set initial volume
      ref.current.volume = Math.max(0, Math.min(1, volumeRef.current));
    }
  }, [setAudioElement, registerAudioElement, cleanupExceptCurrent]);

  // Handle source changes
  useEffect(() => {
    if (!ref.current || !songUrl) return;

    // Prevent duplicate loads
    if (currentUrlRef.current === songUrl && !hasError) return;

    // Clean up previous audio
    if (ref.current.src) {
      ref.current.pause();
      ref.current.currentTime = 0;
    }

    currentUrlRef.current = songUrl;
    isLoadingRef.current = true;
    setIsReady(false);
    setHasError(false);

    // Set new source
    ref.current.src = songUrl;
    // Ensure volume is set before loading
    ref.current.volume = Math.max(0, Math.min(1, volumeRef.current));
    ref.current.load();

    if (onLoadStart) {
      onLoadStart();
    }
  }, [songUrl, onLoadStart, hasError]);

  // Handle play/pause
  useEffect(() => {
    if (!ref.current || !songUrl || !isReady || hasError) return;

    if (isPlaying) {
      // Ensure volume is set before playing
      ref.current.volume = Math.max(0, Math.min(1, volumeRef.current));

      const playPromise = ref.current.play();

      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          if (error.name !== "AbortError") {
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
    if (ref.current && typeof volume === "number") {
      const clampedVolume = Math.max(0, Math.min(1, volume));
      ref.current.volume = clampedVolume;
      volumeRef.current = clampedVolume;
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
    if (!isLoadingRef.current) return;

    isLoadingRef.current = false;
    setIsReady(true);
    setHasError(false);

    // Ensure volume is set when audio is ready
    if (ref.current) {
      ref.current.volume = Math.max(0, Math.min(1, volumeRef.current));
    }

    if (onCanPlay) {
      onCanPlay();
    }
  };

  const handleLoadStart = () => {
    setIsReady(false);
    if (onLoadStart) {
      onLoadStart();
    }
  };

  const handleLoadedData = (e) => {
    // Set volume when metadata is loaded
    if (ref.current) {
      ref.current.volume = Math.max(0, Math.min(1, volumeRef.current));
    }

    if (onLoadedData) {
      onLoadedData(e);
    }
  };

  const handleError = (e) => {
    if (!ref.current?.src) return;

    console.error("Audio error:", e.target.error);
    isLoadingRef.current = false;
    setHasError(true);
    setIsReady(false);
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
      onCanPlayThrough={handleCanPlay}
      onLoadStart={handleLoadStart}
      onError={handleError}
      preload="auto"
    />
  );
};

export default Player;
