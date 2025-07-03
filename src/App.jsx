import { useState, Suspense, useEffect } from "react";
import { useSelector } from "react-redux";
import { Route, Routes, useLocation } from "react-router-dom";
import LeftSidebar from "./components/LeftSidebar";
import MusicPlayer from "./components/MusicPlayer";
import SidebarPlayer from "./components/SidebarPlayer";
import QueueIndicator from "./components/QueueIndicator";
import NowPlaying from "./components/NowPlaying";
import Loader from "./components/Loader";
import OnboardingModal from "./components/OnboardingModal";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useMediaQuery } from "./hooks/useMediaQuery";
import { ScrollProvider, useScrollContainer } from "./context/ScrollContext";
import {
  AlbumDetails,
  ArtistDetails,
  TopAlbums,
  TopArtists,
  Discover,
  Search,
  SongDetails,
  NewReleases,
  CommunityPlaylists,
} from "./pages";

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <Loader title="Loading..." />
  </div>
);

// Routes that should always start at top
const detailRoutes = ["/artists/", "/albums/", "/songs/"];

const MainContent = () => {
  const scrollContainerRef = useScrollContainer();
  const location = useLocation();
  const { currentTrack, modalOpen } = useSelector((state) => state.player);
  const [mobileQueueOpen, setMobileQueueOpen] = useState(false);
  const isDesktopView = useMediaQuery("(min-width: 1480px)");
  const isTabletView = useMediaQuery(
    "(min-width: 640px) and (max-width: 1479px)"
  );

  // Force scroll to top for detail pages
  useEffect(() => {
    const isDetailPage = detailRoutes.some((route) =>
      location.pathname.includes(route)
    );

    if (isDetailPage && scrollContainerRef.current) {
      // Ensure DOM is ready
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = 0;
        }
      }, 0);
    }
  }, [location.pathname, scrollContainerRef]);

  return (
    <>
      <LeftSidebar />
      <div className="flex-1 flex flex-col bg-gradient-to-br from-[#1a1848] via-[#2d2467] to-[#1a1848] min-w-0">
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto custom-scrollbar md:px-6 pb-24 tablet:pb-36 desktop:pb-40"
        >
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Discover />} />
              <Route path="/top-albums" element={<TopAlbums />} />
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
      {/* Desktop Queue */}
      {isDesktopView && (
        <div className="w-[380px] h-screen">
          <SidebarPlayer />
        </div>
      )}
      {/* Mobile Queue Sheet */}
      <NowPlaying
        isOpen={mobileQueueOpen}
        onClose={() => setMobileQueueOpen(false)}
      />
      {/* Music Player - Hide in tablet and desktop views when modal is open */}
      {currentTrack?.title && (
        <div
          className={`fixed h-24 tablet:h-24 desktop:h-28 bottom-0 left-0 md:left-[240px] right-0 bg-gradient-to-br from-white/[0.08] to-[#2d2467]/90 backdrop-blur-xl z-50 border-t border-white/20 shadow-[0_-10px_40px_rgba(0,0,0,0.3)] md:rounded-tl-2xl rounded-t-2xl overflow-hidden transition-all duration-300 ease-in-out ${
            (isTabletView || isDesktopView) && modalOpen
              ? "translate-y-full opacity-0 pointer-events-none"
              : "translate-y-0 opacity-100 animate-slideup"
          } ${isDesktopView ? "!right-[380px]" : ""}`}
        >
          <MusicPlayer onOpenQueue={() => setMobileQueueOpen(true)} />
        </div>
      )}
      <OnboardingModal />
      <QueueIndicator />
    </>
  );
};

const App = () => {
  useKeyboardShortcuts();

  return (
    <ScrollProvider>
      <div className="relative flex h-screen overflow-hidden">
        <MainContent />
      </div>
    </ScrollProvider>
  );
};

export default App;
