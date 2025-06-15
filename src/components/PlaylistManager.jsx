import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { usePlaylistManager } from "../hooks/usePlaylistManager";
import {
  HiX,
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineCheck,
} from "react-icons/hi";
import { BsMusicNoteList } from "react-icons/bs";

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

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#1e1b4b]/98 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 z-50 animate-scaleIn">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">Manage Playlists</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-all"
          >
            <HiX className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[400px] overflow-y-auto custom-scrollbar">
          {/* Create New Playlist */}
          {creatingNew ? (
            <div className="flex items-center gap-2 mb-4">
              <input
                type="text"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleCreate()}
                placeholder="Playlist name..."
                className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#14b8a6]"
                autoFocus
              />
              <button
                onClick={handleCreate}
                className="p-2 bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-lg transition-all"
              >
                <HiOutlineCheck className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  setCreatingNew(false);
                  setNewPlaylistName("");
                }}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
              >
                <HiX className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setCreatingNew(true)}
              className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-[#14b8a6]/20 to-transparent hover:from-[#14b8a6]/30 border border-[#14b8a6]/40 rounded-lg text-white mb-4 transition-all"
            >
              <HiOutlinePlus className="w-5 h-5 text-[#14b8a6]" />
              <span className="font-medium">Create New Playlist</span>
            </button>
          )}

          {/* Playlists List */}
          {playlists.length === 0 ? (
            <div className="text-center py-8">
              <BsMusicNoteList className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <p className="text-white/60">No playlists yet</p>
              <p className="text-white/40 text-sm mt-2">
                Create your first playlist to organize your music
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {playlists.map((playlist) => (
                <div
                  key={playlist.id}
                  className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-all group"
                >
                  {editingId === playlist.id ? (
                    <>
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyPress={(e) =>
                          e.key === "Enter" && handleEdit(playlist.id)
                        }
                        className="flex-1 px-3 py-1 bg-white/10 border border-white/20 rounded text-white focus:outline-none focus:border-[#14b8a6]"
                        autoFocus
                      />
                      <button
                        onClick={() => handleEdit(playlist.id)}
                        className="p-1.5 text-[#14b8a6] hover:bg-white/10 rounded"
                      >
                        <HiOutlineCheck className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditingName("");
                        }}
                        className="p-1.5 text-white/60 hover:bg-white/10 rounded"
                      >
                        <HiX className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <BsMusicNoteList className="w-5 h-5 text-white/60" />
                      <div className="flex-1">
                        <p className="text-white font-medium">
                          {playlist.name}
                        </p>
                        <p className="text-white/40 text-sm">
                          {playlist.tracks?.length || 0} tracks
                        </p>
                      </div>
                      <button
                        onClick={() => handleStartEdit(playlist)}
                        className="p-1.5 text-white/60 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <HiOutlinePencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePlaylist(playlist.id)}
                        className="p-1.5 text-white/60 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <HiOutlineTrash className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </>
  );
};

export default PlaylistManager;
