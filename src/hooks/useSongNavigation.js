import { useCallback, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  changeTrackAndPlay,
  playPause,
  toggleShuffle,
} from "../redux/features/playerSlice";
import { usePreviewUrl } from "../hooks/usePreviewUrl";

export const useSongNavigation = () => {
  const dispatch = useDispatch();
  const {
    currentSongs,
    currentIndex,
    playlistContext,
    shuffle,
    shuffleIndices,
    playedIndices,
  } = useSelector((state) => state.player);
  const { getPreviewUrl, isPreviewCached } = usePreviewUrl();
  const [isNavigating, setIsNavigating] = useState(false);

  const getOptimizedSong = useCallback(
    async (rawSong, songIndex) => {
      let songData = rawSong;
      const trackId = songData?.key || songData?.id || songData?.track_id;

      if (songData?.preview_url) {
        return songData;
      }

      if (songData?.url) {
        return {
          ...songData,
          preview_url: songData.url,
        };
      }

      if (trackId && isPreviewCached(songData)) {
        const cachedResponse = await getPreviewUrl(songData);

        let finalSong;
        if (cachedResponse && typeof cachedResponse === "object") {
          if (cachedResponse.title && cachedResponse.preview_url) {
            finalSong = cachedResponse;
          } else {
            finalSong = {
              ...songData,
              preview_url: cachedResponse.preview_url || cachedResponse.url,
              url: cachedResponse.preview_url || cachedResponse.url,
            };
          }
        } else {
          finalSong = songData;
        }

        return finalSong;
      }

      const fetchedSong = await getPreviewUrl(songData);

      if (fetchedSong && fetchedSong.preview_url) {
        return fetchedSong;
      }

      return {
        ...songData,
        ...fetchedSong,
        title: songData.title || fetchedSong?.title,
        subtitle: songData.subtitle || fetchedSong?.subtitle,
        artists: songData.artists || fetchedSong?.artists,
        images: songData.images || fetchedSong?.images,
      };
    },
    [getPreviewUrl, isPreviewCached]
  );

  const handleNextSong = useCallback(async () => {
    if (!currentSongs || currentSongs.length === 0 || isNavigating) {
      return;
    }

    setIsNavigating(true);

    try {
      console.log("Shuffle state:", shuffle);
      console.log("Shuffle indices:", shuffleIndices);
      console.log("Played indices:", playedIndices);
      console.log("Current index:", currentIndex);
      dispatch(playPause(false));

      let nextIndex;

      if (shuffle && shuffleIndices.length > 0) {
        // Find next unplayed song in shuffle order
        const remainingIndices = shuffleIndices.filter(
          (index) => !playedIndices.includes(index)
        );

        if (remainingIndices.length > 0) {
          nextIndex = remainingIndices[0];
        } else {
          // All songs played, restart shuffle
          dispatch(toggleShuffle());
          dispatch(toggleShuffle());
          nextIndex = shuffleIndices[0];
        }
      } else {
        // Normal sequential playback
        nextIndex = (currentIndex + 1) % currentSongs.length;
      }

      let nextSongData = currentSongs[nextIndex];
      const optimizedSong = await getOptimizedSong(nextSongData, nextIndex);

      if (!optimizedSong || !optimizedSong.preview_url) {
        setIsNavigating(false);
        return;
      }

      dispatch(
        changeTrackAndPlay({
          song: optimizedSong,
          index: nextIndex,
        })
      );
    } catch (error) {
      console.error("Error in handleNextSong:", error);
    } finally {
      setTimeout(() => setIsNavigating(false), 100);
    }
  }, [
    currentSongs,
    currentIndex,
    dispatch,
    getOptimizedSong,
    isNavigating,
    shuffle,
    shuffleIndices,
    playedIndices,
  ]);

  const handlePrevSong = useCallback(async () => {
    if (!currentSongs || currentSongs.length === 0 || isNavigating) {
      return;
    }

    setIsNavigating(true);

    try {
      dispatch(playPause(false));

      let prevIndex;

      if (shuffle && playedIndices.length > 1) {
        // Go back in shuffle history
        prevIndex = playedIndices[playedIndices.length - 2];
      } else {
        // Normal sequential playback
        prevIndex =
          currentIndex === 0 ? currentSongs.length - 1 : currentIndex - 1;
      }

      let prevSongData = currentSongs[prevIndex];
      const optimizedSong = await getOptimizedSong(prevSongData, prevIndex);

      if (!optimizedSong || !optimizedSong.preview_url) {
        setIsNavigating(false);
        return;
      }

      dispatch(
        changeTrackAndPlay({
          song: optimizedSong,
          index: prevIndex,
        })
      );
    } catch (error) {
      console.error("Error in handlePrevSong:", error);
    } finally {
      setTimeout(() => setIsNavigating(false), 100);
    }
  }, [
    currentSongs,
    currentIndex,
    dispatch,
    getOptimizedSong,
    isNavigating,
    shuffle,
    playedIndices,
  ]);

  return { handleNextSong, handlePrevSong, isNavigating };
};
