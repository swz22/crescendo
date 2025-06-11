import { useState, useCallback, useRef, useEffect } from "react";

// Get API URL from environment variable
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// LocalStorage key
const STORAGE_KEY = "crescendo_preview_urls";
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
// LRU Cache implementation
class LRUCache {
  constructor(maxSize = 500) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return undefined;
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  has(key) {
    return this.cache.has(key);
  }

  clear() {
    this.cache.clear();
  }

  get size() {
    return this.cache.size;
  }
}

// Load cached previews from localStorage on initialization
const loadFromLocalStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Load into memory cache
      Object.entries(parsed).forEach(([trackId, data]) => {
        if (data.url) {
          previewCache.set(trackId, data.url);
          cacheTimestamps.set(trackId, data.timestamp || Date.now());
        }
      });
    }
  } catch (error) {
    console.error("Failed to load from localStorage:", error);
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
      lastUsed: Date.now(),
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
    console.error("Failed to save to localStorage:", error);
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

  // Different cache durations based on result
  let duration;
  if (cachedValue === null) {
    // For failures, use shorter cache but increase if we've seen many failures
    const baseFailureDuration = 30 * 1000; // 30 seconds
    const failureMultiplier = Math.min(consecutiveErrors + 1, 10);
    duration = baseFailureDuration * failureMultiplier;
  } else {
    duration = CACHE_DURATION_SUCCESS;
  }

  return Date.now() - timestamp < duration;
};
// Rate limiting queue
const fetchQueue = [];
let isProcessingQueue = false;
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000;
let consecutiveErrors = 0;
const MAX_RETRIES = 3;

// Exponential backoff calculation
const getBackoffDelay = (errorCount) => {
  return Math.min(1000 * Math.pow(2, errorCount), 30000); // Max 30s
};

// Process fetch queue with rate limiting
const processFetchQueue = async () => {
  if (isProcessingQueue || fetchQueue.length === 0) return;

  isProcessingQueue = true;

  while (fetchQueue.length > 0) {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    const backoffDelay = getBackoffDelay(consecutiveErrors);
    const requiredDelay = Math.max(MIN_REQUEST_INTERVAL, backoffDelay);

    if (timeSinceLastRequest < requiredDelay) {
      await new Promise((resolve) =>
        setTimeout(resolve, requiredDelay - timeSinceLastRequest)
      );
    }

    const { trackId, resolve, reject, retryCount = 0 } = fetchQueue.shift();
    lastRequestTime = Date.now();

    try {
      const response = await fetch(`${API_URL}/api/preview/${trackId}`);

      if (!response.ok) {
        if (response.status === 429) {
          // Rate limited - increase backoff and retry
          consecutiveErrors++;
          if (retryCount < MAX_RETRIES) {
            fetchQueue.push({
              trackId,
              resolve,
              reject,
              retryCount: retryCount + 1,
            });
            continue;
          }
        }

        // Cache failure with shorter TTL
        previewCache.set(trackId, null);
        cacheTimestamps.set(trackId, Date.now());
        resolve(null);
        continue;
      }

      // Success - reset error count
      consecutiveErrors = 0;
      const data = await response.json();
      const previewUrl = data.preview_url || null;

      // Cache result
      previewCache.set(trackId, previewUrl);
      cacheTimestamps.set(trackId, Date.now());

      if (previewUrl) {
        saveToLocalStorage(trackId, previewUrl);
      }

      resolve(previewUrl);
    } catch (error) {
      if (retryCount < MAX_RETRIES) {
        fetchQueue.push({
          trackId,
          resolve,
          reject,
          retryCount: retryCount + 1,
        });
      } else {
        reject(error);
      }
    }
  }

  isProcessingQueue = false;
};

const fetchPreviewUrl = async (trackId) => {
  // Check cache first
  if (previewCache.has(trackId) && isCacheValid(trackId)) {
    const cachedValue = previewCache.get(trackId);
    if (cachedValue) {
      updateLastUsed(trackId);
    }
    return cachedValue;
  }

  // Check if already queued
  const existingRequest = fetchPromises.get(trackId);
  if (existingRequest) {
    return existingRequest;
  }

  // Create promise and queue request
  const promise = new Promise((resolve, reject) => {
    fetchQueue.push({ trackId, resolve, reject });
    processFetchQueue();
  });

  fetchPromises.set(trackId, promise);

  // Clean up promise when done
  promise.finally(() => {
    fetchPromises.delete(trackId);
  });

  return promise;
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
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // If song already has preview_url, return the full song object
    if (song.preview_url) {
      return song;
    }

    // Check for track ID in different possible locations
    const trackId = song.key || song.id || song.track_id;

    if (!trackId) {
      return song;
    }

    // Check cache first before making network request
    if (previewCache.has(trackId) && isCacheValid(trackId)) {
      const cachedUrl = previewCache.get(trackId);
      if (cachedUrl !== null) {
        // CRITICAL FIX: Return the full song object with the cached URL
        const updatedSong = {
          ...song,
          preview_url: cachedUrl,
          url: cachedUrl,
        };
        return updatedSong;
      } else {
        return song;
      }
    }

    setLoading(true);
    abortControllerRef.current = new AbortController();

    try {
      const previewUrl = await fetchPreviewUrl(trackId);

      if (previewUrl) {
        // Return the full song object with the fetched URL
        const updatedSong = {
          ...song,
          preview_url: previewUrl,
          url: previewUrl,
        };
        return updatedSong;
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }

    return song;
  }, []);

  const prefetchPreviewUrl = useCallback((song, options = {}) => {
    const { priority = "low" } = options;

    if (!song || song.preview_url) return;

    const trackId = song.key || song.id || song.track_id;
    if (!trackId) return;

    // Check if already cached or in progress
    if (previewCache.has(trackId) && isCacheValid(trackId)) {
      return;
    }

    if (fetchPromises.has(trackId)) {
      return;
    }

    // Queue the fetch with appropriate priority
    if (priority === "high") {
      // High priority goes to front of queue
      fetchQueue.unshift({
        trackId,
        resolve: () => {},
        reject: () => {},
        isPrefetch: true,
      });
    } else {
      // Low priority goes to back
      fetchQueue.push({
        trackId,
        resolve: () => {},
        reject: () => {},
        isPrefetch: true,
      });
    }

    // Process queue if not already processing
    processFetchQueue();
  }, []);

  const prefetchMultiple = useCallback(
    (songs, options = {}) => {
      const { maxConcurrent = 2, startDelay = 0 } = options;

      if (!songs || songs.length === 0) return;

      setTimeout(() => {
        songs.slice(0, maxConcurrent).forEach((song, index) => {
          prefetchPreviewUrl(song, {
            priority: index === 0 ? "high" : "low",
            delay: index * 500, // Increased delay between requests
          });
        });
      }, startDelay);
    },
    [prefetchPreviewUrl]
  );

  // Check if a preview URL is cached (including null for tracks without previews)
  const isPreviewCached = useCallback((song) => {
    const trackId = song?.key || song?.id || song?.track_id;
    return trackId ? previewCache.has(trackId) && isCacheValid(trackId) : false;
  }, []);

  // Check if we know a track has no preview
  const hasNoPreview = useCallback((song) => {
    const trackId = song?.key || song?.id || song?.track_id;
    return (
      trackId &&
      previewCache.has(trackId) &&
      isCacheValid(trackId) &&
      previewCache.get(trackId) === null
    );
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
    } catch (error) {
      console.error("Failed to clear localStorage:", error);
    }
  }, []);

  // Get cache stats
  const getCacheStats = useCallback(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const localStorageCount = stored
      ? Object.keys(JSON.parse(stored)).length
      : 0;

    return {
      memoryCache: previewCache.size,
      localStorage: localStorageCount,
      prefetchQueue: prefetchQueue.size,
      attemptedTracks: attemptedTracks.size,
    };
  }, []);

  // Page-specific prefetch strategy
  const getPagePrefetchStrategy = useCallback((pathname) => {
    if (pathname === "/") {
      // Discover page - prefetch first 5 songs
      return { maxSongs: 5, priority: "medium", delay: 3000 };
    } else if (pathname === "/top-charts" || pathname === "/top-artists") {
      // Top charts/artists - prefetch first 3 songs (popular, likely to be played)
      return { maxSongs: 3, priority: "high", delay: 2000 };
    } else if (pathname.startsWith("/playlists")) {
      // Playlists - prefetch first 3 songs only
      return { maxSongs: 3, priority: "low", delay: 3000 };
    } else if (pathname.startsWith("/search")) {
      // Search results - no automatic prefetch (unpredictable)
      return { maxSongs: 0, priority: "low", delay: 0 };
    } else if (pathname.startsWith("/artists/")) {
      // Artist page - prefetch first 2 top tracks
      return { maxSongs: 2, priority: "high", delay: 2000 };
    }
    // Default - conservative
    return { maxSongs: 2, priority: "low", delay: 3000 };
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
