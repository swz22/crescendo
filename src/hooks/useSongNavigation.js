import { useCallback, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { store } from "../redux/store";
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
      // Use Redux subscription instead of setTimeout hack
      const waitForStateUpdate = () => {
        return new Promise((resolve) => {
          const unsubscribe = store.subscribe(() => {
            // State has been updated
            unsubscribe();
            resolve();
          });

          // Dispatch the navigation action
          dispatch(navigateInContext({ direction: "next" }));
        });
      };

      await waitForStateUpdate();

      // Get the updated state
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
    } catch (error) {
      console.error("Navigation error:", error);
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
      // Use Redux subscription instead of setTimeout hack
      const waitForStateUpdate = () => {
        return new Promise((resolve) => {
          const unsubscribe = store.subscribe(() => {
            // State has been updated
            unsubscribe();
            resolve();
          });

          // Dispatch the navigation action
          dispatch(navigateInContext({ direction: "prev" }));
        });
      };

      await waitForStateUpdate();

      // Get the updated state
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
    } catch (error) {
      console.error("Navigation error:", error);
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
