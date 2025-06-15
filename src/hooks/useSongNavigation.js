import { useCallback, useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { navigateInContext, playPause } from "../redux/features/playerSlice";
import { usePreviewUrl } from "../hooks/usePreviewUrl";

export const useSongNavigation = () => {
  const dispatch = useDispatch();
  const [isNavigating, setIsNavigating] = useState(false);
  const {
    activeContext,
    contexts,
    activeCommunityPlaylist,
    isActive,
    isPlaying,
  } = useSelector((state) => state.player);
  const { getPreviewUrl } = usePreviewUrl();

  // Get current context data
  const getCurrentContext = useCallback(() => {
    if (activeContext === "community_playlist") {
      return activeCommunityPlaylist;
    }
    return contexts[activeContext];
  }, [activeContext, contexts, activeCommunityPlaylist]);

  const handleNextSong = useCallback(async () => {
    if (!isActive || isNavigating) return;

    const currentContext = getCurrentContext();
    if (!currentContext || currentContext.tracks.length === 0) return;

    // Single song - restart
    if (currentContext.tracks.length === 1) {
      dispatch(playPause(false));
      setTimeout(() => dispatch(playPause(true)), 100);
      return;
    }

    setIsNavigating(true);
    try {
      dispatch(navigateInContext({ direction: "next" }));

      // Ensure playback continues
      if (!isPlaying) {
        dispatch(playPause(true));
      }
    } finally {
      setTimeout(() => setIsNavigating(false), 100);
    }
  }, [dispatch, isActive, isNavigating, getCurrentContext, isPlaying]);

  const handlePrevSong = useCallback(async () => {
    if (!isActive || isNavigating) return;

    const currentContext = getCurrentContext();
    if (!currentContext || currentContext.tracks.length === 0) return;

    // Single song - restart
    if (currentContext.tracks.length === 1) {
      dispatch(playPause(false));
      setTimeout(() => dispatch(playPause(true)), 100);
      return;
    }

    setIsNavigating(true);
    try {
      dispatch(navigateInContext({ direction: "prev" }));

      // Ensure playback continues
      if (!isPlaying) {
        dispatch(playPause(true));
      }
    } finally {
      setTimeout(() => setIsNavigating(false), 100);
    }
  }, [dispatch, isActive, isNavigating, getCurrentContext, isPlaying]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setIsNavigating(false);
    };
  }, []);

  return {
    handleNextSong,
    handlePrevSong,
    isNavigating,
    currentContext: getCurrentContext(),
  };
};
