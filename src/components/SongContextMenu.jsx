import { useRef, useEffect } from "react";
import { useDispatch } from "react-redux";
import { playNext, addToQueue } from "../redux/features/playerSlice";
import { usePreviewUrl } from "../hooks/usePreviewUrl";
import { useToast } from "../context/ToastContext";
import { dispatchQueueEvent } from "../utils/queueEvents";

const SongContextMenu = ({ song, position, onClose, onAddToPlaylist }) => {
  const dispatch = useDispatch();
  const menuRef = useRef(null);
  const { getPreviewUrl } = usePreviewUrl();
  const { showToast } = useToast();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handlePlayNext = async () => {
    const songWithPreview = await getPreviewUrl(song);
    if (songWithPreview.preview_url) {
      dispatch(addToQueue({ track: songWithPreview, playNext: true }));
      showToast("Will play next");
    }
    onClose();
  };

  const handleAddToQueue = async () => {
    const songWithPreview = await getPreviewUrl(song);
    if (songWithPreview.preview_url) {
      dispatch(addToQueue({ track: songWithPreview }));
      showToast("Added to queue");
    }
    onClose();
  };

  const handleAddToPlaylist = () => {
    if (onAddToPlaylist) {
      onAddToPlaylist(position);
    }
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-[#1e1b4b]/95 backdrop-blur-xl rounded-lg shadow-xl border border-white/20 py-2 min-w-[180px]"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        maxWidth: "200px",
      }}
    >
      <button
        onClick={handlePlayNext}
        className="w-full px-4 py-2.5 text-left text-white hover:bg-white/10 transition-colors flex items-center gap-3 text-sm"
      >
        <svg
          className="w-4 h-4 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 5l7 7-7 7M5 5l7 7-7 7"
          />
        </svg>
        <span>Play Next</span>
      </button>

      <button
        onClick={handleAddToQueue}
        className="w-full px-4 py-2.5 text-left text-white hover:bg-white/10 transition-colors flex items-center gap-3 text-sm"
      >
        <svg
          className="w-4 h-4 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
        <span>Add to Queue</span>
      </button>

      <div className="border-t border-white/10 my-1" />

      <button
        onClick={handleAddToPlaylist}
        className="w-full px-4 py-2.5 text-left text-white hover:bg-white/10 transition-colors flex items-center gap-3 text-sm"
      >
        <svg
          className="w-4 h-4 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
        <span>Add to Playlist</span>
      </button>
    </div>
  );
};

export default SongContextMenu;
