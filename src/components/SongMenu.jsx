import React, { useState, useRef, useEffect } from "react";
import { useDispatch } from "react-redux";
import { addToQueue, switchContext } from "../redux/features/playerSlice";
import { usePlaylistManager } from "../hooks/usePlaylistManager";
import { usePreviewUrl } from "../hooks/usePreviewUrl";
import { useToast } from "../context/ToastContext";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { getTrackId } from "../utils/trackUtils";
import BottomSheet from "./BottomSheet";
import Portal from "./Portal";
import {
  HiDotsVertical,
  HiPlus,
  HiCheck,
  HiOutlinePlay,
  HiOutlineTrash,
} from "react-icons/hi";
import { HiOutlineQueueList } from "react-icons/hi2";
import { BsMusicNoteList } from "react-icons/bs";

const SongMenu = ({ song, children, className = "", onRemoveFromPlaylist }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [creatingPlaylist, setCreatingPlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const inputRef = useRef(null);

  const dispatch = useDispatch();
  const { showToast } = useToast();
  const { getPreviewUrl } = usePreviewUrl();
  const isMobile = useMediaQuery("(max-width: 640px)");

  const {
    playlists,
    handleAddToPlaylist,
    handleCreatePlaylist,
    isTrackInPlaylist,
  } = usePlaylistManager();

  const trackId = getTrackId(song);

  useEffect(() => {
    if (!isMobile && isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 280;
      const menuHeight = 400;

      let left = rect.right + 8;
      let top = rect.top;

      // Adjust for viewport bounds
      if (left + menuWidth > window.innerWidth - 20) {
        left = rect.left - menuWidth - 8;
      }
      if (top + menuHeight > window.innerHeight - 20) {
        top = window.innerHeight - menuHeight - 20;
      }

      setPosition({ top, left });
    }
  }, [isOpen, isMobile]);

  useEffect(() => {
    if (creatingPlaylist && inputRef.current) {
      inputRef.current.focus();
    }
  }, [creatingPlaylist]);

  const handlePlayNext = async () => {
    const songWithPreview = await getPreviewUrl(song);
    if (songWithPreview.preview_url) {
      dispatch(addToQueue({ song: songWithPreview, playNext: true }));
      dispatch(switchContext({ contextType: "queue" }));
      showToast("Will play next");
    }
    setIsOpen(false);
  };

  const handleAddToQueue = async () => {
    const songWithPreview = await getPreviewUrl(song);
    if (songWithPreview.preview_url) {
      dispatch(addToQueue({ song: songWithPreview, playNext: false }));
      dispatch(switchContext({ contextType: "queue" }));
      showToast("Added to queue");
    }
    setIsOpen(false);
  };

  const handleAddToPlaylistClick = async (playlistId) => {
    const songWithPreview = await getPreviewUrl(song);
    handleAddToPlaylist(playlistId, songWithPreview);
    showToast("Added to playlist");
    setIsOpen(false);
  };

  const handleCreateNewPlaylist = async () => {
    if (newPlaylistName.trim()) {
      const playlistId = handleCreatePlaylist(newPlaylistName.trim());
      const songWithPreview = await getPreviewUrl(song);
      handleAddToPlaylist(playlistId, songWithPreview);
      showToast(`Created "${newPlaylistName}" and added song`);
      setNewPlaylistName("");
      setCreatingPlaylist(false);
      setIsOpen(false);
    }
  };

  const handleRemoveClick = () => {
    if (onRemoveFromPlaylist) {
      onRemoveFromPlaylist();
      showToast("Removed from playlist");
      setIsOpen(false);
    }
  };

  const menuContent = (
    <div className="py-2">
      {/* Action buttons */}
      {!onRemoveFromPlaylist && (
        <button
          onClick={handlePlayNext}
          className="w-full px-6 py-3 text-left text-white hover:bg-white/10 transition-colors flex items-center gap-3"
        >
          <HiOutlinePlay className="w-5 h-5" />
          Play Next
        </button>
      )}

      <button
        onClick={handleAddToQueue}
        className="w-full px-6 py-3 text-left text-white hover:bg-white/10 transition-colors flex items-center gap-3"
      >
        <HiOutlineQueueList className="w-5 h-5" />
        Add to Queue
      </button>

      {/* Show Remove from Playlist option if callback is provided */}
      {onRemoveFromPlaylist && (
        <>
          <div className="border-t border-white/10 my-2" />
          <button
            onClick={handleRemoveClick}
            className="w-full px-6 py-3 text-left text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-3"
          >
            <HiOutlineTrash className="w-5 h-5" />
            Remove from Playlist
          </button>
        </>
      )}

      <div className="border-t border-white/10 my-2" />

      <div className="px-6 py-2">
        <p className="text-sm text-white/60 mb-3">Add to Playlist</p>

        {/* Create new playlist */}
        {creatingPlaylist ? (
          <div className="flex items-center gap-2 mb-3">
            <input
              ref={inputRef}
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleCreateNewPlaylist()}
              placeholder="Playlist name"
              className="flex-1 bg-white/10 text-white px-3 py-2 rounded text-sm placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
            />
            <button
              onClick={handleCreateNewPlaylist}
              disabled={!newPlaylistName.trim()}
              className="p-2 bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <HiCheck className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setCreatingPlaylist(false);
                setNewPlaylistName("");
              }}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded transition-all"
            >
              ×
            </button>
          </div>
        ) : (
          <button
            onClick={() => setCreatingPlaylist(true)}
            className="w-full px-3 py-2 text-left text-white hover:bg-white/10 rounded flex items-center gap-2 transition-colors mb-3"
          >
            <HiPlus className="w-4 h-4" />
            <span className="text-sm">Create new playlist</span>
          </button>
        )}

        {/* Existing playlists */}
        <div className="max-h-52 overflow-y-auto custom-scrollbar space-y-1">
          {playlists.length === 0 && !creatingPlaylist && (
            <p className="text-white/40 text-sm py-2">No playlists yet</p>
          )}
          {playlists.map((playlist) => {
            const isInPlaylist = isTrackInPlaylist(playlist.id, trackId);
            return (
              <button
                key={playlist.id}
                onClick={() =>
                  !isInPlaylist && handleAddToPlaylistClick(playlist.id)
                }
                disabled={isInPlaylist}
                className={`w-full px-3 py-2 text-left text-white rounded flex items-center gap-2 transition-all text-sm ${
                  isInPlaylist
                    ? "bg-white/5 text-white/40 cursor-not-allowed"
                    : "hover:bg-white/10"
                }`}
              >
                <BsMusicNoteList className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{playlist.name}</span>
                {isInPlaylist && (
                  <HiCheck className="w-4 h-4 ml-auto text-[#14b8a6]" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div ref={buttonRef} className={className}>
        {children ? (
          <div onClick={() => setIsOpen(!isOpen)}>{children}</div>
        ) : (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-full hover:bg-white/10 transition-all"
          >
            <HiDotsVertical className="w-5 h-5 text-white" />
          </button>
        )}
      </div>

      {/* Desktop menu */}
      {!isMobile && isOpen && (
        <Portal>
          <div
            className="fixed inset-0 z-50"
            onClick={() => setIsOpen(false)}
          />
          <div
            ref={menuRef}
            className="fixed z-50 bg-gradient-to-b from-[#2d2467] to-[#1e1b4b] backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 overflow-hidden animate-slideDown"
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
              width: "280px",
            }}
          >
            {menuContent}
          </div>
        </Portal>
      )}

      {/* Mobile bottom sheet */}
      {isMobile && (
        <BottomSheet isOpen={isOpen} onClose={() => setIsOpen(false)}>
          {menuContent}
        </BottomSheet>
      )}
    </>
  );
};

export default SongMenu;
