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
  const pendingPlayRef = useRef(false);
  const { setAudioElement } = useAudioState();
  const { registerAudioElement, cleanupExceptCurrent } = useAudioCleanup();

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  useEffect(() => {
    return () => {
      if (ref.current) {
        ref.current.pause();
        ref.current.src = "";
        ref.current.load();
      }
    };
  }, []);

  useEffect(() => {
    if (ref.current) {
      setAudioElement(ref.current);
      registerAudioElement(ref.current);
      cleanupExceptCurrent(ref.current);
      ref.current.volume = Math.max(0, Math.min(1, volumeRef.current));
    }
  }, []);

  // Handle source changes
  useEffect(() => {
    if (!ref.current || !songUrl) return;

    const audioHasUrl =
      ref.current.src === songUrl ||
      (ref.current.src && ref.current.src.includes(songUrl));

    // Reset error state if new song
    if (currentUrlRef.current !== songUrl) {
      setHasError(false);
      currentUrlRef.current = songUrl;
    }

    // Skip if URL already loaded
    if (audioHasUrl && currentUrlRef.current === songUrl) {
      return;
    }

    // Only reload if actually a different song
    if (!audioHasUrl) {
      if (ref.current.src) {
        ref.current.pause();
        ref.current.currentTime = 0;
      }

      isLoadingRef.current = true;
      setIsReady(false);
      setHasError(false);

      ref.current.src = songUrl;
      ref.current.volume = Math.max(0, Math.min(1, volumeRef.current));
      ref.current.load();

      if (onLoadStart) {
        onLoadStart();
      }
    }
  }, [songUrl]);

  // Handle play/pause
  useEffect(() => {
    if (!ref.current || !songUrl || hasError) return;

    if (isPlaying) {
      ref.current.volume = Math.max(0, Math.min(1, volumeRef.current));

      if (!isReady) {
        pendingPlayRef.current = true;
        return;
      }

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
      pendingPlayRef.current = false;
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

  const handleCanPlay = () => {
    setIsReady(true);
    setHasError(false);

    if (ref.current) {
      ref.current.volume = Math.max(0, Math.min(1, volumeRef.current));
    }

    // Execute pending play if needed
    if (pendingPlayRef.current && ref.current && isPlaying) {
      pendingPlayRef.current = false;
      ref.current.play().catch((error) => {
        if (error.name !== "AbortError") {
          console.error("Error playing audio after ready:", error);
        }
      });
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
    if (ref.current) {
      ref.current.volume = Math.max(0, Math.min(1, volumeRef.current));
    }

    if (onLoadedData) {
      onLoadedData(e);
    }
  };

  const handleError = (e) => {
    const currentSrc = ref.current?.src || "";
    const isInvalidSrc =
      !currentSrc ||
      currentSrc === "" ||
      currentSrc === window.location.href ||
      (currentSrc.startsWith(window.location.origin) &&
        !currentSrc.includes("/api/"));

    if (isInvalidSrc) {
      return;
    }

    if (e.target.error?.code === 2 || e.target.error?.code === 3) {
      console.error("Audio error:", e.target.error);
      isLoadingRef.current = false;
      setHasError(true);
      setIsReady(false);
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

  if (!songUrl || songUrl === "") {
    return null;
  }

  return (
    <audio
      ref={ref}
      src={songUrl}
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
