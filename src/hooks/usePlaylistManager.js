import { useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { getTrackId } from "../utils/trackUtils";
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
  const { playlists, activeContext, currentTrack, currentIndex } = useSelector(
    (state) => state.player
  );

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
      dispatch(deletePlaylist({ playlistId }));
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

  const handleSwitchContext = useCallback(
    (contextType) => {
      dispatch(switchContext({ contextType }));
    },
    [dispatch]
  );

  const handlePlayFromContext = useCallback(
    (contextType, trackIndex, playlistData = null) => {
      dispatch(playFromContext({ contextType, trackIndex, playlistData }));
    },
    [dispatch]
  );

  const isTrackInPlaylist = useCallback(
    (playlistId, trackId) => {
      const playlist = playlists.find((p) => p.id === playlistId);
      return playlist
        ? playlist.tracks.some((t) => getTrackId(t) === trackId)
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

  const getCurrentPlaylistData = useCallback(() => {
    if (activeContext === "queue") {
      return {
        id: "queue",
        name: "Your Queue",
        type: "queue",
      };
    } else if (activeContext === "recently_played") {
      return {
        id: "recently_played",
        name: "Recently Played",
        type: "recently_played",
      };
    } else if (activeContext === "community_playlist") {
      return {
        id: "community_playlist",
        name: "Community Playlist",
        type: "community_playlist",
      };
    } else if (activeContext.startsWith("playlist_")) {
      const playlist = playlists.find((p) => p.id === activeContext);
      return {
        id: activeContext,
        name: playlist?.name || "Unknown Playlist",
        type: "playlist",
      };
    } else if (activeContext === "album") {
      return {
        id: "album",
        name: "Album",
        type: "album",
      };
    }

    return {
      id: "queue",
      name: "Your Queue",
      type: "queue",
    };
  }, [activeContext, playlists]);

  const getAllPlaylists = useCallback(() => {
    return playlists.map((p) => ({
      ...p,
      type: "playlist",
      icon: "playlist",
    }));
  }, [playlists]);

  return {
    playlists,
    activeContext,
    currentPlaylist: getCurrentPlaylistData(),
    handleCreatePlaylist,
    handleDeletePlaylist,
    handleRenamePlaylist,
    handleAddToPlaylist,
    handleRemoveFromPlaylist,
    handleSwitchContext,
    handlePlayFromContext,
    isTrackInPlaylist,
    getPlaylistById,
    getAllPlaylists,
  };
};
