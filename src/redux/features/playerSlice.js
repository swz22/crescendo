import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentSongs: [],
  currentIndex: 0,
  isActive: false,
  isPlaying: false,
  activeSong: {},
  genreListId: 'POP',
  recentlyPlayed: [],
  isModalOpen: false,
  playlistContext: null, // Track which playlist is being played
};

const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    setActiveSong: (state, action) => {
      state.activeSong = action.payload.song;

      // Add to recently played (avoid duplicates, keep last 10)
      const newSong = action.payload.song;
      if (newSong && newSong.title) {
        const songKey = newSong.key || newSong.id || newSong.track_id;
        state.recentlyPlayed = [
          newSong,
          ...state.recentlyPlayed.filter(song => (song.key || song.id) !== songKey)
        ].slice(0, 10);
      }

      if (action.payload?.data?.tracks?.hits) {
        state.currentSongs = action.payload.data.tracks.hits;
      } else if (action.payload?.data?.properties) {
        state.currentSongs = action.payload?.data?.tracks;
      } else {
        state.currentSongs = action.payload.data || [];
      }

      state.currentIndex = action.payload.i;
      state.isActive = true;
      
      // Set playlist context if provided
      if (action.payload.playlistId) {
        state.playlistContext = action.payload.playlistId;
      }
    },

    nextSong: (state, action) => {
      // action.payload is the new index
      const newIndex = action.payload;
      
      if (state.currentSongs[newIndex]?.track) {
        state.activeSong = state.currentSongs[newIndex].track;
      } else {
        state.activeSong = state.currentSongs[newIndex];
      }

      // Add to recently played
      if (state.activeSong) {
        state.recentlyPlayed = [
          state.activeSong,
          ...state.recentlyPlayed.filter(song => song.key !== state.activeSong.key)
        ].slice(0, 10);
      }

      state.currentIndex = newIndex;
      state.isActive = true;
    },

    prevSong: (state, action) => {
      // action.payload is the new index
      const newIndex = action.payload;
      
      if (state.currentSongs[newIndex]?.track) {
        state.activeSong = state.currentSongs[newIndex].track;
      } else {
        state.activeSong = state.currentSongs[newIndex];
      }

      // Add to recently played
      if (state.activeSong) {
        state.recentlyPlayed = [
          state.activeSong,
          ...state.recentlyPlayed.filter(song => song.key !== state.activeSong.key)
        ].slice(0, 10);
      }

      state.currentIndex = newIndex;
      state.isActive = true;
    },

    playPause: (state, action) => {
      state.isPlaying = action.payload;
    },

    selectGenreListId: (state, action) => {
      state.genreListId = action.payload;
    },

    setModalOpen: (state, action) => {
      state.isModalOpen = action.payload;
    },
    
    clearPlaylistContext: (state) => {
      state.playlistContext = null;
    },
  },
});

export const { 
  setActiveSong, 
  nextSong, 
  prevSong, 
  playPause, 
  selectGenreListId, 
  setModalOpen,
  clearPlaylistContext 
} = playerSlice.actions;

export default playerSlice.reducer;