import { createSelector } from "@reduxjs/toolkit";

// Centralized selectors for player state
export const getTrackId = (track) => {
  return track?.key || track?.id || track?.track_id || track?.title;
};

// Base selectors
const selectPlayer = (state) => state.player;
const selectActiveContext = (state) => state.player.activeContext;
const selectQueue = (state) => state.player.queue;
const selectRecentlyPlayed = (state) => state.player.recentlyPlayed;
const selectAlbumContext = (state) => state.player.albumContext;
const selectCommunityPlaylist = (state) => state.player.communityPlaylist;
const selectPlaylists = (state) => state.player.playlists;

export const selectCurrentContextTracks = createSelector(
  [
    selectActiveContext,
    selectQueue,
    selectRecentlyPlayed,
    selectAlbumContext,
    selectCommunityPlaylist,
    selectPlaylists,
  ],
  (
    activeContext,
    queue,
    recentlyPlayed,
    albumContext,
    communityPlaylist,
    playlists
  ) => {
    switch (activeContext) {
      case "queue":
        return queue;
      case "recently_played":
        return recentlyPlayed;
      case "album":
        return albumContext?.tracks || [];
      case "community_playlist":
        return communityPlaylist?.tracks || [];
      default:
        if (activeContext.startsWith("playlist_")) {
          const playlist = playlists.find((p) => p.id === activeContext);
          return playlist?.tracks || [];
        }
        return [];
    }
  }
);

export const selectCurrentContextName = createSelector(
  [
    selectActiveContext,
    selectAlbumContext,
    selectCommunityPlaylist,
    selectPlaylists,
  ],
  (activeContext, albumContext, communityPlaylist, playlists) => {
    switch (activeContext) {
      case "queue":
        return "Your Queue";
      case "recently_played":
        return "Recently Played";
      case "album":
        return albumContext?.name || "Album";
      case "community_playlist":
        return communityPlaylist?.name || "Community Playlist";
      default:
        if (activeContext.startsWith("playlist_")) {
          const playlist = playlists.find((p) => p.id === activeContext);
          return playlist?.name || "Unknown Playlist";
        }
        return "Unknown";
    }
  }
);

export const selectCanModifyContext = createSelector(
  [selectActiveContext],
  (activeContext) => {
    // Can only modify queue and user playlists
    // Cannot modify: recently_played, album, community_playlist
    return activeContext === "queue" || activeContext.startsWith("playlist_");
  }
);

export const selectIsTrackInContext = (state, trackId, contextType = null) => {
  const context = contextType || state.player.activeContext;
  let tracks = [];

  switch (context) {
    case "queue":
      tracks = state.player.queue;
      break;
    case "recently_played":
      tracks = state.player.recentlyPlayed;
      break;
    case "album":
      tracks = state.player.albumContext?.tracks || [];
      break;
    case "community_playlist":
      tracks = state.player.communityPlaylist?.tracks || [];
      break;
    default:
      if (context.startsWith("playlist_")) {
        const playlist = state.player.playlists.find((p) => p.id === context);
        tracks = playlist?.tracks || [];
      }
  }

  return tracks.some((t) => getTrackId(t) === trackId);
};

// Memoized selector for all contexts
export const selectAllContexts = createSelector(
  [
    selectQueue,
    selectRecentlyPlayed,
    selectAlbumContext,
    selectCommunityPlaylist,
    selectPlaylists,
  ],
  (queue, recentlyPlayed, albumContext, communityPlaylist, playlists) => {
    const contexts = [];

    // Always include queue and recently played
    contexts.push({
      id: "queue",
      name: "Your Queue",
      type: "queue",
      trackCount: queue.length,
      icon: "queue",
    });

    contexts.push({
      id: "recently_played",
      name: "Recently Played",
      type: "recently_played",
      trackCount: recentlyPlayed.length,
      icon: "clock",
    });

    // Add album context if it exists
    if (albumContext && albumContext.tracks && albumContext.tracks.length > 0) {
      contexts.push({
        id: "album",
        name: albumContext.name,
        type: "album",
        trackCount: albumContext.tracks.length,
        icon: "music",
      });
    }

    // Add community playlist if it exists
    if (
      communityPlaylist &&
      communityPlaylist.tracks &&
      communityPlaylist.tracks.length > 0
    ) {
      contexts.push({
        id: "community_playlist",
        name: communityPlaylist.name,
        type: "community_playlist",
        trackCount: communityPlaylist.tracks.length,
        icon: "music",
      });
    }

    // Add user playlists
    playlists.forEach((playlist) => {
      contexts.push({
        id: playlist.id,
        name: playlist.name,
        type: "playlist",
        trackCount: playlist.tracks?.length || 0,
        icon: "music",
      });
    });

    return contexts;
  }
);
