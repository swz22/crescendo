import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { MdSkipNext, MdSkipPrevious } from "react-icons/md";
import {
  BsArrowRepeat,
  BsFillPauseFill,
  BsFillPlayFill,
  BsShuffle,
} from "react-icons/bs";

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
      setSeekTime(0); // Reset seek position for new track
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

  // Clear loading state when playback stops at end of queue or when staying on same track
  useEffect(() => {
    if (!isPlaying && isChangingTrack) {
      // Clear if at last track without repeat, or at first track
      if (
        (currentIndex === currentSongs.length - 1 && !repeat) ||
        currentIndex === 0
      ) {
        setIsChangingTrack(false);
      }
    }
  }, [isPlaying, isChangingTrack, currentIndex, currentSongs.length, repeat]);

  // Hide loading only when audio is ready AND we were changing tracks
  useEffect(() => {
    if (isAudioReady && isChangingTrack) {
      setIsChangingTrack(false);
    }
  }, [isAudioReady, isChangingTrack]);

  // Monitor isNavigating from useSongNavigation
  useEffect(() => {}, [isNavigating]);

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

  // Debug logging for playback state
  useEffect(() => {
    console.log("MusicPlayer - isPlaying changed to:", isPlaying);
    console.log("MusicPlayer - activeSong:", activeSong);
    console.log("MusicPlayer - songUrl:", songUrl);
  }, [isPlaying, activeSong, songUrl]);

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
      {/* Desktop Layout */}
      <div className="hidden sm:flex relative px-4 sm:px-8 lg:px-12 w-full h-full items-center justify-between">
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

      {/* Mobile Layout - Compact Floating Design */}
      <div className="sm:hidden flex items-center justify-between w-full h-full px-3 py-2">
        {/* Left: Track Info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <img
            src={getSongImage()}
            alt="cover"
            className="w-12 h-12 rounded-lg shadow-md"
          />
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">
              {activeSong?.title || "No active Song"}
            </p>
            <p className="text-gray-400 text-xs truncate">
              {activeSong?.subtitle || "Unknown Artist"}
            </p>
          </div>
        </div>

        {/* Right: Minimal Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevSong}
            className="p-2 text-white/80 active:scale-95"
          >
            <MdSkipPrevious size={24} />
          </button>

          <button
            onClick={handlePlayPause}
            className="p-2.5 bg-[#14b8a6] rounded-full text-white shadow-lg active:scale-95"
          >
            {isPlaying ? (
              <BsFillPauseFill size={18} />
            ) : (
              <BsFillPlayFill size={18} className="translate-x-0.5" />
            )}
          </button>

          <button
            onClick={handleNextSong}
            className="p-2 text-white/80 active:scale-95"
          >
            <MdSkipNext size={24} />
          </button>
        </div>

        {/* Hidden Player */}
        <div className="hidden">
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
      </div>
    </>
  );
};

export default MusicPlayer;
