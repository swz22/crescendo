import { useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useScrollContainer } from "../context/ScrollContext";

const STORAGE_PREFIX = "crescendo_scroll_";
const CLEANUP_INTERVAL = 30 * 60 * 1000; // 30 minutes
const DEBOUNCE_DELAY = 100;

export const usePersistentScroll = () => {
  const location = useLocation();
  const scrollContainerRef = useScrollContainer();
  const debounceTimerRef = useRef(null);
  const hasRestoredRef = useRef(false);
  const lastPathRef = useRef(location.pathname);

  // Clean up old scroll positions
  const cleanupOldPositions = useCallback(() => {
    const now = Date.now();
    const keysToRemove = [];

    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        try {
          const data = JSON.parse(sessionStorage.getItem(key));
          if (
            data &&
            data.timestamp &&
            now - data.timestamp > CLEANUP_INTERVAL
          ) {
            keysToRemove.push(key);
          }
        } catch (e) {
          keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach((key) => sessionStorage.removeItem(key));
  }, []);

  // Save scroll position
  const saveScrollPosition = useCallback(() => {
    if (!scrollContainerRef.current) return;

    const scrollTop = scrollContainerRef.current.scrollTop;
    const storageKey = `${STORAGE_PREFIX}${location.pathname}`;

    try {
      sessionStorage.setItem(
        storageKey,
        JSON.stringify({
          scrollTop,
          timestamp: Date.now(),
          pathname: location.pathname,
        })
      );
    } catch (e) {
      cleanupOldPositions();
      try {
        sessionStorage.setItem(
          storageKey,
          JSON.stringify({
            scrollTop,
            timestamp: Date.now(),
            pathname: location.pathname,
          })
        );
      } catch (err) {
        console.warn("Failed to save scroll position:", err);
      }
    }
  }, [location.pathname, scrollContainerRef, cleanupOldPositions]);

  // Debounced save function
  const debouncedSaveScrollPosition = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      saveScrollPosition();
    }, DEBOUNCE_DELAY);
  }, [saveScrollPosition]);

  // Restore scroll position
  const restoreScrollPosition = useCallback(() => {
    if (!scrollContainerRef.current || hasRestoredRef.current) return;

    const storageKey = `${STORAGE_PREFIX}${location.pathname}`;

    try {
      const savedData = sessionStorage.getItem(storageKey);
      if (savedData) {
        const { scrollTop } = JSON.parse(savedData);

        // Ensure DOM is ready
        requestAnimationFrame(() => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollTop;
            hasRestoredRef.current = true;
          }
        });
      }
    } catch (e) {
      console.warn("Failed to restore scroll position:", e);
    }
  }, [location.pathname, scrollContainerRef]);

  // Handle scroll events
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      debouncedSaveScrollPosition();
    };

    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      container.removeEventListener("scroll", handleScroll);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [debouncedSaveScrollPosition, scrollContainerRef]);

  // Handle route changes
  useEffect(() => {
    // Save scroll position when leaving the page
    if (lastPathRef.current !== location.pathname) {
      saveScrollPosition();
      lastPathRef.current = location.pathname;
      hasRestoredRef.current = false;
    }

    // Restore scroll position after a short delay
    const restoreTimer = setTimeout(() => {
      restoreScrollPosition();
    }, 50);

    cleanupOldPositions();

    return () => {
      clearTimeout(restoreTimer);
    };
  }, [
    location.pathname,
    saveScrollPosition,
    restoreScrollPosition,
    cleanupOldPositions,
  ]);

  const scrollToTop = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }, [scrollContainerRef]);

  return { scrollToTop };
};
