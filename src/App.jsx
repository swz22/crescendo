import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Route, Routes, useLocation } from "react-router-dom";
import {
  LeftSidebar,
  MusicPlayer,
  PlaylistPlayer,
  QueueIndicator,
} from "./components";
import OnboardingModal from "./components/OnboardingModal";
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

      <div className="w-[380px] h-screen">
        <PlaylistPlayer playlist={currentPlaylist} tracks={currentSongs} />
      </div>

      {activeSong?.title && (
        <div
          className={`fixed h-28 bottom-0 left-[240px] right-[380px] animate-slideup bg-gradient-to-br from-white/[0.08] to-[#2d2467]/90 backdrop-blur-xl z-10 rounded-t-2xl border-t border-x border-white/20 shadow-[0_-10px_40px_rgba(0,0,0,0.3)] ${
            hideMainPlayer ? "invisible" : "visible"
          }`}
        >
          <MusicPlayer />
        </div>
      )}

      <OnboardingModal />
      <QueueIndicator />
    </div>
  );
};

export default App;
