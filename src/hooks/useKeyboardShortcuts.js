import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { playPause, setVolume } from "../redux/features/playerSlice";
import { useSongNavigation } from "./useSongNavigation";

// Global flag to disable music shortcuts
window.musicShortcutsDisabled = false;

export const useKeyboardShortcuts = () => {
  const dispatch = useDispatch();
  const { isPlaying, volume, currentTrack } = useSelector((state) => state.player);
  const { handleNextSong, handlePrevSong } = useSongNavigation();

  // Store previous volume for mute toggle
  const previousVolumeRef = useRef(volume);

  useEffect(() => {
    const handleKeyPress = (e) => {
      // Get the target element
      const target = e.target;
      const tagName = target.tagName.toLowerCase();

      // Don't trigger shortcuts when typing in inputs
      if (tagName === "input" || tagName === "textarea" || target.contentEditable === "true") {
        return;
      }

      if (window.musicShortcutsDisabled) {
        return;
      }

      // Handle shortcuts
      switch (e.key) {
        case " ": // Space - Play/Pause
          e.preventDefault();
          if (currentTrack) {
            dispatch(playPause(!isPlaying));
          }
          break;

        case "ArrowRight": // Next track
          if (currentTrack) {
            e.preventDefault();
            handleNextSong();
          }
          break;

        case "ArrowLeft": // Previous track
          if (currentTrack) {
            e.preventDefault();
            handlePrevSong();
          }
          break;

        case "ArrowUp": // Volume up
          e.preventDefault();
          const newVolumeUp = Math.min(volume + 0.1, 1);
          dispatch(setVolume(newVolumeUp));
          if (newVolumeUp > 0) {
            previousVolumeRef.current = newVolumeUp;
          }
          break;

        case "ArrowDown": // Volume down
          e.preventDefault();
          const newVolumeDown = Math.max(volume - 0.1, 0);
          dispatch(setVolume(newVolumeDown));
          if (newVolumeDown > 0) {
            previousVolumeRef.current = newVolumeDown;
          }
          break;

        case "m":
        case "M": // Mute/Unmute toggle
          e.preventDefault();
          if (volume > 0) {
            // Mute
            previousVolumeRef.current = volume;
            dispatch(setVolume(0));
          } else {
            // Unmute
            dispatch(setVolume(previousVolumeRef.current || 0.5));
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);

    // Cleanup
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [dispatch, isPlaying, volume, currentTrack, handleNextSong, handlePrevSong]);

  return {
    isPlaying,
    volume,
    isMuted: volume === 0,
  };
};
