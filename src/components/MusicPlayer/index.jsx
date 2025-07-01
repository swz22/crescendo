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
import { selectCurrentContextTracks } from "../../redux/features/playerSelectors";
import { useSongNavigation } from "../../hooks/useSongNavigation";
import { useAudioPreload } from "../../hooks/useAudioPreload";
import { usePreviewUrl } from "../../hooks/usePreviewUrl";
import Controls from "./Controls";
import Player from "./Player";
import Seekbar from "./Seekbar";
import VolumeBar from "./VolumeBar";
import TrackLoadingState from "../TrackLoadingState";
import { useAudioState } from "../../hooks/useAudioState";

const MusicPlayer = ({ onOpenQueue }) => {
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
  const tracks = useSelector(selectCurrentContextTracks);
  const queueCount = tracks.length;

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

    return "";
  };

  const songUrl = getSongUrl();

  if (!isActive || !currentTrack) return null;

  return (
    <>
      {/* Mobile Layout - Simplified */}
      <div className="flex md:hidden items-center w-full h-full px-4 py-2">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <img
            src={getSongImage()}
            alt="cover"
            className="w-12 h-12 rounded-lg shadow-lg flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="text-white text-sm font-semibold truncate">
              {currentTrack?.title}
            </p>
            <p className="text-gray-300 text-xs truncate">
              {currentTrack?.subtitle}
            </p>
          </div>
        </div>

        {/* Mobile Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevSong}
            className="p-2 text-white/80 active:scale-95 disabled:opacity-50"
            disabled={isNavigating}
          >
            <MdSkipPrevious size={24} />
          </button>
          <button
            onClick={handlePlayPause}
            className="p-3 bg-white/10 rounded-full text-white active:scale-95"
          >
            {isPlaying ? (
              <BsFillPauseFill size={20} />
            ) : (
              <BsFillPlayFill size={20} />
            )}
          </button>
          <button
            onClick={handleNextSong}
            className="p-2 text-white/80 active:scale-95 disabled:opacity-50"
            disabled={isNavigating}
          >
            <MdSkipNext size={24} />
          </button>
          <button
            onClick={onOpenQueue}
            className="relative p-2 text-white/60 hover:text-white transition-colors"
          >
            <HiOutlineQueueList size={22} />
            {queueCount > 0 && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#14b8a6] rounded-full flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">
                  {queueCount}
                </span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Tablet Layout - 925px to 1480px */}
      <div className="hidden md:flex desktop:hidden items-center w-full h-full px-4 lg:px-6 py-3">
        {/* Track Info Section */}
        <div className="flex items-center gap-3 min-w-0 flex-shrink-0 w-[180px] lg:w-[240px]">
          <img
            src={getSongImage()}
            alt="cover"
            className="w-12 h-12 lg:w-14 lg:h-14 rounded-lg shadow-lg flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="text-white text-sm lg:text-base font-semibold truncate">
              {currentTrack?.title || "No active Song"}
            </p>
            <p className="text-gray-300 text-xs lg:text-sm truncate">
              {currentTrack?.subtitle || "Unknown Artist"}
            </p>
          </div>
        </div>

        {/* Center Section - Controls & Sliders */}
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          {/* Main Controls Row */}
          <div className="flex items-center justify-center gap-1 lg:gap-2 mb-3">
            {/* Shuffle */}
            <button
              onClick={() => dispatch(toggleShuffle())}
              className={`p-1.5 rounded-lg transition-all hidden lg:block ${
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

            {/* Play/Pause - Prominent button */}
            <button
              onClick={handlePlayPause}
              className="p-3 bg-gradient-to-r from-[#14b8a6] to-[#0891b2] rounded-full text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50 transition-all mx-1 lg:mx-2"
              disabled={isChangingTrack}
            >
              {isPlaying ? (
                <BsFillPauseFill size={20} />
              ) : (
                <BsFillPlayFill size={20} />
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
              className={`p-1.5 rounded-lg transition-all hidden lg:block ${
                repeat
                  ? "text-[#14b8a6] bg-[#14b8a6]/10"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <BsArrowRepeat size={16} />
            </button>
          </div>

          {/* Seekbar */}
          <div className="w-full max-w-md">
            <Seekbar
              value={currentTime}
              min={0}
              max={duration}
              onInput={(event) => seek(event.target.value)}
              setSeekTime={seek}
              appTime={currentTime}
            />
          </div>
        </div>

        {/* Right Section - Volume & Queue */}
        <div className="flex items-center gap-2 lg:gap-3">
          <VolumeBar
            value={volume}
            min="0"
            max="1"
            onChange={(event) =>
              dispatch(setVolumeAction(parseFloat(event.target.value)))
            }
            setVolume={(val) => dispatch(setVolumeAction(val))}
          />
          <button
            onClick={onOpenQueue}
            className="relative p-2 text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/10"
          >
            <HiOutlineQueueList size={22} />
            {queueCount > 0 && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#14b8a6] rounded-full flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">
                  {queueCount}
                </span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Desktop Layout - 1480px+ */}
      <div className="hidden desktop:flex items-center justify-between w-full h-full px-6 py-4">
        {/* Track Info Section - Desktop */}
        <div className="flex items-center gap-4 min-w-0 w-[300px]">
          <img
            src={getSongImage()}
            alt="cover"
            className="w-16 h-16 rounded-lg shadow-lg flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="text-white text-base font-semibold truncate">
              {currentTrack?.title || "No active Song"}
            </p>
            <p className="text-gray-300 text-sm truncate">
              {currentTrack?.subtitle || "Unknown Artist"}
            </p>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-12">
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
            isLoading={isChangingTrack || isNavigating}
          />
          <Seekbar
            value={currentTime}
            min={0}
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
    </>
  );
};

export default MusicPlayer;
