// Centralized selectors for player state
export const getTrackId = (track) => {
  return track?.key || track?.id || track?.track_id || track?.title;
};

export const selectCurrentContextTracks = (state) => {
  const { activeContext, queue, recentlyPlayed, communityPlaylist, playlists } =
    state.player;

  switch (activeContext) {
    case "queue":
      return queue;
    case "recently_played":
      return recentlyPlayed;
    case "community_playlist":
      return communityPlaylist?.tracks || [];
    default:
      if (activeContext.startsWith("playlist_")) {
        const playlist = playlists.find((p) => p.id === activeContext);
        return playlist?.tracks || [];
      }
      return [];
  }
};

export const selectCurrentContextName = (state) => {
  const { activeContext, communityPlaylist, playlists } = state.player;

  switch (activeContext) {
    case "queue":
      return "Your Queue";
    case "recently_played":
      return "Recently Played";
    case "community_playlist":
      return communityPlaylist?.name || "Community Playlist";
    default:
      if (activeContext.startsWith("playlist_")) {
        const playlist = playlists.find((p) => p.id === activeContext);
        return playlist?.name || "Unknown Playlist";
      }
      return "Unknown";
  }
};

export const selectCanModifyContext = (state) => {
  const { activeContext } = state.player;
  return activeContext === "queue" || activeContext.startsWith("playlist_");
};

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

export const selectAllContexts = (state) => {
  const { playlists, communityPlaylist } = state.player;

  const contexts = [
    {
      id: "queue",
      name: "Your Queue",
      type: "queue",
      trackCount: state.player.queue.length,
    },
    {
      id: "recently_played",
      name: "Recently Played",
      type: "recently_played",
      trackCount: state.player.recentlyPlayed.length,
    },
  ];

  if (communityPlaylist) {
    contexts.push({
      id: "community_playlist",
      name: communityPlaylist.name,
      type: "community_playlist",
      trackCount: communityPlaylist.tracks?.length || 0,
    });
  }

  playlists.forEach((playlist) => {
    contexts.push({
      id: playlist.id,
      name: playlist.name,
      type: "playlist",
      trackCount: playlist.tracks?.length || 0,
    });
  });

  return contexts;
};
