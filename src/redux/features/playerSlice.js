import { createSlice } from "@reduxjs/toolkit";
import { StorageKeys } from "../../utils/storageManager";

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
  volume: loadFromStorage(StorageKeys.VOLUME) || 0.7,

  // Playback modes
  shuffle: false,
  repeat: false,

  // Active context
  activeContext: "queue", // queue | recently_played | album | community_playlist | playlist_[id]
  currentIndex: -1,

  // Track lists (all separate, no nesting)
  queue: loadFromStorage(StorageKeys.QUEUE) || [],
  recentlyPlayed: [],

  // Temporary contexts (not persisted)
  albumContext: null, // { id, name, tracks }
  communityPlaylist: null, // { id, name, tracks }

  // User playlists (persisted)
  playlists: loadFromStorage(StorageKeys.PLAYLISTS) || [],

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

    // Context switching - now loads first track if available
    switchContext: (state, action) => {
      const { contextType } = action.payload;

      // Always pause playback when switching
      state.isPlaying = false;
      state.activeContext = contextType;

      // Get tracks from the new context
      const tracks = getCurrentContextTracks({
        ...state,
        activeContext: contextType,
      });

      if (tracks && tracks.length > 0) {
        // Load the first track but keep paused
        state.currentIndex = 0;
        state.currentTrack = tracks[0];
        state.isActive = true; // Keep player visible
      } else {
        // No tracks in context, reset everything
        state.currentIndex = -1;
        state.currentTrack = null;
        state.isActive = false;
      }
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

      // Only add to recently played if NOT playing from recently played
      if (state.activeContext !== "recently_played") {
        addToRecentlyPlayed(state, state.currentTrack);
      }
    },

    // Play specific track - adds to queue
    playTrack: (state, action) => {
      const { track, fromContext } = action.payload;

      if (fromContext === "recently_played") {
        // Special handling for recently played
        state.activeContext = "recently_played";
        const index = state.recentlyPlayed.findIndex(
          (t) => getTrackId(t) === getTrackId(track)
        );
        state.currentIndex = index >= 0 ? index : 0;
      } else {
        // Add to queue and switch to queue context
        const trackId = getTrackId(track);
        const existingIndex = state.queue.findIndex(
          (t) => getTrackId(t) === trackId
        );

        if (existingIndex >= 0) {
          state.queue.splice(existingIndex, 1);
        }

        state.queue.unshift(track);
        state.activeContext = "queue";
        state.currentIndex = 0;

        // Add to recently played
        addToRecentlyPlayed(state, track);
      }

      state.currentTrack = track;
      state.isActive = true;
      state.isPlaying = true;

      // Save queue
      saveToStorage(StorageKeys.QUEUE, state.queue);
    },

    // Play from specific context
    playFromContext: (state, action) => {
      const { contextType, trackIndex, playlistData, trackWithPreview } =
        action.payload;

      // Handle album context
      if (contextType === "album" && playlistData) {
        state.albumContext = {
          id: playlistData.id,
          name: playlistData.name,
          tracks: playlistData.tracks || [],
        };
      }

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
        // If we have a track with preview URL, update it in the tracks array
        if (trackWithPreview && trackWithPreview.preview_url) {
          tracks[trackIndex] = trackWithPreview;

          // Also update in the actual state arrays
          if (contextType === "queue") {
            state.queue[trackIndex] = trackWithPreview;
            saveToStorage(StorageKeys.QUEUE, state.queue);
          } else if (contextType.startsWith("playlist_")) {
            const playlist = state.playlists.find((p) => p.id === contextType);
            if (playlist) {
              playlist.tracks[trackIndex] = trackWithPreview;
              saveToStorage(StorageKeys.PLAYLISTS, state.playlists);
            }
          }
        }

        state.currentIndex = trackIndex;
        state.currentTrack = trackWithPreview || tracks[trackIndex];
        state.isPlaying = true;
        state.isActive = true;

        // Only add to recently played if NOT playing from recently played
        if (contextType !== "recently_played") {
          addToRecentlyPlayed(state, state.currentTrack);
        }
      }
    },

    // Replace entire context (for Play All/Play Album)
    replaceContext: (state, action) => {
      const {
        contextType,
        tracks,
        startIndex = 0,
        playlistData,
      } = action.payload;

      if (contextType === "queue") {
        state.queue = tracks;
        saveToStorage(StorageKeys.QUEUE, tracks);
      } else if (contextType === "album") {
        // Replace album context
        state.albumContext = {
          id: playlistData?.id || "album",
          name: playlistData?.name || "Album",
          tracks: tracks,
        };
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

    // Queue management
    addToQueue: (state, action) => {
      const { song, playNext = false } = action.payload;
      const trackId = getTrackId(song);

      // Remove if already in queue
      const existingIndex = state.queue.findIndex(
        (t) => getTrackId(t) === trackId
      );
      if (existingIndex >= 0) {
        state.queue.splice(existingIndex, 1);
      }

      if (
        playNext &&
        state.activeContext === "queue" &&
        state.currentIndex >= 0
      ) {
        // Insert after current track
        state.queue.splice(state.currentIndex + 1, 0, song);
      } else {
        // Add to end
        state.queue.push(song);
      }

      saveToStorage(StorageKeys.QUEUE, state.queue);
    },

    removeFromContext: (state, action) => {
      const { trackIndex } = action.payload;

      // Determine which context we're removing from
      const context = state.activeContext;

      // Can't remove from these contexts
      if (
        context === "recently_played" ||
        context === "album" ||
        context === "community_playlist"
      ) {
        return;
      }

      // Handle queue
      if (context === "queue") {
        if (trackIndex >= 0 && trackIndex < state.queue.length) {
          state.queue.splice(trackIndex, 1);

          // Update current playback if needed
          if (trackIndex < state.currentIndex) {
            // Removed track was before current, adjust index
            state.currentIndex--;
          } else if (trackIndex === state.currentIndex) {
            // Removed the currently playing track
            if (state.queue.length === 0) {
              // Queue is now empty
              state.currentIndex = -1;
              state.currentTrack = null;
              state.isPlaying = false;
              state.isActive = false;
            } else {
              // Play next track (or loop to first if at end)
              state.currentIndex = Math.min(
                state.currentIndex,
                state.queue.length - 1
              );
              state.currentTrack = state.queue[state.currentIndex];
            }
          }

          saveToStorage(StorageKeys.QUEUE, state.queue);
        }
      }
      // Handle user playlists
      else if (context.startsWith("playlist_")) {
        const playlist = state.playlists.find((p) => p.id === context);
        if (
          playlist &&
          trackIndex >= 0 &&
          trackIndex < playlist.tracks.length
        ) {
          playlist.tracks.splice(trackIndex, 1);

          // Update current playback if needed
          if (trackIndex < state.currentIndex) {
            // Removed track was before current, adjust index
            state.currentIndex--;
          } else if (trackIndex === state.currentIndex) {
            // Removed the currently playing track
            if (playlist.tracks.length === 0) {
              // Playlist is now empty
              state.currentIndex = -1;
              state.currentTrack = null;
              state.isPlaying = false;
              state.isActive = false;
            } else {
              // Play next track (or loop to first if at end)
              state.currentIndex = Math.min(
                state.currentIndex,
                playlist.tracks.length - 1
              );
              state.currentTrack = playlist.tracks[state.currentIndex];
            }
          }

          saveToStorage(StorageKeys.PLAYLISTS, state.playlists);
        }
      }
    },

    clearQueue: (state) => {
      state.queue = [];
      if (state.activeContext === "queue") {
        state.currentTrack = null;
        state.isPlaying = false;
        state.isActive = false;
        state.currentIndex = -1;
      }
      saveToStorage(StorageKeys.QUEUE, []);
    },

    // Playlist management
    createPlaylist: (state, action) => {
      const { name, id } = action.payload;
      state.playlists.push({
        id,
        name,
        tracks: [],
        createdAt: Date.now(),
      });
      saveToStorage(StorageKeys.PLAYLISTS, state.playlists);
    },

    deletePlaylist: (state, action) => {
      const { playlistId } = action.payload;
      state.playlists = state.playlists.filter((p) => p.id !== playlistId);

      // If we were playing from this playlist, switch to queue
      if (state.activeContext === playlistId) {
        state.activeContext = "queue";
        state.currentIndex = -1;
        state.currentTrack = null;
        state.isPlaying = false;
        state.isActive = false;
      }

      saveToStorage(StorageKeys.PLAYLISTS, state.playlists);
    },

    renamePlaylist: (state, action) => {
      const { playlistId, name } = action.payload;
      const playlist = state.playlists.find((p) => p.id === playlistId);
      if (playlist) {
        playlist.name = name;
        saveToStorage(StorageKeys.PLAYLISTS, state.playlists);
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
          saveToStorage(StorageKeys.PLAYLISTS, state.playlists);
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
        if (index >= 0) {
          playlist.tracks.splice(index, 1);

          // Adjust current index if we're playing from this playlist
          if (
            state.activeContext === playlistId &&
            index < state.currentIndex
          ) {
            state.currentIndex--;
          }

          saveToStorage(StorageKeys.PLAYLISTS, state.playlists);
        }
      }
    },

    // Playback modes
    toggleShuffle: (state) => {
      state.shuffle = !state.shuffle;
    },

    toggleRepeat: (state) => {
      state.repeat = !state.repeat;
    },

    // Other actions
    selectGenreListId: (state, action) => {
      state.genreListId = action.payload;
    },

    setModalOpen: (state, action) => {
      state.modalOpen = action.payload;
    },

    // In src/redux/features/playerSlice.js, replace the updateCurrentTrackPreview reducer:

    updateCurrentTrackPreview: (state, action) => {
      const { track } = action.payload;
      if (!track) return;

      // Update current track
      state.currentTrack = track;

      // Update the track in the active context
      if (state.currentIndex >= 0) {
        switch (state.activeContext) {
          case "queue":
            if (state.queue[state.currentIndex]) {
              state.queue[state.currentIndex] = track;
              saveToStorage(StorageKeys.QUEUE, state.queue);
            }
            break;

          case "album":
            if (state.albumContext?.tracks?.[state.currentIndex]) {
              state.albumContext.tracks[state.currentIndex] = track;
            }
            break;

          case "community_playlist":
            if (state.communityPlaylist?.tracks?.[state.currentIndex]) {
              state.communityPlaylist.tracks[state.currentIndex] = track;
            }
            break;

          case "recently_played":
            if (state.recentlyPlayed[state.currentIndex]) {
              state.recentlyPlayed[state.currentIndex] = track;
            }
            break;

          default:
            // Handle user playlists
            if (state.activeContext.startsWith("playlist_")) {
              const playlist = state.playlists.find(
                (p) => p.id === state.activeContext
              );
              if (playlist?.tracks?.[state.currentIndex]) {
                playlist.tracks[state.currentIndex] = track;
                saveToStorage(StorageKeys.PLAYLISTS, state.playlists);
              }
            }
            break;
        }
      }
    },

    updateAlbumTrack: (state, action) => {
      const { index, track } = action.payload;
      if (state.albumContext && state.albumContext.tracks[index]) {
        state.albumContext.tracks[index] = track;
      }
    },

    setVolume: (state, action) => {
      state.volume = action.payload;
      saveToStorage(StorageKeys.VOLUME, action.payload);
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
    case "album":
      return state.albumContext?.tracks || [];
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
  switchContext,
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
  toggleShuffle,
  toggleRepeat,
  selectGenreListId,
  setModalOpen,
  updateCurrentTrackPreview,
  updateAlbumTrack,
  setVolume,
} = playerSlice.actions;

export default playerSlice.reducer;
