import { createSlice } from "@reduxjs/toolkit";

// LocalStorage helpers
const QUEUE_STORAGE_KEY = "crescendo_queue_state";

const loadFromLocalStorage = (key) => {
  try {
    const stored = localStorage.getItem(`crescendo_${key}`);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error(`Failed to load ${key} from localStorage:`, error);
    return null;
  }
};

const saveQueueState = (state) => {
  try {
    const queueState = {
      queue: state.queue,
      currentIndex: state.currentIndex,
      queueSource: state.queueSource,
      queueName: state.queueName,
      timestamp: Date.now(),
    };
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queueState));
  } catch (error) {
    console.error("Failed to save queue state:", error);
  }
};

// Load persisted queue on init
const loadPersistedQueue = () => {
  const stored = loadFromLocalStorage("queue_state");
  if (
    stored &&
    stored.timestamp &&
    Date.now() - stored.timestamp < 24 * 60 * 60 * 1000
  ) {
    // Ensure we have valid data
    const queue = stored.queue || [];
    const currentIndex = stored.currentIndex ?? -1; // Use ?? to handle 0 properly

    return {
      queue: queue,
      currentIndex: currentIndex,
      queueSource: stored.queueSource,
      queueName: stored.queueName || "Your Queue",
      // Set activeSong even for index 0
      activeSong:
        currentIndex >= 0 && queue[currentIndex] ? queue[currentIndex] : {},
      isActive: currentIndex >= 0 && queue.length > 0,
      // Initialize empty shuffleOrder - will be regenerated if shuffle is on
      shuffleOrder: [],
    };
  }
  return {
    queue: [],
    currentIndex: -1,
    queueSource: null,
    queueName: "Your Queue",
    activeSong: {},
    isActive: false,
    shuffleOrder: [],
  };
};

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

  // Save to localStorage
  try {
    localStorage.setItem(
      "crescendo_recentlyPlayed",
      JSON.stringify(state.recentlyPlayed)
    );
  } catch (error) {
    console.error("Failed to save recently played:", error);
  }
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

const persistedQueue = loadPersistedQueue();

const initialState = {
  // Unified queue - single source of truth
  queue: persistedQueue.queue,
  currentIndex: persistedQueue.currentIndex,

  // Playback state
  isActive: false,
  isPlaying: false,
  activeSong: persistedQueue.queue[persistedQueue.currentIndex] || {},

  // Playback modes
  shuffle: false,
  shuffleOrder: [],
  repeat: false,

  // History
  recentlyPlayed: loadFromLocalStorage("recentlyPlayed") || [],

  // UI state
  genreListId: "POP",
  isModalOpen: false,

  // Playlist management
  playlists: loadPlaylistsFromStorage(),
  activePlaylistId: null,
  activePlaylistType: "queue",

  // Queue metadata
  queueSource: persistedQueue.queueSource,
  queueName: persistedQueue.queueName,

  // Legacy state (to be removed)
  currentSongs: persistedQueue.queue,
  currentPlaylist: null,
  playlistContext: null,
};

if (initialState.shuffle && initialState.queue.length > 1) {
  initialState.shuffleOrder = generateShuffleOrder(
    initialState.queue.length,
    initialState.currentIndex
  );
}

const playerSlice = createSlice({
  name: "player",
  initialState,
  reducers: {
    // Main play action
    playTrack: (state, action) => {
      const { track, source } = action.payload;

      // Find if track exists in queue
      const existingIndex = state.queue.findIndex(
        (s) => (s.key || s.id) === (track.key || track.id)
      );

      if (existingIndex !== -1) {
        // Track exists, just play it
        state.currentIndex = existingIndex;
        state.activeSong = state.queue[existingIndex];
      } else {
        // Add to queue and play
        state.queue.push(track);
        state.currentIndex = state.queue.length - 1;
        state.activeSong = track;
      }

      state.isActive = true;
      state.isPlaying = true;
      state.queueSource = source || "manual";

      // Update legacy state
      state.currentSongs = state.queue;

      // Add to history
      addToHistory(state, track);

      // Handle shuffle
      if (state.shuffle && state.queue.length > 1) {
        state.shuffleOrder = generateShuffleOrder(
          state.queue.length,
          state.currentIndex
        );
      }

      // Persist state
      saveQueueState(state);
    },

    setActiveSong: (state, action) => {
      const { song, data, i } = action.payload;

      // Update active song
      state.activeSong = song;

      // Add to history
      addToHistory(state, song);

      // Update queue if new data provided
      if (data && Array.isArray(data)) {
        state.queue = data;
        state.currentIndex = i || 0;
        state.currentSongs = data; // Legacy support
      } else if (
        !state.queue.some((s) => (s.key || s.id) === (song.key || song.id))
      ) {
        // Add single song to queue if not exists
        state.queue.push(song);
        state.currentIndex = state.queue.length - 1;
        state.currentSongs = state.queue; // Legacy support
      } else {
        // Find and set current index
        state.currentIndex = state.queue.findIndex(
          (s) => (s.key || s.id) === (song.key || song.id)
        );
      }

      state.isActive = true;

      // Handle shuffle
      if (state.shuffle && state.queue.length > 1) {
        state.shuffleOrder = generateShuffleOrder(
          state.queue.length,
          state.currentIndex
        );
      }

      // Persist state
      saveQueueState(state);
    },

    navigateSong: (state, action) => {
      const { direction } = action.payload;

      if (state.queue.length === 0) return;

      let newIndex;

      if (state.shuffle && state.shuffleOrder.length > 0) {
        // Shuffle navigation
        const currentShuffleIndex = state.shuffleOrder.indexOf(
          state.currentIndex
        );

        if (direction === "next") {
          const nextShuffleIndex =
            (currentShuffleIndex + 1) % state.shuffleOrder.length;
          newIndex = state.shuffleOrder[nextShuffleIndex];
        } else {
          const prevShuffleIndex = currentShuffleIndex - 1;
          newIndex =
            state.shuffleOrder[
              prevShuffleIndex >= 0
                ? prevShuffleIndex
                : state.shuffleOrder.length - 1
            ];
        }
      } else {
        // Sequential navigation
        if (direction === "next") {
          newIndex = (state.currentIndex + 1) % state.queue.length;
          if (newIndex === 0 && !state.repeat) {
            state.isPlaying = false;
            return;
          }
        } else {
          newIndex = state.currentIndex - 1;
          if (newIndex < 0) {
            newIndex = state.repeat ? state.queue.length - 1 : 0;
          }
        }
      }

      state.currentIndex = newIndex;
      state.activeSong = state.queue[newIndex];
      state.currentSongs = state.queue; // Legacy support
      addToHistory(state, state.activeSong);

      // Persist state
      saveQueueState(state);
    },

    addToQueue: (state, action) => {
      const { song, playNext = false } = action.payload;

      // Check if song already in queue
      const exists = state.queue.some(
        (s) => (s.key || s.id) === (song.key || song.id)
      );

      if (!exists) {
        if (playNext && state.currentIndex >= 0) {
          // Insert after current song
          state.queue.splice(state.currentIndex + 1, 0, song);

          // Update shuffle order if active
          if (state.shuffle) {
            state.shuffleOrder = generateShuffleOrder(
              state.queue.length,
              state.currentIndex
            );
          }
        } else {
          // Add to end
          state.queue.push(song);
        }

        state.currentSongs = state.queue; // Legacy support
        saveQueueState(state);
      }
    },

    removeFromQueue: (state, action) => {
      const { index } = action.payload;

      if (index >= 0 && index < state.queue.length) {
        state.queue.splice(index, 1);

        // Adjust current index
        if (index < state.currentIndex) {
          state.currentIndex--;
        } else if (index === state.currentIndex) {
          if (state.queue.length === 0) {
            state.currentIndex = -1;
            state.activeSong = {};
            state.isActive = false;
            state.isPlaying = false;
          } else {
            state.currentIndex = Math.min(
              state.currentIndex,
              state.queue.length - 1
            );
            state.activeSong = state.queue[state.currentIndex];
          }
        }

        // Regenerate shuffle if active
        if (state.shuffle && state.queue.length > 1) {
          state.shuffleOrder = generateShuffleOrder(
            state.queue.length,
            state.currentIndex
          );
        }

        state.currentSongs = state.queue; // Legacy support
        saveQueueState(state);
      }
    },

    clearQueue: (state) => {
      state.queue = [];
      state.currentIndex = -1;
      state.activeSong = {};
      state.isActive = false;
      state.isPlaying = false;
      state.shuffleOrder = [];
      state.currentSongs = []; // Legacy support

      saveQueueState(state);
    },

    replaceQueue: (state, action) => {
      const {
        songs,
        startIndex = 0,
        source = null,
        name = "Your Queue",
      } = action.payload;

      state.queue = songs;
      state.currentIndex = startIndex;
      state.activeSong = songs[startIndex] || {};
      state.isActive = songs.length > 0;
      state.queueSource = source;
      state.queueName = name;
      state.currentSongs = songs; // Legacy support

      // Generate shuffle order if needed
      if (state.shuffle && songs.length > 1) {
        state.shuffleOrder = generateShuffleOrder(songs.length, startIndex);
      }

      saveQueueState(state);
    },

    toggleShuffle: (state) => {
      state.shuffle = !state.shuffle;

      if (state.shuffle && state.queue.length > 1) {
        state.shuffleOrder = generateShuffleOrder(
          state.queue.length,
          state.currentIndex
        );
      } else {
        state.shuffleOrder = [];
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

    // Legacy actions (kept for compatibility)
    addToQueueAndPlay: (state, action) => {
      const { song, source } = action.payload;

      // Just redirect to playTrack
      playerSlice.caseReducers.playTrack(state, {
        payload: { track: song, source },
      });
    },

    changeTrackAndPlay: (state, action) => {
      const { song, index } = action.payload;

      if (index >= 0 && index < state.queue.length) {
        state.currentIndex = index;
        state.activeSong = song;
        state.isActive = true;
        state.isPlaying = true;

        addToHistory(state, song);
        saveQueueState(state);
      }
    },

    // Playlist management
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

      if (playlistType === "playlist") {
        const playlist = state.playlists.find((p) => p.id === playlistId);
        if (playlist) {
          state.queue = playlist.tracks;
          state.currentSongs = playlist.tracks;
          state.currentPlaylist = playlist;
          state.currentIndex = 0;
          state.queueName = playlist.name;
        }
      } else if (playlistType === "recent") {
        state.queue = state.recentlyPlayed;
        state.currentSongs = state.recentlyPlayed;
        state.currentPlaylist = {
          id: "recent",
          name: "Recently Played",
          tracks: state.recentlyPlayed,
        };
        state.currentIndex = 0;
        state.queueName = "Recently Played";
      } else if (playlistType === "queue") {
        state.currentPlaylist = {
          id: "queue",
          name: "Your Queue",
          tracks: state.queue,
        };
        state.queueName = "Your Queue";
      }

      saveQueueState(state);
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

    // UI state
    clearPlaylistContext: (state) => {
      state.playlistContext = null;
    },

    setCurrentPlaylist: (state, action) => {
      state.currentPlaylist = action.payload;
    },

    clearCurrentPlaylist: (state) => {
      state.currentPlaylist = null;
    },

    // More legacy actions
    playNext: (state, action) => {
      playerSlice.caseReducers.addToQueue(state, {
        payload: { song: action.payload.track, playNext: true },
      });
    },

    nextSong: (state) => {
      playerSlice.caseReducers.navigateSong(state, {
        payload: { direction: "next" },
      });
    },

    prevSong: (state) => {
      playerSlice.caseReducers.navigateSong(state, {
        payload: { direction: "prev" },
      });
    },

    setShuffleWithStart: (state, action) => {
      state.shuffle = true;
      if (state.queue.length > 1) {
        state.shuffleOrder = generateShuffleOrder(
          state.queue.length,
          state.currentIndex
        );
      }
    },

    setQueue: (state, action) => {
      // Legacy support - redirect to replaceQueue
      playerSlice.caseReducers.replaceQueue(state, action);
    },

    navigateTrack: (state, action) => {
      // Legacy support - redirect to navigateSong
      playerSlice.caseReducers.navigateSong(state, action);
    },
  },
});

export const {
  // Core playback actions
  setActiveSong,
  navigateSong,
  playPause,
  toggleShuffle,
  toggleRepeat,
  // Queue management
  addToQueue,
  removeFromQueue,
  clearQueue,
  replaceQueue,
  // UI state
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
  // Legacy actions
  playTrack,
  changeTrackAndPlay,
  setQueue,
  navigateTrack,
  addToQueueAndPlay,
  playNext,
  nextSong,
  prevSong,
  setShuffleWithStart,
} = playerSlice.actions;

export default playerSlice.reducer;
