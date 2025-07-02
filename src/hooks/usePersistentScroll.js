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

  const saveScrollPosition = useCallback(() => {
    if (!scrollContainerRef.current) return;

    const scrollTop = scrollContainerRef.current.scrollTop;
    const storageKey = `${STORAGE_PREFIX}${lastPathRef.current}`;

    try {
      sessionStorage.setItem(
        storageKey,
        JSON.stringify({
          scrollTop,
          timestamp: Date.now(),
          pathname: lastPathRef.current,
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
            pathname: lastPathRef.current,
          })
        );
      } catch (err) {
        console.warn("Failed to save scroll position:", err);
      }
    }
  }, [scrollContainerRef, cleanupOldPositions]);

  const debouncedSaveScrollPosition = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      saveScrollPosition();
    }, DEBOUNCE_DELAY);
  }, [saveScrollPosition]);

  const restoreScrollPosition = useCallback(() => {
    if (!scrollContainerRef.current || hasRestoredRef.current) return;

    const storageKey = `${STORAGE_PREFIX}${location.pathname}`;

    try {
      const savedData = sessionStorage.getItem(storageKey);
      if (savedData) {
        const { scrollTop } = JSON.parse(savedData);

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
    if (lastPathRef.current !== location.pathname) {
      saveScrollPosition();
      lastPathRef.current = location.pathname;
      hasRestoredRef.current = false;
    }

    // For lazy-loaded components, wait for content
    let resizeObserver;
    let restoreAttempts = 0;
    const maxAttempts = 20;

    const attemptRestore = () => {
      if (!scrollContainerRef.current || hasRestoredRef.current) return;

      const storageKey = `${STORAGE_PREFIX}${location.pathname}`;
      const savedData = sessionStorage.getItem(storageKey);

      if (!savedData) return;

      try {
        const { scrollTop } = JSON.parse(savedData);
        if (!scrollTop) return;

        const container = scrollContainerRef.current;
        const scrollHeight = container.scrollHeight;
        const clientHeight = container.clientHeight;
        const maxScrollTop = scrollHeight - clientHeight;

        if (scrollHeight > clientHeight && scrollTop <= maxScrollTop) {
          container.scrollTop = scrollTop;
          hasRestoredRef.current = true;

          if (resizeObserver) {
            resizeObserver.disconnect();
          }
        } else if (scrollTop > maxScrollTop && maxScrollTop > 0) {
          // If saved position is beyond max, scroll to bottom
          container.scrollTop = maxScrollTop;
          hasRestoredRef.current = true;

          if (resizeObserver) {
            resizeObserver.disconnect();
          }
        } else if (restoreAttempts < maxAttempts) {
          restoreAttempts++;
          setTimeout(attemptRestore, 100);
        }
      } catch (e) {
        console.warn("Failed to restore scroll position:", e);
      }
    };

    // Detect when content size changes
    if (scrollContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        if (!hasRestoredRef.current) {
          attemptRestore();
        }
      });

      resizeObserver.observe(scrollContainerRef.current);
    }

    const restoreTimer = setTimeout(attemptRestore, 100);

    cleanupOldPositions();

    return () => {
      clearTimeout(restoreTimer);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [location.pathname, saveScrollPosition, cleanupOldPositions]);

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
