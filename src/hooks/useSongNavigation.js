import { useCallback, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  navigateInContext,
  updateCurrentTrackPreview,
} from "../redux/features/playerSlice";
import { usePreviewUrl } from "./usePreviewUrl";

export const useSongNavigation = () => {
  const dispatch = useDispatch();
  const [isNavigating, setIsNavigating] = useState(false);
  const { getPreviewUrl } = usePreviewUrl();
  const { currentTrack } = useSelector((state) => state.player);

  const handleNextSong = useCallback(async () => {
    if (isNavigating) return;

    setIsNavigating(true);
    try {
      // Navigate to next track
      dispatch(navigateInContext({ direction: "next" }));

      // Small delay to ensure state is updated
      await new Promise((resolve) => setTimeout(resolve, 50));

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
      setIsNavigating(false);
    }
  }, [dispatch, isNavigating, getPreviewUrl]);

  const handlePrevSong = useCallback(async () => {
    if (isNavigating) return;

    setIsNavigating(true);
    try {
      // Navigate to previous track
      dispatch(navigateInContext({ direction: "prev" }));

      // Small delay to ensure state is updated
      await new Promise((resolve) => setTimeout(resolve, 50));

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
      setIsNavigating(false);
    }
  }, [dispatch, isNavigating, getPreviewUrl]);

  return {
    handleNextSong,
    handlePrevSong,
    isNavigating,
  };
};
