import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";

import { playPause } from "../../redux/features/playerSlice";
import { useSongNavigation } from "../../hooks/useSongNavigation";
import Controls from "./Controls";
import Player from "./Player";
import Seekbar from "./Seekbar";
import Track from "./Track";
import VolumeBar from "./VolumeBar";

const MusicPlayer = () => {
  const { activeSong, currentSongs, currentIndex, isActive, isPlaying } =
    useSelector((state) => state.player);
  const [duration, setDuration] = useState(0);
  const [seekTime, setSeekTime] = useState(0);
  const [appTime, setAppTime] = useState(0);
  const [volume, setVolume] = useState(0.3);
  const [repeat, setRepeat] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const dispatch = useDispatch();
  const { handleNextSong, handlePrevSong } = useSongNavigation();

  useEffect(() => {
    if (currentSongs.length) dispatch(playPause(true));
  }, [currentIndex]);

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

  // Log the URL state for debugging
  useEffect(() => {
    console.log('MusicPlayer - Current song URL:', songUrl);
    console.log('MusicPlayer - Is playing:', isPlaying);
    console.log('MusicPlayer - Active song:', activeSong);
  }, [songUrl, isPlaying, activeSong]);

  // Handle case where song has no URL in a useEffect to avoid render-time state updates
  useEffect(() => {
    if (activeSong && !songUrl && isPlaying) {
      console.log('No URL for active song, pausing playback');
      dispatch(playPause(false));
    }
  }, [activeSong, songUrl, isPlaying, dispatch]);

  return (
    <div className="relative sm:px-12 px-8 w-full flex items-center justify-between">
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
          setRepeat={setRepeat}
          shuffle={shuffle}
          setShuffle={setShuffle}
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
          onLoadedData={(event) => setDuration(event.target.duration)}
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
  );
};

export default MusicPlayer;