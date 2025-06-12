import { useCallback, useState } from "react";
import { previewUrlManager } from "../utils/previewUrlManager";

export const usePreviewUrl = () => {
  const [loading, setLoading] = useState(false);

  const getPreviewUrl = useCallback(async (song) => {
    if (song.preview_url) {
      return song;
    }

    const trackId = song.key || song.id || song.track_id;
    if (!trackId) {
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
    } finally {
      setLoading(false);
    }

    return song;
  }, []);

  const prefetchPreviewUrl = useCallback(async (song, options = {}) => {
    if (!song || song.preview_url) return false;

    const trackId = song.key || song.id || song.track_id;
    if (!trackId) return false;

    if (options.priority === "high") {
      const url = await previewUrlManager.getPreviewUrl(trackId);
      return url !== null;
    }

    setTimeout(() => {
      previewUrlManager.getPreviewUrl(trackId);
    }, options.delay || 500);

    return true;
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

      const songsToFetch = songs.slice(0, options.maxConcurrent || 3);

      songsToFetch.forEach((song, index) => {
        setTimeout(() => {
          prefetchPreviewUrl(song, { priority: "low" });
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
