import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { usePlaylistManager } from "../hooks/usePlaylistManager";
import Portal from "./Portal";
import {
  HiX,
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineCheck,
} from "react-icons/hi";
import { BsMusicNoteList } from "react-icons/bs";
import ConfirmDialog from "./ConfirmDialog";

const PlaylistManager = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { playlists } = useSelector((state) => state.player);
  const {
    handleCreatePlaylist,
    handleDeletePlaylist,
    handleRenamePlaylist,
    handleSwitchContext,
  } = usePlaylistManager();

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
            transform: isAnimating
              ? "translate3d(0, 0, 0)"
              : "translate3d(100%, 0, 0)",
            transition: "transform 300ms cubic-bezier(0.4, 0, 0.2, 1)",
            willChange: "transform",
          }}
        >
          <div className="h-full bg-gradient-to-b from-[#1e1b4b]/98 to-[#0f0e2e]/98 backdrop-blur-xl shadow-2xl border-l border-white/10">
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h2 className="text-2xl font-bold text-white">
                  Manage Playlists
                </h2>
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
                  <div className="flex items-center gap-2 mb-6">
                    <input
                      type="text"
                      value={newPlaylistName}
                      onChange={(e) => setNewPlaylistName(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleCreate()}
                      placeholder="Playlist name..."
                      className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#14b8a6] focus:bg-white/15 transition-all"
                      autoFocus
                    />
                    <button
                      onClick={handleCreate}
                      disabled={!newPlaylistName.trim()}
                      className="p-3 bg-[#14b8a6] hover:bg-[#0d9488] disabled:bg-white/10 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200"
                    >
                      <HiOutlineCheck className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        setCreatingNew(false);
                        setNewPlaylistName("");
                      }}
                      className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200"
                    >
                      <HiX className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setCreatingNew(true)}
                    className="w-full flex items-center gap-3 px-4 py-4 bg-gradient-to-r from-[#14b8a6]/20 to-transparent border border-[#14b8a6]/40 hover:border-[#14b8a6]/60 rounded-xl text-white mb-6 transition-all duration-200 group hover:shadow-[0_0_20px_rgba(20,184,166,0.2)]"
                  >
                    <div className="p-2 bg-[#14b8a6]/20 rounded-lg transition-colors">
                      <HiOutlinePlus className="w-5 h-5 text-[#14b8a6] group-hover:text-[#22d3b7] transition-colors" />
                    </div>
                    <span className="font-medium text-lg">
                      Create New Playlist
                    </span>
                  </button>
                )}

                {/* Playlists List */}
                {playlists.length === 0 ? (
                  <div className="text-center py-12">
                    <BsMusicNoteList className="w-20 h-20 text-white/20 mx-auto mb-4 animate-pulse" />
                    <p className="text-white/60 text-lg mb-2">
                      No playlists yet
                    </p>
                    <p className="text-white/40 text-sm">
                      Create your first playlist to organize your music
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {playlists.map((playlist, index) => (
                      <div
                        key={playlist.id}
                        className="group bg-white/5 hover:bg-white/10 rounded-xl p-4 transition-all duration-200"
                        style={{
                          animation: isAnimating
                            ? `slideInRight ${
                                300 + index * 50
                              }ms cubic-bezier(0.4, 0, 0.2, 1) forwards`
                            : "none",
                          opacity: isAnimating ? 1 : 0,
                        }}
                      >
                        {editingId === playlist.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyPress={(e) =>
                                e.key === "Enter" && handleEdit(playlist.id)
                              }
                              className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#14b8a6] transition-all"
                              autoFocus
                            />
                            <button
                              onClick={() => handleEdit(playlist.id)}
                              className="p-2 bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-lg transition-all"
                            >
                              <HiOutlineCheck className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingId(null);
                                setEditingName("");
                              }}
                              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
                            >
                              <HiX className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div
                              className="flex-1 cursor-pointer group"
                              onClick={() => {
                                handleSwitchContext(`playlist_${playlist.id}`);
                                onClose();
                              }}
                            >
                              <h3 className="font-medium text-white text-lg mb-1 group-hover:text-[#14b8a6] transition-colors">
                                {playlist.name}
                              </h3>
                              <p className="text-sm text-white/60">
                                {playlist.tracks.length}{" "}
                                {playlist.tracks.length === 1
                                  ? "track"
                                  : "tracks"}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                              <button
                                onClick={() => handleStartEdit(playlist)}
                                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
                                title="Rename playlist"
                              >
                                <HiOutlinePencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setPlaylistToDelete(playlist);
                                  setShowDeleteDialog(true);
                                }}
                                className="p-2 bg-white/10 hover:bg-red-500/20 text-white hover:text-red-400 rounded-lg transition-all"
                                title="Delete playlist"
                              >
                                <HiOutlineTrash className="w-4 h-4" />
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
      {playlistToDelete && (
        <ConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => {
            setShowDeleteDialog(false);
            setPlaylistToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
          title={`Delete "${playlistToDelete.name}"?`}
          message="This playlist will be permanently deleted. All tracks will be removed from this playlist."
          confirmText="Delete Playlist"
          cancelText="Cancel"
          variant="danger"
          icon={HiOutlineTrash}
          details={[
            `${playlistToDelete.tracks.length} tracks will be removed from this playlist`,
            "The songs themselves won't be deleted",
            "This action cannot be undone",
          ]}
        />
      )}
    </Portal>
  );
};

export default PlaylistManager;
