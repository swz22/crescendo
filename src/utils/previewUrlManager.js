import { StorageKeys } from "./storageManager";
// Centralized preview URL management with request deduplication
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

class PreviewUrlManager {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
    this.failureCount = new Map();
    this.lastRequestTime = 0;
    this.minRequestInterval = 250;
    this.maxRetries = 3;
    this.circuitBreakerThreshold = 10;
    this.circuitBreakerResetTime = 60000;
    this.consecutiveFailures = 0;
    this.circuitBreakerTrippedAt = null;
    this.maxCacheSize = 1000; // Prevent unbounded growth
    this.loadPersistedCache();
  }

  // Check and potentially reset circuit breaker
  checkCircuitBreaker() {
    if (this.circuitBreakerTrippedAt) {
      const elapsed = Date.now() - this.circuitBreakerTrippedAt;
      if (elapsed > this.circuitBreakerResetTime) {
        console.log("Circuit breaker reset after timeout");
        this.circuitBreakerTrippedAt = null;
        this.consecutiveFailures = 0;
      }
    }
  }

  async getPreviewUrl(trackId) {
    if (!trackId) return null;

    // Check and potentially reset circuit breaker
    this.checkCircuitBreaker();

    if (this.isCircuitBreakerOpen()) {
      console.log("Circuit breaker is open, returning null");
      return null;
    }

    const cached = this.cache.get(trackId);
    if (cached) {
      const age = Date.now() - cached.timestamp;
      const maxAge = cached.url ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
      if (age < maxAge) {
        return cached.url;
      }
      // Remove stale entry
      this.cache.delete(trackId);
    }

    if (this.pendingRequests.has(trackId)) {
      return this.pendingRequests.get(trackId);
    }

    const requestPromise = this.fetchPreviewUrl(trackId);
    this.pendingRequests.set(trackId, requestPromise);

    try {
      const url = await requestPromise;
      return url;
    } finally {
      this.pendingRequests.delete(trackId);
    }
  }

  async fetchPreviewUrl(trackId) {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minRequestInterval) {
      await new Promise((resolve) =>
        setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest)
      );
    }
    this.lastRequestTime = Date.now();

    const failures = this.failureCount.get(trackId) || 0;
    if (failures >= this.maxRetries) {
      this.cache.set(trackId, { url: null, timestamp: Date.now() });
      return null;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(`${API_URL}/api/preview/${trackId}`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 429) {
        this.consecutiveFailures++;
        const backoffTime = Math.min(1000 * Math.pow(2, failures), 30000);
        await new Promise((resolve) => setTimeout(resolve, backoffTime));
        this.failureCount.set(trackId, failures + 1);
        throw new Error("Rate limited");
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const url = data.preview_url || null;

      // Enforce cache size limit
      if (this.cache.size >= this.maxCacheSize) {
        const entriesToDelete = Math.floor(this.maxCacheSize * 0.2);
        const iterator = this.cache.keys();
        for (let i = 0; i < entriesToDelete; i++) {
          const key = iterator.next().value;
          if (key) this.cache.delete(key);
        }
      }

      this.cache.set(trackId, { url, timestamp: Date.now() });
      this.consecutiveFailures = 0;
      this.failureCount.delete(trackId);

      // Throttle persistence to avoid excessive writes
      this.schedulePersist();

      return url;
    } catch (error) {
      this.failureCount.set(trackId, failures + 1);
      this.consecutiveFailures++;

      if (this.consecutiveFailures >= this.circuitBreakerThreshold) {
        this.circuitBreakerTrippedAt = Date.now();
        console.warn("Circuit breaker tripped due to consecutive failures");
      }

      if (failures + 1 >= this.maxRetries) {
        this.cache.set(trackId, { url: null, timestamp: Date.now() });
      }

      console.error(`Failed to fetch preview for ${trackId}:`, error.message);
      return null;
    }
  }

  persistTimeout = null;

  schedulePersist() {
    if (this.persistTimeout) return;

    this.persistTimeout = setTimeout(() => {
      this.persistCache();
      this.persistTimeout = null;
    }, 5000);
  }

  isCircuitBreakerOpen() {
    if (!this.circuitBreakerTrippedAt) return false;
    const elapsed = Date.now() - this.circuitBreakerTrippedAt;
    return elapsed <= this.circuitBreakerResetTime;
  }

  persistCache() {
    try {
      const entries = Array.from(this.cache.entries())
        .filter(([_, data]) => data.url !== null)
        .sort((a, b) => b[1].timestamp - a[1].timestamp)
        .slice(0, 500);

      const cacheData = Object.fromEntries(entries);
      localStorage.setItem(
        StorageKeys.PREVIEW_CACHE,
        JSON.stringify(cacheData)
      );
    } catch (error) {
      console.warn("Failed to persist cache:", error);
    }
  }

  loadPersistedCache() {
    try {
      const stored = localStorage.getItem(StorageKeys.PREVIEW_CACHE);
      if (stored) {
        const data = JSON.parse(stored);
        Object.entries(data).forEach(([trackId, cacheData]) => {
          this.cache.set(trackId, cacheData);
        });
      }
    } catch (error) {
      console.warn("Failed to load persisted cache:", error);
      // Clear corrupted cache
      try {
        localStorage.removeItem(StorageKeys.PREVIEW_CACHE);
      } catch {}
    }
  }

  clearCache() {
    this.cache.clear();
    this.pendingRequests.clear();
    this.failureCount.clear();
    this.consecutiveFailures = 0;
    this.circuitBreakerTrippedAt = null;

    if (this.persistTimeout) {
      clearTimeout(this.persistTimeout);
      this.persistTimeout = null;
    }

    try {
      localStorage.removeItem(StorageKeys.PREVIEW_CACHE);
    } catch (error) {
      console.warn("Failed to clear localStorage:", error);
    }
  }

  getCacheStats() {
    return {
      cached: this.cache.size,
      pending: this.pendingRequests.size,
      failed: this.failureCount.size,
      circuitBreakerOpen: this.isCircuitBreakerOpen(),
    };
  }
}

export const previewUrlManager = new PreviewUrlManager();
