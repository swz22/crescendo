import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Route, Routes, useLocation } from "react-router-dom";
import {
  Searchbar,
  LeftSidebar,
  MusicPlayer,
  MusicSidebar,
  FloatingMiniPlayer,
  PerformanceMonitor,
} from "./components";
import {
  AlbumDetails,
  ArtistDetails,
  TopArtists,
  Discover,
  Search,
  SongDetails,
  NewReleases,
  CommunityPlaylists,
} from "./pages";

const App = () => {
  const { activeSong, isModalOpen, playlistContext, isPlaying } = useSelector(
    (state) => state.player
  );
  const location = useLocation();
  const [playlistSession, setPlaylistSession] = useState(false);

  // Start playlist session when we have a playlist context
  useEffect(() => {
    if (playlistContext && location.pathname === "/playlists") {
      setPlaylistSession(true);
    }
  }, [playlistContext, location.pathname]);

  // Only end playlist session when we navigate away from playlists page
  useEffect(() => {
    if (location.pathname !== "/playlists") {
      setPlaylistSession(false);
    }
  }, [location.pathname]);

  // Show floating player during playlist session
  const showFloatingPlayer =
    playlistSession && location.pathname === "/playlists";

  // Hide main player when modal is open OR when floating player is shown
  const hideMainPlayer = isModalOpen || showFloatingPlayer;

  return (
    <div className="relative flex">
      <LeftSidebar />
      <div className="flex-1 flex flex-col bg-gradient-to-br from-[#1a1848] via-[#2d2467] to-[#1a1848]">
        {/* Top Bar */}
        <div className="relative flex items-center justify-between px-6 py-3 bg-black/20 backdrop-blur-md border-b border-white/5">
          {/* Empty left section for balance */}
          <div className="w-32"></div>

          {/* Centered Search */}
          <div className="flex-1 max-w-2xl">
            <Searchbar />
          </div>

          {/* Right section - just placeholder now */}
          <div className="w-32 flex justify-end">
            {/* PerformanceMonitor moved out - placeholder for alignment */}
          </div>
        </div>

        <div className="px-6 h-[calc(100vh-68px)] overflow-y-scroll custom-scrollbar flex xl:flex-row flex-col-reverse">
          <div className="flex-1 h-fit pb-40">
            <Routes>
              <Route path="/" element={<Discover />} />
              <Route path="/top-artists" element={<TopArtists />} />
              <Route path="/new-releases" element={<NewReleases />} />
              <Route path="/playlists" element={<CommunityPlaylists />} />
              <Route path="/albums/:id" element={<AlbumDetails />} />
              <Route path="/artists/:id" element={<ArtistDetails />} />
              <Route path="/songs/:songid" element={<SongDetails />} />
              <Route path="/search/:searchTerm" element={<Search />} />
            </Routes>
          </div>
          <div className="xl:sticky relative top-0 h-fit">
            <MusicSidebar />
          </div>
        </div>
      </div>

      {/* Music Player */}
      {activeSong?.title && (
        <div
          className={`absolute h-28 bottom-0 left-0 right-0 flex animate-slideup bg-gradient-to-br from-white/10 to-[#2d2467] backdrop-blur-lg rounded-t-3xl z-10 ${
            hideMainPlayer ? "invisible" : "visible"
          }`}
        >
          <MusicPlayer />
        </div>
      )}

      {/* Floating player */}
      <FloatingMiniPlayer isVisible={showFloatingPlayer} />

      {/* PerformanceMonitor at root level - outside all containers */}
      <PerformanceMonitor />
    </div>
  );
};

export default App;
