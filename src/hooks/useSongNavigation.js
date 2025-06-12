import { useCallback, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  navigateSong,
  playPause,
  setActiveSong,
} from "../redux/features/playerSlice";
import { usePreviewUrl } from "../hooks/usePreviewUrl";

export const useSongNavigation = () => {
  const dispatch = useDispatch();
  const [isNavigating, setIsNavigating] = useState(false);
  const {
    queue,
    isActive,
    currentIndex,
    shuffle,
    shuffleOrder,
    repeat,
    isPlaying,
  } = useSelector((state) => state.player);
  const { getPreviewUrl } = usePreviewUrl();

  const handleNextSong = useCallback(async () => {
    if (!isActive || queue.length === 0 || isNavigating) {
      return;
    }

    // Single song - restart
    if (queue.length === 1) {
      dispatch(playPause(false));
      setTimeout(() => dispatch(playPause(true)), 100);
      return;
    }

    setIsNavigating(true);
    try {
      // Calculate next index based on shuffle state
      let nextIndex;
      if (shuffle && shuffleOrder.length > 0) {
        const currentShuffleIndex = shuffleOrder.indexOf(currentIndex);
        const nextShuffleIndex =
          (currentShuffleIndex + 1) % shuffleOrder.length;
        nextIndex = shuffleOrder[nextShuffleIndex];
      } else {
        nextIndex = (currentIndex + 1) % queue.length;
        if (nextIndex === 0 && !repeat) {
          dispatch(playPause(false));
          setIsNavigating(false);
          return;
        }
      }

      // Get the next song and ensure it has preview URL
      const nextSong = queue[nextIndex];
      const songWithPreview = await getPreviewUrl(nextSong);

      if (songWithPreview.preview_url) {
        // Update the queue with the song that has preview URL
        const updatedQueue = [...queue];
        updatedQueue[nextIndex] = songWithPreview;

        // Use setActiveSong which properly updates everything
        dispatch(
          setActiveSong({
            song: songWithPreview,
            data: updatedQueue,
            i: nextIndex,
          })
        );

        // Ensure playback continues
        if (!isPlaying) {
          dispatch(playPause(true));
        }
      } else {
        console.warn("No preview available for next song");
        // Still navigate to show the track info
        dispatch(navigateSong({ direction: "next" }));
      }
    } finally {
      setTimeout(() => setIsNavigating(false), 100);
    }
  }, [
    dispatch,
    isActive,
    queue,
    isNavigating,
    currentIndex,
    shuffle,
    shuffleOrder,
    repeat,
    getPreviewUrl,
    isPlaying,
  ]);

  const handlePrevSong = useCallback(async () => {
    if (!isActive || queue.length === 0 || isNavigating) {
      return;
    }

    // Single song - restart
    if (queue.length === 1) {
      dispatch(playPause(false));
      setTimeout(() => dispatch(playPause(true)), 100);
      return;
    }

    setIsNavigating(true);
    try {
      // Calculate previous index based on shuffle state
      let prevIndex;
      if (shuffle && shuffleOrder.length > 0) {
        const currentShuffleIndex = shuffleOrder.indexOf(currentIndex);
        const prevShuffleIndex = currentShuffleIndex - 1;
        prevIndex =
          shuffleOrder[
            prevShuffleIndex >= 0 ? prevShuffleIndex : shuffleOrder.length - 1
          ];
      } else {
        prevIndex = currentIndex - 1;
        if (prevIndex < 0) {
          prevIndex = repeat ? queue.length - 1 : 0;
        }
      }

      // Get the previous song and ensure it has preview URL
      const prevSong = queue[prevIndex];
      const songWithPreview = await getPreviewUrl(prevSong);

      if (songWithPreview.preview_url) {
        // Update the queue with the song that has preview URL
        const updatedQueue = [...queue];
        updatedQueue[prevIndex] = songWithPreview;

        // Use setActiveSong which properly updates everything
        dispatch(
          setActiveSong({
            song: songWithPreview,
            data: updatedQueue,
            i: prevIndex,
          })
        );

        // Ensure playback continues
        if (!isPlaying) {
          dispatch(playPause(true));
        }
      } else {
        console.warn("No preview available for previous song");
        // Still navigate to show the track info
        dispatch(navigateSong({ direction: "prev" }));
      }
    } finally {
      setTimeout(() => setIsNavigating(false), 100);
    }
  }, [
    dispatch,
    isActive,
    queue,
    isNavigating,
    currentIndex,
    shuffle,
    shuffleOrder,
    repeat,
    getPreviewUrl,
  ]);

  return { handleNextSong, handlePrevSong, isNavigating };
};
