import { createSlice } from "@reduxjs/toolkit";

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
  currentSongs: [],
  currentIndex: 0,
  isActive: false,
  isPlaying: false,
  activeSong: {},
  genreListId: "POP",
  recentlyPlayed: [],
  isModalOpen: false,
  playlistContext: null,
  currentPlaylist: null,
  shuffle: false,
  shuffleIndices: [],
  playedIndices: [],
  repeat: false,
  // New playlist management state
  playlists: loadPlaylistsFromStorage(),
  activePlaylistId: null,
  activePlaylistType: "queue", // "queue", "playlist", "recent"
};

const playerSlice = createSlice({
  name: "player",
  initialState,
  reducers: {
    // Existing reducers remain the same
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

      // Set current playlist if provided
      if (action.payload.playlist) {
        state.currentPlaylist = action.payload.playlist;
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

    // New playlist management actions
    createPlaylist: (state, action) => {
      const newPlaylist = {
        id: `playlist_${Date.now()}`,
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
  // New exports
  createPlaylist,
  deletePlaylist,
  renamePlaylist,
  addToPlaylist,
  removeFromPlaylist,
  switchPlaylist,
  reorderPlaylistTracks,
} = playerSlice.actions;

export default playerSlice.reducer;
