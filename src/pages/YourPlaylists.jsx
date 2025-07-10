import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { AppHeader, ResponsiveGrid, Loader } from "../components";
import UserPlaylistCard from "../components/UserPlaylistCard";
import PlaylistHeroSection from "../components/PlaylistHeroSection";
import EmptyPlaylistsState from "../components/EmptyPlaylistsState";
import UserPlaylistModal from "../components/UserPlaylistModal";
import { usePlaylistManager } from "../hooks/usePlaylistManager";
import { FiSearch, FiFilter } from "react-icons/fi";
import { HiOutlineSortAscending } from "react-icons/hi";

const YourPlaylists = () => {
  const navigate = useNavigate();
  const { playlists } = useSelector((state) => state.player);
  const { handleCreatePlaylist } = usePlaylistManager();

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const getPlaylistStats = () => {
    const totalTracks = playlists.reduce((acc, p) => acc + p.tracks.length, 0);
    const totalDuration = playlists.reduce((acc, p) => {
      const playlistDuration = p.tracks.reduce((sum, track) => sum + (track.duration_ms || 0), 0);
      return acc + playlistDuration;
    }, 0);

    return {
      playlistCount: playlists.length,
      totalTracks,
      totalDuration,
    };
  };

  const filteredAndSortedPlaylists = playlists
    .filter((playlist) => playlist.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "tracks":
          return b.tracks.length - a.tracks.length;
        case "recent":
        default:
          return (b.createdAt || 0) - (a.createdAt || 0);
      }
    });

  const handlePlaylistClick = (playlist) => {
    console.log("Playlist clicked:", playlist.name);
    setSelectedPlaylist(playlist);
  };

  const handleModalClose = () => {
    console.log("Closing modal");
    setSelectedPlaylist(null);
  };

  const handleCreateNewPlaylist = () => {
    const playlistName = `Your Playlist #${playlists.length + 1}`;
    const newId = handleCreatePlaylist(playlistName);
  };

  if (loading) {
    return <Loader title="Loading your playlists..." />;
  }

  const stats = getPlaylistStats();

  const sortOptions = [
    { value: "recent", label: "Recently Created" },
    { value: "name", label: "Name (A-Z)" },
    { value: "tracks", label: "Track Count" },
  ];

  return (
    <div className="flex flex-col">
      <AppHeader title="Your Playlists" subtitle="Your personal music collection" showSearch={true} />

      {/* Hero Section */}
      <div className="px-4 sm:px-6 md:px-8 mb-4 sm:mb-6">
        <PlaylistHeroSection stats={stats} onCreatePlaylist={handleCreateNewPlaylist} />
      </div>

      {playlists.length > 0 ? (
        <>
          {/* Search and Filter Bar - Fixed for proper mobile/tablet/desktop breakpoints */}
          <div className="px-4 sm:px-6 md:px-8 mb-4 sm:mb-6">
            <div className="flex flex-col md:flex-col lg:flex-row gap-3 lg:gap-4">
              {/* Search Input */}
              <div className="relative flex-1">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search your playlists..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 lg:py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:bg-white/[0.15] focus:border-[#14b8a6]/50 transition-all text-sm lg:text-base"
                />
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowSortMenu(!showSortMenu)}
                  className="flex items-center gap-2 px-4 py-2.5 lg:py-3 bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/[0.15] transition-all w-full lg:w-auto justify-center lg:justify-start text-sm lg:text-base"
                >
                  <HiOutlineSortAscending className="w-4 h-4 lg:w-5 lg:h-5" />
                  <span className="hidden lg:inline">Sort by:</span>
                  <span className="capitalize">{sortOptions.find((opt) => opt.value === sortBy)?.label}</span>
                </button>

                {/* Dropdown Menu */}
                {showSortMenu && (
                  <div className="absolute top-full mt-2 right-0 lg:left-0 w-48 bg-[#1e1b4b] border border-white/20 rounded-xl shadow-2xl z-10 overflow-hidden">
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSortBy(option.value);
                          setShowSortMenu(false);
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-white/10 transition-all text-sm ${
                          sortBy === option.value ? "bg-white/10 text-[#14b8a6]" : "text-white"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Playlists Grid - Fixed responsive breakpoints */}
          <div className="px-4 sm:px-6 md:px-8 pb-8 sm:pb-12">
            {filteredAndSortedPlaylists.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-4 lg:gap-5 xl:gap-6">
                {filteredAndSortedPlaylists.map((playlist) => (
                  <UserPlaylistCard
                    key={playlist.id}
                    playlist={playlist}
                    onClick={() => handlePlaylistClick(playlist)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400 text-base lg:text-lg">No playlists found matching "{searchTerm}"</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="px-4 sm:px-6 md:px-8">
          <EmptyPlaylistsState onCreatePlaylist={handleCreateNewPlaylist} />
        </div>
      )}

      {selectedPlaylist && <UserPlaylistModal playlist={selectedPlaylist} onClose={handleModalClose} />}
    </div>
  );
};

export default YourPlaylists;
