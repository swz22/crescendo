import { useCallback, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { store } from "../redux/store";
import { navigateTrack, playPause } from "../redux/features/playerSlice";

export const useSongNavigation = () => {
  const dispatch = useDispatch();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleNextSong = useCallback(async () => {
    const { queue, isActive } = store.getState().player;

    if (!isActive || queue.tracks.length === 0 || isNavigating) {
      return;
    }

    // If only one song, restart it
    if (queue.tracks.length === 1) {
      dispatch(playPause(false));
      setTimeout(() => dispatch(playPause(true)), 100);
      return;
    }

    setIsNavigating(true);

    try {
      dispatch(navigateTrack({ direction: "next" }));
    } catch (error) {
      console.error("Error in handleNextSong:", error);
    } finally {
      setTimeout(() => setIsNavigating(false), 100);
    }
  }, [dispatch, isNavigating]);

  const handlePrevSong = useCallback(async () => {
    const { queue, isActive } = store.getState().player;

    if (!isActive || queue.tracks.length === 0 || isNavigating) {
      return;
    }

    // If only one song, restart it
    if (queue.tracks.length === 1) {
      dispatch(playPause(false));
      setTimeout(() => dispatch(playPause(true)), 100);
      return;
    }

    setIsNavigating(true);

    try {
      dispatch(navigateTrack({ direction: "prev" }));
    } catch (error) {
      console.error("Error in handlePrevSong:", error);
    } finally {
      setTimeout(() => setIsNavigating(false), 100);
    }
  }, [dispatch, isNavigating]);

  return { handleNextSong, handlePrevSong, isNavigating };
};
