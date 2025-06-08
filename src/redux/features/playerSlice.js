import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  currentSongs: [],
  currentIndex: 0,
  isActive: false,
  isPlaying: false,
  activeSong: {},
  genreListId: "POP",
  recentlyPlayed: [],
  isModalOpen: false,
  playlistContext: null,
  shuffle: false,
  shuffleIndices: [],
  playedIndices: [],
};

const playerSlice = createSlice({
  name: "player",
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
          ...state.recentlyPlayed.filter(
            (song) => (song.key || song.id) !== songKey
          ),
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

      // If shuffle is active and we have new songs, create new shuffle indices
      if (state.shuffle && state.currentSongs.length > 0) {
        const indices = Array.from(
          { length: state.currentSongs.length },
          (_, i) => i
        ).filter((i) => i !== action.payload.i);

        // Fisher-Yates shuffle
        for (let i = indices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [indices[i], indices[j]] = [indices[j], indices[i]];
        }

        state.shuffleIndices = indices;
        state.playedIndices = [action.payload.i];
      }
    },

    changeTrackAndPlay: (state, action) => {
      const { song, index } = action.payload;

      if (!song) {
        console.error("No song data provided to changeTrackAndPlay");
        return;
      }

      if (!song.preview_url && !song.url) {
        console.error("Song missing preview URL:", {
          title: song.title,
          key: song.key,
          id: song.id,
        });
        return;
      }

      if (!song.title || !song.images) {
        console.warn("Song data incomplete:", {
          hasTitle: !!song.title,
          hasSubtitle: !!song.subtitle,
          hasImages: !!song.images,
          hasArtists: !!song.artists,
          songKeys: Object.keys(song),
        });
      }

      let fullSong = song;
      if (!song.title && state.currentSongs[index]) {
        let songFromArray = state.currentSongs[index];

        if (songFromArray?.track) {
          songFromArray = songFromArray.track;
        }

        fullSong = {
          ...songFromArray,
          preview_url: song.preview_url || song.url,
          url: song.preview_url || song.url,
        };
      }

      state.activeSong = fullSong;

      const songKey = fullSong.key || fullSong.id || fullSong.track_id;
      if (songKey && fullSong.title) {
        state.recentlyPlayed = [
          fullSong,
          ...state.recentlyPlayed.filter((s) => {
            const sKey = s.key || s.id || s.track_id;
            return sKey !== songKey;
          }),
        ].slice(0, 10);
      }

      state.currentIndex = index;
      state.isActive = true;
      state.isPlaying = true;

      // Update shuffle tracking
      if (state.shuffle && state.playedIndices) {
        if (!state.playedIndices.includes(index)) {
          state.playedIndices.push(index);
        }
      }
    },

    nextSong: (state, action) => {
      const newIndex = action.payload;

      if (state.currentSongs[newIndex]?.track) {
        state.activeSong = state.currentSongs[newIndex].track;
      } else {
        state.activeSong = state.currentSongs[newIndex];
      }

      // Add to recently played
      if (state.activeSong) {
        const songKey =
          state.activeSong.key ||
          state.activeSong.id ||
          state.activeSong.track_id;
        state.recentlyPlayed = [
          state.activeSong,
          ...state.recentlyPlayed.filter((song) => {
            const sKey = song.key || song.id || song.track_id;
            return sKey !== songKey;
          }),
        ].slice(0, 10);
      }

      state.currentIndex = newIndex;
      state.isActive = true;
    },

    prevSong: (state, action) => {
      const newIndex = action.payload;

      if (state.currentSongs[newIndex]?.track) {
        state.activeSong = state.currentSongs[newIndex].track;
      } else {
        state.activeSong = state.currentSongs[newIndex];
      }

      // Add to recently played
      if (state.activeSong) {
        const songKey =
          state.activeSong.key ||
          state.activeSong.id ||
          state.activeSong.track_id;
        state.recentlyPlayed = [
          state.activeSong,
          ...state.recentlyPlayed.filter((song) => {
            const sKey = song.key || song.id || song.track_id;
            return sKey !== songKey;
          }),
        ].slice(0, 10);
      }

      state.currentIndex = newIndex;
      state.isActive = true;
    },

    toggleShuffle: (state) => {
      state.shuffle = !state.shuffle;

      if (state.shuffle && state.currentSongs.length > 0) {
        // Create shuffled indices excluding current song
        const indices = Array.from(
          { length: state.currentSongs.length },
          (_, i) => i
        ).filter((i) => i !== state.currentIndex);

        // Fisher-Yates shuffle
        for (let i = indices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [indices[i], indices[j]] = [indices[j], indices[i]];
        }

        state.shuffleIndices = indices;
        state.playedIndices = [state.currentIndex];
      } else {
        state.shuffleIndices = [];
        state.playedIndices = [];
      }
    },

    setShuffleWithStart: (state, action) => {
      state.shuffle = true;

      if (state.currentSongs.length > 0) {
        // Create shuffled indices for all songs
        const indices = Array.from(
          { length: state.currentSongs.length },
          (_, i) => i
        );

        // Fisher-Yates shuffle
        for (let i = indices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [indices[i], indices[j]] = [indices[j], indices[i]];
        }

        state.shuffleIndices = indices;
        state.playedIndices = [];
      }
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
  changeTrackAndPlay,
  nextSong,
  prevSong,
  toggleShuffle,
  setShuffleWithStart,
  playPause,
  selectGenreListId,
  setModalOpen,
  clearPlaylistContext,
} = playerSlice.actions;

export default playerSlice.reducer;
