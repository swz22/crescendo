import { useCallback, useRef, useEffect } from "react";

// Global audio element for consistent playback
let globalAudioElement = null;

// Preloaded audio buffers
const audioBuffers = new Map();
const bufferUrls = new Map(); // Track blob URLs for cleanup

// Cleanup old blob URLs
const cleanupBlobUrl = (url) => {
  if (url && url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
};

// Maximum cached audio buffers
const MAX_CACHED_BUFFERS = 20;

export const useAudioPreload = () => {
  const cleanupTimeoutRef = useRef(null);

  // Set the main audio element reference
  const setAudioElement = useCallback((element) => {
    globalAudioElement = element;

    // Add event listeners for better resource management
    if (element) {
      element.addEventListener("error", (e) => {
        console.error("Audio playback error:", e);
      });

      element.addEventListener("stalled", () => {
        console.warn("Audio playback stalled");
      });
    }
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
      }
    };
  }, []);

  // Preload audio with proper cleanup
  const preloadAudio = useCallback(async (songId, previewUrl) => {
    if (!previewUrl || audioBuffers.has(songId)) {
      return true;
    }

    try {
      // Check cache size and clean if needed
      if (audioBuffers.size >= MAX_CACHED_BUFFERS) {
        // Remove oldest entries (first half)
        const entriesToRemove = Math.floor(MAX_CACHED_BUFFERS / 2);
        const iterator = audioBuffers.entries();

        for (let i = 0; i < entriesToRemove; i++) {
          const [oldSongId] = iterator.next().value;
          const oldBlobUrl = bufferUrls.get(oldSongId);

          if (oldBlobUrl) {
            cleanupBlobUrl(oldBlobUrl);
            bufferUrls.delete(oldSongId);
          }

          audioBuffers.delete(oldSongId);
        }
      }

      // Fetch with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(previewUrl, {
        signal: controller.signal,
        mode: "cors",
        credentials: "omit",
        cache: "force-cache",
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      // Store both buffer and blob URL for cleanup
      audioBuffers.set(songId, blobUrl);
      bufferUrls.set(songId, blobUrl);

      // Preload in audio element if available
      if (globalAudioElement && !globalAudioElement.src) {
        const audio = new Audio();
        audio.preload = "auto";
        audio.src = blobUrl;

        // Clean up this temporary audio element
        audio.addEventListener(
          "canplaythrough",
          () => {
            setTimeout(() => {
              audio.src = "";
              audio.remove();
            }, 100);
          },
          { once: true }
        );

        // Fallback cleanup
        setTimeout(() => {
          if (audio.src) {
            audio.src = "";
            audio.remove();
          }
        }, 5000);
      }

      return true;
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error(`Failed to preload ${songId}:`, error);
      }
      return false;
    }
  }, []);

  // Check if audio is ready
  const isAudioReady = useCallback((songId) => {
    return audioBuffers.has(songId);
  }, []);

  // Get preloaded audio URL
  const getPreloadedUrl = useCallback((songId) => {
    return audioBuffers.get(songId) || null;
  }, []);

  // Preload multiple tracks efficiently
  const preloadMultiple = useCallback(
    async (songs) => {
      if (!songs || songs.length === 0) return;

      // Limit concurrent preloads
      const MAX_CONCURRENT = 2;
      const preloadQueue = [...songs];
      const activePreloads = [];

      const processNext = async () => {
        if (preloadQueue.length === 0) return;

        const song = preloadQueue.shift();
        const previewUrl = song?.preview_url || song?.url;
        const songId = song?.key || song?.id || song?.track_id;

        if (previewUrl && songId && !audioBuffers.has(songId)) {
          try {
            await preloadAudio(songId, previewUrl);
          } catch (error) {
            console.error("Preload error:", error);
          }
        }

        await processNext();
      };

      // Start concurrent preloads
      for (let i = 0; i < Math.min(MAX_CONCURRENT, songs.length); i++) {
        activePreloads.push(processNext());
      }

      await Promise.all(activePreloads);
    },
    [preloadAudio]
  );

  // Get cache statistics
  const getCacheStats = useCallback(() => {
    return {
      cached: audioBuffers.size,
      loading: 0,
      maxCache: MAX_CACHED_BUFFERS,
    };
  }, []);

  // Clear all cached audio
  const clearCache = useCallback(() => {
    // Clean up all blob URLs
    bufferUrls.forEach((blobUrl) => {
      cleanupBlobUrl(blobUrl);
    });

    audioBuffers.clear();
    bufferUrls.clear();

    // Reset audio element
    if (globalAudioElement) {
      globalAudioElement.src = "";
      globalAudioElement.load();
    }
  }, []);

  // Clean up specific track
  const cleanupTrack = useCallback((songId) => {
    const blobUrl = bufferUrls.get(songId);

    if (blobUrl) {
      cleanupBlobUrl(blobUrl);
      bufferUrls.delete(songId);
    }

    audioBuffers.delete(songId);
  }, []);

  return {
    setAudioElement,
    preloadAudio,
    isAudioReady,
    getPreloadedUrl,
    preloadMultiple,
    getCacheStats,
    clearCache,
    cleanupTrack,
  };
};
