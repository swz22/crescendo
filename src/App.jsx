import { useState, Suspense } from "react";
import { useSelector } from "react-redux";
import { Route, Routes } from "react-router-dom";
import LeftSidebar from "./components/LeftSidebar";
import MusicPlayer from "./components/MusicPlayer";
import SidebarPlayer from "./components/SidebarPlayer";
import QueueIndicator from "./components/QueueIndicator";
import FloatingQueueButton from "./components/FloatingQueueButton";
import MobileQueueSheet from "./components/MobileQueueSheet";
import Loader from "./components/Loader";
import OnboardingModal from "./components/OnboardingModal";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
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

// Loading component for lazy loaded routes
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <Loader title="Loading..." />
  </div>
);

const App = () => {
  const { currentTrack } = useSelector((state) => state.player);
  const [mobileQueueOpen, setMobileQueueOpen] = useState(false);

  useKeyboardShortcuts();

  return (
    <div className="relative flex h-screen overflow-hidden">
      <LeftSidebar />

      <div className="flex-1 flex flex-col bg-gradient-to-br from-[#1a1848] via-[#2d2467] to-[#1a1848]">
        <div className="flex-1 overflow-y-auto custom-scrollbar sm:px-6 pb-24 sm:pb-40 lg:pb-32">
          <Suspense fallback={<PageLoader />}>
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
          </Suspense>
        </div>
      </div>

      {/* Desktop Queue - Hidden on mobile */}
      <div className="w-[380px] h-screen hidden lg:block">
        <SidebarPlayer />
      </div>

      {/* Mobile Queue Button - only show on mobile when music is playing */}
      <div className="sm:hidden">
        {currentTrack?.title && (
          <FloatingQueueButton onClick={() => setMobileQueueOpen(true)} />
        )}
      </div>

      {/* Mobile Queue Sheet */}
      <MobileQueueSheet
        isOpen={mobileQueueOpen}
        onClose={() => setMobileQueueOpen(false)}
      />

      {/* Music Player - Single instance for all screen sizes */}
      {currentTrack?.title && (
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
