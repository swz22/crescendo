import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Route, Routes, useLocation } from "react-router-dom";
import { Searchbar, LeftSidebar, MusicPlayer, MusicSidebar, FloatingMiniPlayer } from "./components";
import {
  ArtistDetails,
  TopArtists,
  Discover,
  Search,
  SongDetails,
  NewReleases,
  CommunityPlaylists,
} from "./pages";

const App = () => {
  const { activeSong, isModalOpen, playlistContext, isPlaying } = useSelector((state) => state.player);
  const location = useLocation();
  const [playlistSession, setPlaylistSession] = useState(false);
  
  console.log('All env variables:', import.meta.env);
  
  // Start playlist session when we have a playlist context
  useEffect(() => {
    if (playlistContext && location.pathname === '/playlists') {
      setPlaylistSession(true);
    }
  }, [playlistContext, location.pathname]);
  
  // Only end playlist session when we navigate away from playlists page
  useEffect(() => {
    if (location.pathname !== '/playlists') {
      setPlaylistSession(false);
    }
  }, [location.pathname]);
  
  // Show floating player during playlist session
  const showFloatingPlayer = playlistSession && location.pathname === '/playlists';
  
  // Hide main player when modal is open OR when floating player is shown
  const hideMainPlayer = isModalOpen || showFloatingPlayer;
  
  return (
    <div className="relative flex">
      <LeftSidebar />
      <div className="flex-1 flex flex-col bg-gradient-to-r from-[#110d36] via-[#352f73] to-[#110d36]">
        <Searchbar />
        <div className="px-6 h-[calc(100vh-72px)] overflow-y-scroll custom-scrollbar flex xl:flex-row flex-col-reverse">
          <div className="flex-1 h-fit pb-40">
            <Routes>
              <Route path="/" element={<Discover />} />
              <Route path="/top-artists" element={<TopArtists />} />
              <Route path="/new-releases" element={<NewReleases />} />
              <Route path="/playlists" element={<CommunityPlaylists />} />
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
      
      {/* Always render the music player, but hide it visually when appropriate */}
      {activeSong?.title && (
        <div className={`absolute h-28 bottom-0 left-0 right-0 flex animate-slideup bg-gradient-to-br from-white/10 to-[#2a2a80] backdrop-blur-lg rounded-t-3xl z-10 ${
          hideMainPlayer ? 'invisible' : 'visible'
        }`}>
          <MusicPlayer />
        </div>
      )}
      
      {/* Global floating player - show during playlist session regardless of activeSong state */}
      <FloatingMiniPlayer isVisible={showFloatingPlayer} />
    </div>
  );
};

export default App;