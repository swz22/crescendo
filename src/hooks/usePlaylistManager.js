import { useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  createPlaylist,
  deletePlaylist,
  renamePlaylist,
  addToPlaylist,
  removeFromPlaylist,
  switchContext,
  playFromContext,
} from "../redux/features/playerSlice";

export const usePlaylistManager = () => {
  const dispatch = useDispatch();
  const { playlists, activeContext, contexts, activeCommunityPlaylist } =
    useSelector((state) => state.player);

  const handleCreatePlaylist = useCallback(
    (name) => {
      const newId = `playlist_${Date.now()}`;
      dispatch(createPlaylist({ name, id: newId }));
      return newId;
    },
    [dispatch]
  );

  const handleDeletePlaylist = useCallback(
    (playlistId) => {
      if (window.confirm("Are you sure you want to delete this playlist?")) {
        dispatch(deletePlaylist(playlistId));
      }
    },
    [dispatch]
  );

  const handleRenamePlaylist = useCallback(
    (playlistId, newName) => {
      dispatch(renamePlaylist({ playlistId, name: newName }));
    },
    [dispatch]
  );

  const handleAddToPlaylist = useCallback(
    (playlistId, track) => {
      dispatch(addToPlaylist({ playlistId, track }));
    },
    [dispatch]
  );

  const handleRemoveFromPlaylist = useCallback(
    (playlistId, trackId) => {
      dispatch(removeFromPlaylist({ playlistId, trackId }));
    },
    [dispatch]
  );

  const handleSwitchPlaylist = useCallback(
    (contextId, contextType) => {
      dispatch(switchContext({ contextType: contextId }));
    },
    [dispatch]
  );

  const handlePlayFromContext = useCallback(
    (contextType, trackIndex, playlistData = null) => {
      dispatch(playFromContext({ contextType, trackIndex, playlistData }));
    },
    [dispatch]
  );

  const getCurrentPlaylistData = useCallback(() => {
    if (activeContext === "community_playlist") {
      return {
        id: "community_playlist",
        name: activeCommunityPlaylist?.name || "Community Playlist",
        tracks: activeCommunityPlaylist?.tracks || [],
        type: "community_playlist",
      };
    }

    const context = contexts[activeContext];
    if (!context) {
      return {
        id: "queue",
        name: "Your Queue",
        tracks: [],
        type: "queue",
      };
    }

    return {
      id: activeContext,
      name: context.name,
      tracks: context.tracks,
      type:
        activeContext === "queue"
          ? "queue"
          : activeContext === "recently_played"
          ? "recently_played"
          : "playlist",
    };
  }, [activeContext, contexts, activeCommunityPlaylist]);

  const isTrackInPlaylist = useCallback(
    (playlistId, trackId) => {
      const playlist = playlists.find((p) => p.id === playlistId);
      return playlist
        ? playlist.tracks.some((t) => (t.key || t.id || t.track_id) === trackId)
        : false;
    },
    [playlists]
  );

  const getPlaylistById = useCallback(
    (playlistId) => {
      return playlists.find((p) => p.id === playlistId);
    },
    [playlists]
  );

  const getAllPlaylists = useCallback(() => {
    const queueContext = contexts.queue || { tracks: [] };
    const recentContext = contexts.recently_played || { tracks: [] };

    return [
      {
        id: "queue",
        name: "Your Queue",
        tracks: queueContext.tracks,
        type: "queue",
        icon: "queue",
      },
      {
        id: "recently_played",
        name: "Recently Played",
        tracks: recentContext.tracks,
        type: "recently_played",
        icon: "history",
      },
      ...playlists.map((p) => ({
        ...p,
        type: "playlist",
        icon: "playlist",
        tracks: contexts[p.id]?.tracks || p.tracks || [],
      })),
    ];
  }, [playlists, contexts]);

  return {
    playlists,
    activePlaylistId: activeContext,
    activePlaylistType: activeContext,
    currentPlaylist: getCurrentPlaylistData(),
    handleCreatePlaylist,
    handleDeletePlaylist,
    handleRenamePlaylist,
    handleAddToPlaylist,
    handleRemoveFromPlaylist,
    handleSwitchPlaylist,
    handlePlayFromContext,
    isTrackInPlaylist,
    getPlaylistById,
    getAllPlaylists,
  };
};
