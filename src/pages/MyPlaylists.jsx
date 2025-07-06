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

const MyPlaylists = () => {
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
      const playlistDuration = p.tracks.reduce(
        (sum, track) => sum + (track.duration_ms || 0),
        0
      );
      return acc + playlistDuration;
    }, 0);

    return {
      playlistCount: playlists.length,
      totalTracks,
      totalDuration,
    };
  };

  const filteredAndSortedPlaylists = playlists
    .filter((playlist) =>
      playlist.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
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
    setSelectedPlaylist(playlist);
  };

  const handleCreateNewPlaylist = () => {
    const playlistName = `My Playlist #${playlists.length + 1}`;
    const newId = handleCreatePlaylist(playlistName);
    const newPlaylist = playlists.find((p) => p.id === newId);
    if (newPlaylist) {
      setSelectedPlaylist(newPlaylist);
    }
  };

  if (loading) {
    return <Loader title="Loading your playlists..." />;
  }

  const stats = getPlaylistStats();

  return (
    <div className="flex flex-col">
      <AppHeader
        title="My Playlists"
        subtitle="Your personal music collection"
      />

      {/* Hero Section */}
      <PlaylistHeroSection
        stats={stats}
        onCreatePlaylist={handleCreateNewPlaylist}
      />

      {playlists.length > 0 ? (
        <>
          <div className="flex flex-col sm:flex-row gap-4 mb-6 px-0 md:px-0">
            {/* Search */}
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search your playlists..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/[0.08] backdrop-blur-xl border border-white/20 rounded-xl 
                  placeholder-gray-400 outline-none text-white pl-10 pr-4 py-3
                  focus:bg-white/[0.12] focus:border-[#14b8a6]/50 focus:shadow-[0_0_20px_rgba(45,212,191,0.2)] 
                  transition-all duration-300"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center gap-2 px-4 py-3 bg-white/[0.08] backdrop-blur-xl 
                  border border-white/20 rounded-xl text-white hover:bg-white/[0.12] 
                  transition-all duration-300"
              >
                <HiOutlineSortAscending className="w-5 h-5" />
                <span className="text-sm font-medium">
                  Sort by{" "}
                  {sortBy === "recent"
                    ? "Recent"
                    : sortBy === "name"
                    ? "Name"
                    : "Tracks"}
                </span>
              </button>

              {showSortMenu && (
                <div
                  className="absolute right-0 mt-2 w-48 bg-[#1e1b4b]/98 backdrop-blur-xl 
                  rounded-xl shadow-xl border border-white/20 overflow-hidden z-20"
                >
                  {[
                    { value: "recent", label: "Recently Created" },
                    { value: "name", label: "Name (A-Z)" },
                    { value: "tracks", label: "Track Count" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortBy(option.value);
                        setShowSortMenu(false);
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-white/10 transition-colors ${
                        sortBy === option.value
                          ? "text-[#14b8a6]"
                          : "text-white"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Playlists Grid */}
          {filteredAndSortedPlaylists.length > 0 ? (
            <ResponsiveGrid type="playlists">
              {filteredAndSortedPlaylists.map((playlist) => (
                <UserPlaylistCard
                  key={playlist.id}
                  playlist={playlist}
                  onClick={() => handlePlaylistClick(playlist)}
                />
              ))}
            </ResponsiveGrid>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <p className="text-gray-400 text-lg">
                No playlists found matching "{searchTerm}"
              </p>
            </div>
          )}
        </>
      ) : (
        <EmptyPlaylistsState onCreatePlaylist={handleCreateNewPlaylist} />
      )}

      {/* Playlist Modal */}
      {selectedPlaylist && (
        <>
          <UserPlaylistModal
            playlist={selectedPlaylist}
            onClose={() => setSelectedPlaylist(null)}
          />
        </>
      )}
    </div>
  );
};

export default MyPlaylists;
