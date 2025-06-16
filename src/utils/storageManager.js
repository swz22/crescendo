// Centralized storage management
export const StorageKeys = {
  QUEUE: "crescendo_queue_v2",
  PLAYLISTS: "crescendo_playlists_v2",
  PREVIEW_CACHE: "crescendo_preview_cache_v2",
  ONBOARDING: "crescendo_onboarding_seen",
  VOLUME: "crescendo_volume",
};

export const clearAllAppData = () => {
  // Clear localStorage
  Object.values(StorageKeys).forEach((key) => {
    localStorage.removeItem(key);
  });

  // Clear sessionStorage
  sessionStorage.clear();

  // Clear IndexedDB if used
  if ("indexedDB" in window) {
    indexedDB.databases().then((databases) => {
      databases.forEach((db) => {
        if (db.name && db.name.startsWith("crescendo")) {
          indexedDB.deleteDatabase(db.name);
        }
      });
    });
  }

  // Clear caches
  if ("caches" in window) {
    caches.keys().then((names) => {
      names.forEach((name) => {
        if (name.startsWith("crescendo")) {
          caches.delete(name);
        }
      });
    });
  }

  // Reload to ensure clean state
  window.location.reload();
};

// Debug utility to view all storage
export const debugStorage = () => {
  const storage = {};

  // Get all localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.includes("crescendo")) {
      try {
        storage[key] = JSON.parse(localStorage.getItem(key));
      } catch {
        storage[key] = localStorage.getItem(key);
      }
    }
  }

  console.log("Crescendo Storage:", storage);
  return storage;
};
