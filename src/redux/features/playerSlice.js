import { createSlice } from "@reduxjs/toolkit";

// Storage keys
const STORAGE_KEYS = {
  queue: "crescendo_queue_v2",
  playlists: "crescendo_playlists_v2",
};

// Load from localStorage
const loadFromStorage = (key) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error(`Failed to load ${key}:`, error);
    return null;
  }
};

// Save to localStorage
const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Failed to save ${key}:`, error);
  }
};

// Initial state - completely flat structure
const initialState = {
  // Current playback
  currentTrack: null,
  isPlaying: false,
  isActive: false,

  // Playback modes
  shuffle: false,
  repeat: false,

  // Active context
  activeContext: "queue", // queue | recently_played | community_playlist | playlist_[id]
  currentIndex: -1,

  // Track lists (all separate, no nesting)
  queue: loadFromStorage(STORAGE_KEYS.queue) || [],
  recentlyPlayed: [], // Session-only, no persistence
  communityPlaylist: null, // { id, name, tracks }
  playlists: loadFromStorage(STORAGE_KEYS.playlists) || [],

  // UI state
  genreListId: "POP",
  modalOpen: false,
};

const playerSlice = createSlice({
  name: "player",
  initialState,
  reducers: {
    // Core playback actions
    setCurrentTrack: (state, action) => {
      state.currentTrack = action.payload;
      state.isActive = !!action.payload;
    },

    playPause: (state, action) => {
      state.isPlaying = action.payload;
    },

    // Context switching
    setActiveContext: (state, action) => {
      const { context, index = 0 } = action.payload;
      state.activeContext = context;
      state.currentIndex = index;
    },

    // Navigate within current context
    navigateInContext: (state, action) => {
      const { direction } = action.payload;
      const tracks = getCurrentContextTracks(state);

      if (!tracks || tracks.length === 0) return;

      let newIndex;
      if (direction === "next") {
        // Always loop to first track when at the end
        newIndex =
          state.currentIndex === tracks.length - 1 ? 0 : state.currentIndex + 1;
      } else {
        // Always loop to last track when at the beginning
        newIndex =
          state.currentIndex === 0 ? tracks.length - 1 : state.currentIndex - 1;
      }

      state.currentIndex = newIndex;
      state.currentTrack = tracks[newIndex];

      // Only add to recently played if NOT in recently played context
      if (state.activeContext !== "recently_played") {
        addToRecentlyPlayed(state, tracks[newIndex]);
      }
    },

    // Play track (switches to queue)
    playTrack: (state, action) => {
      const { track, fromContext } = action.payload;

      // Check if playing from recently played
      if (fromContext === "recently_played") {
        // Find the track in recently played
        const recentIndex = state.recentlyPlayed.findIndex(
          (t) => getTrackId(t) === getTrackId(track)
        );

        if (recentIndex !== -1) {
          // Play from recently played context
          state.activeContext = "recently_played";
          state.currentIndex = recentIndex;
          state.currentTrack = track;
          state.isPlaying = true;
          state.isActive = true;

          // Move to top if not already there
          if (recentIndex !== 0) {
            const [movedTrack] = state.recentlyPlayed.splice(recentIndex, 1);
            state.recentlyPlayed.unshift(movedTrack);
            state.currentIndex = 0;
          }

          return;
        }
      }

      // Default behavior - switch to queue
      state.activeContext = "queue";

      // Add to queue if not exists
      const trackId = getTrackId(track);
      const existingIndex = state.queue.findIndex(
        (t) => getTrackId(t) === trackId
      );

      if (existingIndex === -1) {
        state.queue.push(track);
        state.currentIndex = state.queue.length - 1;
      } else {
        state.currentIndex = existingIndex;
      }

      state.currentTrack = track;
      state.isPlaying = true;
      state.isActive = true;

      // Add to recently played only if not playing from recently played
      if (fromContext !== "recently_played") {
        addToRecentlyPlayed(state, track);
      }

      // Save queue
      saveToStorage(STORAGE_KEYS.queue, state.queue);
    },

    // Play from specific context
    playFromContext: (state, action) => {
      const { contextType, trackIndex, playlistData } = action.payload;

      // Handle community playlist
      if (contextType === "community_playlist" && playlistData) {
        state.communityPlaylist = {
          id: playlistData.id,
          name: playlistData.name,
          tracks: playlistData.tracks || [],
        };
      }

      state.activeContext = contextType;
      const tracks = getCurrentContextTracks(state);

      if (
        tracks &&
        tracks.length > 0 &&
        trackIndex >= 0 &&
        trackIndex < tracks.length
      ) {
        state.currentIndex = trackIndex;
        state.currentTrack = tracks[trackIndex];
        state.isPlaying = true;
        state.isActive = true;

        // Only add to recently played if NOT playing from recently played
        if (contextType !== "recently_played") {
          addToRecentlyPlayed(state, tracks[trackIndex]);
        }
      }
    },

    // Replace entire context (for Play All)
    replaceContext: (state, action) => {
      const {
        contextType,
        tracks,
        startIndex = 0,
        playlistData,
      } = action.payload;

      if (contextType === "queue") {
        state.queue = tracks;
        saveToStorage(STORAGE_KEYS.queue, tracks);
      } else if (contextType === "community_playlist") {
        state.communityPlaylist = {
          id: playlistData?.id || "community",
          name: playlistData?.name || "Community Playlist",
          tracks: tracks,
        };
      }

      state.activeContext = contextType;
      state.currentIndex = startIndex;
      state.currentTrack = tracks[startIndex];
      state.isPlaying = true;
      state.isActive = true;

      // Only add to recently played if NOT replacing recently played context
      if (contextType !== "recently_played") {
        addToRecentlyPlayed(state, tracks[startIndex]);
      }
    },

    // Add to queue
    addToQueue: (state, action) => {
      const { song, playNext = false } = action.payload;
      const trackId = getTrackId(song);

      // Check if already exists
      const exists = state.queue.some((t) => getTrackId(t) === trackId);
      if (!exists) {
        if (
          playNext &&
          state.activeContext === "queue" &&
          state.currentIndex >= 0
        ) {
          state.queue.splice(state.currentIndex + 1, 0, song);
          // Don't adjust currentIndex here - the track was inserted after
        } else {
          state.queue.push(song);
        }
        saveToStorage(STORAGE_KEYS.queue, state.queue);
      }
    },

    // Remove from context
    removeFromContext: (state, action) => {
      const { trackIndex } = action.payload;
      const tracks = getCurrentContextTracks(state);

      if (
        !tracks ||
        state.activeContext === "recently_played" ||
        state.activeContext === "community_playlist"
      ) {
        return; // Can't remove from these contexts
      }

      if (trackIndex >= 0 && trackIndex < tracks.length) {
        tracks.splice(trackIndex, 1);

        // Adjust current index
        if (trackIndex < state.currentIndex) {
          state.currentIndex--;
        } else if (trackIndex === state.currentIndex) {
          if (tracks.length === 0) {
            state.currentIndex = -1;
            state.currentTrack = null;
            state.isPlaying = false;
            state.isActive = false;
          } else {
            state.currentIndex = Math.min(
              state.currentIndex,
              tracks.length - 1
            );
            state.currentTrack = tracks[state.currentIndex];
          }
        }

        // Save changes
        if (state.activeContext === "queue") {
          saveToStorage(STORAGE_KEYS.queue, state.queue);
        } else if (state.activeContext.startsWith("playlist_")) {
          saveToStorage(STORAGE_KEYS.playlists, state.playlists);
        }
      }
    },

    // Clear queue
    clearQueue: (state) => {
      state.queue = [];
      saveToStorage(STORAGE_KEYS.queue, []);

      if (state.activeContext === "queue") {
        state.currentIndex = -1;
        state.currentTrack = null;
        state.isPlaying = false;
        state.isActive = false;
      }
    },

    // Playlist management
    createPlaylist: (state, action) => {
      const { name, id = `playlist_${Date.now()}` } = action.payload;

      const newPlaylist = {
        id,
        name,
        tracks: [],
        createdAt: new Date().toISOString(),
      };

      state.playlists.push(newPlaylist);
      saveToStorage(STORAGE_KEYS.playlists, state.playlists);
    },

    deletePlaylist: (state, action) => {
      const { playlistId } = action.payload;

      state.playlists = state.playlists.filter((p) => p.id !== playlistId);
      saveToStorage(STORAGE_KEYS.playlists, state.playlists);

      // Switch context if deleted playlist was active
      if (state.activeContext === playlistId) {
        state.activeContext = "queue";
        state.currentIndex = -1;
      }
    },

    renamePlaylist: (state, action) => {
      const { playlistId, name } = action.payload;

      const playlist = state.playlists.find((p) => p.id === playlistId);
      if (playlist) {
        playlist.name = name;
        saveToStorage(STORAGE_KEYS.playlists, state.playlists);
      }
    },

    addToPlaylist: (state, action) => {
      const { playlistId, track } = action.payload;

      const playlist = state.playlists.find((p) => p.id === playlistId);
      if (playlist) {
        const trackId = getTrackId(track);
        const exists = playlist.tracks.some((t) => getTrackId(t) === trackId);

        if (!exists) {
          playlist.tracks.push(track);
          saveToStorage(STORAGE_KEYS.playlists, state.playlists);
        }
      }
    },

    removeFromPlaylist: (state, action) => {
      const { playlistId, trackId } = action.payload;

      const playlist = state.playlists.find((p) => p.id === playlistId);
      if (playlist) {
        const index = playlist.tracks.findIndex(
          (t) => getTrackId(t) === trackId
        );
        if (index !== -1) {
          playlist.tracks.splice(index, 1);

          // Update current index if this playlist is active
          if (state.activeContext === playlistId) {
            if (index < state.currentIndex) {
              state.currentIndex--;
            } else if (index === state.currentIndex) {
              if (playlist.tracks.length === 0) {
                state.currentIndex = -1;
                state.currentTrack = null;
                state.isPlaying = false;
                state.isActive = false;
              } else {
                state.currentIndex = Math.min(
                  state.currentIndex,
                  playlist.tracks.length - 1
                );
                state.currentTrack = playlist.tracks[state.currentIndex];
              }
            }
          }

          saveToStorage(STORAGE_KEYS.playlists, state.playlists);
        }
      }
    },

    // Switch context
    switchContext: (state, action) => {
      const { contextType } = action.payload;
      state.activeContext = contextType;

      // Find current track in new context if possible
      const tracks = getCurrentContextTracks(state);
      if (tracks && state.currentTrack) {
        const trackId = getTrackId(state.currentTrack);
        const index = tracks.findIndex((t) => getTrackId(t) === trackId);
        state.currentIndex = index >= 0 ? index : -1;
      } else {
        state.currentIndex = -1;
      }
    },

    // Playback modes
    toggleShuffle: (state) => {
      state.shuffle = !state.shuffle;
    },

    toggleRepeat: (state) => {
      state.repeat = !state.repeat;
    },

    // UI state
    selectGenreListId: (state, action) => {
      state.genreListId = action.payload;
    },

    setModalOpen: (state, action) => {
      state.modalOpen = action.payload;
    },

    // Update track preview URL
    updateCurrentTrackPreview: (state, action) => {
      const { track } = action.payload;
      if (
        state.currentTrack &&
        getTrackId(state.currentTrack) === getTrackId(track)
      ) {
        state.currentTrack = { ...state.currentTrack, ...track };

        // Also update in the current context
        const tracks = getCurrentContextTracks(state);
        if (
          tracks &&
          state.currentIndex >= 0 &&
          state.currentIndex < tracks.length
        ) {
          tracks[state.currentIndex] = state.currentTrack;

          // Save if needed
          if (state.activeContext === "queue") {
            saveToStorage(STORAGE_KEYS.queue, state.queue);
          } else if (state.activeContext.startsWith("playlist_")) {
            saveToStorage(STORAGE_KEYS.playlists, state.playlists);
          }
        }
      }
    },
  },
});

// Helper functions
function getTrackId(track) {
  return track?.key || track?.id || track?.track_id || track?.title;
}

function getCurrentContextTracks(state) {
  switch (state.activeContext) {
    case "queue":
      return state.queue;
    case "recently_played":
      return state.recentlyPlayed;
    case "community_playlist":
      return state.communityPlaylist?.tracks || [];
    default:
      if (state.activeContext.startsWith("playlist_")) {
        const playlist = state.playlists.find(
          (p) => p.id === state.activeContext
        );
        return playlist?.tracks || [];
      }
      return [];
  }
}

function addToRecentlyPlayed(state, track) {
  if (!track) return;

  const trackId = getTrackId(track);

  // Find if track already exists
  const existingIndex = state.recentlyPlayed.findIndex(
    (t) => getTrackId(t) === trackId
  );

  if (existingIndex === 0) {
    return;
  } else if (existingIndex > 0) {
    // Remove from current position
    state.recentlyPlayed.splice(existingIndex, 1);
  }

  // Add to front
  state.recentlyPlayed.unshift(track);

  // Keep only 20 tracks
  if (state.recentlyPlayed.length > 20) {
    state.recentlyPlayed = state.recentlyPlayed.slice(0, 20);
  }
}

export const {
  setCurrentTrack,
  playPause,
  setActiveContext,
  navigateInContext,
  playTrack,
  playFromContext,
  replaceContext,
  addToQueue,
  removeFromContext,
  clearQueue,
  createPlaylist,
  deletePlaylist,
  renamePlaylist,
  addToPlaylist,
  removeFromPlaylist,
  switchContext,
  toggleShuffle,
  toggleRepeat,
  selectGenreListId,
  setModalOpen,
  updateCurrentTrackPreview,
} = playerSlice.actions;

export default playerSlice.reducer;
