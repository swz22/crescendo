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
    console.log("Playlist clicked:", playlist.name);
    setSelectedPlaylist(playlist);
  };

  const handleModalClose = () => {
    console.log("Closing modal");
    setSelectedPlaylist(null);
  };

  const handleCreateNewPlaylist = () => {
    const playlistName = `My Playlist #${playlists.length + 1}`;
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
          {/* Search and Sort Controls */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8 px-4 md:px-6">
            <div className="relative w-full md:w-96">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search your playlists..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6] focus:border-transparent transition-all"
              />
            </div>

            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center gap-2 px-4 py-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/10 text-white hover:bg-white/20 transition-all"
              >
                <HiOutlineSortAscending className="w-5 h-5" />
                <span>
                  Sort by: {sortOptions.find((o) => o.value === sortBy)?.label}
                </span>
              </button>

              {showSortMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-[#1e1b4b]/95 backdrop-blur-xl rounded-lg shadow-2xl border border-white/10 overflow-hidden z-20">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortBy(option.value);
                        setShowSortMenu(false);
                      }}
                      className={`w-full px-4 py-3 text-left hover:bg-white/10 transition-colors ${
                        sortBy === option.value
                          ? "bg-white/10 text-[#14b8a6]"
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
        <UserPlaylistModal
          key={selectedPlaylist.id}
          playlist={selectedPlaylist}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
};

export default MyPlaylists;
