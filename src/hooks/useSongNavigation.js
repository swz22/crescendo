import { useCallback, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { changeTrackAndPlay, playPause } from "../redux/features/playerSlice";
import { usePreviewUrl } from "../hooks/usePreviewUrl";

export const useSongNavigation = () => {
  const dispatch = useDispatch();
  const { currentSongs, currentIndex, playlistContext } = useSelector(
    (state) => state.player
  );
  const { getPreviewUrl, isPreviewCached } = usePreviewUrl();
  const [isNavigating, setIsNavigating] = useState(false);

  const getOptimizedSong = useCallback(
    async (rawSong, songIndex) => {
      // Don't extract from track - use the root level data which has all metadata
      let songData = rawSong;

      // The song already has all the data at root level
      // title, subtitle, images, etc. are all there

      const trackId = songData?.key || songData?.id || songData?.track_id;

      // If song already has preview_url, return immediately with full data
      if (songData?.preview_url) {
        return songData;
      }

      // If URL field exists, use it
      if (songData?.url) {
        return {
          ...songData,
          preview_url: songData.url,
        };
      }

      // Check if it's cached
      if (trackId && isPreviewCached(songData)) {
        // This should be instant from cache
        const cachedResponse = await getPreviewUrl(songData);

        // Make sure we preserve all the original song data
        let finalSong;
        if (cachedResponse && typeof cachedResponse === "object") {
          // If getPreviewUrl returns a full song object with all data
          if (cachedResponse.title && cachedResponse.preview_url) {
            finalSong = cachedResponse;
          } else {
            // If it only returns preview URL, merge with original
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

      // Only if not cached, fetch it (slow path)
      const fetchedSong = await getPreviewUrl(songData);

      // Make sure we have valid data
      if (fetchedSong && fetchedSong.preview_url) {
        return fetchedSong;
      }

      // Fallback - merge with original
      return {
        ...songData,
        ...fetchedSong,
        // Ensure critical fields are preserved from original
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
      // First pause current playback
      dispatch(playPause(false));

      const nextIndex = (currentIndex + 1) % currentSongs.length;
      let nextSongData = currentSongs[nextIndex];

      // Get optimized song with preview URL
      const optimizedSong = await getOptimizedSong(nextSongData, nextIndex);

      if (!optimizedSong || !optimizedSong.preview_url) {
        setIsNavigating(false);
        return;
      }

      // Use the new combined action
      dispatch(
        changeTrackAndPlay({
          song: optimizedSong,
          index: nextIndex,
        })
      );
    } catch (error) {
      console.error("Error in handleNextSong:", error);
    } finally {
      // Reset navigation state after a short delay
      setTimeout(() => setIsNavigating(false), 100);
    }
  }, [currentSongs, currentIndex, dispatch, getOptimizedSong, isNavigating]);

  const handlePrevSong = useCallback(async () => {
    if (!currentSongs || currentSongs.length === 0 || isNavigating) {
      return;
    }

    setIsNavigating(true);

    try {
      // First pause current playback
      dispatch(playPause(false));

      const prevIndex =
        currentIndex === 0 ? currentSongs.length - 1 : currentIndex - 1;
      let prevSongData = currentSongs[prevIndex];

      // Get optimized song with preview URL
      const optimizedSong = await getOptimizedSong(prevSongData, prevIndex);

      if (!optimizedSong || !optimizedSong.preview_url) {
        setIsNavigating(false);
        return;
      }

      // Use the new combined action
      dispatch(
        changeTrackAndPlay({
          song: optimizedSong,
          index: prevIndex,
        })
      );
    } catch (error) {
      console.error("Error in handlePrevSong:", error);
    } finally {
      // Reset navigation state after a short delay
      setTimeout(() => setIsNavigating(false), 100);
    }
  }, [currentSongs, currentIndex, dispatch, getOptimizedSong, isNavigating]);

  return { handleNextSong, handlePrevSong, isNavigating };
};
