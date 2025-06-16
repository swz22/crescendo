import { useCallback, useRef, useEffect } from "react";

// Preloaded audio buffers
const audioBuffers = new Map();
const bufferUrls = new Map();
const loadingBuffers = new Set();

// Maximum cached audio buffers
const MAX_CACHED_BUFFERS = 20;

// Cleanup old buffers
const cleanupOldBuffers = (keepCount = 10) => {
  if (audioBuffers.size <= keepCount) return;

  const entriesToRemove = audioBuffers.size - keepCount;
  const iterator = audioBuffers.entries();

  for (let i = 0; i < entriesToRemove; i++) {
    const [oldSongId] = iterator.next().value;
    const oldBlobUrl = bufferUrls.get(oldSongId);

    if (oldBlobUrl && oldBlobUrl.startsWith("blob:")) {
      URL.revokeObjectURL(oldBlobUrl);
    }

    audioBuffers.delete(oldSongId);
    bufferUrls.delete(oldSongId);
    loadingBuffers.delete(oldSongId);
  }
};

export const useAudioPreload = () => {
  const cleanupTimeoutRef = useRef(null);
  const mountedRef = useRef(true);

  // Clean up on unmount
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
      }
    };
  }, []);

  // Preload audio with proper cleanup
  const preloadAudio = useCallback(async (songId, previewUrl) => {
    if (!previewUrl || audioBuffers.has(songId) || loadingBuffers.has(songId)) {
      return true;
    }

    loadingBuffers.add(songId);

    try {
      // Check cache size and clean if needed
      if (audioBuffers.size >= MAX_CACHED_BUFFERS) {
        cleanupOldBuffers(Math.floor(MAX_CACHED_BUFFERS / 2));
      }

      // Fetch with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(previewUrl, {
        signal: controller.signal,
        mode: "cors",
        credentials: "omit",
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const blob = await response.blob();

      // Check if component is still mounted
      if (!mountedRef.current) {
        return false;
      }

      const blobUrl = URL.createObjectURL(blob);

      // Store both buffer and blob URL for cleanup
      audioBuffers.set(songId, blobUrl);
      bufferUrls.set(songId, blobUrl);

      return true;
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error(`Failed to preload ${songId}:`, error);
      }
      return false;
    } finally {
      loadingBuffers.delete(songId);
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
      if (!songs || songs.length === 0 || !mountedRef.current) return;

      const MAX_CONCURRENT = 2;
      const preloadQueue = [...songs];
      const activePreloads = [];

      const processNext = async () => {
        if (preloadQueue.length === 0 || !mountedRef.current) return;

        const song = preloadQueue.shift();
        const previewUrl = song?.preview_url || song?.url;
        const songId = song?.key || song?.id || song?.track_id;

        if (
          previewUrl &&
          songId &&
          !audioBuffers.has(songId) &&
          !loadingBuffers.has(songId)
        ) {
          try {
            await preloadAudio(songId, previewUrl);
          } catch (error) {
            console.error("Preload error:", error);
          }
        }

        if (mountedRef.current) {
          await processNext();
        }
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
      loading: loadingBuffers.size,
      maxCache: MAX_CACHED_BUFFERS,
    };
  }, []);

  // Clear all cached audio
  const clearCache = useCallback(() => {
    // Clean up all blob URLs
    bufferUrls.forEach((blobUrl) => {
      if (blobUrl && blobUrl.startsWith("blob:")) {
        URL.revokeObjectURL(blobUrl);
      }
    });

    audioBuffers.clear();
    bufferUrls.clear();
    loadingBuffers.clear();
  }, []);

  return {
    preloadAudio,
    isAudioReady,
    getPreloadedUrl,
    preloadMultiple,
    getCacheStats,
    clearCache,
  };
};
