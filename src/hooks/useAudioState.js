import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";

// Global audio state for synchronization
let globalAudioElement = null;
let audioStateListeners = new Set();

const notifyListeners = (state) => {
  audioStateListeners.forEach((listener) => listener(state));
};

export const useAudioState = () => {
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const { isPlaying, volume } = useSelector((state) => state.player);

  useEffect(() => {
    const handleUpdate = (state) => {
      if (state.duration !== undefined) setDuration(state.duration);
      if (state.currentTime !== undefined) setCurrentTime(state.currentTime);
      if (state.isBuffering !== undefined) setIsBuffering(state.isBuffering);
    };

    audioStateListeners.add(handleUpdate);

    return () => {
      audioStateListeners.delete(handleUpdate);
    };
  }, []);

  // Sync volume with global audio element
  useEffect(() => {
    if (globalAudioElement && typeof volume === "number") {
      globalAudioElement.volume = Math.max(0, Math.min(1, volume));
    }
  }, [volume]);

  const setAudioElement = useCallback((element) => {
    if (!element || globalAudioElement === element) return;

    globalAudioElement = element;

    const updateTime = () => {
      if (globalAudioElement) {
        notifyListeners({
          currentTime: globalAudioElement.currentTime,
          duration: globalAudioElement.duration || 0,
        });
      }
    };

    const updateDuration = () => {
      if (globalAudioElement) {
        notifyListeners({
          duration: globalAudioElement.duration || 0,
        });
      }
    };

    const updateBuffering = (buffering) => {
      notifyListeners({ isBuffering: buffering });
    };

    if (element) {
      element.addEventListener("timeupdate", updateTime);
      element.addEventListener("loadedmetadata", updateDuration);
      element.addEventListener("durationchange", updateDuration);
      element.addEventListener("waiting", () => updateBuffering(true));
      element.addEventListener("playing", () => updateBuffering(false));
      element.addEventListener("canplay", () => updateBuffering(false));
    }
  }, []);

  const seek = useCallback(
    (time) => {
      if (globalAudioElement && !isNaN(time)) {
        globalAudioElement.currentTime = Math.max(0, Math.min(time, duration));
      }
    },
    [duration]
  );

  return {
    duration,
    currentTime,
    isBuffering,
    seek,
    setAudioElement,
  };
};
