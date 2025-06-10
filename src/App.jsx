import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Route, Routes, useLocation } from "react-router-dom";
import {
  LeftSidebar,
  MusicPlayer,
  MusicSidebar,
  FloatingMiniPlayer,
  PerformanceMonitor,
  PlaylistPlayer,
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
  const {
    activeSong,
    isModalOpen,
    playlistContext,
    isPlaying,
    currentPlaylist,
    currentSongs,
  } = useSelector((state) => state.player);
  const location = useLocation();
  const [playlistSession, setPlaylistSession] = useState(false);

  const showPlaylistPlayer = true;
  const showMusicSidebar = false;

  useEffect(() => {
    if (playlistContext && location.pathname === "/playlists") {
      setPlaylistSession(true);
    }
  }, [playlistContext, location.pathname]);

  useEffect(() => {
    if (location.pathname !== "/playlists") {
      setPlaylistSession(false);
    }
  }, [location.pathname]);

  const showFloatingPlayer = false;
  const hideMainPlayer = isModalOpen;

  return (
    <div className="relative flex h-screen overflow-hidden">
      <LeftSidebar />

      <div className="flex-1 flex flex-col bg-gradient-to-br from-[#1a1848] via-[#2d2467] to-[#1a1848]">
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-32">
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
      </div>

      <div className="w-[380px] h-full">
        {showMusicSidebar ? (
          <MusicSidebar />
        ) : (
          <PlaylistPlayer playlist={currentPlaylist} tracks={currentSongs} />
        )}
      </div>

      {activeSong?.title && (
        <div
          className={`fixed h-28 bottom-0 left-0 right-0 animate-slideup bg-gradient-to-br from-white/10 to-[#2d2467] backdrop-blur-lg z-10 ${
            hideMainPlayer ? "invisible" : "visible"
          }`}
        >
          <MusicPlayer />
        </div>
      )}

      <FloatingMiniPlayer isVisible={showFloatingPlayer} />
    </div>
  );
};

export default App;
