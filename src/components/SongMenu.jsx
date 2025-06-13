import React, { useState, useRef, useEffect } from "react";
import { useDispatch } from "react-redux";
import { store } from "../redux/store";
import { addToQueue } from "../redux/features/playerSlice";
import { usePlaylistManager } from "../hooks/usePlaylistManager";
import { usePreviewUrl } from "../hooks/usePreviewUrl";
import { useToast } from "../context/ToastContext";
import { useMediaQuery } from "../hooks/useMediaQuery";
import BottomSheet from "./BottomSheet";
import Portal from "./Portal";
import { HiDotsVertical, HiPlus, HiCheck, HiOutlinePlay } from "react-icons/hi";
import { HiOutlineQueueList } from "react-icons/hi2";
import { BsMusicNoteList } from "react-icons/bs";

const SongMenu = ({ song, children, className = "" }) => {
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

  const trackId = song?.key || song?.id || song?.track_id;

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
      // First, find and remove the song if it's already in the queue
      const state = store.getState();
      const queue = state.player.queue;
      const existingIndex = queue.findIndex(
        (s) => (s.key || s.id) === (songWithPreview.key || songWithPreview.id)
      );

      if (existingIndex !== -1) {
        dispatch(removeFromQueue({ index: existingIndex }));
      }

      // Then add it as play next
      dispatch(addToQueue({ song: songWithPreview, playNext: true }));
      showToast("Will play next");
    }
    setIsOpen(false);
  };

  const handleAddToQueue = async () => {
    const songWithPreview = await getPreviewUrl(song);
    if (songWithPreview.preview_url) {
      // First, find and remove the song if it's already in the queue
      const state = store.getState();
      const queue = state.player.queue;
      const existingIndex = queue.findIndex(
        (s) => (s.key || s.id) === (songWithPreview.key || songWithPreview.id)
      );

      if (existingIndex !== -1) {
        dispatch(removeFromQueue({ index: existingIndex }));
      }

      // Then add it to the end
      dispatch(addToQueue({ song: songWithPreview }));
      showToast("Added to queue");
    }
    setIsOpen(false);
  };
  const handleAddToPlaylistClick = (playlistId) => {
    handleAddToPlaylist(playlistId, song);
    showToast("Added to playlist");
    setIsOpen(false);
  };

  const handleCreateNewPlaylist = () => {
    if (newPlaylistName.trim()) {
      const playlistId = handleCreatePlaylist(newPlaylistName.trim());
      handleAddToPlaylist(playlistId, song);
      showToast(`Created "${newPlaylistName}" and added song`);
      setNewPlaylistName("");
      setCreatingPlaylist(false);
      setIsOpen(false);
    }
  };

  const menuContent = (
    <div className="py-2">
      {/* Action buttons */}
      <button
        onClick={handlePlayNext}
        className="w-full px-6 py-3 text-left text-white hover:bg-white/10 transition-colors flex items-center gap-3"
      >
        <HiOutlinePlay className="w-5 h-5" />
        Play Next
      </button>

      <button
        onClick={handleAddToQueue}
        className="w-full px-6 py-3 text-left text-white hover:bg-white/10 transition-colors flex items-center gap-3"
      >
        <HiOutlineQueueList className="w-5 h-5" />
        Add to Queue
      </button>

      <div className="border-t border-white/10 my-2" />

      <div className="px-6 py-2">
        <p className="text-sm text-white/60 mb-3">Add to Playlist</p>

        {/* Create new playlist */}
        {creatingPlaylist ? (
          <div className="flex gap-2 mb-3">
            <input
              ref={inputRef}
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleCreateNewPlaylist()}
              placeholder="Playlist name..."
              className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder-white/40 focus:outline-none focus:border-[#14b8a6]"
            />
            <button
              onClick={handleCreateNewPlaylist}
              className="px-3 py-2 bg-[#14b8a6] text-white rounded-lg text-sm font-medium hover:bg-[#0d9488] transition-colors"
            >
              Add
            </button>
          </div>
        ) : (
          <button
            onClick={() => setCreatingPlaylist(true)}
            className="w-full flex items-center gap-3 px-4 py-2.5 mb-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-all"
          >
            <HiPlus className="w-4 h-4" />
            <span className="text-sm">Create New Playlist</span>
          </button>
        )}

        {/* Existing playlists */}
        <div className="space-y-1 max-h-[240px] overflow-y-auto custom-scrollbar">
          {playlists.map((playlist) => {
            const isInPlaylist = isTrackInPlaylist(playlist.id, trackId);

            return (
              <button
                key={playlist.id}
                onClick={() =>
                  !isInPlaylist && handleAddToPlaylistClick(playlist.id)
                }
                disabled={isInPlaylist}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-left ${
                  isInPlaylist
                    ? "opacity-50 cursor-not-allowed bg-white/5"
                    : "hover:bg-white/10"
                }`}
              >
                <BsMusicNoteList className="w-4 h-4 text-white/60" />
                <span className="flex-1 text-sm text-white truncate">
                  {playlist.name}
                </span>
                {isInPlaylist && <HiCheck className="w-4 h-4 text-[#14b8a6]" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={className}
      >
        {children || (
          <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <HiDotsVertical className="w-5 h-5 text-white" />
          </button>
        )}
      </div>

      {/* Mobile Bottom Sheet */}
      {isMobile && (
        <BottomSheet
          isOpen={isOpen}
          onClose={() => {
            setIsOpen(false);
            setCreatingPlaylist(false);
            setNewPlaylistName("");
          }}
          title={song?.title || "Song Options"}
        >
          {menuContent}
        </BottomSheet>
      )}

      {/* Desktop Dropdown */}
      {!isMobile && isOpen && (
        <Portal>
          <div
            className="fixed inset-0 z-[98]"
            onClick={() => {
              setIsOpen(false);
              setCreatingPlaylist(false);
              setNewPlaylistName("");
            }}
          />
          <div
            ref={menuRef}
            className="fixed z-[99] bg-[#1e1b4b]/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 overflow-hidden animate-fadeIn"
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
    </>
  );
};

export default SongMenu;
