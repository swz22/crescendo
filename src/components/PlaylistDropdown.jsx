import { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { switchContext } from "../redux/features/playerSlice";
import {
  selectAllContexts,
  selectCurrentContextName,
} from "../redux/features/playerSelectors";
import {
  HiOutlineQueueList,
  HiOutlineClock,
  HiOutlinePlus,
  HiChevronDown,
} from "react-icons/hi2";
import { BsMusicNoteList } from "react-icons/bs";

const PlaylistDropdown = ({ onManageClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const dispatch = useDispatch();

  const { activeContext } = useSelector((state) => state.player);
  const contexts = useSelector(selectAllContexts);
  const currentContextName = useSelector(selectCurrentContextName);

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
      case "playlist":
        return <BsMusicNoteList className="w-5 h-5 text-white" />;
      default:
        return <BsMusicNoteList className="w-5 h-5 text-white" />;
    }
  };

  const getCurrentTrackCount = () => {
    const context = contexts.find((c) => c.id === activeContext);
    return context?.trackCount || 0;
  };

  const handleContextSelect = (contextId) => {
    dispatch(switchContext({ contextType: contextId }));
    setIsOpen(false);
  };

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
            {currentContextName}
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
              {contexts
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
                    </div>
                    <span className="text-sm text-white/60">
                      {context.trackCount}
                    </span>
                    {activeContext === context.id && (
                      <div className="w-2 h-2 bg-[#14b8a6] rounded-full animate-pulse" />
                    )}
                  </button>
                ))}
            </div>

            {/* User Playlists */}
            {contexts.filter((c) => c.type === "playlist").length > 0 && (
              <>
                <div className="border-t border-white/10 my-2" />
                <div className="px-3 py-2">
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-2">
                    Your Playlists
                  </p>
                  {contexts
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
                        </div>
                        <span className="text-sm text-white/60">
                          {context.trackCount}
                        </span>
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
