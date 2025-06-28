import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { MdSkipNext, MdSkipPrevious } from "react-icons/md";
import {
  BsArrowRepeat,
  BsFillPauseFill,
  BsFillPlayFill,
  BsShuffle,
  BsVolumeDown,
  BsVolumeMute,
  BsVolumeUp,
} from "react-icons/bs";
import { HiOutlineQueueList } from "react-icons/hi2";

import {
  playPause,
  toggleShuffle,
  toggleRepeat,
  setVolume as setVolumeAction,
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
import MobileQueueSheet from "../MobileQueueSheet";
import { useAudioState } from "../../hooks/useAudioState";

const MusicPlayer = () => {
  const {
    currentTrack,
    isActive,
    isPlaying,
    shuffle,
    repeat,
    activeContext,
    queue,
    recentlyPlayed,
    albumContext,
    playlists,
    communityPlaylist,
  } = useSelector((state) => state.player);

  const volume = useSelector((state) => state.player.volume);
  const [mobileQueueOpen, setMobileQueueOpen] = useState(false);

  // Format time helper
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Get current context tracks
  const getCurrentTracks = () => {
    switch (activeContext) {
      case "queue":
        return queue;
      case "recently_played":
        return recentlyPlayed;
      case "album":
        return albumContext?.tracks || [];
      case "community_playlist":
        return communityPlaylist?.tracks || [];
      default:
        if (activeContext.startsWith("playlist_")) {
          const playlist = playlists.find((p) => p.id === activeContext);
          return playlist?.tracks || [];
        }
        return [];
    }
  };

  const currentSongs = getCurrentTracks();
  const dispatch = useDispatch();
  const [isChangingTrack, setIsChangingTrack] = useState(false);

  const { handleNextSong, handlePrevSong, isNavigating } = useSongNavigation();
  const { seekTime, currentTime, duration, seek, reset } = useAudioState();

  // Preload audio
  const { preloadAudio } = useAudioPreload();
  const { getPreviewUrl } = usePreviewUrl();

  useEffect(() => {
    if (currentTrack && currentSongs.length > 0) {
      const currentIndex = currentSongs.findIndex(
        (song) =>
          song?.key === currentTrack?.key ||
          song?.id === currentTrack?.id ||
          song?.track_id === currentTrack?.track_id
      );

      const nextIndex = currentIndex + 1;
      if (nextIndex < currentSongs.length) {
        const nextSong = currentSongs[nextIndex];
        getPreviewUrl(nextSong).then((songWithUrl) => {
          if (songWithUrl?.preview_url) {
            preloadAudio(songWithUrl.preview_url);
          }
        });
      }
    }
  }, [currentTrack, currentSongs, getPreviewUrl, preloadAudio]);

  const handlePlayPause = () => {
    if (isActive) {
      dispatch(playPause(!isPlaying));
    }
  };

  const handleAudioReady = () => {
    if (isChangingTrack) {
      setIsChangingTrack(false);
    }
  };

  const handleAudioLoading = () => {
    setIsChangingTrack(true);
  };

  const getSongImage = () => {
    if (!currentTrack) return "";
    return (
      currentTrack?.images?.coverart ||
      currentTrack?.album?.images?.[0]?.url ||
      currentTrack?.images?.background ||
      ""
    );
  };

  const getSongUrl = () => {
    if (!currentTrack) return "";

    if (currentTrack.preview_url) return currentTrack.preview_url;
    if (currentTrack.url) return currentTrack.url;
    if (currentTrack.hub?.actions?.[1]?.uri)
      return currentTrack.hub.actions[1].uri;
    if (currentTrack.hub?.actions?.[0]?.uri)
      return currentTrack.hub.actions[0].uri;
    if (currentTrack.uri) return currentTrack.uri;

    if (currentTrack.hub?.actions) {
      const action = currentTrack.hub.actions.find((action) => action.uri);
      if (action?.uri) return action.uri;
    }

    return "";
  };

  const songUrl = getSongUrl();

  useEffect(() => {
    if (currentTrack && !songUrl && isPlaying) {
      dispatch(playPause(false));
      setIsChangingTrack(false);
    }
  }, [currentTrack, songUrl, isPlaying, dispatch]);

  // Volume icon component
  const VolumeIcon = () => {
    if (volume === 0) return <BsVolumeMute size={18} />;
    if (volume < 0.5) return <BsVolumeDown size={18} />;
    return <BsVolumeUp size={18} />;
  };

  return (
    <>
      <TrackLoadingState isLoading={isChangingTrack} />

      {/* Mobile Layout - phones only */}
      <div className="md:hidden flex items-center justify-between w-full h-full px-3 py-1 safe-area-bottom">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <img
            src={getSongImage()}
            alt="cover"
            className="w-10 h-10 rounded-lg shadow-md"
          />
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">
              {currentTrack?.title || "No active Song"}
            </p>
            <p className="text-gray-400 text-[10px] truncate">
              {currentTrack?.subtitle || "Unknown Artist"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevSong}
            className="p-1.5 text-white/80 active:scale-95 disabled:opacity-50"
            disabled={isNavigating}
          >
            <MdSkipPrevious size={20} />
          </button>
          <button
            onClick={handlePlayPause}
            className="p-2 bg-[#14b8a6] rounded-full text-white shadow-lg active:scale-95 disabled:opacity-50"
            disabled={isChangingTrack}
          >
            {isPlaying ? (
              <BsFillPauseFill size={14} />
            ) : (
              <BsFillPlayFill size={14} className="translate-x-0.5" />
            )}
          </button>
          <button
            onClick={handleNextSong}
            className="p-1.5 text-white/80 active:scale-95 disabled:opacity-50"
            disabled={isNavigating}
          >
            <MdSkipNext size={20} />
          </button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
          <div
            className="h-full bg-[#14b8a6] transition-all duration-300"
            style={{
              width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      {/* Tablet Layout - 768px to 1480px (Redesigned) */}
      <div className="hidden md:flex desktop:hidden items-center w-full h-full px-6 gap-4 py-3">
        {/* Left Section: Track Info (30% width with min/max constraints) */}
        <div className="flex items-center gap-3 min-w-0 w-[30%] min-w-[200px] max-w-[300px]">
          <img
            src={getSongImage()}
            alt="cover"
            className="w-12 h-12 rounded-lg shadow-lg flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="text-white text-sm font-semibold truncate">
              {currentTrack?.title || "No active Song"}
            </p>
            <p className="text-gray-300 text-xs truncate">
              {currentTrack?.subtitle || "Unknown Artist"}
            </p>
          </div>
        </div>

        {/* Center Section: Controls (40% width, centered) */}
        <div className="flex items-center justify-center gap-2 flex-1">
          {/* Shuffle */}
          <button
            onClick={() => dispatch(toggleShuffle())}
            className={`p-1.5 rounded-lg transition-all ${
              shuffle
                ? "text-[#14b8a6] bg-[#14b8a6]/10"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <BsShuffle size={16} />
          </button>

          {/* Previous */}
          <button
            onClick={handlePrevSong}
            className="p-2 text-white/90 hover:text-white active:scale-95 disabled:opacity-50 transition-all"
            disabled={isNavigating}
          >
            <MdSkipPrevious size={24} />
          </button>

          {/* Play/Pause */}
          <button
            onClick={handlePlayPause}
            className="p-3 bg-gradient-to-r from-[#14b8a6] to-[#0891b2] rounded-full text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50 transition-all mx-2"
            disabled={isChangingTrack}
          >
            {isPlaying ? (
              <BsFillPauseFill size={20} />
            ) : (
              <BsFillPlayFill size={20} className="translate-x-0.5" />
            )}
          </button>

          {/* Next */}
          <button
            onClick={handleNextSong}
            className="p-2 text-white/90 hover:text-white active:scale-95 disabled:opacity-50 transition-all"
            disabled={isNavigating}
          >
            <MdSkipNext size={24} />
          </button>

          {/* Repeat */}
          <button
            onClick={() => dispatch(toggleRepeat())}
            className={`p-1.5 rounded-lg transition-all ${
              repeat
                ? "text-[#14b8a6] bg-[#14b8a6]/10"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <BsArrowRepeat size={16} />
          </button>

          {/* Queue Button */}
          <button
            onClick={() => setMobileQueueOpen(true)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all relative ml-2"
          >
            <HiOutlineQueueList size={18} />
            {queue.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-[#14b8a6] to-[#0891b2] text-white text-[9px] min-w-[16px] h-[16px] rounded-full flex items-center justify-center font-bold shadow-md">
                {queue.length > 99 ? "99+" : queue.length}
              </span>
            )}
          </button>
        </div>

        {/* Right Section: Stacked Volume and Seek Bars (30% width with min/max constraints) */}
        <div className="flex items-center justify-end w-[30%] min-w-[200px] max-w-[300px]">
          {/* Stacked Volume and Seek Bars */}
          <div className="flex flex-col gap-2 max-w-[200px] w-full">
            {/* Volume Bar */}
            <div className="flex items-center gap-2">
              <div className="w-[32px] flex items-center">
                <button
                  onClick={() =>
                    dispatch(setVolumeAction(volume === 0 ? 0.5 : 0))
                  }
                  className="text-gray-400 hover:text-white transition-all p-0.5"
                >
                  <VolumeIcon />
                </button>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) =>
                  dispatch(setVolumeAction(parseFloat(e.target.value)))
                }
                className="flex-1 h-1 bg-white/20 rounded-full appearance-none cursor-pointer
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 
                         [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[#14b8a6] 
                         [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
                         hover:[&::-webkit-slider-thumb]:bg-[#2dd4bf] [&::-webkit-slider-thumb]:shadow-md"
                style={{
                  background: `linear-gradient(to right, #14b8a6 0%, #14b8a6 ${
                    volume * 100
                  }%, rgba(255,255,255,0.2) ${
                    volume * 100
                  }%, rgba(255,255,255,0.2) 100%)`,
                }}
              />
              <div className="w-[32px]" />{" "}
              {/* Spacer to align with time text below */}
            </div>

            {/* Seekbar with Time */}
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-[11px] tabular-nums flex-shrink-0 w-[32px] text-left">
                {formatTime(currentTime)}
              </span>
              <input
                type="range"
                step="any"
                value={currentTime}
                min="0"
                max={duration || 0}
                onInput={(e) => seek(e.target.value)}
                className="flex-1 h-1 bg-white/20 rounded-full appearance-none cursor-pointer
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 
                         [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[#14b8a6] 
                         [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
                         hover:[&::-webkit-slider-thumb]:bg-[#2dd4bf] [&::-webkit-slider-thumb]:shadow-md"
                style={{
                  background: `linear-gradient(to right, #14b8a6 0%, #14b8a6 ${
                    duration > 0 ? (currentTime / duration) * 100 : 0
                  }%, rgba(255,255,255,0.2) ${
                    duration > 0 ? (currentTime / duration) * 100 : 0
                  }%, rgba(255,255,255,0.2) 100%)`,
                }}
              />
              <span className="text-gray-400 text-[11px] tabular-nums flex-shrink-0 w-[32px]">
                {formatTime(duration)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout - 1480px and up (when sidebar queue is visible) */}
      <div className="hidden desktop:flex relative px-4 sm:px-8 lg:px-12 w-full h-full items-center justify-between">
        <Track
          isPlaying={isPlaying}
          isActive={isActive}
          activeSong={currentTrack}
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
            isNavigating={isNavigating}
          />
          <Seekbar
            value={currentTime}
            min="0"
            max={duration}
            onInput={(event) => seek(event.target.value)}
            setSeekTime={seek}
            appTime={currentTime}
          />
        </div>
        <VolumeBar
          value={volume}
          min="0"
          max="1"
          onChange={(event) =>
            dispatch(setVolumeAction(parseFloat(event.target.value)))
          }
          setVolume={(val) => dispatch(setVolumeAction(val))}
        />
      </div>

      {/* Single Audio Player for all layouts */}
      <Player
        activeSong={currentTrack}
        songUrl={songUrl}
        volume={volume}
        isPlaying={isPlaying}
        seekTime={seekTime}
        repeat={repeat}
        currentIndex={0}
        onEnded={handleNextSong}
        onLoadedData={handleAudioReady}
        onCanPlay={handleAudioReady}
        onLoadStart={handleAudioLoading}
      />

      {/* Mobile Queue Sheet - also used for tablet */}
      <MobileQueueSheet
        isOpen={mobileQueueOpen}
        onClose={() => setMobileQueueOpen(false)}
      />
    </>
  );
};

export default MusicPlayer;
