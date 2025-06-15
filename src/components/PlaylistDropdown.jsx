import { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { switchContext } from "../redux/features/playerSlice";
import {
  HiOutlineQueueList,
  HiOutlineClock,
  HiOutlinePlus,
  HiChevronDown,
  HiOutlinePencil,
  HiOutlineTrash,
} from "react-icons/hi2";
import { BsMusicNoteList } from "react-icons/bs";

const PlaylistDropdown = ({ onManageClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const dispatch = useDispatch();

  const { activeContext, contexts, activeCommunityPlaylist, playlists } =
    useSelector((state) => state.player);

  // Close dropdown when clicking outside
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

  const getIcon = (type) => {
    switch (type) {
      case "queue":
        return <HiOutlineQueueList className="w-5 h-5 text-white" />;
      case "recently_played":
        return <HiOutlineClock className="w-5 h-5 text-white" />;
      case "community_playlist":
        return <BsMusicNoteList className="w-5 h-5 text-white" />;
      default:
        return <BsMusicNoteList className="w-5 h-5 text-white" />;
    }
  };

  const getCurrentContextName = () => {
    if (activeContext === "community_playlist") {
      return activeCommunityPlaylist?.name || "Community Playlist";
    }
    return contexts[activeContext]?.name || "Unknown Context";
  };

  const getCurrentTrackCount = () => {
    if (activeContext === "community_playlist") {
      return activeCommunityPlaylist?.tracks?.length || 0;
    }
    return contexts[activeContext]?.tracks?.length || 0;
  };

  const handleContextSelect = (contextId) => {
    dispatch(switchContext({ contextType: contextId }));
    setIsOpen(false);
  };

  const getAllContexts = () => {
    return [
      {
        id: "queue",
        name: contexts.queue?.name || "Your Queue",
        tracks: contexts.queue?.tracks || [],
        type: "queue",
      },
      {
        id: "recently_played",
        name: contexts.recently_played?.name || "Recently Played",
        tracks: contexts.recently_played?.tracks || [],
        type: "recently_played",
      },
      ...playlists.map((playlist) => ({
        id: playlist.id,
        name: playlist.name,
        tracks: contexts[playlist.id]?.tracks || playlist.tracks || [],
        type: "playlist",
      })),
    ];
  };

  const allContexts = getAllContexts();

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Dropdown Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200 group max-w-full"
      >
        <div className="flex items-center gap-2 min-w-0">
          {getIcon(activeContext)}
          <span className="text-white font-medium truncate">
            {getCurrentContextName()}
          </span>
          <span className="text-white/60 text-sm">
            ({getCurrentTrackCount()})
          </span>
        </div>
        <HiChevronDown
          className={`w-4 h-4 text-white/60 transition-transform duration-200 flex-shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full mt-2 w-72 bg-[#1e1b4b]/98 backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 overflow-hidden z-50 animate-fadeIn">
          <div className="py-2 max-h-96 overflow-y-auto custom-scrollbar">
            {/* System Contexts */}
            <div className="px-3 py-2">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-2">
                System
              </p>
              {allContexts
                .filter((c) => c.type !== "playlist")
                .map((context) => (
                  <button
                    key={context.id}
                    onClick={() => handleContextSelect(context.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                      activeContext === context.id
                        ? "bg-[#14b8a6]/20 text-[#14b8a6]"
                        : "hover:bg-white/10 text-white"
                    }`}
                  >
                    <div className="flex-shrink-0">{getIcon(context.type)}</div>
                    <div className="flex-1 text-left">
                      <p className="font-medium">{context.name}</p>
                      <p className="text-xs opacity-60">
                        {context.tracks.length} tracks
                      </p>
                    </div>
                    {activeContext === context.id && (
                      <div className="w-2 h-2 bg-[#14b8a6] rounded-full animate-pulse" />
                    )}
                  </button>
                ))}
            </div>

            {/* User Playlists */}
            {allContexts.filter((c) => c.type === "playlist").length > 0 && (
              <>
                <div className="border-t border-white/10 my-2" />
                <div className="px-3 py-2">
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-2">
                    Your Playlists
                  </p>
                  {allContexts
                    .filter((c) => c.type === "playlist")
                    .map((context) => (
                      <button
                        key={context.id}
                        onClick={() => handleContextSelect(context.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                          activeContext === context.id
                            ? "bg-[#14b8a6]/20 text-[#14b8a6]"
                            : "hover:bg-white/10 text-white"
                        }`}
                      >
                        <div className="flex-shrink-0">
                          {getIcon(context.type)}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium truncate">{context.name}</p>
                          <p className="text-xs opacity-60">
                            {context.tracks.length} tracks
                          </p>
                        </div>
                        {activeContext === context.id && (
                          <div className="w-2 h-2 bg-[#14b8a6] rounded-full animate-pulse" />
                        )}
                      </button>
                    ))}
                </div>
              </>
            )}

            {/* Manage Playlists Button */}
            <div className="border-t border-white/10 p-3">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onManageClick();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#14b8a6] to-[#0d9488] hover:from-[#0d9488] hover:to-[#0891b2] text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-[#14b8a6]/25"
              >
                <HiOutlinePlus className="w-5 h-5" />
                Manage Playlists
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaylistDropdown;
