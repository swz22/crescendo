import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";

import {
  playPause,
  toggleShuffle,
  toggleRepeat,
} from "../../redux/features/playerSlice";
import { useSongNavigation } from "../../hooks/useSongNavigation";
import { useAudioPreload } from "../../hooks/useAudioPreload";
import { usePreviewUrl } from "../../hooks/usePreviewUrl";
import Controls from "./Controls";
import Player from "./Player";
import Seekbar from "./Seekbar";
import Track from "./Track";
import VolumeBar from "./VolumeBar";
import TrackLoadingState from "../TrackLoadingState";

const MusicPlayer = () => {
  const {
    activeSong,
    currentSongs,
    currentIndex,
    isActive,
    isPlaying,
    shuffle,
    repeat,
  } = useSelector((state) => state.player);
  const [duration, setDuration] = useState(0);
  const [seekTime, setSeekTime] = useState(0);
  const [appTime, setAppTime] = useState(0);
  const [volume, setVolume] = useState(0.3);
  const [isChangingTrack, setIsChangingTrack] = useState(false);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const dispatch = useDispatch();
  const {
    handleNextSong: originalHandleNextSong,
    handlePrevSong: originalHandlePrevSong,
    isNavigating,
  } = useSongNavigation();
  const { preloadMultiple } = useAudioPreload();
  const { getPreviewUrl, isPreviewCached } = usePreviewUrl();
  const lastSongUrlRef = useRef(null);

  // Track when audio is actually ready to play
  const handleAudioReady = () => {
    setIsAudioReady(true);
    setIsChangingTrack(false);
  };

  // Track when audio starts loading
  const handleAudioLoading = () => {
    setIsAudioReady(false);
  };

  // Show loading when song URL changes
  useEffect(() => {
    const songUrl = activeSong?.preview_url || activeSong?.url;

    if (songUrl && songUrl !== lastSongUrlRef.current) {
      setIsChangingTrack(true);
      setIsAudioReady(false);
      lastSongUrlRef.current = songUrl;
    }
  }, [activeSong]);

  // Wrap navigation functions to show loading state
  const handleNextSong = async () => {
    // Don't show loading if only one song
    if (!currentSongs || currentSongs.length <= 1) {
      return;
    }

    setIsChangingTrack(true);
    setIsAudioReady(false);

    try {
      await originalHandleNextSong();
    } catch (error) {
      console.error("Error in handleNextSong:", error);
      setIsChangingTrack(false);
    }
  };

  const handlePrevSong = async () => {
    // Don't show loading if only one song
    if (!currentSongs || currentSongs.length <= 1) {
      return;
    }

    setIsChangingTrack(true);
    setIsAudioReady(false);

    try {
      await originalHandlePrevSong();
    } catch (error) {
      console.error("Error in handlePrevSong:", error);
      setIsChangingTrack(false);
    }
  };

  // Hide loading only when audio is ready AND we were changing tracks
  useEffect(() => {
    if (isAudioReady && isChangingTrack) {
      setIsChangingTrack(false);
    }
  }, [isAudioReady, isChangingTrack]);

  // Monitor isNavigating from useSongNavigation
  useEffect(() => {}, [isNavigating]);

  // Start playing when song changes
  useEffect(() => {
    if (currentSongs.length && activeSong?.preview_url) {
      dispatch(playPause(true));
    }
  }, [currentIndex, activeSong]);

  // Preload next songs when current song changes
  useEffect(() => {
    if (currentSongs.length > 0 && currentIndex !== undefined && activeSong) {
      const preloadSongs = async () => {
        const nextSongs = [];

        // Get next 3 songs
        for (let i = 1; i <= 3; i++) {
          const nextIndex = (currentIndex + i) % currentSongs.length;
          let nextSong = currentSongs[nextIndex];

          // Handle nested structure
          if (nextSong?.track) {
            nextSong = nextSong.track;
          }

          // If song doesn't have preview URL but is cached, get it
          if (
            !nextSong.preview_url &&
            !nextSong.url &&
            isPreviewCached(nextSong)
          ) {
            try {
              const songWithPreview = await getPreviewUrl(nextSong);
              if (songWithPreview.preview_url) {
                nextSongs.push(songWithPreview);
              }
            } catch (err) {
              console.error("Error getting preview URL for preload:", err);
            }
          } else if (nextSong.preview_url || nextSong.url) {
            nextSongs.push(nextSong);
          }
        }

        if (nextSongs.length > 0) {
          preloadMultiple(nextSongs);
        }
      };

      preloadSongs();
    }
  }, [
    currentIndex,
    currentSongs,
    activeSong,
    preloadMultiple,
    getPreviewUrl,
    isPreviewCached,
  ]);

  const handlePlayPause = () => {
    if (!isActive) return;

    if (isPlaying) {
      dispatch(playPause(false));
    } else {
      dispatch(playPause(true));
    }
  };

  // Get the song image with multiple fallbacks
  const getSongImage = () => {
    if (!activeSong)
      return "https://via.placeholder.com/240x240.png?text=No+Song";

    // Try different possible image paths
    if (activeSong.images?.coverart) return activeSong.images.coverart;
    if (activeSong.share?.image) return activeSong.share.image;
    if (activeSong.images?.background) return activeSong.images.background;
    if (activeSong.attributes?.artwork?.url) {
      return activeSong.attributes.artwork.url
        .replace("{w}", "240")
        .replace("{h}", "240");
    }
    if (activeSong.hub?.image) return activeSong.hub.image;

    return "https://via.placeholder.com/240x240.png?text=No+Image";
  };

  const getSongUrl = () => {
    if (!activeSong) {
      return "";
    }

    // Check all possible locations for preview URL
    if (activeSong.preview_url) {
      return activeSong.preview_url;
    }

    // Also check url field
    if (activeSong.url) {
      return activeSong.url;
    }

    // Legacy ShazamCore structure
    if (activeSong.hub?.actions?.[1]?.uri) return activeSong.hub.actions[1].uri;
    if (activeSong.hub?.actions?.[0]?.uri) return activeSong.hub.actions[0].uri;

    // Direct uri field
    if (activeSong.uri) return activeSong.uri;

    // Look for any action with a URI
    if (activeSong.hub?.actions) {
      const action = activeSong.hub.actions.find((action) => action.uri);
      if (action?.uri) return action.uri;
    }

    return "";
  };

  const songUrl = getSongUrl();

  // Handle case where song has no URL
  useEffect(() => {
    if (activeSong && !songUrl && isPlaying) {
      dispatch(playPause(false));
      setIsChangingTrack(false);
    }
  }, [activeSong, songUrl, isPlaying, dispatch]);

  return (
    <>
      <TrackLoadingState isLoading={isChangingTrack} />
      <div className="relative sm:px-12 px-8 w-full h-full flex items-center justify-between">
        <Track
          isPlaying={isPlaying}
          isActive={isActive}
          activeSong={activeSong}
          songImage={getSongImage()}
        />
        <div className="flex-1 flex flex-col items-center justify-center">
          <Controls
            isPlaying={isPlaying}
            isActive={isActive}
            repeat={repeat}
            setRepeat={() => dispatch(toggleRepeat())}
            shuffle={shuffle}
            setShuffle={() => dispatch(toggleShuffle())}
            currentSongs={currentSongs}
            handlePlayPause={handlePlayPause}
            handlePrevSong={handlePrevSong}
            handleNextSong={handleNextSong}
          />
          <Seekbar
            value={appTime}
            min="0"
            max={duration}
            onInput={(event) => setSeekTime(event.target.value)}
            setSeekTime={setSeekTime}
            appTime={appTime}
          />
          <Player
            activeSong={activeSong}
            songUrl={songUrl}
            volume={volume}
            isPlaying={isPlaying}
            seekTime={seekTime}
            repeat={repeat}
            currentIndex={currentIndex}
            onEnded={handleNextSong}
            onTimeUpdate={(event) => setAppTime(event.target.currentTime)}
            onLoadedData={(event) => {
              setDuration(event.target.duration);
              handleAudioReady();
            }}
            onCanPlay={() => {
              handleAudioReady();
            }}
            onLoadStart={() => {
              handleAudioLoading();
            }}
          />
        </div>
        <VolumeBar
          value={volume}
          min="0"
          max="1"
          onChange={(event) => setVolume(event.target.value)}
          setVolume={setVolume}
        />
      </div>
    </>
  );
};

export default MusicPlayer;
