import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { usePlaylistManager } from "../hooks/usePlaylistManager";
import Portal from "./Portal";
import { HiX, HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineCheck } from "react-icons/hi";
import { BsMusicNoteList } from "react-icons/bs";
import ConfirmDialog from "./ConfirmDialog";

const PlaylistManager = ({ isOpen, onClose, onPlaylistClick }) => {
  const dispatch = useDispatch();
  const { playlists } = useSelector((state) => state.player);
  const { handleCreatePlaylist, handleDeletePlaylist, handleRenamePlaylist, handleSwitchContext } =
    usePlaylistManager();

  const [creatingNew, setCreatingNew] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [playlistToDelete, setPlaylistToDelete] = useState(null);

  useEffect(() => {
    if (isOpen) {
      // First render the portal
      setIsVisible(true);
      // Use a small timeout to ensure the DOM is ready before animating
      const timer = setTimeout(() => {
        setIsAnimating(true);
      }, 10); // Small delay to ensure render
      return () => clearTimeout(timer);
    } else {
      // Animate out first
      setIsAnimating(false);
      // Then remove from DOM after animation completes
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleCreate = () => {
    if (newPlaylistName.trim()) {
      handleCreatePlaylist(newPlaylistName.trim());
      setNewPlaylistName("");
      setCreatingNew(false);
    }
  };

  const handleEdit = (playlistId) => {
    if (editingName.trim()) {
      handleRenamePlaylist(playlistId, editingName.trim());
      setEditingId(null);
      setEditingName("");
    }
  };

  const handleStartEdit = (playlist) => {
    setEditingId(playlist.id);
    setEditingName(playlist.name);
  };

  const handleBackdropClick = () => {
    onClose();
  };

  const handleDeleteConfirm = () => {
    if (playlistToDelete) {
      handleDeletePlaylist(playlistToDelete.id);
      setPlaylistToDelete(null);
      setShowDeleteDialog(false);
    }
  };

  const handlePlaylistItemClick = (playlist) => {
    console.log("handlePlaylistItemClick called with:", playlist);
    if (onPlaylistClick) {
      console.log("Calling onPlaylistClick with ID:", playlist.id);
      onPlaylistClick(playlist.id);
    } else {
      console.log("No onPlaylistClick handler, switching context");
      handleSwitchContext(playlist.id);
    }
  };

  if (!isVisible) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[60] flex">
        {/* Backdrop */}
        {!showDeleteDialog && (
          <div
            className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
              isAnimating ? "opacity-100" : "opacity-0"
            }`}
            onClick={handleBackdropClick}
          />
        )}

        {/* Panel - Match SidebarPlayer width of 380px */}
        <div
          className="absolute right-0 top-0 h-full w-[380px]"
          style={{
            transform: isAnimating ? "translate3d(0, 0, 0)" : "translate3d(100%, 0, 0)",
            transition: "transform 300ms cubic-bezier(0.4, 0, 0.2, 1)",
            willChange: "transform",
          }}
        >
          <div className="h-full bg-gradient-to-b from-[#1e1b4b]/98 to-[#0f0e2e]/98 backdrop-blur-xl shadow-2xl border-l border-white/10">
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h2 className="text-2xl font-bold text-white">Manage Playlists</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-white/10 transition-all duration-200 group"
                >
                  <HiX className="w-6 h-6 text-white/70 group-hover:text-white transition-colors" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 p-6 overflow-y-auto custom-scrollbar overscroll-contain">
                {/* Create New Playlist */}
                {creatingNew ? (
                  <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
                    <h3 className="text-white font-medium mb-3">Create New Playlist</h3>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newPlaylistName}
                        onChange={(e) => setNewPlaylistName(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleCreate()}
                        placeholder="Playlist name..."
                        className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg 
                          text-white placeholder-white/40 focus:outline-none focus:border-[#14b8a6] 
                          transition-colors"
                        autoFocus
                      />
                      <button
                        onClick={handleCreate}
                        disabled={!newPlaylistName.trim()}
                        className="p-2 bg-[#14b8a6] text-white rounded-lg hover:bg-[#0d9488] 
                          transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <HiOutlineCheck className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          setCreatingNew(false);
                          setNewPlaylistName("");
                        }}
                        className="p-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                      >
                        <HiX className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setCreatingNew(true)}
                    className="w-full mb-6 flex items-center gap-3 px-4 py-3 bg-[#14b8a6]/10 
                      border border-[#14b8a6]/30 rounded-xl hover:bg-[#14b8a6]/20 
                      hover:border-[#14b8a6]/50 transition-all duration-200 group"
                  >
                    <HiOutlinePlus className="w-5 h-5 text-[#14b8a6] group-hover:text-[#22d3b7]" />
                    <span className="text-[#14b8a6] group-hover:text-[#22d3b7] font-medium">Create New Playlist</span>
                  </button>
                )}

                {/* Existing Playlists */}
                <div>
                  <h3 className="text-white/60 text-sm uppercase tracking-wider mb-4">
                    Your Playlists ({playlists.length})
                  </h3>

                  {playlists.length === 0 ? (
                    <div className="text-center py-12">
                      <BsMusicNoteList className="w-20 h-20 text-white/20 mx-auto mb-4 animate-pulse" />
                      <p className="text-white/60 text-lg mb-2">No playlists yet</p>
                      <p className="text-white/40 text-sm">Create your first playlist to organize your music</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {playlists.map((playlist, index) => (
                        <div
                          key={playlist.id}
                          className="group bg-white/5 hover:bg-white/10 rounded-xl p-4 transition-all duration-200 cursor-pointer"
                          onClick={() => {
                            console.log("Playlist div clicked:", playlist.id);
                            handlePlaylistItemClick(playlist);
                          }}
                          style={{
                            animation: isAnimating
                              ? `slideInRight ${300 + index * 50}ms cubic-bezier(0.4, 0, 0.2, 1) forwards`
                              : "none",
                            opacity: isAnimating ? 1 : 0,
                          }}
                        >
                          {editingId === playlist.id ? (
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="text"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === "Enter") handleEdit(playlist.id);
                                }}
                                className="flex-1 px-3 py-1.5 bg-white/10 border border-white/20 
                                  rounded-lg text-white focus:outline-none focus:border-[#14b8a6] 
                                  transition-colors"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                              />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(playlist.id);
                                }}
                                className="p-1.5 bg-[#14b8a6] text-white rounded-lg hover:bg-[#0d9488] transition-colors"
                              >
                                <HiOutlineCheck className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingId(null);
                                  setEditingName("");
                                }}
                                className="p-1.5 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                              >
                                <HiX className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <BsMusicNoteList className="w-5 h-5 text-[#14b8a6] flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-white font-medium truncate">{playlist.name}</h4>
                                  <p className="text-white/60 text-sm">
                                    {playlist.tracks.length} {playlist.tracks.length === 1 ? "track" : "tracks"}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartEdit(playlist);
                                  }}
                                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                                  title="Rename playlist"
                                >
                                  <HiOutlinePencil className="w-4 h-4 text-white/70" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPlaylistToDelete(playlist);
                                    setShowDeleteDialog(true);
                                  }}
                                  className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
                                  title="Delete playlist"
                                >
                                  <HiOutlineTrash className="w-4 h-4 text-white/70 hover:text-red-400" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <ConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={handleDeleteConfirm}
          title="Delete Playlist"
          message={`Are you sure you want to delete "${playlistToDelete?.name}"? This action cannot be undone.`}
          confirmText="Delete"
          isDestructive
        />
      </div>
    </Portal>
  );
};

export default PlaylistManager;
