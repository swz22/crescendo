import { useState, useRef, useEffect } from "react";
import { usePlaylistManager } from "../hooks/usePlaylistManager";
import { HiPlus, HiCheck, HiOutlineSparkles } from "react-icons/hi";
import { BsMusicNoteList } from "react-icons/bs";
import Portal from "./Portal.jsx";

const AddToPlaylistDropdown = ({
  track,
  children,
  className = "",
  forceOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(forceOpen);
  const [addedToPlaylists, setAddedToPlaylists] = useState(new Set());
  const [showSuccess, setShowSuccess] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const {
    playlists,
    handleAddToPlaylist,
    handleCreatePlaylist,
    isTrackInPlaylist,
  } = usePlaylistManager();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
    }
  }, [forceOpen]);

  useEffect(() => {
    console.log("Positioning effect", {
      isOpen,
      hasButtonRef: !!buttonRef.current,
      buttonRect: buttonRef.current?.getBoundingClientRect(),
    });
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownWidth = 280;
      const dropdownHeight = 400;

      let left = rect.left;
      let top = rect.bottom + 8;

      // Check right edge
      if (left + dropdownWidth > window.innerWidth - 20) {
        left = rect.right - dropdownWidth;
      }

      // Check left edge
      if (left < 10) {
        left = 10;
      }

      // Check bottom edge
      if (top + dropdownHeight > window.innerHeight - 20) {
        top = rect.top - dropdownHeight - 8;
      }

      setDropdownPosition({ top, left });
    }
  }, [isOpen]);

  const handleClick = (e) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleAdd = (playlistId) => {
    handleAddToPlaylist(playlistId, track);
    setAddedToPlaylists(new Set([...addedToPlaylists, playlistId]));

    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setIsOpen(false);
    }, 1500);

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
      const newPlaylistId = handleCreatePlaylist(name.trim());

      // Add track to the newly created playlist
      setTimeout(() => {
        handleAddToPlaylist(newPlaylistId, track);
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          setIsOpen(false);
        }, 1500);
      }, 100);
    }
  };

  const trackId = track?.key || track?.id || track?.track_id;

  return (
    <>
      <div ref={buttonRef} onClick={handleClick} className={className}>
        {children || (
          <button className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/60 hover:text-white">
            <HiPlus size={20} />
          </button>
        )}
      </div>

      {isOpen && (
        <Portal>
          <div
            className="fixed inset-0 z-[998]"
            onClick={() => setIsOpen(false)}
          />

          <div
            ref={dropdownRef}
            className="fixed w-[280px] z-[999] animate-slideInDown"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
            }}
          >
            <div className="bg-[#0f0e2e]/95 backdrop-blur-2xl rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] border border-white/15 overflow-hidden">
              <div className="p-4 border-b border-white/10 bg-gradient-to-r from-[#14b8a6]/10 to-transparent">
                <h4 className="text-white font-semibold text-sm flex items-center gap-2">
                  <HiOutlineSparkles className="text-[#14b8a6]" />
                  Add to playlist
                </h4>
              </div>

              {showSuccess && (
                <div className="absolute inset-0 bg-[#0f0e2e]/98 backdrop-blur-xl z-10 flex items-center justify-center animate-fadeIn">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-[#14b8a6]/20 rounded-full flex items-center justify-center mx-auto mb-3 animate-successPulse">
                      <HiCheck className="w-8 h-8 text-[#14b8a6]" />
                    </div>
                    <p className="text-white font-medium">Added to playlist!</p>
                  </div>
                </div>
              )}

              <div className="p-2">
                <button
                  onClick={handleCreateNew}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-[#14b8a6]/10 to-transparent hover:from-[#14b8a6]/20 hover:to-[#0d9488]/10 transition-all duration-200 text-white mb-2 group"
                >
                  <div className="w-8 h-8 bg-[#14b8a6]/20 rounded-lg flex items-center justify-center group-hover:bg-[#14b8a6]/30 transition-colors">
                    <HiPlus className="w-5 h-5 text-[#14b8a6]" />
                  </div>
                  <span className="text-sm font-medium">
                    Create New Playlist
                  </span>
                </button>

                {playlists.length > 0 && (
                  <>
                    <div className="border-t border-white/5 my-2" />
                    <div className="max-h-[240px] overflow-y-auto custom-scrollbar pr-1">
                      {playlists.map((playlist) => {
                        const isInPlaylist = isTrackInPlaylist(
                          playlist.id,
                          trackId
                        );
                        const justAdded = addedToPlaylists.has(playlist.id);

                        return (
                          <button
                            key={playlist.id}
                            onClick={() =>
                              !isInPlaylist && handleAdd(playlist.id)
                            }
                            disabled={isInPlaylist}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                              isInPlaylist
                                ? "opacity-50 cursor-not-allowed bg-white/5"
                                : "hover:bg-white/10 active:scale-[0.98]"
                            } text-white group`}
                          >
                            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center group-hover:bg-white/20 transition-colors">
                              <BsMusicNoteList className="w-4 h-4" />
                            </div>
                            <div className="flex-1 text-left">
                              <span className="text-sm font-medium block truncate">
                                {playlist.name}
                              </span>
                              <span className="text-xs text-white/40">
                                {playlist.tracks?.length || 0} tracks
                              </span>
                            </div>
                            {(isInPlaylist || justAdded) && (
                              <div
                                className={`transition-all duration-300 ${
                                  justAdded ? "scale-125" : "scale-100"
                                }`}
                              >
                                <HiCheck
                                  className={`w-5 h-5 ${
                                    justAdded
                                      ? "text-[#14b8a6]"
                                      : "text-white/40"
                                  }`}
                                />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}

                {playlists.length === 0 && (
                  <div className="py-8 text-center">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                      <BsMusicNoteList className="w-8 h-8 text-white/20" />
                    </div>
                    <p className="text-white/60 text-sm">No playlists yet</p>
                    <p className="text-white/40 text-xs mt-1">
                      Create one to get started!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
};

export default AddToPlaylistDropdown;
