import { useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  createPlaylist,
  deletePlaylist,
  renamePlaylist,
  addToPlaylist,
  removeFromPlaylist,
  switchPlaylist,
  reorderPlaylistTracks,
} from "../redux/features/playerSlice";

export const usePlaylistManager = () => {
  const dispatch = useDispatch();
  const {
    playlists,
    activePlaylistId,
    activePlaylistType,
    currentSongs,
    recentlyPlayed,
    // @ts-ignore - hide TS error
  } = useSelector((state) => state.player);

  // Create new playlist
  const handleCreatePlaylist = useCallback(
    (name) => {
      dispatch(createPlaylist({ name }));
      // Return the new playlist ID
      const newId = `playlist_${Date.now()}`;
      return newId;
    },
    [dispatch]
  );

  // Delete playlist
  const handleDeletePlaylist = useCallback(
    (playlistId) => {
      if (window.confirm("Are you sure you want to delete this playlist?")) {
        dispatch(deletePlaylist(playlistId));
      }
    },
    [dispatch]
  );

  // Rename playlist
  const handleRenamePlaylist = useCallback(
    (playlistId, newName) => {
      dispatch(renamePlaylist({ playlistId, name: newName }));
    },
    [dispatch]
  );

  // Add track to playlist
  const handleAddToPlaylist = useCallback(
    (playlistId, track) => {
      dispatch(addToPlaylist({ playlistId, track }));
    },
    [dispatch]
  );

  // Remove track from playlist
  const handleRemoveFromPlaylist = useCallback(
    (playlistId, trackId) => {
      dispatch(removeFromPlaylist({ playlistId, trackId }));
    },
    [dispatch]
  );

  // Switch active playlist
  const handleSwitchPlaylist = useCallback(
    (playlistId, playlistType) => {
      dispatch(switchPlaylist({ playlistId, playlistType }));
    },
    [dispatch]
  );

  // Reorder tracks in playlist
  const handleReorderTracks = useCallback(
    (playlistId, fromIndex, toIndex) => {
      dispatch(reorderPlaylistTracks({ playlistId, fromIndex, toIndex }));
    },
    [dispatch]
  );

  // Get current playlist data
  const getCurrentPlaylistData = useCallback(() => {
    if (activePlaylistType === "queue") {
      return {
        id: "queue",
        name: "Your Queue",
        tracks: currentSongs,
        type: "queue",
      };
    } else if (activePlaylistType === "recent") {
      return {
        id: "recent",
        name: "Recently Played",
        tracks: recentlyPlayed,
        type: "recent",
      };
    } else if (activePlaylistType === "playlist") {
      const playlist = playlists.find((p) => p.id === activePlaylistId);
      return playlist
        ? { ...playlist, type: "playlist" }
        : {
            id: "queue",
            name: "Your Queue",
            tracks: currentSongs,
            type: "queue",
          };
    }
    return {
      id: "queue",
      name: "Your Queue",
      tracks: currentSongs,
      type: "queue",
    };
  }, [
    activePlaylistType,
    activePlaylistId,
    currentSongs,
    recentlyPlayed,
    playlists,
  ]);

  // Check if track is in playlist
  const isTrackInPlaylist = useCallback(
    (playlistId, trackId) => {
      const playlist = playlists.find((p) => p.id === playlistId);
      return playlist
        ? playlist.tracks.some((t) => (t.key || t.id) === trackId)
        : false;
    },
    [playlists]
  );

  // Get playlist by ID
  const getPlaylistById = useCallback(
    (playlistId) => {
      return playlists.find((p) => p.id === playlistId);
    },
    [playlists]
  );

  // Get all playlists with metadata
  const getAllPlaylists = useCallback(() => {
    return [
      {
        id: "queue",
        name: "Your Queue",
        tracks: currentSongs,
        type: "queue",
        icon: "queue",
      },
      {
        id: "recent",
        name: "Recently Played",
        tracks: recentlyPlayed,
        type: "recent",
        icon: "history",
      },
      ...playlists.map((p) => ({ ...p, type: "playlist", icon: "playlist" })),
    ];
  }, [playlists, currentSongs, recentlyPlayed]);

  return {
    playlists,
    activePlaylistId,
    activePlaylistType,
    currentPlaylist: getCurrentPlaylistData(),
    handleCreatePlaylist,
    handleDeletePlaylist,
    handleRenamePlaylist,
    handleAddToPlaylist,
    handleRemoveFromPlaylist,
    handleSwitchPlaylist,
    handleReorderTracks,
    isTrackInPlaylist,
    getPlaylistById,
    getAllPlaylists,
  };
};
