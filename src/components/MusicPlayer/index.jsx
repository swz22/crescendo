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

  const handleAudioReady = () => {
    setIsAudioReady(true);
    setIsChangingTrack(false);
  };

  const handleAudioLoading = () => {
    setIsAudioReady(false);
  };

  useEffect(() => {
    const songUrl = activeSong?.preview_url || activeSong?.url;

    if (songUrl && songUrl !== lastSongUrlRef.current) {
      setIsChangingTrack(true);
      setIsAudioReady(false);
      setSeekTime(0);
      lastSongUrlRef.current = songUrl;
    }
  }, [activeSong]);

  const handleNextSong = async () => {
    if (!currentSongs || currentSongs.length <= 1) return;

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
    if (!currentSongs || currentSongs.length <= 1) return;

    setIsChangingTrack(true);
    setIsAudioReady(false);

    try {
      await originalHandlePrevSong();
    } catch (error) {
      console.error("Error in handlePrevSong:", error);
      setIsChangingTrack(false);
    }
  };

  useEffect(() => {
    if (!isPlaying && isChangingTrack) {
      if (
        (currentIndex === currentSongs.length - 1 && !repeat) ||
        currentIndex === 0
      ) {
        setIsChangingTrack(false);
      }
    }
  }, [isPlaying, isChangingTrack, currentIndex, currentSongs.length, repeat]);

  useEffect(() => {
    if (isAudioReady && isChangingTrack) {
      setIsChangingTrack(false);
    }
  }, [isAudioReady, isChangingTrack]);

  useEffect(() => {}, [isNavigating]);

  useEffect(() => {
    if (currentSongs.length > 0 && currentIndex !== undefined && activeSong) {
      const preloadSongs = async () => {
        const nextSongs = [];

        for (let i = 1; i <= 3; i++) {
          const nextIndex = (currentIndex + i) % currentSongs.length;
          let nextSong = currentSongs[nextIndex];

          if (nextSong?.track) nextSong = nextSong.track;

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
    dispatch(playPause(!isPlaying));
  };

  const getSongImage = () => {
    if (!activeSong)
      return "https://via.placeholder.com/240x240.png?text=No+Song";

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
    if (!activeSong) return "";
    if (activeSong.preview_url) return activeSong.preview_url;
    if (activeSong.url) return activeSong.url;
    if (activeSong.hub?.actions?.[1]?.uri) return activeSong.hub.actions[1].uri;
    if (activeSong.hub?.actions?.[0]?.uri) return activeSong.hub.actions[0].uri;
    if (activeSong.uri) return activeSong.uri;

    if (activeSong.hub?.actions) {
      const action = activeSong.hub.actions.find((action) => action.uri);
      if (action?.uri) return action.uri;
    }

    return "";
  };

  const songUrl = getSongUrl();

  useEffect(() => {
    console.log("MusicPlayer - isPlaying changed to:", isPlaying);
    console.log("MusicPlayer - activeSong:", activeSong);
    console.log("MusicPlayer - songUrl:", songUrl);
  }, [isPlaying, activeSong, songUrl]);

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
            onCanPlay={handleAudioReady}
            onLoadStart={handleAudioLoading}
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

      {/* Mobile Layout */}
      <div className="sm:hidden flex items-center justify-between w-full h-full px-3 py-2">
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

        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
          <div
            className="h-full bg-[#14b8a6] transition-all duration-300"
            style={{
              width: `${duration > 0 ? (appTime / duration) * 100 : 0}%`,
            }}
          />
        </div>

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
            onCanPlay={handleAudioReady}
            onLoadStart={handleAudioLoading}
          />
        </div>
      </div>
    </>
  );
};

export default MusicPlayer;
