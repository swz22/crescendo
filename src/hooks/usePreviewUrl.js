import { useState, useCallback, useRef, useEffect } from 'react';

// In-memory cache for preview URLs
const previewCache = new Map();
const cacheTimestamps = new Map();
const prefetchQueue = new Set();
const fetchPromises = new Map();

// Cache duration: 5 minutes for successful URLs, 30 seconds for failures
const CACHE_DURATION_SUCCESS = 5 * 60 * 1000;
const CACHE_DURATION_FAILURE = 30 * 1000;

const isCacheValid = (trackId) => {
  const timestamp = cacheTimestamps.get(trackId);
  if (!timestamp) return false;
  
  const cachedValue = previewCache.get(trackId);
  const duration = cachedValue === null ? CACHE_DURATION_FAILURE : CACHE_DURATION_SUCCESS;
  
  return Date.now() - timestamp < duration;
};

const fetchPreviewUrl = async (trackId) => {
  // Check cache first
  if (previewCache.has(trackId) && isCacheValid(trackId)) {
    const cachedValue = previewCache.get(trackId);
    console.log('Returning cached preview URL for:', trackId, cachedValue);
    return cachedValue;
  }

  // Check if we're already fetching this track
  if (fetchPromises.has(trackId)) {
    console.log('Waiting for existing fetch for:', trackId);
    return fetchPromises.get(trackId);
  }

  // Create fetch promise
  const fetchPromise = (async () => {
    try {
      console.log('Fetching preview URL for track:', trackId);
      const response = await fetch(`http://localhost:3001/api/preview/${trackId}`);
      
      // Check if response is ok
      if (!response.ok) {
        const errorData = await response.json();
        console.log(`Preview fetch failed for track ${trackId}:`, errorData);
        
        // Handle rate limiting differently
        if (response.status === 429) {
          console.log('Rate limited - will retry later');
          // Don't cache rate limit errors
          return null;
        }
        
        // Cache other failures
        previewCache.set(trackId, null);
        cacheTimestamps.set(trackId, Date.now());
        return null;
      }
      
      const data = await response.json();
      console.log('Preview URL response:', data);
      
      // Cache the result with timestamp
      const previewUrl = data.preview_url || null;
      previewCache.set(trackId, previewUrl);
      cacheTimestamps.set(trackId, Date.now());
      
      return previewUrl;
    } catch (error) {
      console.error('Failed to fetch preview URL:', error);
      // Don't cache network errors
      return null;
    } finally {
      // Clean up promise cache
      fetchPromises.delete(trackId);
    }
  })();

  fetchPromises.set(trackId, fetchPromise);
  return fetchPromise;
};

export const usePreviewUrl = () => {
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef(null);
  const prefetchTimeoutRef = useRef(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (prefetchTimeoutRef.current) {
        clearTimeout(prefetchTimeoutRef.current);
      }
    };
  }, []);

  const getPreviewUrl = useCallback(async (song) => {
    console.log('getPreviewUrl called with song:', song);
    
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    if (song.preview_url) {
      console.log('Song already has preview_url:', song.preview_url);
      return song;
    }
    
    // Check for track ID in different possible locations
    const trackId = song.key || song.id || song.track_id;
    
    if (!trackId) {
      console.log('Song has no track ID:', song);
      return song;
    }
    
    // Check cache first before making network request
    if (previewCache.has(trackId) && isCacheValid(trackId)) {
      const cachedUrl = previewCache.get(trackId);
      if (cachedUrl !== null) {
        console.log('Using cached preview URL:', cachedUrl);
        const updatedSong = { ...song, preview_url: cachedUrl, url: cachedUrl };
        console.log('Returning updated song:', updatedSong);
        return updatedSong;
      } else {
        console.log('Cached failure for track, will retry:', trackId);
      }
    }
    
    setLoading(true);
    abortControllerRef.current = new AbortController();
    
    try {
      const previewUrl = await fetchPreviewUrl(trackId);
      
      if (previewUrl) {
        console.log('Successfully fetched preview URL:', previewUrl);
        const updatedSong = { ...song, preview_url: previewUrl, url: previewUrl };
        console.log('Returning updated song with preview:', updatedSong);
        return updatedSong;
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
    
    console.log('No preview URL found for song');
    return song;
  }, []);

  const prefetchPreviewUrl = useCallback((song, options = {}) => {
    const { priority = 'low', delay = 0 } = options;
    
    if (!song || song.preview_url) return;
    
    const trackId = song.key || song.id || song.track_id;
    if (!trackId) return;
    
    // Already cached (including null values) or being fetched
    if (previewCache.has(trackId) || fetchPromises.has(trackId)) {
      return;
    }
    
    // Add to prefetch queue
    if (!prefetchQueue.has(trackId)) {
      prefetchQueue.add(trackId);
      
      const doPrefetch = () => {
        console.log(`Prefetching preview URL for ${trackId} (priority: ${priority})`);
        fetchPreviewUrl(trackId).then(() => {
          prefetchQueue.delete(trackId);
        }).catch(() => {
          // Silently handle prefetch errors
          prefetchQueue.delete(trackId);
        });
      };
      
      if (priority === 'high') {
        doPrefetch();
      } else {
        prefetchTimeoutRef.current = setTimeout(doPrefetch, delay);
      }
    }
  }, []);

  const prefetchMultiple = useCallback((songs, options = {}) => {
    const { maxConcurrent = 2, startDelay = 0 } = options;
    
    if (!songs || songs.length === 0) return;
    
    setTimeout(() => {
      songs.slice(0, maxConcurrent).forEach((song, index) => {
        prefetchPreviewUrl(song, {
          priority: index === 0 ? 'high' : 'low',
          delay: index * 500 // Increased delay between requests
        });
      });
    }, startDelay);
  }, [prefetchPreviewUrl]);

  // Check if a preview URL is cached (including null for tracks without previews)
  const isPreviewCached = useCallback((song) => {
    const trackId = song?.key || song?.id || song?.track_id;
    return trackId ? (previewCache.has(trackId) && isCacheValid(trackId)) : false;
  }, []);

  // Check if we know a track has no preview
  const hasNoPreview = useCallback((song) => {
    const trackId = song?.key || song?.id || song?.track_id;
    return trackId && previewCache.has(trackId) && isCacheValid(trackId) && previewCache.get(trackId) === null;
  }, []);

  // Clear cache function for debugging
  const clearCache = useCallback(() => {
    previewCache.clear();
    cacheTimestamps.clear();
    prefetchQueue.clear();
    fetchPromises.clear();
    console.log('Preview URL cache cleared');
  }, []);

  return { 
    getPreviewUrl, 
    prefetchPreviewUrl, 
    prefetchMultiple,
    isPreviewCached,
    hasNoPreview,
    loading,
    clearCache 
  };
};