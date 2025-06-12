import { useCallback, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { navigateSong, playPause } from "../redux/features/playerSlice";

export const useSongNavigation = () => {
  const dispatch = useDispatch();
  const [isNavigating, setIsNavigating] = useState(false);
  const { queue, isActive } = useSelector((state) => state.player);

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
      dispatch(navigateSong({ direction: "next" }));
    } finally {
      setTimeout(() => setIsNavigating(false), 100);
    }
  }, [dispatch, isActive, queue.length, isNavigating]);

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
      dispatch(navigateSong({ direction: "prev" }));
    } finally {
      setTimeout(() => setIsNavigating(false), 100);
    }
  }, [dispatch, isActive, queue.length, isNavigating]);

  return { handleNextSong, handlePrevSong, isNavigating };
};
