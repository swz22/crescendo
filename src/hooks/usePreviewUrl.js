import { useState, useCallback, useRef, useEffect } from 'react';

// LocalStorage key
const STORAGE_KEY = 'crescendo_preview_urls';
const MAX_STORAGE_ITEMS = 1000; // Limit storage size

// In-memory cache for preview URLs
const previewCache = new Map();
const cacheTimestamps = new Map();
const prefetchQueue = new Set();
const fetchPromises = new Map();
const attemptedTracks = new Set(); // Track which songs we've already tried

// Cache duration: 5 minutes for successful URLs, 30 seconds for failures
const CACHE_DURATION_SUCCESS = 5 * 60 * 1000;
const CACHE_DURATION_FAILURE = 30 * 1000;

// Load cached previews from localStorage on initialization
const loadFromLocalStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      console.log(`Loading ${Object.keys(parsed).length} preview URLs from localStorage`);
      
      // Load into memory cache
      Object.entries(parsed).forEach(([trackId, data]) => {
        if (data.url) {
          previewCache.set(trackId, data.url);
          cacheTimestamps.set(trackId, data.timestamp || Date.now());
        }
      });
    }
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
  }
};

// Save to localStorage
const saveToLocalStorage = (trackId, url) => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const cached = stored ? JSON.parse(stored) : {};
    
    // Add new entry
    cached[trackId] = {
      url,
      timestamp: Date.now(),
      lastUsed: Date.now()
    };
    
    // Limit storage size - remove oldest entries if needed
    const entries = Object.entries(cached);
    if (entries.length > MAX_STORAGE_ITEMS) {
      // Sort by lastUsed and keep most recent
      entries.sort((a, b) => b[1].lastUsed - a[1].lastUsed);
      const keepEntries = entries.slice(0, MAX_STORAGE_ITEMS);
      const newCached = Object.fromEntries(keepEntries);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newCached));
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
    }
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
};

// Update last used timestamp when retrieving from cache
const updateLastUsed = (trackId) => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const cached = JSON.parse(stored);
      if (cached[trackId]) {
        cached[trackId].lastUsed = Date.now();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
      }
    }
  } catch (error) {
    // Silently fail - not critical
  }
};

// Initialize - load from localStorage on module load
loadFromLocalStorage();

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
    
    // Update last used timestamp for localStorage
    if (cachedValue) {
      updateLastUsed(trackId);
    }
    
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
      
      // Save successful URLs to localStorage
      if (previewUrl) {
        saveToLocalStorage(trackId, previewUrl);
      }
      
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
    const { priority = 'low' } = options;
    
    if (!song || song.preview_url) return;
    
    const trackId = song.key || song.id || song.track_id;
    if (!trackId) return;
    
    // Skip if we've already attempted this track
    if (attemptedTracks.has(trackId)) {
      return;
    }
    
    // Already cached (including null values) or being fetched
    if (previewCache.has(trackId) || fetchPromises.has(trackId)) {
      return;
    }
    
    // Limit concurrent prefetch queue
    if (prefetchQueue.size >= 3) {
      console.log(`Prefetch queue full, skipping ${trackId}`);
      return;
    }
    
    // Mark as attempted
    attemptedTracks.add(trackId);
    
    // Add to prefetch queue
    prefetchQueue.add(trackId);
    
    const doPrefetch = async () => {
      try {
        console.log(`Prefetching preview URL for ${trackId} (priority: ${priority})`);
        await fetchPreviewUrl(trackId);
      } catch (error) {
        console.error(`Prefetch failed for ${trackId}:`, error);
      } finally {
        prefetchQueue.delete(trackId);
      }
    };
    
    // High priority: fetch immediately
    // Low priority: respect rate limits
    if (priority === 'high') {
      doPrefetch();
    } else {
      // Add delay for low priority to prevent rate limits
      setTimeout(doPrefetch, 1000);
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
    attemptedTracks.clear();
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.log('Preview URL cache cleared (including localStorage)');
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  }, []);

  // Get cache stats
  const getCacheStats = useCallback(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const localStorageCount = stored ? Object.keys(JSON.parse(stored)).length : 0;
    
    return {
      memoryCache: previewCache.size,
      localStorage: localStorageCount,
      prefetchQueue: prefetchQueue.size,
      attemptedTracks: attemptedTracks.size
    };
  }, []);

  // Page-specific prefetch strategy
  const getPagePrefetchStrategy = useCallback((pathname) => {
    if (pathname === '/') {
      // Discover page - prefetch first 5 songs
      return { maxSongs: 5, priority: 'medium', delay: 3000 };
    } else if (pathname === '/top-charts' || pathname === '/top-artists') {
      // Top charts/artists - prefetch first 3 songs (popular, likely to be played)
      return { maxSongs: 3, priority: 'high', delay: 2000 };
    } else if (pathname.startsWith('/playlists')) {
      // Playlists - prefetch first 3 songs only
      return { maxSongs: 3, priority: 'low', delay: 3000 };
    } else if (pathname.startsWith('/search')) {
      // Search results - no automatic prefetch (unpredictable)
      return { maxSongs: 0, priority: 'low', delay: 0 };
    } else if (pathname.startsWith('/artists/')) {
      // Artist page - prefetch first 2 top tracks
      return { maxSongs: 2, priority: 'high', delay: 2000 };
    }
    // Default - conservative
    return { maxSongs: 2, priority: 'low', delay: 3000 };
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
    getPagePrefetchStrategy
  };
};