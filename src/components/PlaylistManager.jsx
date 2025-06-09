import { useState, useEffect } from "react";
import { usePlaylistManager } from "../hooks/usePlaylistManager";
import {
  HiX,
  HiPlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineMusicNote,
} from "react-icons/hi";
import { BsMusicNoteList } from "react-icons/bs";

const PlaylistManager = ({ isOpen, onClose }) => {
  const {
    playlists,
    handleCreatePlaylist,
    handleDeletePlaylist,
    handleRenamePlaylist,
    handleSwitchPlaylist,
  } = usePlaylistManager();
  const [isAnimating, setIsAnimating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(onClose, 300);
  };

  const handleCreate = () => {
    if (newPlaylistName.trim()) {
      handleCreatePlaylist(newPlaylistName.trim());
      setNewPlaylistName("");
      setIsCreating(false);
    }
  };

  const handleEdit = (playlist) => {
    setEditingId(playlist.id);
    setEditingName(playlist.name);
  };

  const handleSaveEdit = () => {
    if (editingName.trim() && editingId) {
      handleRenamePlaylist(editingId, editingName.trim());
      setEditingId(null);
      setEditingName("");
    }
  };

  const handleSelectPlaylist = (playlist) => {
    handleSwitchPlaylist(playlist.id, "playlist");
    handleClose();
  };

  const getMosaicImages = (playlist) => {
    const images = [];
    const tracks = playlist.tracks || [];

    for (let i = 0; i < 4; i++) {
      if (tracks[i]?.images?.coverart) {
        images.push(tracks[i].images.coverart);
      } else {
        images.push(null);
      }
    }

    return images;
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] transition-all duration-300 ${
          isAnimating ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      <div
        className={`fixed top-0 right-0 bottom-0 w-full max-w-md bg-gradient-to-br from-[#1e1b4b]/98 to-[#0f172a]/98 z-[101] shadow-2xl transition-all duration-300 ease-out transform ${
          isAnimating ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 bg-gradient-to-b from-white/5 to-transparent border-b border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                Manage Playlists
              </h2>
              <button
                onClick={handleClose}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
              >
                <HiX size={24} className="text-white" />
              </button>
            </div>

            {isCreating ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleCreate()}
                  placeholder="New playlist name..."
                  className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#14b8a6] focus:bg-white/15"
                  autoFocus
                />
                <button
                  onClick={handleCreate}
                  className="px-4 py-2 bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-lg font-medium transition-colors"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setNewPlaylistName("");
                  }}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsCreating(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#14b8a6] to-[#0d9488] hover:from-[#0d9488] hover:to-[#0891b2] text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-[#14b8a6]/25"
              >
                <HiPlus className="w-5 h-5" />
                Create New Playlist
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
            {playlists.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-[#14b8a6]/20 to-[#0d9488]/10 rounded-full flex items-center justify-center">
                  <BsMusicNoteList size={40} className="text-[#14b8a6]" />
                </div>
                <p className="text-white font-semibold text-lg mb-2">
                  No playlists yet
                </p>
                <p className="text-white/60 text-sm">
                  Create your first playlist to organize your favorite tracks
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {playlists.map((playlist) => {
                  const mosaicImages = getMosaicImages(playlist);
                  const hasImages = mosaicImages.some((img) => img !== null);

                  return (
                    <div
                      key={playlist.id}
                      className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-[#14b8a6]/40 transition-all duration-200 group"
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer shadow-lg hover:shadow-xl transition-shadow"
                          onClick={() => handleSelectPlaylist(playlist)}
                        >
                          {hasImages ? (
                            <div className="grid grid-cols-2 gap-0.5 w-full h-full">
                              {mosaicImages.map((image, index) => (
                                <div
                                  key={index}
                                  className="w-full h-full bg-white/10"
                                >
                                  {image ? (
                                    <img
                                      src={image}
                                      alt=""
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <HiOutlineMusicNote className="text-white/20" />
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[#14b8a6]/20 to-[#0d9488]/10 flex items-center justify-center">
                              <BsMusicNoteList
                                size={32}
                                className="text-[#14b8a6]"
                              />
                            </div>
                          )}
                        </div>

                        <div className="flex-1">
                          {editingId === playlist.id ? (
                            <div className="flex gap-2 mb-2">
                              <input
                                type="text"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                onKeyPress={(e) =>
                                  e.key === "Enter" && handleSaveEdit()
                                }
                                className="flex-1 px-3 py-1 bg-white/10 border border-white/20 rounded text-white text-lg focus:outline-none focus:border-[#14b8a6]"
                                autoFocus
                              />
                              <button
                                onClick={handleSaveEdit}
                                className="text-[#14b8a6] hover:text-[#0d9488]"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setEditingId(null);
                                  setEditingName("");
                                }}
                                className="text-white/60 hover:text-white"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <h3
                              className="text-white font-semibold text-lg mb-1 cursor-pointer hover:text-[#14b8a6] transition-colors"
                              onClick={() => handleSelectPlaylist(playlist)}
                            >
                              {playlist.name}
                            </h3>
                          )}
                          <p className="text-white/60 text-sm mb-3">
                            {playlist.tracks?.length || 0} tracks
                          </p>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSelectPlaylist(playlist)}
                              className="px-3 py-1.5 bg-[#14b8a6] hover:bg-[#0d9488] text-white text-sm rounded-lg font-medium transition-colors"
                            >
                              Play
                            </button>
                            <button
                              onClick={() => handleEdit(playlist)}
                              className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                            >
                              <HiOutlinePencil size={18} />
                            </button>
                            <button
                              onClick={() => handleDeletePlaylist(playlist.id)}
                              className="p-1.5 text-white/60 hover:text-red-400 hover:bg-white/10 rounded-lg transition-all"
                            >
                              <HiOutlineTrash size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default PlaylistManager;
