import { useState, useEffect, useCallback, useRef } from "react";
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

  // Store event handlers in refs
  const handlersRef = useRef({});

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
    if (!element) return;

    // Clean up previous element's event listeners if it's a different element
    if (
      globalAudioElement &&
      globalAudioElement !== element &&
      handlersRef.current.element === globalAudioElement
    ) {
      const handlers = handlersRef.current;
      if (handlers.updateTime) {
        globalAudioElement.removeEventListener(
          "timeupdate",
          handlers.updateTime
        );
      }
      if (handlers.updateDuration) {
        globalAudioElement.removeEventListener(
          "loadedmetadata",
          handlers.updateDuration
        );
        globalAudioElement.removeEventListener(
          "durationchange",
          handlers.updateDuration
        );
      }
      if (handlers.updateBufferingWaiting) {
        globalAudioElement.removeEventListener(
          "waiting",
          handlers.updateBufferingWaiting
        );
      }
      if (handlers.updateBufferingPlaying) {
        globalAudioElement.removeEventListener(
          "playing",
          handlers.updateBufferingPlaying
        );
      }
      if (handlers.updateBufferingCanPlay) {
        globalAudioElement.removeEventListener(
          "canplay",
          handlers.updateBufferingCanPlay
        );
      }
    }

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

    const updateBufferingWaiting = () => notifyListeners({ isBuffering: true });
    const updateBufferingPlaying = () =>
      notifyListeners({ isBuffering: false });
    const updateBufferingCanPlay = () =>
      notifyListeners({ isBuffering: false });

    // Remove any existing listeners first
    element.removeEventListener("timeupdate", updateTime);
    element.removeEventListener("loadedmetadata", updateDuration);
    element.removeEventListener("durationchange", updateDuration);
    element.removeEventListener("waiting", updateBufferingWaiting);
    element.removeEventListener("playing", updateBufferingPlaying);
    element.removeEventListener("canplay", updateBufferingCanPlay);

    // Store handlers for cleanup
    handlersRef.current = {
      element,
      updateTime,
      updateDuration,
      updateBufferingWaiting,
      updateBufferingPlaying,
      updateBufferingCanPlay,
    };

    // Always add fresh event listeners
    element.addEventListener("timeupdate", updateTime);
    element.addEventListener("loadedmetadata", updateDuration);
    element.addEventListener("durationchange", updateDuration);
    element.addEventListener("waiting", updateBufferingWaiting);
    element.addEventListener("playing", updateBufferingPlaying);
    element.addEventListener("canplay", updateBufferingCanPlay);
  }, []);

  const seek = useCallback(
    (time) => {
      if (globalAudioElement && !isNaN(time)) {
        globalAudioElement.currentTime = Math.max(0, Math.min(time, duration));
      }
    },
    [duration]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up any remaining event listeners
      if (
        globalAudioElement &&
        handlersRef.current.element === globalAudioElement
      ) {
        const handlers = handlersRef.current;
        if (handlers.updateTime) {
          globalAudioElement.removeEventListener(
            "timeupdate",
            handlers.updateTime
          );
        }
        if (handlers.updateDuration) {
          globalAudioElement.removeEventListener(
            "loadedmetadata",
            handlers.updateDuration
          );
          globalAudioElement.removeEventListener(
            "durationchange",
            handlers.updateDuration
          );
        }
        if (handlers.updateBufferingWaiting) {
          globalAudioElement.removeEventListener(
            "waiting",
            handlers.updateBufferingWaiting
          );
        }
        if (handlers.updateBufferingPlaying) {
          globalAudioElement.removeEventListener(
            "playing",
            handlers.updateBufferingPlaying
          );
        }
        if (handlers.updateBufferingCanPlay) {
          globalAudioElement.removeEventListener(
            "canplay",
            handlers.updateBufferingCanPlay
          );
        }
      }
    };
  }, []);

  return {
    duration,
    currentTime,
    isBuffering,
    seek,
    setAudioElement,
  };
};
