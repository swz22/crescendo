import { useState, useRef } from "react";
import { useDispatch } from "react-redux";
import { usePlaylistManager } from "../hooks/usePlaylistManager";
import { usePreviewUrl } from "../hooks/usePreviewUrl";
import { replaceContext } from "../redux/features/playerSlice";
import { BsMusicNoteList, BsThreeDots, BsPlayFill } from "react-icons/bs";
import { HiOutlinePencil, HiOutlineTrash, HiX, HiCheck } from "react-icons/hi";
import { useToast } from "../context/ToastContext";
import ConfirmDialog from "./ConfirmDialog";
import { Icon } from "@iconify/react";

const UserPlaylistCard = ({ playlist, onClick }) => {
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const { handleDeletePlaylist, handleRenamePlaylist } = usePlaylistManager();
  const { getPreviewUrl } = usePreviewUrl();

  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(playlist.name);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const menuRef = useRef(null);
  const inputRef = useRef(null);

  const isEmpty = playlist.tracks.length === 0;

  const getMosaicImages = () => {
    if (isEmpty) return [];

    const images = [];
    const seenAlbums = new Set();

    for (const track of playlist.tracks) {
      const albumId = track.album?.id;
      const albumArt = track.album?.images?.[0]?.url || track.images?.coverart;

      if (albumArt && (!albumId || !seenAlbums.has(albumId))) {
        images.push(albumArt);
        if (albumId) seenAlbums.add(albumId);
        if (images.length === 4) break;
      }
    }

    return images;
  };

  const mosaicImages = getMosaicImages();
  const placeholderImage = null;

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const handlePlayClick = async (e) => {
    e.stopPropagation();
    if (isEmpty) {
      showToast("Playlist is empty", "error");
      return;
    }

    const firstTrack = await getPreviewUrl(playlist.tracks[0]);

    if (firstTrack?.preview_url) {
      const updatedTracks = [...playlist.tracks];
      updatedTracks[0] = firstTrack;

      dispatch(
        replaceContext({
          contextType: playlist.id,
          tracks: updatedTracks,
          startIndex: 0,
          playlistData: {
            id: playlist.id,
            name: playlist.name,
          },
        })
      );

      showToast(`Playing ${playlist.name}`);
    } else {
      showToast("No preview available", "error");
    }
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    setIsEditing(true);
    setShowMenu(false);
    setTimeout(() => inputRef.current?.select(), 50);
  };

  const handleSaveEdit = () => {
    if (editName.trim() && editName !== playlist.name) {
      handleRenamePlaylist(playlist.id, editName.trim());
      showToast("Playlist renamed");
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditName(playlist.name);
    setIsEditing(false);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    handleDeletePlaylist(playlist.id);
    showToast("Playlist deleted");
    setShowDeleteDialog(false);
  };

  return (
    <>
      <div
        onClick={!isEditing ? onClick : undefined}
        className={`group relative flex flex-col p-4 rounded-xl bg-white/[0.03] backdrop-blur-sm 
          hover:bg-white/[0.08] border border-white/10 hover:border-white/20 
          transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-black/20
          hover:transform hover:scale-[1.02] ${isEmpty ? "opacity-90" : ""}`}
      >
        {/* Playlist Image */}
        <div className="relative aspect-square rounded-lg overflow-hidden mb-4 bg-gradient-to-br from-gray-800 to-gray-900">
          {isEmpty ? (
            // Empty Playlist Design
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#2d2467]/40 to-[#1a1848]/60">
              <Icon icon="solar:playlist-minimalistic-2-bold-duotone" className="w-20 h-20 text-white/20" />
            </div>
          ) : mosaicImages.length === 4 ? (
            <div className="grid grid-cols-2 gap-0.5 h-full">
              {mosaicImages.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              ))}
            </div>
          ) : mosaicImages.length > 0 ? (
            <img
              src={mosaicImages[0]}
              alt={playlist.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          ) : (
            // Fallback if no images
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
              <BsMusicNoteList className="w-16 h-16 text-white/20" />
            </div>
          )}

          {/* Play button */}
          <button
            onClick={handlePlayClick}
            className={`absolute bottom-2 right-2 p-3 bg-[#14b8a6] rounded-full shadow-lg
              transform translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100
              transition-all duration-300 hover:scale-110 hover:bg-[#0d9488]
              ${isEmpty ? "opacity-50 cursor-not-allowed" : ""}`}
            disabled={isEmpty}
          >
            <BsPlayFill className="w-6 h-6 text-white ml-0.5" />
          </button>
        </div>

        {/* Playlist Info */}
        <div className="flex-1">
          {isEditing ? (
            <div className="flex items-center gap-2 mb-2">
              <input
                ref={inputRef}
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveEdit();
                  if (e.key === "Escape") handleCancelEdit();
                }}
                className="flex-1 bg-white/10 text-white px-2 py-1 rounded text-sm
                  border border-white/20 focus:border-[#14b8a6] focus:outline-none"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSaveEdit();
                }}
                className="p-1 hover:bg-white/10 rounded transition-colors"
              >
                <HiCheck className="w-4 h-4 text-[#14b8a6]" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCancelEdit();
                }}
                className="p-1 hover:bg-white/10 rounded transition-colors"
              >
                <HiX className="w-4 h-4 text-red-500" />
              </button>
            </div>
          ) : (
            <h3 className="font-semibold text-white truncate mb-1 group-hover:text-[#14b8a6] transition-colors">
              {playlist.name}
            </h3>
          )}

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">
                {playlist.tracks.length} {playlist.tracks.length === 1 ? "track" : "tracks"}
              </p>
              <p className="text-xs text-gray-500 mt-1">{formatDate(playlist.createdAt)}</p>
            </div>

            {/* Menu Button */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="p-2 rounded-full hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
              >
                <BsThreeDots className="w-4 h-4 text-gray-400" />
              </button>

              {/* Dropdown Menu */}
              {showMenu && (
                <div className="absolute right-0 bottom-full mb-2 w-48 bg-[#1a1848] rounded-lg shadow-xl border border-white/10 overflow-hidden z-50">
                  <button
                    onClick={handleEditClick}
                    className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-3"
                  >
                    <HiOutlinePencil className="w-4 h-4" />
                    Rename
                  </button>
                  <button
                    onClick={handleDeleteClick}
                    className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-red-400 transition-colors flex items-center gap-3"
                  >
                    <HiOutlineTrash className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Playlist"
        message={`Are you sure you want to delete "${playlist.name}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="danger"
      />
    </>
  );
};

export default UserPlaylistCard;
