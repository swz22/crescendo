import { useState, useCallback, useRef, useEffect } from "react";

export const useLoadingState = () => {
  const [loadingStates, setLoadingStates] = useState({});
  const timeoutRefs = useRef({});

  useEffect(() => {
    return () => {
      Object.values(timeoutRefs.current).forEach(clearTimeout);
    };
  }, []);

  const setLoading = useCallback((id, isLoading) => {
    if (isLoading) {
      // Clear any existing timeout for this ID
      if (timeoutRefs.current[id]) {
        clearTimeout(timeoutRefs.current[id]);
      }

      setLoadingStates((prev) => ({ ...prev, [id]: true }));

      // Auto-clear after 10 seconds
      timeoutRefs.current[id] = setTimeout(() => {
        setLoadingStates((prev) => {
          const newState = { ...prev };
          delete newState[id];
          return newState;
        });
        delete timeoutRefs.current[id];
      }, 10000);
    } else {
      // Clear loading state and timeout
      if (timeoutRefs.current[id]) {
        clearTimeout(timeoutRefs.current[id]);
        delete timeoutRefs.current[id];
      }
      setLoadingStates((prev) => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
    }
  }, []);

  const isLoading = useCallback(
    (id) => {
      return Boolean(loadingStates[id]);
    },
    [loadingStates]
  );

  const clearAll = useCallback(() => {
    // Clear all timeouts
    Object.values(timeoutRefs.current).forEach(clearTimeout);
    timeoutRefs.current = {};

    // Clear all loading states
    setLoadingStates({});
  }, []);

  return {
    setLoading,
    isLoading,
    clearAll,
    loadingStates,
  };
};
