import { createSlice } from "@reduxjs/toolkit";

// Helper functions
const generateShuffleOrder = (length, currentIndex) => {
  const indices = Array.from({ length }, (_, i) => i).filter(
    (i) => i !== currentIndex
  );

  // Fisher-Yates shuffle
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  return indices;
};

const addToHistory = (state, song) => {
  if (!song || !song.title) return;

  const songKey = song.key || song.id || song.track_id;
  state.recentlyPlayed = [
    song,
    ...state.recentlyPlayed.filter((s) => {
      const sKey = s.key || s.id || s.track_id;
      return sKey !== songKey;
    }),
  ].slice(0, 50); // Keep last 50
};

// Load playlists from localStorage
const loadPlaylistsFromStorage = () => {
  try {
    const stored = localStorage.getItem("crescendo_playlists");
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Failed to load playlists:", error);
  }
  return [];
};

// Save playlists to localStorage
const savePlaylistsToStorage = (playlists) => {
  try {
    localStorage.setItem("crescendo_playlists", JSON.stringify(playlists));
  } catch (error) {
    console.error("Failed to save playlists:", error);
  }
};

const initialState = {
  // Core queue state - single source of truth
  queue: {
    tracks: [],
    currentIndex: 0,
    source: null, // 'discover', 'album', 'playlist', 'search', etc
    sourceId: null, // ID of playlist/album/artist if applicable
    name: "Your Queue",
  },

  // Playback state
  isActive: false,
  isPlaying: false,
  activeSong: {},

  // Playback modes
  shuffle: false,
  shuffleOrder: [], // Pre-computed shuffle order
  repeat: false, // false, 'track', 'queue'

  // History
  recentlyPlayed: [],
  playHistory: [], // Indices of played tracks in current session

  // UI state
  genreListId: "POP",
  isModalOpen: false,

  // Playlist management
  playlists: loadPlaylistsFromStorage(),

  // Deprecated - to be removed after migration
  currentSongs: [],
  currentIndex: 0,
  playlistContext: null,
  currentPlaylist: null,
  shuffleIndices: [],
  playedIndices: [],
  activePlaylistId: null,
  activePlaylistType: "queue",
  queueSource: null,
  queueName: "Your Queue",
};

const playerSlice = createSlice({
  name: "player",
  initialState,
  reducers: {
    // Single action for all play scenarios
    playTrack: (state, action) => {
      const { track, source, sourceId, index, queue } = action.payload;

      // Update queue if provided (for album/playlist play)
      if (queue && queue.length > 0) {
        state.queue.tracks = queue;
        state.queue.currentIndex = index || 0;
        state.queue.source = source;
        state.queue.sourceId = sourceId;
        state.queue.name = action.payload.queueName || "Your Queue";

        // Reset shuffle if queue changed
        if (state.shuffle) {
          state.shuffleOrder = generateShuffleOrder(queue.length, index || 0);
        }
      } else if (track) {
        // Single track play - add to queue if not exists
        const existingIndex = state.queue.tracks.findIndex(
          (t) => (t.key || t.id) === (track.key || track.id)
        );

        if (existingIndex !== -1) {
          state.queue.currentIndex = existingIndex;
        } else {
          state.queue.tracks.push(track);
          state.queue.currentIndex = state.queue.tracks.length - 1;
        }
      }

      // Update playback state
      state.activeSong = track || state.queue.tracks[state.queue.currentIndex];
      state.isActive = true;
      state.isPlaying = true;

      // Add to history
      addToHistory(state, state.activeSong);

      // Legacy support - remove in next phase
      state.currentSongs = state.queue.tracks;
      state.currentIndex = state.queue.currentIndex;
    },

    // Add to queue without playing
    addToQueue: (state, action) => {
      const { track, playNext = false } = action.payload;

      const exists = state.queue.tracks.some(
        (t) => (t.key || t.id) === (track.key || track.id)
      );

      if (!exists) {
        if (
          playNext &&
          state.queue.currentIndex < state.queue.tracks.length - 1
        ) {
          state.queue.tracks.splice(state.queue.currentIndex + 1, 0, track);
        } else {
          state.queue.tracks.push(track);
        }

        // Update shuffle order if active
        if (state.shuffle) {
          state.shuffleOrder = generateShuffleOrder(
            state.queue.tracks.length,
            state.queue.currentIndex
          );
        }
      }

      // Legacy support
      state.currentSongs = state.queue.tracks;
    },

    // Clear and replace queue
    setQueue: (state, action) => {
      const { tracks, source, sourceId, name, startIndex = 0 } = action.payload;

      state.queue.tracks = tracks;
      state.queue.currentIndex = startIndex;
      state.queue.source = source;
      state.queue.sourceId = sourceId;
      state.queue.name = name || "Your Queue";

      // Reset playback
      state.activeSong = tracks[startIndex] || {};
      state.isActive = tracks.length > 0;
      state.playHistory = [startIndex];

      // Handle shuffle
      if (state.shuffle) {
        state.shuffleOrder = generateShuffleOrder(tracks.length, startIndex);
      }

      // Legacy support
      state.currentSongs = tracks;
      state.currentIndex = startIndex;
    },

    // Replace entire queue
    replaceQueue: (state, action) => {
      const { songs, source, startIndex = 0 } = action.payload;

      state.currentSongs = songs;
      state.currentIndex = startIndex;
      state.activeSong = songs[startIndex];
      state.isActive = true;
      state.queueSource = source;

      // Reset shuffle if active
      if (state.shuffle) {
        const indices = Array.from(
          { length: songs.length },
          (_, i) => i
        ).filter((i) => i !== startIndex);

        for (let i = indices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [indices[i], indices[j]] = [indices[j], indices[i]];
        }

        state.shuffleIndices = indices;
        state.playedIndices = [startIndex];
      }
    },

    // Clear queue
    clearQueue: (state) => {
      state.currentSongs = [];
      state.currentIndex = 0;
      state.activeSong = {};
      state.isActive = false;
      state.isPlaying = false;
      state.queueSource = null;
    },

    // Remove track from queue
    removeFromQueue: (state, action) => {
      const { index } = action.payload;

      if (index >= 0 && index < state.currentSongs.length) {
        state.currentSongs.splice(index, 1);

        // Adjust current index if needed
        if (index < state.currentIndex) {
          state.currentIndex--;
        } else if (index === state.currentIndex) {
          // Current song was removed
          if (state.currentSongs.length === 0) {
            state.activeSong = {};
            state.isActive = false;
            state.isPlaying = false;
          } else {
            // Play next song or previous if last
            const newIndex = Math.min(
              state.currentIndex,
              state.currentSongs.length - 1
            );
            state.currentIndex = newIndex;
            state.activeSong = state.currentSongs[newIndex];
          }
        }
      }
    },

    // Legacy setActiveSong - kept for compatibility
    setActiveSong: (state, action) => {
      state.activeSong = action.payload.song;

      // Add to recently played
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

      // Set current playlist if provided
      if (action.payload.playlist) {
        state.currentPlaylist = action.payload.playlist;
      }

      // Handle shuffle
      if (state.shuffle && state.currentSongs.length > 0) {
        const indices = Array.from(
          { length: state.currentSongs.length },
          (_, i) => i
        ).filter((i) => i !== action.payload.i);

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

    navigateTrack: (state, action) => {
      const { direction } = action.payload; // 'next' or 'prev'

      if (state.queue.tracks.length === 0) return;

      let newIndex;

      if (state.shuffle) {
        // Handle shuffle navigation
        if (direction === "next") {
          const currentPosInShuffle =
            state.playHistory[state.playHistory.length - 1];
          const remainingIndices = state.shuffleOrder.filter(
            (i) => !state.playHistory.includes(i)
          );

          if (remainingIndices.length > 0) {
            newIndex = remainingIndices[0];
            state.playHistory.push(newIndex);
          } else if (state.repeat === "queue") {
            // Restart shuffle
            state.shuffleOrder = generateShuffleOrder(
              state.queue.tracks.length,
              state.queue.currentIndex
            );
            state.playHistory = [state.shuffleOrder[0]];
            newIndex = state.shuffleOrder[0];
          } else {
            return; // No more tracks
          }
        } else {
          // Previous in shuffle
          if (state.playHistory.length > 1) {
            state.playHistory.pop();
            newIndex = state.playHistory[state.playHistory.length - 1];
          } else {
            newIndex = state.queue.currentIndex;
          }
        }
      } else {
        // Sequential navigation
        if (direction === "next") {
          newIndex = (state.queue.currentIndex + 1) % state.queue.tracks.length;
          if (newIndex === 0 && state.repeat !== "queue") {
            return; // Don't loop if repeat is off
          }
        } else {
          newIndex =
            state.queue.currentIndex === 0
              ? state.queue.tracks.length - 1
              : state.queue.currentIndex - 1;
        }
      }

      // Update state
      state.queue.currentIndex = newIndex;
      state.activeSong = state.queue.tracks[newIndex];
      addToHistory(state, state.activeSong);

      // Legacy support
      state.currentIndex = newIndex;
      state.currentSongs = state.queue.tracks;
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

    toggleRepeat: (state) => {
      state.repeat = !state.repeat;
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

    setCurrentPlaylist: (state, action) => {
      state.currentPlaylist = action.payload;
    },

    clearCurrentPlaylist: (state) => {
      state.currentPlaylist = null;
    },

    // Playlist management actions
    createPlaylist: (state, action) => {
      const newPlaylist = {
        id: action.payload.id || `playlist_${Date.now()}`,
        name: action.payload.name || "New Playlist",
        tracks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        imageUrl: null,
      };
      state.playlists.push(newPlaylist);
      savePlaylistsToStorage(state.playlists);
    },

    deletePlaylist: (state, action) => {
      state.playlists = state.playlists.filter(
        (playlist) => playlist.id !== action.payload
      );
      if (state.activePlaylistId === action.payload) {
        state.activePlaylistId = null;
        state.activePlaylistType = "queue";
      }
      savePlaylistsToStorage(state.playlists);
    },

    renamePlaylist: (state, action) => {
      const playlist = state.playlists.find(
        (p) => p.id === action.payload.playlistId
      );
      if (playlist) {
        playlist.name = action.payload.name;
        playlist.updatedAt = new Date().toISOString();
        savePlaylistsToStorage(state.playlists);
      }
    },

    addToPlaylist: (state, action) => {
      const { playlistId, track } = action.payload;
      const playlist = state.playlists.find((p) => p.id === playlistId);
      if (playlist) {
        // Check if track already exists
        const trackExists = playlist.tracks.some(
          (t) => (t.key || t.id) === (track.key || track.id)
        );
        if (!trackExists) {
          playlist.tracks.push(track);
          playlist.updatedAt = new Date().toISOString();
          savePlaylistsToStorage(state.playlists);
        }
      }
    },

    removeFromPlaylist: (state, action) => {
      const { playlistId, trackId } = action.payload;
      const playlist = state.playlists.find((p) => p.id === playlistId);
      if (playlist) {
        playlist.tracks = playlist.tracks.filter(
          (t) => (t.key || t.id) !== trackId
        );
        playlist.updatedAt = new Date().toISOString();
        savePlaylistsToStorage(state.playlists);
      }
    },

    switchPlaylist: (state, action) => {
      const { playlistId, playlistType } = action.payload;
      state.activePlaylistId = playlistId;
      state.activePlaylistType = playlistType;

      // Load appropriate tracks based on type
      if (playlistType === "playlist") {
        const playlist = state.playlists.find((p) => p.id === playlistId);
        if (playlist) {
          state.currentSongs = playlist.tracks;
          state.currentPlaylist = playlist;
          state.currentIndex = 0;
        }
      } else if (playlistType === "recent") {
        state.currentSongs = state.recentlyPlayed;
        state.currentPlaylist = {
          id: "recent",
          name: "Recently Played",
          tracks: state.recentlyPlayed,
        };
        state.currentIndex = 0;
      } else if (playlistType === "queue") {
        // Keep current queue
        state.currentPlaylist = {
          id: "queue",
          name: "Your Queue",
          tracks: state.currentSongs,
        };
      }
    },

    reorderPlaylistTracks: (state, action) => {
      const { playlistId, fromIndex, toIndex } = action.payload;
      const playlist = state.playlists.find((p) => p.id === playlistId);
      if (playlist) {
        const [movedTrack] = playlist.tracks.splice(fromIndex, 1);
        playlist.tracks.splice(toIndex, 0, movedTrack);
        playlist.updatedAt = new Date().toISOString();
        savePlaylistsToStorage(state.playlists);
      }
    },
  },
});

export const {
  // Unified queue actions
  playTrack,
  addToQueue,
  setQueue,
  navigateTrack,
  clearQueue,
  removeFromQueue,
  // Legacy actions (to be deprecated)
  addToQueueAndPlay,
  playNext,
  replaceQueue,
  setActiveSong,
  changeTrackAndPlay,
  nextSong,
  prevSong,
  toggleShuffle,
  setShuffleWithStart,
  toggleRepeat,
  playPause,
  selectGenreListId,
  setModalOpen,
  clearPlaylistContext,
  setCurrentPlaylist,
  clearCurrentPlaylist,
  // Playlist management
  createPlaylist,
  deletePlaylist,
  renamePlaylist,
  addToPlaylist,
  removeFromPlaylist,
  switchPlaylist,
  reorderPlaylistTracks,
} = playerSlice.actions;

export default playerSlice.reducer;
