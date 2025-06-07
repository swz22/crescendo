import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setActiveSong, playPause, setModalOpen } from '../redux/features/playerSlice';
import { usePreviewUrl } from './usePreviewUrl';

export const useSongNavigation = () => {
  const dispatch = useDispatch();
  const { currentSongs, currentIndex, playlistContext, isModalOpen } = useSelector((state) => state.player);
  const { getPreviewUrl } = usePreviewUrl();

  const handleNextSong = useCallback(async () => {
    if (!currentSongs || currentSongs.length === 0) {
      console.log('No songs in playlist');
      return;
    }
    
    console.log('Current modal state:', isModalOpen);
    console.log('Current playlist context:', playlistContext);
    
    console.log('Current songs array:', currentSongs);
    console.log('Current song structure:', currentSongs[0]);
    console.log('Current index:', currentIndex, 'Total songs:', currentSongs.length);
    dispatch(playPause(false));
    
    const nextIndex = (currentIndex + 1) % currentSongs.length;
    console.log('Next index:', nextIndex);
    
    let nextSongData = currentSongs[nextIndex];
    console.log('Raw next song data:', nextSongData);
    
    // Always fetch preview URL using our workaround
    const songWithPreview = await getPreviewUrl(nextSongData);
    
    // Use setActiveSong to properly update all state including playlist context
    console.log('Setting active song with preview:', songWithPreview);
    dispatch(setActiveSong({ 
      song: songWithPreview, 
      data: currentSongs, 
      i: nextIndex,
      playlistId: playlistContext // Maintain playlist context
    }));
    
    // Use requestAnimationFrame for minimal delay
    requestAnimationFrame(() => {
      console.log('Attempting to play next song...');
      dispatch(playPause(true));
    });
  }, [currentSongs, currentIndex, dispatch, getPreviewUrl, playlistContext, isModalOpen]);

  const handlePrevSong = useCallback(async () => {
    if (!currentSongs || currentSongs.length === 0) {
      return;
    }
    
    // Pause current track first to ensure clean transition
    dispatch(playPause(false));
    
    const prevIndex = currentIndex === 0 ? currentSongs.length - 1 : currentIndex - 1;
    console.log('Previous index:', prevIndex);
    
    let prevSongData = currentSongs[prevIndex];
    
    console.log('Previous song data before preview fetch:', prevSongData);
    
    // Always fetch preview URL using our workaround
    const songWithPreview = await getPreviewUrl(prevSongData);
    console.log('Song with preview URL:', songWithPreview);
    
    // Use setActiveSong to properly update all state including playlist context
    dispatch(setActiveSong({ 
      song: songWithPreview, 
      data: currentSongs, 
      i: prevIndex,
      playlistId: playlistContext // Maintain playlist context
    }));
    
    // Use requestAnimationFrame for minimal delay
    requestAnimationFrame(() => {
      console.log('Attempting to play previous song...');
      dispatch(playPause(true));
    });
  }, [currentSongs, currentIndex, dispatch, getPreviewUrl, playlistContext]);

  return { handleNextSong, handlePrevSong };
};