import { useCallback, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  navigateInContext,
  updateCurrentTrackPreview,
} from "../redux/features/playerSlice";
import { usePreviewUrl } from "./usePreviewUrl";

export const useSongNavigation = () => {
  const dispatch = useDispatch();
  const [isNavigating, setIsNavigating] = useState(false);
  const navigationLockRef = useRef(false);
  const { getPreviewUrl } = usePreviewUrl();
  const { currentTrack } = useSelector((state) => state.player);

  const handleNextSong = useCallback(async () => {
    // Prevent concurrent navigation
    if (navigationLockRef.current) return;

    navigationLockRef.current = true;
    setIsNavigating(true);

    try {
      // Navigate to next track
      dispatch(navigateInContext({ direction: "next" }));

      // Small delay to ensure state is updated
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Get updated track from store
      const { store } = await import("../redux/store");
      const updatedState = store.getState().player;
      const newTrack = updatedState.currentTrack;

      if (newTrack && !newTrack.preview_url) {
        // Fetch preview URL
        const trackWithPreview = await getPreviewUrl(newTrack);
        if (trackWithPreview?.preview_url) {
          dispatch(updateCurrentTrackPreview({ track: trackWithPreview }));
        }
      }
    } finally {
      navigationLockRef.current = false;
      setIsNavigating(false);
    }
  }, [dispatch, getPreviewUrl]);

  const handlePrevSong = useCallback(async () => {
    // Prevent concurrent navigation
    if (navigationLockRef.current) return;

    navigationLockRef.current = true;
    setIsNavigating(true);

    try {
      // Navigate to previous track
      dispatch(navigateInContext({ direction: "prev" }));

      // Small delay to ensure state is updated
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Get updated track from store
      const { store } = await import("../redux/store");
      const updatedState = store.getState().player;
      const newTrack = updatedState.currentTrack;

      if (newTrack && !newTrack.preview_url) {
        // Fetch preview URL
        const trackWithPreview = await getPreviewUrl(newTrack);
        if (trackWithPreview?.preview_url) {
          dispatch(updateCurrentTrackPreview({ track: trackWithPreview }));
        }
      }
    } finally {
      navigationLockRef.current = false;
      setIsNavigating(false);
    }
  }, [dispatch, getPreviewUrl]);

  return {
    handleNextSong,
    handlePrevSong,
    isNavigating,
  };
};
