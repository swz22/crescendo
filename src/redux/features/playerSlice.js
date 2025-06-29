import { createSlice } from "@reduxjs/toolkit";
import { StorageKeys } from "../../utils/storageManager";

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

const initialState = {
  currentTrack: null,
  isPlaying: false,
  isActive: false,
  volume: loadFromStorage(StorageKeys.VOLUME) || 0.5,
  shuffle: false,
  repeat: false,
  activeContext: "queue", // queue | recently_played | album | community_playlist | playlist_[id]
  currentIndex: -1,
  queue: loadFromStorage(StorageKeys.QUEUE) || [],
  recentlyPlayed: [],
  albumContext: null, // { id, name, tracks }
  communityPlaylist: null, // { id, name, tracks }
  playlists: loadFromStorage(StorageKeys.PLAYLISTS) || [],
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

    switchContext: (state, action) => {
      const { contextType } = action.payload;

      if (state.activeContext === contextType) {
        return;
      }

      state.isPlaying = false;
      state.activeContext = contextType;

      const tracks = getCurrentContextTracks({
        ...state,
        activeContext: contextType,
      });

      if (tracks && tracks.length > 0) {
        state.currentIndex = 0;
        state.currentTrack = tracks[0];
        state.isActive = true;
      } else {
        state.currentIndex = -1;
        state.currentTrack = null;
        state.isActive = false;
      }
    },

    navigateInContext: (state, action) => {
      const { direction } = action.payload;
      const tracks = getCurrentContextTracks(state);

      if (!tracks || tracks.length === 0) return;

      let newIndex;
      if (direction === "next") {
        if (state.shuffle && tracks.length > 1) {
          newIndex = getNextShuffleIndex(state.currentIndex, tracks.length);
        } else {
          newIndex =
            state.currentIndex === tracks.length - 1
              ? 0
              : state.currentIndex + 1;
        }
      } else {
        if (state.shuffle && tracks.length > 1) {
          newIndex = getNextShuffleIndex(state.currentIndex, tracks.length);
        } else {
          newIndex =
            state.currentIndex === 0
              ? tracks.length - 1
              : state.currentIndex - 1;
        }
      }

      state.currentIndex = newIndex;
      state.currentTrack = tracks[newIndex];

      if (state.activeContext !== "recently_played") {
        addToRecentlyPlayed(state, state.currentTrack);
      }
    },

    playTrack: (state, action) => {
      const { track, fromContext } = action.payload;

      if (fromContext === "recently_played") {
        state.activeContext = "recently_played";
        const index = state.recentlyPlayed.findIndex(
          (t) => getTrackId(t) === getTrackId(track)
        );
        state.currentIndex = index >= 0 ? index : 0;
      } else {
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

        addToRecentlyPlayed(state, track);
      }

      state.currentTrack = track;
      state.isActive = true;
      state.isPlaying = true;

      saveToStorage(StorageKeys.QUEUE, state.queue);
    },

    playFromContext: (state, action) => {
      const { contextType, trackIndex, playlistData, trackWithPreview } =
        action.payload;

      if (contextType === "album" && playlistData) {
        state.albumContext = {
          id: playlistData.id,
          name: playlistData.name,
          tracks: playlistData.tracks || [],
        };
      }

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
        if (trackWithPreview && trackWithPreview.preview_url) {
          tracks[trackIndex] = trackWithPreview;

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

        if (contextType !== "recently_played") {
          addToRecentlyPlayed(state, state.currentTrack);
        }
      }
    },

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

      if (contextType !== "recently_played") {
        addToRecentlyPlayed(state, tracks[startIndex]);
      }
    },

    addToQueue: (state, action) => {
      const { song, playNext = false } = action.payload;
      const trackId = getTrackId(song);

      const existingIndex = state.queue.findIndex(
        (t) => getTrackId(t) === trackId
      );
      if (existingIndex >= 0) {
        state.queue.splice(existingIndex, 1);
      }

      if (playNext && state.currentTrack) {
        const currentTrackId = getTrackId(state.currentTrack);
        const currentQueueIndex = state.queue.findIndex(
          (t) => getTrackId(t) === currentTrackId
        );

        if (currentQueueIndex >= 0) {
          state.queue.splice(currentQueueIndex + 1, 0, song);
        } else {
          state.queue.unshift(song);
        }
      } else {
        state.queue.push(song);
      }

      saveToStorage(StorageKeys.QUEUE, state.queue);
    },

    removeFromContext: (state, action) => {
      const { trackIndex } = action.payload;
      const context = state.activeContext;

      // Can't remove from these contexts
      if (
        context === "recently_played" ||
        context === "album" ||
        context === "community_playlist"
      ) {
        return;
      }

      if (context === "queue") {
        if (trackIndex >= 0 && trackIndex < state.queue.length) {
          state.queue.splice(trackIndex, 1);

          if (trackIndex < state.currentIndex) {
            state.currentIndex--;
          } else if (trackIndex === state.currentIndex) {
            if (state.queue.length === 0) {
              state.currentIndex = -1;
              state.currentTrack = null;
              state.isPlaying = false;
              state.isActive = false;
            } else {
              state.currentIndex = Math.min(
                state.currentIndex,
                state.queue.length - 1
              );
              state.currentTrack = state.queue[state.currentIndex];
            }
          }

          saveToStorage(StorageKeys.QUEUE, state.queue);
        }
      } else if (context.startsWith("playlist_")) {
        const playlist = state.playlists.find((p) => p.id === context);
        if (
          playlist &&
          trackIndex >= 0 &&
          trackIndex < playlist.tracks.length
        ) {
          playlist.tracks.splice(trackIndex, 1);

          if (trackIndex < state.currentIndex) {
            state.currentIndex--;
          } else if (trackIndex === state.currentIndex) {
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

    updateCurrentTrackPreview: (state, action) => {
      const { track } = action.payload;
      if (!track) return;

      state.currentTrack = track;

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

          default:
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
  const existingIndex = state.recentlyPlayed.findIndex(
    (t) => getTrackId(t) === trackId
  );

  if (existingIndex === 0) {
    return;
  } else if (existingIndex > 0) {
    state.recentlyPlayed.splice(existingIndex, 1);
  }

  state.recentlyPlayed.unshift(track);

  if (state.recentlyPlayed.length > 20) {
    state.recentlyPlayed = state.recentlyPlayed.slice(0, 20);
  }
}

function getNextShuffleIndex(currentIndex, tracksLength) {
  if (tracksLength <= 1) return 0;

  let newIndex;
  const maxAttempts = 50;
  let attempts = 0;

  do {
    newIndex = Math.floor(Math.random() * tracksLength);
    attempts++;
  } while (newIndex === currentIndex && attempts < maxAttempts);

  return newIndex;
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
