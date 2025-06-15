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
    currentTrack,
    isActive,
    isPlaying,
    shuffle,
    repeat,
    activeContext,
    queue,
    recentlyPlayed,
    playlists,
    communityPlaylist,
  } = useSelector((state) => state.player);

  // Get current context tracks
  const getCurrentTracks = () => {
    switch (activeContext) {
      case "queue":
        return queue;
      case "recently_played":
        return recentlyPlayed;
      case "community":
        return communityPlaylist?.tracks || [];
      default:
        if (activeContext.startsWith("playlist_")) {
          const playlistId = activeContext.replace("playlist_", "");
          const playlist = playlists.find((p) => p.id === playlistId);
          return playlist?.tracks || [];
        }
        return [];
    }
  };

  const currentSongs = getCurrentTracks();

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
    const songUrl = currentTrack?.preview_url || currentTrack?.url;

    if (songUrl && songUrl !== lastSongUrlRef.current) {
      setIsChangingTrack(true);
      setIsAudioReady(false);
      setSeekTime(0);
      lastSongUrlRef.current = songUrl;
    }
  }, [currentTrack]);

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

      {/* Desktop Layout */}
      <div className="hidden sm:flex relative px-4 sm:px-8 lg:px-12 w-full h-full items-center justify-between">
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
            activeSong={currentTrack}
            songUrl={songUrl}
            volume={volume}
            isPlaying={isPlaying}
            seekTime={seekTime}
            repeat={repeat}
            currentIndex={0}
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
      <div className="sm:hidden flex items-center justify-between w-full h-full px-3 py-1 safe-area-bottom">
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
            className="p-1.5 text-white/80 active:scale-95"
          >
            <MdSkipPrevious size={20} />
          </button>
          <button
            onClick={handlePlayPause}
            className="p-2 bg-[#14b8a6] rounded-full text-white shadow-lg active:scale-95"
          >
            {isPlaying ? (
              <BsFillPauseFill size={14} />
            ) : (
              <BsFillPlayFill size={14} className="translate-x-0.5" />
            )}
          </button>
          <button
            onClick={handleNextSong}
            className="p-1.5 text-white/80 active:scale-95"
          >
            <MdSkipNext size={20} />
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
      </div>

      {/* Hidden Player for Audio */}
      <div className="hidden">
        <Player
          activeSong={currentTrack}
          songUrl={songUrl}
          volume={volume}
          isPlaying={isPlaying}
          seekTime={seekTime}
          repeat={repeat}
          currentIndex={0}
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
    </>
  );
};

export default MusicPlayer;
