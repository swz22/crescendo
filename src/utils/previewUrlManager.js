// Centralized preview URL management
class PreviewUrlManager {
  constructor() {
    this.subscribers = new Set();
    this.batchQueue = [];
    this.batchTimeout = null;
    this.batchSize = 5;
    this.batchDelay = 1000;
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notify(trackId, url) {
    this.subscribers.forEach((callback) => callback(trackId, url));
  }

  async batchFetch(trackIds) {
    trackIds.forEach((trackId) => {
      if (!this.batchQueue.includes(trackId)) {
        this.batchQueue.push(trackId);
      }
    });

    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    this.batchTimeout = setTimeout(() => {
      this.processBatch();
    }, this.batchDelay);
  }

  async processBatch() {
    const batch = this.batchQueue.splice(0, this.batchSize);

    // Process batch with staggered delays
    batch.forEach((trackId, index) => {
      setTimeout(() => {
        // This will use the existing queue system
        fetchPreviewUrl(trackId, PRIORITY_LEVELS.LOW);
      }, index * 200);
    });

    // Process remaining items
    if (this.batchQueue.length > 0) {
      this.batchTimeout = setTimeout(() => {
        this.processBatch();
      }, this.batchDelay);
    }
  }
}

export const previewUrlManager = new PreviewUrlManager();
