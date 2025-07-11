import { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { switchContext } from "../redux/features/playerSlice";
import {
  selectAllContexts,
  selectCurrentContextName,
} from "../redux/features/playerSelectors";
import DropdownPortal from "./DropdownPortal";
import { HiOutlineClock, HiOutlinePlus, HiChevronDown } from "react-icons/hi2";
import { BsMusicNoteList } from "react-icons/bs";
import { CgMenuLeft } from "react-icons/cg";

const PlaylistDropdown = ({ onManageClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownButtonRef = useRef(null);
  const dispatch = useDispatch();

  const { activeContext } = useSelector((state) => state.player);
  const contexts = useSelector(selectAllContexts);
  const currentContextName = useSelector(selectCurrentContextName);

  const getIcon = (iconType) => {
    switch (iconType) {
      case "queue":
        return <CgMenuLeft className="w-5 h-5 text-white" />;
      case "clock":
        return <HiOutlineClock className="w-5 h-5 text-white" />;
      case "music":
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

  // Separate contexts by type
  const systemContexts = contexts.filter((c) =>
    ["queue", "recently_played", "album", "community_playlist"].includes(c.type)
  );
  const userPlaylists = contexts.filter((c) => c.type === "playlist");

  return (
    <>
      {/* Dropdown Trigger */}
      <button
        ref={dropdownButtonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200 group max-w-full"
      >
        <div className="flex items-center gap-2 min-w-0">
          {getIcon(contexts.find((c) => c.id === activeContext)?.icon)}
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

      {/* Dropdown Menu using Portal */}
      <DropdownPortal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        triggerRef={dropdownButtonRef}
        minWidth={335}
        maxHeight={500}
        placement="bottom-start"
        className="overflow-visible"
      >
        <div className="py-2">
          {/* System Contexts */}
          <div className="px-3 pb-2">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-3 font-medium">
              System
            </p>
            <div className="space-y-1">
              {systemContexts.map((context) => (
                <button
                  key={context.id}
                  onClick={() => handleContextSelect(context.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group ${
                    activeContext === context.id
                      ? "bg-[#14b8a6]/20 text-[#14b8a6]"
                      : "hover:bg-white/10 text-white"
                  }`}
                >
                  <div className="flex-shrink-0">
                    <div
                      className={
                        activeContext === context.id ? "text-[#14b8a6]" : ""
                      }
                    >
                      {getIcon(context.icon)}
                    </div>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium">{context.name}</p>
                  </div>
                  <span
                    className={`text-sm ${
                      activeContext === context.id
                        ? "text-[#14b8a6]"
                        : "text-white/60"
                    }`}
                  >
                    {context.trackCount}
                  </span>
                  {activeContext === context.id && (
                    <div className="w-2 h-2 bg-[#14b8a6] rounded-full animate-pulse" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* User Playlists Section */}
          <div className="border-t border-white/10 my-3" />
          <div className="px-3 pb-2">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-3 font-medium">
              Your Playlists
            </p>

            {/* Manage Playlists Button */}
            <button
              onClick={() => {
                onManageClick?.();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-3 bg-transparent border border-[#14b8a6]/40 hover:border-[#14b8a6]/60 rounded-lg transition-all duration-200 text-[#14b8a6] hover:text-[#22d3b7] group hover:shadow-[0_0_20px_rgba(20,184,166,0.2)] mb-3"
            >
              <HiOutlinePlus className="w-5 h-5 transition-colors flex-shrink-0" />
              <span className="font-medium">Manage Playlists</span>
            </button>

            {/* Playlist Items */}
            {userPlaylists.length > 0 ? (
              <div className="space-y-1">
                {userPlaylists.map((context) => (
                  <button
                    key={context.id}
                    onClick={() => handleContextSelect(context.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group ${
                      activeContext === context.id
                        ? "bg-[#14b8a6]/20 text-[#14b8a6]"
                        : "hover:bg-white/10 text-white"
                    }`}
                  >
                    <div className="flex-shrink-0">
                      <div
                        className={
                          activeContext === context.id ? "text-[#14b8a6]" : ""
                        }
                      >
                        {getIcon(context.icon)}
                      </div>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium truncate">{context.name}</p>
                    </div>
                    <span
                      className={`text-sm ${
                        activeContext === context.id
                          ? "text-[#14b8a6]"
                          : "text-white/60"
                      }`}
                    >
                      {context.trackCount}
                    </span>
                    {activeContext === context.id && (
                      <div className="w-2 h-2 bg-[#14b8a6] rounded-full animate-pulse" />
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-white/40 text-sm text-center py-2">
                No playlists yet
              </p>
            )}
          </div>
        </div>
      </DropdownPortal>
    </>
  );
};

export default PlaylistDropdown;
