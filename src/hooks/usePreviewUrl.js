import { useState, useCallback, useRef, useEffect } from "react";

// Get API URL from environment variable
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// LocalStorage key
const STORAGE_KEY = "crescendo_preview_urls";
const MAX_STORAGE_ITEMS = 1000; // Limit storage size

// In-memory cache for preview URLs
const previewCache = new Map();
const cacheTimestamps = new Map();
const attemptedTracks = new Set(); // Track which songs we've already tried

// Rate limiting with adaptive delays
const PRIORITY_LEVELS = {
  CRITICAL: 0, // User clicked play
  HIGH: 1, // User hovering
  LOW: 2, // Background prefetch
};

// Adaptive rate limiter
class AdaptiveRateLimiter {
  constructor() {
    this.successCount = 0;
    this.errorCount = 0;
    this.lastRequestTime = 0;
    this.baseDelay = 200; // Start optimistic
    this.currentDelay = 200;
    this.successWindow = [];
    this.windowSize = 20; // Track last 20 requests
  }

  recordSuccess() {
    this.successWindow.push({ time: Date.now(), success: true });
    this.errorCount = 0;
    this.updateDelay();
  }

  recordError(is429 = false) {
    this.successWindow.push({ time: Date.now(), success: false });
    if (is429) {
      this.errorCount++;
      this.currentDelay = Math.min(
        this.baseDelay * Math.pow(2, this.errorCount),
        5000
      );
    }
    this.updateDelay();
  }

  updateDelay() {
    // Clean old entries
    const cutoff = Date.now() - 30000; // 30 second window
    this.successWindow = this.successWindow.filter(
      (entry) => entry.time > cutoff
    );

    // Calculate success rate
    if (this.successWindow.length >= 10) {
      const successRate =
        this.successWindow.filter((e) => e.success).length /
        this.successWindow.length;

      if (successRate > 0.95 && this.currentDelay > 100) {
        // Excellent success rate, speed up
        this.currentDelay = Math.max(100, this.currentDelay * 0.8);
      } else if (successRate < 0.7) {
        // Poor success rate, slow down
        this.currentDelay = Math.min(2000, this.currentDelay * 1.5);
      }
    }
  }

  getDelay(priority) {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    // Critical requests get minimal delay
    if (priority === PRIORITY_LEVELS.CRITICAL) {
      return Math.max(0, 100 - timeSinceLastRequest);
    }

    // High priority (hover) gets current adaptive delay
    if (priority === PRIORITY_LEVELS.HIGH) {
      return Math.max(0, this.currentDelay - timeSinceLastRequest);
    }

    // Low priority gets 2x delay
    return Math.max(0, this.currentDelay * 2 - timeSinceLastRequest);
  }

  recordRequest() {
    this.lastRequestTime = Date.now();
  }
}

// Priority queue implementation
class PriorityQueue {
  constructor() {
    this.queues = {
      [PRIORITY_LEVELS.CRITICAL]: [],
      [PRIORITY_LEVELS.HIGH]: [],
      [PRIORITY_LEVELS.LOW]: [],
    };
    this.processing = false;
    this.rateLimiter = new AdaptiveRateLimiter();
    this.activeRequests = new Map(); // Track active requests for cancellation
  }

  async add(trackId, priority = PRIORITY_LEVELS.LOW) {
    // Cancel existing lower priority request for same track
    this.cancelTrack(trackId, priority);

    // Check if already cached
    if (previewCache.has(trackId) && isCacheValid(trackId)) {
      const cachedValue = previewCache.get(trackId);
      if (cachedValue) updateLastUsed(trackId);
      return Promise.resolve(cachedValue);
    }

    // Create abort controller for cancellation
    const abortController = new AbortController();

    return new Promise((resolve, reject) => {
      const request = {
        trackId,
        priority,
        resolve,
        reject,
        abortController,
        timestamp: Date.now(),
      };

      // Add to appropriate queue
      this.queues[priority].push(request);
      this.activeRequests.set(trackId, request);

      // Start processing if not already
      this.process();
    });
  }

  cancelTrack(trackId, newPriority = null) {
    const existingRequest = this.activeRequests.get(trackId);
    if (
      existingRequest &&
      (newPriority === null || existingRequest.priority > newPriority)
    ) {
      existingRequest.abortController.abort();
      this.activeRequests.delete(trackId);

      // Remove from queue
      const queue = this.queues[existingRequest.priority];
      const index = queue.indexOf(existingRequest);
      if (index > -1) queue.splice(index, 1);
    }
  }

  cancelAllExcept(trackId) {
    for (const [id, request] of this.activeRequests) {
      if (id !== trackId && request.priority > PRIORITY_LEVELS.CRITICAL) {
        this.cancelTrack(id);
      }
    }
  }

  async process() {
    if (this.processing) return;
    this.processing = true;

    while (this.hasRequests()) {
      const request = this.getNextRequest();
      if (!request) break;

      // Apply rate limiting delay
      const delay = this.rateLimiter.getDelay(request.priority);
      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      // Skip if cancelled
      if (request.abortController.signal.aborted) {
        continue;
      }

      this.rateLimiter.recordRequest();

      try {
        const response = await fetch(
          `${API_URL}/api/preview/${request.trackId}`,
          { signal: request.abortController.signal }
        );

        if (!response.ok) {
          if (response.status === 429) {
            this.rateLimiter.recordError(true);
            // Requeue if critical
            if (request.priority === PRIORITY_LEVELS.CRITICAL) {
              this.queues[request.priority].unshift(request);
              continue;
            }
          }
          this.rateLimiter.recordError(false);
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const previewUrl = data.preview_url || null;

        // Update cache
        previewCache.set(request.trackId, previewUrl);
        cacheTimestamps.set(request.trackId, Date.now());
        if (previewUrl) saveToLocalStorage(request.trackId, previewUrl);

        this.rateLimiter.recordSuccess();
        this.activeRequests.delete(request.trackId);
        request.resolve(previewUrl);
      } catch (error) {
        if (error.name === "AbortError") {
          request.reject(new Error("Request cancelled"));
        } else {
          this.rateLimiter.recordError(false);
          // Cache failure for non-critical requests
          if (request.priority !== PRIORITY_LEVELS.CRITICAL) {
            previewCache.set(request.trackId, null);
            cacheTimestamps.set(request.trackId, Date.now());
          }
          this.activeRequests.delete(request.trackId);
          request.reject(error);
        }
      }
    }

    this.processing = false;
  }

  hasRequests() {
    return Object.values(this.queues).some((queue) => queue.length > 0);
  }

  getNextRequest() {
    // Priority order: CRITICAL -> HIGH -> LOW
    for (const priority of [
      PRIORITY_LEVELS.CRITICAL,
      PRIORITY_LEVELS.HIGH,
      PRIORITY_LEVELS.LOW,
    ]) {
      if (this.queues[priority].length > 0) {
        return this.queues[priority].shift();
      }
    }
    return null;
  }
}

// Global instances
const requestQueue = new PriorityQueue();

// Updated fetch function
const fetchPreviewUrl = async (trackId, priority = PRIORITY_LEVELS.LOW) => {
  return requestQueue.add(trackId, priority);
};

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

  // Cache "no preview" for 24 hours to avoid repeated checks
  const duration =
    cachedValue === null
      ? 24 * 60 * 60 * 1000 // 24 hours for null
      : 5 * 60 * 1000; // 5 minutes for success

  return Date.now() - timestamp < duration;
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

    // If song already has preview_url, return immediately
    if (song.preview_url) {
      return song;
    }

    const trackId = song.key || song.id || song.track_id;
    if (!trackId) {
      return song;
    }

    // Check cache first
    if (previewCache.has(trackId) && isCacheValid(trackId)) {
      const cachedUrl = previewCache.get(trackId);
      if (cachedUrl !== null) {
        return {
          ...song,
          preview_url: cachedUrl,
          url: cachedUrl,
        };
      } else {
        return song;
      }
    }

    setLoading(true);

    // Cancel all other requests when user clicks play
    requestQueue.cancelAllExcept(trackId);

    try {
      // CRITICAL priority for user-initiated plays
      const previewUrl = await fetchPreviewUrl(
        trackId,
        PRIORITY_LEVELS.CRITICAL
      );

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

  const prefetchPreviewUrl = useCallback((song, options = {}) => {
    const { priority = "low" } = options;

    if (!song || song.preview_url) return;

    const trackId = song.key || song.id || song.track_id;
    if (!trackId) return;

    // Map string priority to numeric
    const numericPriority =
      priority === "high" ? PRIORITY_LEVELS.HIGH : PRIORITY_LEVELS.LOW;

    // Fire and forget prefetch
    fetchPreviewUrl(trackId, numericPriority).catch(() => {
      // Silently handle prefetch failures
    });
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
    attemptedTracks.clear();
    requestQueue.cancelAllExcept(null);
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
      prefetchQueue: requestQueue.activeRequests.size,
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
