import { useCallback, useState } from "react";
import { previewUrlManager } from "../utils/previewUrlManager";
import { useToast } from "../context/ToastContext";

export const usePreviewUrl = () => {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const getPreviewUrl = useCallback(
    async (song) => {
      if (!song) {
        console.warn("getPreviewUrl called with no song");
        return null;
      }

      if (song.preview_url) {
        return song;
      }

      const trackId = song.key || song.id || song.track_id;
      if (!trackId) {
        console.warn("Song has no valid track ID", song);
        return song;
      }

      setLoading(true);
      try {
        const previewUrl = await previewUrlManager.getPreviewUrl(trackId);
        if (previewUrl) {
          return {
            ...song,
            preview_url: previewUrl,
            url: previewUrl,
          };
        }
      } catch (error) {
        console.error("Error getting preview URL:", error);
        // Only show toast for user-initiated actions, not background prefetching
        if (loading) {
          showToast("Unable to load preview for this track", "error");
        }
      } finally {
        setLoading(false);
      }

      return song;
    },
    [loading, showToast]
  );

  const prefetchPreviewUrl = useCallback(async (song, options = {}) => {
    if (!song || song.preview_url) return false;

    const trackId = song.key || song.id || song.track_id;
    if (!trackId) return false;

    try {
      if (options.priority === "high") {
        const url = await previewUrlManager.getPreviewUrl(trackId);
        return url !== null;
      }

      setTimeout(() => {
        previewUrlManager.getPreviewUrl(trackId).catch((error) => {
          console.debug("Background prefetch failed:", error.message);
        });
      }, options.delay || 500);

      return true;
    } catch (error) {
      console.debug("Prefetch error:", error);
      return false;
    }
  }, []);

  const isPreviewCached = useCallback((song) => {
    const trackId = song?.key || song?.id || song?.track_id;
    if (!trackId) return false;

    const cached = previewUrlManager.cache.get(trackId);
    return cached && cached.url !== null;
  }, []);

  const hasNoPreview = useCallback((song) => {
    const trackId = song?.key || song?.id || song?.track_id;
    if (!trackId) return false;

    const cached = previewUrlManager.cache.get(trackId);
    return cached && cached.url === null;
  }, []);

  const clearCache = useCallback(() => {
    previewUrlManager.clearCache();
  }, []);

  const getCacheStats = useCallback(() => {
    return previewUrlManager.getCacheStats();
  }, []);

  const prefetchMultiple = useCallback(
    (songs, options = {}) => {
      if (!songs || songs.length === 0) return;

      const validSongs = songs.filter((song) => {
        const trackId = song?.key || song?.id || song?.track_id;
        return trackId && !song.preview_url;
      });

      const songsToFetch = validSongs.slice(0, options.maxConcurrent || 3);

      songsToFetch.forEach((song, index) => {
        setTimeout(() => {
          prefetchPreviewUrl(song, { priority: "low" }).catch((error) => {
            console.debug("Batch prefetch error:", error);
          });
        }, index * 1000);
      });
    },
    [prefetchPreviewUrl]
  );

  const getPagePrefetchStrategy = useCallback((pathname) => {
    if (pathname === "/") {
      return { maxSongs: 3, priority: "low", delay: 2000 };
    } else if (pathname.startsWith("/top-")) {
      return { maxSongs: 2, priority: "low", delay: 3000 };
    } else if (pathname.startsWith("/artists/")) {
      return { maxSongs: 2, priority: "high", delay: 1000 };
    }
    return { maxSongs: 0, priority: "low", delay: 0 };
  }, []);

  return {
    getPreviewUrl,
    prefetchPreviewUrl,
    prefetchMultiple,
    isPreviewCached,
    hasNoPreview,
    loading,
    clearCache,
    getCacheStats,
    getPagePrefetchStrategy,
  };
};
