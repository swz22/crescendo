import { useState, useRef, useEffect } from "react";
import { usePlaylistManager } from "../hooks/usePlaylistManager";
import { HiPlus, HiCheck } from "react-icons/hi";
import { BsMusicNoteList } from "react-icons/bs";

const AddToPlaylistDropdown = ({ track, children, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [addedToPlaylists, setAddedToPlaylists] = useState(new Set());
  const dropdownRef = useRef(null);
  const {
    playlists,
    handleAddToPlaylist,
    handleCreatePlaylist,
    isTrackInPlaylist,
  } = usePlaylistManager();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleAdd = (playlistId) => {
    handleAddToPlaylist(playlistId, track);
    setAddedToPlaylists(new Set([...addedToPlaylists, playlistId]));

    setTimeout(() => {
      setAddedToPlaylists((prev) => {
        const next = new Set(prev);
        next.delete(playlistId);
        return next;
      });
    }, 2000);
  };

  const handleCreateNew = () => {
    const name = prompt("Enter playlist name:");
    if (name?.trim()) {
      const newPlaylistId = `playlist_${Date.now()}`;
      handleCreatePlaylist(name.trim());

      setTimeout(() => {
        handleAddToPlaylist(newPlaylistId, track);
        setIsOpen(false);
      }, 100);
    }
  };

  const trackId = track?.key || track?.id || track?.track_id;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
      >
        {children || (
          <button className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/60 hover:text-white">
            <HiPlus size={20} />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-[#1e1b4b]/98 backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 overflow-hidden z-50 animate-fadeIn">
          <div className="p-3">
            <h4 className="text-white font-semibold text-sm mb-3">
              Add to playlist
            </h4>

            <button
              onClick={handleCreateNew}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-white mb-2"
            >
              <HiPlus className="w-4 h-4" />
              <span className="text-sm font-medium">Create New Playlist</span>
            </button>

            {playlists.length > 0 && (
              <>
                <div className="border-t border-white/10 my-2" />
                <div className="max-h-64 overflow-y-auto custom-scrollbar">
                  {playlists.map((playlist) => {
                    const isInPlaylist = isTrackInPlaylist(
                      playlist.id,
                      trackId
                    );
                    const justAdded = addedToPlaylists.has(playlist.id);

                    return (
                      <button
                        key={playlist.id}
                        onClick={() => !isInPlaylist && handleAdd(playlist.id)}
                        disabled={isInPlaylist}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                          isInPlaylist
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:bg-white/10"
                        } text-white`}
                      >
                        <BsMusicNoteList className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm flex-1 text-left truncate">
                          {playlist.name}
                        </span>
                        {(isInPlaylist || justAdded) && (
                          <HiCheck
                            className={`w-4 h-4 ${
                              justAdded ? "text-[#14b8a6]" : "text-white/40"
                            }`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {playlists.length === 0 && (
              <p className="text-white/60 text-sm text-center py-4">
                No playlists yet. Create one to get started!
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AddToPlaylistDropdown;
