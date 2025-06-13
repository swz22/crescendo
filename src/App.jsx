import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Route, Routes, useLocation } from "react-router-dom";
import {
  LeftSidebar,
  MusicPlayer,
  PlaylistPlayer,
  QueueIndicator,
  FloatingQueueButton,
  MobileQueueSheet,
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
  const [mobileQueueOpen, setMobileQueueOpen] = useState(false);
  const hideMainPlayer = isModalOpen;

  useEffect(() => {
    console.log("App.jsx - activeSong:", activeSong?.title);
    console.log("App.jsx - hideMainPlayer:", hideMainPlayer);
  }, [activeSong, hideMainPlayer]);

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

  return (
    <div className="relative flex h-screen overflow-hidden">
      <LeftSidebar />

      <div className="flex-1 flex flex-col bg-gradient-to-br from-[#1a1848] via-[#2d2467] to-[#1a1848]">
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-6 pb-24 sm:pb-40 lg:pb-32">
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

      {/* Desktop Queue - Hidden on mobile */}
      <div className="w-[380px] h-screen hidden lg:block">
        <PlaylistPlayer playlist={currentPlaylist} tracks={currentSongs} />
      </div>

      {/* Mobile Queue Button - only show on mobile when music is playing */}
      <div className="sm:hidden">
        {activeSong?.title && (
          <FloatingQueueButton onClick={() => setMobileQueueOpen(true)} />
        )}
      </div>

      {/* Mobile Queue Sheet */}
      <MobileQueueSheet
        isOpen={mobileQueueOpen}
        onClose={() => setMobileQueueOpen(false)}
      />

      {/* Music Player - Single instance for all screen sizes */}
      {activeSong?.title && !hideMainPlayer && (
        <div className="fixed h-20 sm:h-28 bottom-0 left-0 right-0 lg:left-[240px] lg:right-[380px] animate-slideup bg-gradient-to-br from-white/[0.08] to-[#2d2467]/90 backdrop-blur-xl z-50 border-t border-white/20 shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
          <MusicPlayer />
        </div>
      )}

      <OnboardingModal />
      <QueueIndicator />
    </div>
  );
};

export default App;
