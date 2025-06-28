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

  const { duration, currentTime, seek } = useAudioState();
  const [seekTime, setSeekTime] = useState(0);
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
    const songUrl = currentTrack?.preview_url || currentTrack?.url;

    if (songUrl && songUrl !== lastSongUrlRef.current) {
      setIsChangingTrack(true);
      setIsAudioReady(false);
      setSeekTime(0);
      lastSongUrlRef.current = songUrl;
    }
  }, [currentTrack]);

  const handleNextSong = async () => {
    if (!currentSongs || currentSongs.length <= 1 || isNavigating) return;

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
    if (!currentSongs || currentSongs.length <= 1 || isNavigating) return;

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
      setIsChangingTrack(false);
    }
  }, [isPlaying, isChangingTrack]);

  useEffect(() => {
    if (isAudioReady && isChangingTrack) {
      setIsChangingTrack(false);
    }
  }, [isAudioReady, isChangingTrack]);

  // Preload next tracks
  useEffect(() => {
    if (currentSongs.length > 0 && currentTrack) {
      const currentIndex = currentSongs.findIndex((song) => {
        const songId = song?.key || song?.id || song?.track_id;
        const currentId =
          currentTrack?.key || currentTrack?.id || currentTrack?.track_id;
        return songId === currentId;
      });

      if (currentIndex !== -1) {
        const preloadSongs = async () => {
          const nextSongs = [];

          for (let i = 1; i <= 3; i++) {
            const nextIndex = (currentIndex + i) % currentSongs.length;
            let nextSong = currentSongs[nextIndex];

            if (!nextSong) continue;

            if (nextSong?.track) nextSong = nextSong.track;

            if (!isPreviewCached(nextSong)) {
              try {
                const songWithPreview = await getPreviewUrl(nextSong);
                if (songWithPreview?.preview_url) {
                  nextSongs.push(songWithPreview);
                }
              } catch (err) {
                console.error("Error getting preview URL for preload:", err);
              }
            } else {
              nextSongs.push(nextSong);
            }
          }

          if (nextSongs.length > 0) {
            preloadMultiple(nextSongs);
          }
        };

        preloadSongs();
      }
    }
  }, [
    currentTrack,
    currentSongs,
    preloadMultiple,
    getPreviewUrl,
    isPreviewCached,
  ]);

  const handlePlayPause = () => {
    if (!isActive) return;
    dispatch(playPause(!isPlaying));
  };

  const getSongImage = () => {
    if (!currentTrack)
      return "https://via.placeholder.com/240x240.png?text=No+Song";

    if (currentTrack.images?.coverart) return currentTrack.images.coverart;
    if (currentTrack.share?.image) return currentTrack.share.image;
    if (currentTrack.images?.background) return currentTrack.images.background;
    if (currentTrack.attributes?.artwork?.url) {
      return currentTrack.attributes.artwork.url
        .replace("{w}", "240")
        .replace("{h}", "240");
    }
    if (currentTrack.hub?.image) return currentTrack.hub.image;

    return "https://via.placeholder.com/240x240.png?text=No+Image";
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

      {/* Tablet Layout - 768px to 1480px (until sidebar queue is visible) */}
      <div className="hidden md:flex desktop:hidden flex-col justify-center w-full h-full px-6 py-2">
        {/* Row 1: Track Info and Volume */}
        <div className="flex items-center justify-between mb-2">
          {/* Track info - left aligned, no background */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative group flex-shrink-0">
              <img
                src={getSongImage()}
                alt="cover"
                className="w-12 h-12 rounded-lg shadow-xl transition-all duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <div className="flex flex-col justify-center min-w-0 max-w-[300px]">
              <p className="text-white text-[15px] font-semibold truncate">
                {currentTrack?.title || "No active Song"}
              </p>
              <p className="text-gray-300 text-[13px] truncate opacity-90">
                {currentTrack?.subtitle || "Unknown Artist"}
              </p>
            </div>
          </div>

          {/* Volume control with queue button */}
          <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm rounded-xl px-3 py-2">
            <button
              onClick={() => setMobileQueueOpen(true)}
              className="p-2 bg-white/10 rounded-lg text-white hover:bg-white/20 active:scale-95 transition-all duration-200 relative group"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h7"
                />
              </svg>
              {queue.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-[#14b8a6] to-[#0891b2] text-white text-[10px] min-w-[16px] h-[16px] rounded-full flex items-center justify-center font-bold shadow-lg">
                  {queue.length}
                </span>
              )}
              <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap pointer-events-none">
                Queue
              </span>
            </button>

            <div className="w-px h-5 bg-white/20" />

            <div className="flex items-center gap-2">
              <svg
                className="w-3.5 h-3.5 text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z"
                  clipRule="evenodd"
                />
              </svg>
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
          </div>
        </div>

        {/* Row 2: Playback Controls and Seekbar */}
        <div className="flex items-center justify-center gap-3">
          {/* Repeat button - moved to left side */}
          <button
            onClick={() => dispatch(toggleRepeat())}
            className={`p-1.5 rounded-lg transition-all duration-200 ${
              repeat
                ? "text-[#14b8a6] bg-[#14b8a6]/20"
                : "text-gray-400 hover:text-white hover:bg-white/10"
            }`}
          >
            <BsArrowRepeat size={16} />
          </button>

          {/* Main controls with shuffle */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevSong}
              className="p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg active:scale-95 disabled:opacity-50 transition-all duration-200"
              disabled={isNavigating}
            >
              <MdSkipPrevious size={20} />
            </button>

            <button
              onClick={handlePlayPause}
              className="p-2.5 bg-gradient-to-r from-[#14b8a6] to-[#0891b2] rounded-xl text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50 transition-all duration-200"
              disabled={isChangingTrack}
            >
              {isPlaying ? (
                <BsFillPauseFill size={20} />
              ) : (
                <BsFillPlayFill size={20} className="translate-x-0.5" />
              )}
            </button>

            <button
              onClick={handleNextSong}
              className="p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg active:scale-95 disabled:opacity-50 transition-all duration-200"
              disabled={isNavigating}
            >
              <MdSkipNext size={20} />
            </button>

            {/* Shuffle button */}
            <button
              onClick={() => dispatch(toggleShuffle())}
              className={`p-1.5 rounded-lg transition-all duration-200 ${
                shuffle
                  ? "text-[#14b8a6] bg-[#14b8a6]/20"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              <BsShuffle size={16} />
            </button>
          </div>

          {/* Seekbar */}
          <div className="flex-1 max-w-md">
            <Seekbar
              value={currentTime}
              min="0"
              max={duration}
              onInput={(event) => seek(event.target.value)}
              setSeekTime={seek}
              appTime={currentTime}
            />
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
