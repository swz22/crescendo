import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { nextSong, prevSong, playPause } from '../../redux/features/playerSlice';
import Controls from './Controls';
import Player from './Player';
import Seekbar from './Seekbar';
import Track from './Track';
import VolumeBar from './VolumeBar';

const MusicPlayer = () => {
  const { activeSong, currentSongs, currentIndex, isActive, isPlaying } = useSelector((state) => state.player);
  const [duration, setDuration] = useState(0);
  const [seekTime, setSeekTime] = useState(0);
  const [appTime, setAppTime] = useState(0);
  const [volume, setVolume] = useState(0.3);
  const [repeat, setRepeat] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const dispatch = useDispatch();

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

  const handleNextSong = () => {
    dispatch(playPause(false));

    if (!shuffle) {
      dispatch(nextSong((currentIndex + 1) % currentSongs.length));
    } else {
      dispatch(nextSong(Math.floor(Math.random() * currentSongs.length)));
    }
  };

  const handlePrevSong = () => {
    if (currentIndex === 0) {
      dispatch(prevSong(currentSongs.length - 1));
    } else if (shuffle) {
      dispatch(prevSong(Math.floor(Math.random() * currentSongs.length)));
    } else {
      dispatch(prevSong(currentIndex - 1));
    }
  };

  // Get the song image with multiple fallbacks
  const getSongImage = () => {
    if (!activeSong) return 'https://via.placeholder.com/240x240.png?text=No+Song';
    
    // Try different possible image paths
    if (activeSong.images?.coverart) return activeSong.images.coverart;
    if (activeSong.share?.image) return activeSong.share.image;
    if (activeSong.images?.background) return activeSong.images.background;
    if (activeSong.attributes?.artwork?.url) {
      return activeSong.attributes.artwork.url
        .replace('{w}', '240')
        .replace('{h}', '240');
    }
    if (activeSong.hub?.image) return activeSong.hub.image;
    
    return 'https://via.placeholder.com/240x240.png?text=No+Image';
  };

  // Get the song URL with fallbacks
  const getSongUrl = () => {
    if (!activeSong) return '';
    
    // Try different possible URL paths
    if (activeSong.hub?.actions?.[1]?.uri) return activeSong.hub.actions[1].uri;
    if (activeSong.hub?.actions?.[0]?.uri) return activeSong.hub.actions[0].uri;
    if (activeSong.url) return activeSong.url;
    if (activeSong.preview_url) return activeSong.preview_url;
    if (activeSong.uri) return activeSong.uri;
    
    // Look for any action with a URI
    if (activeSong.hub?.actions) {
      const action = activeSong.hub.actions.find(action => action.uri);
      if (action?.uri) return action.uri;
    }
    
    return '';
  };

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
          songUrl={getSongUrl()}
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
      <VolumeBar value={volume} min="0" max="1" onChange={(event) => setVolume(event.target.value)} setVolume={setVolume} />
    </div>
  );
};

export default MusicPlayer;