import { createSlice } from "@reduxjs/toolkit";

// Storage keys
const STORAGE_KEYS = {
  playbackState: "crescendo_playback_state",
  playlists: "crescendo_playlists",
  recentlyPlayed: "crescendo_recently_played",
};

// Storage helpers
const loadFromStorage = (key) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error(`Failed to load ${key}:`, error);
    return null;
  }
};

const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Failed to save ${key}:`, error);
  }
};

// Context types
const CONTEXT_TYPES = {
  QUEUE: "queue",
  PLAYLIST: "playlist",
  COMMUNITY_PLAYLIST: "community_playlist",
  RECENTLY_PLAYED: "recently_played",
};

// Helper: Remove duplicates by track ID
const removeDuplicates = (tracks, newTrack) => {
  const newTrackId = newTrack?.key || newTrack?.id || newTrack?.track_id;
  return tracks.filter((track) => {
    const trackId = track?.key || track?.id || track?.track_id;
    return trackId !== newTrackId;
  });
};

// Helper: Find track index
const findTrackIndex = (tracks, targetTrack) => {
  const targetId = targetTrack?.key || targetTrack?.id || targetTrack?.track_id;
  return tracks.findIndex((track) => {
    const trackId = track?.key || track?.id || track?.track_id;
    return trackId === targetId;
  });
};

// Load persisted state
const loadPersistedState = () => {
  const playbackState = loadFromStorage(STORAGE_KEYS.playbackState);
  const playlists = loadFromStorage(STORAGE_KEYS.playlists) || [];
  const recentlyPlayed = loadFromStorage(STORAGE_KEYS.recentlyPlayed) || [];

  // Validate and return safe defaults
  if (
    playbackState &&
    playbackState.timestamp &&
    Date.now() - playbackState.timestamp < 24 * 60 * 60 * 1000
  ) {
    return {
      ...playbackState,
      playlists,
      recentlyPlayed,
      isPlaying: false, // Never auto-resume playback
    };
  }

  return {
    // Playback contexts
    contexts: {
      [CONTEXT_TYPES.QUEUE]: {
        tracks: [],
        name: "Your Queue",
        currentIndex: -1,
      },
      [CONTEXT_TYPES.RECENTLY_PLAYED]: {
        tracks: recentlyPlayed.slice(0, 20),
        name: "Recently Played",
        currentIndex: -1,
      },
    },

    // Active context
    activeContext: CONTEXT_TYPES.QUEUE,
    activeCommunityPlaylist: null,

    // Current playback
    activeSong: {},
    isPlaying: false,
    isActive: false,

    // Playback modes
    shuffle: false,
    repeat: false,

    // Custom playlists
    playlists,
    recentlyPlayed,

    // UI state
    genreListId: "POP",
    isModalOpen: false,

    // Legacy support (will be gradually removed)
    queue: [],
    currentSongs: [],
    currentIndex: -1,
  };
};

// Save state
const savePlaybackState = (state) => {
  const toSave = {
    contexts: state.contexts,
    activeContext: state.activeContext,
    activeCommunityPlaylist: state.activeCommunityPlaylist,
    activeSong: state.activeSong,
    isActive: state.isActive,
    shuffle: state.shuffle,
    repeat: state.repeat,
    timestamp: Date.now(),
  };
  saveToStorage(STORAGE_KEYS.playbackState, toSave);
};

// Initialize state
const initialState = loadPersistedState();

const playerSlice = createSlice({
  name: "player",
  initialState,
  reducers: {
    // Core playback action - handles context switching automatically
    playTrack: (state, action) => {
      const { track, source = "manual" } = action.payload;

      // Always switch to queue context and add track
      state.activeContext = CONTEXT_TYPES.QUEUE;
      state.activeCommunityPlaylist = null;

      const queueContext = state.contexts[CONTEXT_TYPES.QUEUE];

      // Remove duplicates and add to end
      queueContext.tracks = removeDuplicates(queueContext.tracks, track);
      queueContext.tracks.push(track);
      queueContext.currentIndex = queueContext.tracks.length - 1;

      // Set as active song
      state.activeSong = track;
      state.isActive = true;
      state.isPlaying = true;

      // Add to recently played
      state.recentlyPlayed = removeDuplicates(state.recentlyPlayed, track);
      state.recentlyPlayed.unshift(track);
      state.recentlyPlayed = state.recentlyPlayed.slice(0, 20);

      // Update recently played context
      state.contexts[CONTEXT_TYPES.RECENTLY_PLAYED].tracks = [
        ...state.recentlyPlayed,
      ];

      // Update legacy state
      state.queue = queueContext.tracks;
      state.currentSongs = queueContext.tracks;
      state.currentIndex = queueContext.currentIndex;

      savePlaybackState(state);
      saveToStorage(STORAGE_KEYS.recentlyPlayed, state.recentlyPlayed);
    },

    // Play from specific context position
    playFromContext: (state, action) => {
      const { contextType, trackIndex, playlistData = null } = action.payload;

      let context;

      if (contextType === CONTEXT_TYPES.COMMUNITY_PLAYLIST && playlistData) {
        // Set up community playlist context
        state.activeCommunityPlaylist = {
          ...playlistData,
          currentIndex: trackIndex,
        };
        context = state.activeCommunityPlaylist;
        state.activeContext = CONTEXT_TYPES.COMMUNITY_PLAYLIST;
      } else {
        context = state.contexts[contextType];
        if (!context) return;
        state.activeContext = contextType;
        state.activeCommunityPlaylist = null;
      }

      if (trackIndex >= 0 && trackIndex < context.tracks.length) {
        context.currentIndex = trackIndex;
        const track = context.tracks[trackIndex];

        state.activeSong = track;
        state.isActive = true;
        state.isPlaying = true;

        // Add to recently played
        state.recentlyPlayed = removeDuplicates(state.recentlyPlayed, track);
        state.recentlyPlayed.unshift(track);
        state.recentlyPlayed = state.recentlyPlayed.slice(0, 20);

        // Update recently played context
        state.contexts[CONTEXT_TYPES.RECENTLY_PLAYED].tracks = [
          ...state.recentlyPlayed,
        ];

        // Update legacy state
        state.queue = context.tracks;
        state.currentSongs = context.tracks;
        state.currentIndex = context.currentIndex;

        savePlaybackState(state);
        saveToStorage(STORAGE_KEYS.recentlyPlayed, state.recentlyPlayed);
      }
    },

    // Navigate within current context
    navigateInContext: (state, action) => {
      const { direction } = action.payload;

      let context;
      if (state.activeContext === CONTEXT_TYPES.COMMUNITY_PLAYLIST) {
        context = state.activeCommunityPlaylist;
      } else {
        context = state.contexts[state.activeContext];
      }

      if (!context || context.tracks.length === 0) return;

      let newIndex;

      if (direction === "next") {
        newIndex = (context.currentIndex + 1) % context.tracks.length;
        if (newIndex === 0 && !state.repeat) {
          state.isPlaying = false;
          return;
        }
      } else {
        newIndex = context.currentIndex - 1;
        if (newIndex < 0) {
          newIndex = state.repeat ? context.tracks.length - 1 : 0;
        }
      }

      context.currentIndex = newIndex;
      const track = context.tracks[newIndex];

      state.activeSong = track;

      // Add to recently played
      state.recentlyPlayed = removeDuplicates(state.recentlyPlayed, track);
      state.recentlyPlayed.unshift(track);
      state.recentlyPlayed = state.recentlyPlayed.slice(0, 20);

      // Update recently played context
      state.contexts[CONTEXT_TYPES.RECENTLY_PLAYED].tracks = [
        ...state.recentlyPlayed,
      ];

      // Update legacy state
      state.queue = context.tracks;
      state.currentSongs = context.tracks;
      state.currentIndex = context.currentIndex;

      savePlaybackState(state);
      saveToStorage(STORAGE_KEYS.recentlyPlayed, state.recentlyPlayed);
    },

    // Switch active context without playing
    switchContext: (state, action) => {
      const { contextType, playlistData = null } = action.payload;

      if (contextType === CONTEXT_TYPES.COMMUNITY_PLAYLIST && playlistData) {
        state.activeCommunityPlaylist = {
          ...playlistData,
          currentIndex: -1,
        };
        state.activeContext = CONTEXT_TYPES.COMMUNITY_PLAYLIST;
      } else if (state.contexts[contextType]) {
        state.activeContext = contextType;
        state.activeCommunityPlaylist = null;
      }

      savePlaybackState(state);
    },

    // Add track to queue context
    addToQueue: (state, action) => {
      const { track, playNext = false } = action.payload;
      const queueContext = state.contexts[CONTEXT_TYPES.QUEUE];

      // Remove duplicates
      queueContext.tracks = removeDuplicates(queueContext.tracks, track);

      if (playNext && queueContext.currentIndex >= 0) {
        queueContext.tracks.splice(queueContext.currentIndex + 1, 0, track);
      } else {
        queueContext.tracks.push(track);
      }

      // Update legacy state if queue is active
      if (state.activeContext === CONTEXT_TYPES.QUEUE) {
        state.queue = queueContext.tracks;
        state.currentSongs = queueContext.tracks;
      }

      savePlaybackState(state);
    },

    // Remove track from current context
    removeFromContext: (state, action) => {
      const { trackIndex } = action.payload;

      let context;
      if (state.activeContext === CONTEXT_TYPES.COMMUNITY_PLAYLIST) {
        return; // Community playlists are read-only
      } else {
        context = state.contexts[state.activeContext];
      }

      if (!context || trackIndex < 0 || trackIndex >= context.tracks.length)
        return;

      context.tracks.splice(trackIndex, 1);

      // Adjust current index
      if (trackIndex < context.currentIndex) {
        context.currentIndex--;
      } else if (trackIndex === context.currentIndex) {
        if (context.tracks.length === 0) {
          context.currentIndex = -1;
          state.activeSong = {};
          state.isActive = false;
          state.isPlaying = false;
        } else {
          context.currentIndex = Math.min(
            context.currentIndex,
            context.tracks.length - 1
          );
          state.activeSong = context.tracks[context.currentIndex] || {};
        }
      }

      // Update legacy state
      state.queue = context.tracks;
      state.currentSongs = context.tracks;
      state.currentIndex = context.currentIndex;

      savePlaybackState(state);
    },

    // Clear queue context
    clearQueue: (state) => {
      const queueContext = state.contexts[CONTEXT_TYPES.QUEUE];
      queueContext.tracks = [];
      queueContext.currentIndex = -1;

      if (state.activeContext === CONTEXT_TYPES.QUEUE) {
        state.activeSong = {};
        state.isActive = false;
        state.isPlaying = false;
        state.queue = [];
        state.currentSongs = [];
        state.currentIndex = -1;
      }

      savePlaybackState(state);
    },

    // Replace entire context
    replaceContext: (state, action) => {
      const {
        contextType,
        tracks,
        startIndex = 0,
        playlistData = null,
      } = action.payload;

      if (contextType === CONTEXT_TYPES.COMMUNITY_PLAYLIST) {
        state.activeCommunityPlaylist = {
          ...playlistData,
          tracks,
          currentIndex: startIndex,
        };
        state.activeContext = CONTEXT_TYPES.COMMUNITY_PLAYLIST;

        if (startIndex >= 0 && startIndex < tracks.length) {
          const track = tracks[startIndex];
          state.activeSong = track;
          state.isActive = true;

          // Add to recently played
          state.recentlyPlayed = removeDuplicates(state.recentlyPlayed, track);
          state.recentlyPlayed.unshift(track);
          state.recentlyPlayed = state.recentlyPlayed.slice(0, 20);
          state.contexts[CONTEXT_TYPES.RECENTLY_PLAYED].tracks = [
            ...state.recentlyPlayed,
          ];
          saveToStorage(STORAGE_KEYS.recentlyPlayed, state.recentlyPlayed);
        }
      } else if (state.contexts[contextType]) {
        const context = state.contexts[contextType];
        context.tracks = tracks;
        context.currentIndex = startIndex;

        if (state.activeContext === contextType) {
          if (startIndex >= 0 && startIndex < tracks.length) {
            const track = tracks[startIndex];
            state.activeSong = track;
            state.isActive = true;

            // Add to recently played
            state.recentlyPlayed = removeDuplicates(
              state.recentlyPlayed,
              track
            );
            state.recentlyPlayed.unshift(track);
            state.recentlyPlayed = state.recentlyPlayed.slice(0, 20);
            state.contexts[CONTEXT_TYPES.RECENTLY_PLAYED].tracks = [
              ...state.recentlyPlayed,
            ];
            saveToStorage(STORAGE_KEYS.recentlyPlayed, state.recentlyPlayed);
          }

          // Update legacy state
          state.queue = tracks;
          state.currentSongs = tracks;
          state.currentIndex = startIndex;
        }
      }

      savePlaybackState(state);
    },

    // Playback controls
    playPause: (state, action) => {
      state.isPlaying = action.payload;
    },

    toggleShuffle: (state) => {
      state.shuffle = !state.shuffle;
    },

    toggleRepeat: (state) => {
      state.repeat = !state.repeat;
    },

    // Playlist management
    createPlaylist: (state, action) => {
      const newPlaylist = {
        id: action.payload.id || `playlist_${Date.now()}`,
        name: action.payload.name || "New Playlist",
        tracks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      state.playlists.push(newPlaylist);

      // Create context for this playlist
      state.contexts[newPlaylist.id] = {
        tracks: [],
        name: newPlaylist.name,
        currentIndex: -1,
      };

      saveToStorage(STORAGE_KEYS.playlists, state.playlists);
      savePlaybackState(state);
    },

    deletePlaylist: (state, action) => {
      const playlistId = action.payload;

      state.playlists = state.playlists.filter((p) => p.id !== playlistId);

      // Remove context
      delete state.contexts[playlistId];

      // Switch away if this was active
      if (state.activeContext === playlistId) {
        state.activeContext = CONTEXT_TYPES.QUEUE;
      }

      saveToStorage(STORAGE_KEYS.playlists, state.playlists);
      savePlaybackState(state);
    },

    renamePlaylist: (state, action) => {
      const { playlistId, name } = action.payload;
      const playlist = state.playlists.find((p) => p.id === playlistId);

      if (playlist) {
        playlist.name = name;
        playlist.updatedAt = new Date().toISOString();

        // Update context name
        if (state.contexts[playlistId]) {
          state.contexts[playlistId].name = name;
        }

        saveToStorage(STORAGE_KEYS.playlists, state.playlists);
        savePlaybackState(state);
      }
    },

    addToPlaylist: (state, action) => {
      const { playlistId, track } = action.payload;
      const playlist = state.playlists.find((p) => p.id === playlistId);

      if (playlist) {
        // Remove duplicates and add
        playlist.tracks = removeDuplicates(playlist.tracks, track);
        playlist.tracks.push(track);
        playlist.updatedAt = new Date().toISOString();

        // Update context
        if (state.contexts[playlistId]) {
          state.contexts[playlistId].tracks = [...playlist.tracks];
        }

        saveToStorage(STORAGE_KEYS.playlists, state.playlists);
        savePlaybackState(state);
      }
    },

    removeFromPlaylist: (state, action) => {
      const { playlistId, trackId } = action.payload;
      const playlist = state.playlists.find((p) => p.id === playlistId);

      if (playlist) {
        playlist.tracks = playlist.tracks.filter((track) => {
          const tId = track?.key || track?.id || track?.track_id;
          return tId !== trackId;
        });
        playlist.updatedAt = new Date().toISOString();

        // Update context
        if (state.contexts[playlistId]) {
          state.contexts[playlistId].tracks = [...playlist.tracks];

          // Adjust current index if needed
          const context = state.contexts[playlistId];
          if (context.currentIndex >= playlist.tracks.length) {
            context.currentIndex = playlist.tracks.length - 1;
          }
        }

        saveToStorage(STORAGE_KEYS.playlists, state.playlists);
        savePlaybackState(state);
      }
    },

    // UI state
    selectGenreListId: (state, action) => {
      state.genreListId = action.payload;
    },

    setModalOpen: (state, action) => {
      state.isModalOpen = action.payload;
    },

    // Legacy actions (kept for compatibility)
    setActiveSong: (state, action) => {
      // Redirect to playTrack
      playerSlice.caseReducers.playTrack(state, action);
    },

    navigateSong: (state, action) => {
      // Redirect to navigateInContext
      playerSlice.caseReducers.navigateInContext(state, action);
    },
  },
});

export const {
  // Core playback
  playTrack,
  playFromContext,
  navigateInContext,
  switchContext,
  playPause,
  toggleShuffle,
  toggleRepeat,

  // Context management
  addToQueue,
  removeFromContext,
  clearQueue,
  replaceContext,

  // Playlist management
  createPlaylist,
  deletePlaylist,
  renamePlaylist,
  addToPlaylist,
  removeFromPlaylist,

  // UI state
  selectGenreListId,
  setModalOpen,

  // Legacy (will be removed)
  setActiveSong,
  navigateSong,
} = playerSlice.actions;

export default playerSlice.reducer;
