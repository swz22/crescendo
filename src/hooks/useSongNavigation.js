import { useCallback, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  navigateInContext,
  playFromContext,
} from "../redux/features/playerSlice";
import { usePreviewUrl } from "./usePreviewUrl";

export const useSongNavigation = () => {
  const dispatch = useDispatch();
  const [isNavigating, setIsNavigating] = useState(false);
  const navigationLockRef = useRef(false);
  const { getPreviewUrl } = usePreviewUrl();
  const { activeContext } = useSelector((state) => state.player);

  const handleNextSong = useCallback(async () => {
    // Prevent concurrent navigation
    if (navigationLockRef.current) return;

    navigationLockRef.current = true;
    setIsNavigating(true);

    try {
      // First, navigate to get the new index
      dispatch(navigateInContext({ direction: "next" }));

      // Small delay to ensure state is updated
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Get updated state from store
      const { store } = await import("../redux/store");
      const updatedState = store.getState().player;
      const newTrack = updatedState.currentTrack;
      const newIndex = updatedState.currentIndex;

      if (newTrack && !newTrack.preview_url) {
        // Fetch preview URL
        const trackWithPreview = await getPreviewUrl(newTrack);
        if (trackWithPreview?.preview_url) {
          // Use playFromContext to update both current track and context
          dispatch(
            playFromContext({
              contextType: activeContext,
              trackIndex: newIndex,
              trackWithPreview: trackWithPreview,
            })
          );
        }
      }
    } finally {
      navigationLockRef.current = false;
      setIsNavigating(false);
    }
  }, [dispatch, getPreviewUrl, activeContext]);

  const handlePrevSong = useCallback(async () => {
    // Prevent concurrent navigation
    if (navigationLockRef.current) return;

    navigationLockRef.current = true;
    setIsNavigating(true);

    try {
      // First, navigate to get the new index
      dispatch(navigateInContext({ direction: "prev" }));

      // Small delay to ensure state is updated
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Get updated state from store
      const { store } = await import("../redux/store");
      const updatedState = store.getState().player;
      const newTrack = updatedState.currentTrack;
      const newIndex = updatedState.currentIndex;

      if (newTrack && !newTrack.preview_url) {
        // Fetch preview URL
        const trackWithPreview = await getPreviewUrl(newTrack);
        if (trackWithPreview?.preview_url) {
          // Use playFromContext to update both current track and context
          dispatch(
            playFromContext({
              contextType: activeContext,
              trackIndex: newIndex,
              trackWithPreview: trackWithPreview,
            })
          );
        }
      }
    } finally {
      navigationLockRef.current = false;
      setIsNavigating(false);
    }
  }, [dispatch, getPreviewUrl, activeContext]);

  return {
    handleNextSong,
    handlePrevSong,
    isNavigating,
  };
};
