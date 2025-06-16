import { useEffect, useRef } from "react";

export const useAudioCleanup = () => {
  const audioInstancesRef = useRef(new Set());

  const registerAudioElement = (element) => {
    if (element) {
      audioInstancesRef.current.add(element);
    }
  };

  const cleanupAllAudio = () => {
    audioInstancesRef.current.forEach((audio) => {
      try {
        audio.pause();
        audio.currentTime = 0;
        audio.src = "";
        audio.load();
      } catch (error) {
        console.error("Error cleaning up audio:", error);
      }
    });
    audioInstancesRef.current.clear();
  };

  const cleanupExceptCurrent = (currentElement) => {
    audioInstancesRef.current.forEach((audio) => {
      if (audio !== currentElement) {
        try {
          audio.pause();
          audio.currentTime = 0;
          audio.src = "";
          audio.load();
        } catch (error) {
          console.error("Error cleaning up audio:", error);
        }
      }
    });

    // Keep only current element
    audioInstancesRef.current.clear();
    if (currentElement) {
      audioInstancesRef.current.add(currentElement);
    }
  };

  useEffect(() => {
    return () => {
      cleanupAllAudio();
    };
  }, []);

  return {
    registerAudioElement,
    cleanupAllAudio,
    cleanupExceptCurrent,
  };
};
