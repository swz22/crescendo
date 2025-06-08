import { useCallback, useRef } from 'react';

// Track which URLs have been preloaded
const preloadedUrls = new Set();

export const useAudioPreload = () => {
  const mainAudioRef = useRef(null);

  // Set the main audio element reference
  const setAudioElement = useCallback((element) => {
    mainAudioRef.current = element;
  }, []);

  // Preload using link prefetch (most efficient)
  const preloadAudio = useCallback(async (songId, previewUrl) => {
    if (!previewUrl || preloadedUrls.has(previewUrl)) {
      return;
    }

    try {  
      // Method 1: Link prefetch hint (fastest)
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.as = 'audio';
      link.href = previewUrl;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
      
      // Method 2: Fetch as blob to ensure it's in cache
      fetch(previewUrl, { 
        mode: 'cors',
        credentials: 'omit',
        cache: 'force-cache'
      })
      .then(response => {
        if (response.ok) {
          preloadedUrls.add(previewUrl);
        }
      })
      .catch(err => {
        console.error(`Failed to prefetch ${songId}:`, err);
      });
      
      // Mark as preloaded immediately (optimistic)
      preloadedUrls.add(previewUrl);
      
    } catch (error) {
      console.error(`Error preloading audio for ${songId}:`, error);
    }
  }, []);

  // Check if a URL has been preloaded
  const isAudioReady = useCallback((previewUrl) => {
    return preloadedUrls.has(previewUrl);
  }, []);

  // Preload multiple songs efficiently
  const preloadMultiple = useCallback(async (songs) => {
    if (!songs || songs.length === 0) return;
    
    // Preload all at once (browser will handle queuing)
    songs.forEach((song, index) => {
      const previewUrl = song?.preview_url || song?.url;
      const songId = song?.key || song?.id || song?.track_id;
      
      if (previewUrl && songId) {
        // Stagger slightly to avoid overwhelming
        setTimeout(() => {
          preloadAudio(songId, previewUrl);
        }, index * 100);
      }
    });
  }, [preloadAudio]);

  // Get cache stats
  const getCacheStats = useCallback(() => {
    return {
      cached: preloadedUrls.size,
      loading: 0,
      maxCache: 100
    };
  }, []);

  // Clear cache
  const clearCache = useCallback(() => {
    preloadedUrls.clear();
    // Remove prefetch links
    document.querySelectorAll('link[rel="prefetch"][as="audio"]').forEach(el => el.remove());
  }, []);

  return {
    setAudioElement,
    preloadAudio,
    isAudioReady,
    preloadMultiple,
    getCacheStats,
    clearCache
  };
};