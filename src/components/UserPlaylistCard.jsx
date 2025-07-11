import { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { usePlaylistManager } from "../hooks/usePlaylistManager";
import { usePreviewUrl } from "../hooks/usePreviewUrl";
import { replaceContext, playPause } from "../redux/features/playerSlice";
import { BsMusicNoteList, BsPlayFill, BsPauseFill } from "react-icons/bs";
import { HiOutlinePencil, HiOutlineTrash, HiX, HiCheck, HiDotsVertical } from "react-icons/hi";
import { useToast } from "../context/ToastContext";
import ConfirmDialog from "./ConfirmDialog";
import { Icon } from "@iconify/react";
import { isSameTrack } from "../utils/trackUtils";

const UserPlaylistCard = ({ playlist, onClick }) => {
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const { handleDeletePlaylist, handleRenamePlaylist } = usePlaylistManager();
  const { getPreviewUrl } = usePreviewUrl();
  const { isPlaying, activeContext, currentTrack } = useSelector((state) => state.player);
  const isPlaylistPlaying = isPlaying && activeContext === playlist.id;
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(playlist.name);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const menuRef = useRef(null);
  const inputRef = useRef(null);
  const menuButtonRef = useRef(null);

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(event.target)
      ) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

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

    if (isPlaylistPlaying) {
      dispatch(playPause(false));
      return;
    }

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
        className={`group relative flex flex-col p-3 rounded-xl bg-white/[0.03] backdrop-blur-sm 
          hover:bg-white/[0.08] border border-white/10 hover:border-white/20 
          transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-black/20
          hover:transform hover:scale-[1.02] ${isEmpty ? "opacity-90" : ""}`}
      >
        {/* Playlist Image */}
        <div
          onClick={!isEditing ? onClick : undefined}
          className="relative aspect-square rounded-lg overflow-hidden mb-2.5 bg-gradient-to-br from-gray-800 to-gray-900 cursor-pointer"
        >
          {isEmpty ? (
            // Empty Playlist Design
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#2d2467]/40 to-[#1a1848]/60">
              <Icon icon="solar:playlist-minimalistic-2-bold-duotone" className="w-16 h-16 text-white/20" />
            </div>
          ) : mosaicImages.length === 4 ? (
            // 4-image mosaic
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
            // Single image
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
              <BsMusicNoteList className="w-14 h-14 text-white/20" />
            </div>
          )}

          {/* Play button */}
          {!isEmpty && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePlayClick(e);
              }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-2.5 bg-[#14b8a6]/90 rounded-full shadow-lg shadow-black/25 opacity-100 scale-100 transition-all duration-300 hover:scale-110 hover:bg-[#0d9488]/90 z-10 flex items-center justify-center"
              aria-label="Play playlist"
            >
              {isPlaylistPlaying ? (
                <BsPauseFill className="w-5 h-5 text-white" />
              ) : (
                <BsPlayFill className="w-5 h-5 text-white" style={{ marginLeft: "2px" }} />
              )}
            </button>
          )}
        </div>

        {/* Playlist Info */}
        <div onClick={!isEditing ? onClick : undefined} className="flex-1 cursor-pointer">
          {isEditing ? (
            <div className="mb-1.5 relative">
              <input
                ref={inputRef}
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveEdit();
                  if (e.key === "Escape") handleCancelEdit();
                }}
                className="w-full bg-white/10 text-white px-2 py-1 sm:pr-20 rounded text-sm
                  border border-white/20 focus:border-[#14b8a6] focus:outline-none"
                onClick={(e) => e.stopPropagation()}
              />
              {/* Checkmark and X buttons for rename - Mobile*/}
              <div className="flex items-center justify-end gap-1 mt-0.5 sm:hidden">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSaveEdit();
                  }}
                  className="p-0 hover:opacity-80 transition-opacity flex items-center justify-center"
                >
                  <HiCheck className="w-4 h-4 text-[#14b8a6]" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCancelEdit();
                  }}
                  className="p-0 hover:opacity-80 transition-opacity flex items-center justify-center"
                >
                  <HiX className="w-4 h-4 text-red-500 mt-[1px]" />
                </button>
              </div>
              {/* Checkmark and X buttons for rename - Desktop*/}
              <div className="hidden sm:flex absolute right-1 top-1/2 -translate-y-1/2 items-center gap-1 z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSaveEdit();
                  }}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                >
                  <HiCheck className="w-3.5 h-3.5 text-[#14b8a6]" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCancelEdit();
                  }}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                >
                  <HiX className="w-3.5 h-3.5 text-red-500" />
                </button>
              </div>
            </div>
          ) : (
            <h3 className="font-semibold text-white truncate mb-0.5 group-hover:text-[#14b8a6] transition-colors text-sm">
              {playlist.name}
            </h3>
          )}

          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-400 leading-tight">
                {playlist.tracks.length} {playlist.tracks.length === 1 ? "track" : "tracks"}
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-tight">{formatDate(playlist.createdAt)}</p>
            </div>

            {/* Menu Button */}
            <button
              ref={menuButtonRef}
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-2 -mt-1 -mr-3.5 sm:-mr-2 md:-mr-1.5 lg:-mr-1 rounded-full sm:hover:bg-white/10 transition-colors flex items-center justify-center"
              aria-label="Playlist menu"
            >
              <HiDotsVertical className="w-5 h-5 text-gray-400 hover:text-white ml-0.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Dropdown Menu */}
      {showMenu && menuButtonRef.current && (
        <div
          ref={menuRef}
          style={{
            position: "fixed",
            bottom: window.innerHeight - menuButtonRef.current.getBoundingClientRect().top + 8,
            left: menuButtonRef.current.getBoundingClientRect().right - 144,
            zIndex: 100,
          }}
          className="w-36 bg-[#1a1848] rounded-lg shadow-xl border border-white/10 overflow-hidden"
        >
          <button
            onClick={handleEditClick}
            className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2.5"
          >
            <HiOutlinePencil className="w-4 h-4" />
            Rename
          </button>
          <button
            onClick={handleDeleteClick}
            className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-red-400 transition-colors flex items-center gap-2.5"
          >
            <HiOutlineTrash className="w-4 h-4" />
            Delete
          </button>
        </div>
      )}

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
