import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useScrollContainer } from "../context/ScrollContext";
import {
  playPause,
  playTrack,
  replaceContext,
  setModalOpen,
  toggleShuffle,
  switchContext,
  addToQueue,
} from "../redux/features/playerSlice";
import { usePreviewUrl } from "../hooks/usePreviewUrl";
import { useLoadingState } from "../hooks/useLoadingState";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { usePlaylistManager } from "../hooks/usePlaylistManager";
import PlayPause from "./PlayPause";
import LoadingState from "./LoadingState";
import MusicLoadingSpinner from "./MusicLoadingSpinner";
import SongMenu from "./SongMenu";
import ModalPlayer from "./ModalPlayer";
import NowPlaying from "./NowPlaying";
import { IoClose, IoArrowBack } from "react-icons/io5";
import { BsMusicNoteBeamed, BsClock, BsShuffle, BsFillPlayFill } from "react-icons/bs";
import { HiPlus, HiOutlinePencil, HiOutlineTrash, HiOutlineSparkles, HiDotsVertical } from "react-icons/hi";
import { useToast } from "../context/ToastContext";
import { isSameTrack, getTrackId } from "../utils/trackUtils";
import ConfirmDialog from "./ConfirmDialog";
import { Icon } from "@iconify/react";

const UserPlaylistModal = ({ playlist, initialMosaicImages, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const mainScrollContainerRef = useScrollContainer();
  const { currentTrack, isPlaying, activeContext, currentIndex, shuffle } = useSelector((state) => state.player);

  // Get current playlist from Redux store
  const currentPlaylist = useSelector((state) => state.player.playlists.find((p) => p.id === playlist.id)) || playlist;

  const { getPreviewUrl, prefetchMultiple } = usePreviewUrl();
  const { handleRemoveFromPlaylist, handleRenamePlaylist, handleDeletePlaylist } = usePlaylistManager();

  const [isAnimating, setIsAnimating] = useState(false);
  const [showNowPlaying, setShowNowPlaying] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(currentPlaylist.name);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [mosaicImages, setMosaicImages] = useState(initialMosaicImages || []);
  const scrollContainerRef = useRef(null);
  const activeTrackRef = useRef(null);
  const { showToast } = useToast();
  const { setLoading, isLoading } = useLoadingState();
  const isDesktopScreen = useMediaQuery("(min-width: 1480px)");
  const isTabletView = useMediaQuery("(min-width: 640px) and (max-width: 1479px)");

  const tracks = currentPlaylist.tracks || [];
  const placeholderImage =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNGE1NTY4Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2EwYWVjMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==";

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimating(true), 50);
    dispatch(setModalOpen(true));
    return () => clearTimeout(timer);
  }, [dispatch]);

  useEffect(() => {
    if (initialMosaicImages && initialMosaicImages.length > 0) {
      setMosaicImages(initialMosaicImages);
    } else if (tracks.length > 0) {
      const imagesToSet = tracks
        .slice(0, 4)
        .map((track) => track.album?.images?.[0]?.url || track.images?.coverart || placeholderImage)
        .filter((img) => img !== placeholderImage);

      if (imagesToSet.length > 0) {
        setMosaicImages(imagesToSet.length === 4 ? imagesToSet : Array(4).fill(imagesToSet[0] || placeholderImage));
      }
    }
  }, [playlist.id, initialMosaicImages, tracks]);

  // Prefetch preview URLs
  useEffect(() => {
    if (tracks.length > 0) {
      prefetchMultiple(tracks.slice(0, 10), { maxConcurrent: 3 });
    }
  }, [tracks, prefetchMultiple]);

  // Scroll to active track
  useEffect(() => {
    if (activeTrackRef.current && scrollContainerRef.current) {
      activeTrackRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [currentIndex, activeContext]);

  const handleClose = () => {
    setIsAnimating(false);
    dispatch(setModalOpen(false));
    setTimeout(onClose, 300);
  };

  const handlePlayClick = async (track, index) => {
    const trackId = getTrackId(track);
    setLoading(`track-${trackId}`, true);

    try {
      const trackWithPreview = await getPreviewUrl(track);
      if (trackWithPreview?.preview_url) {
        dispatch(
          replaceContext({
            contextType: currentPlaylist.id,
            tracks: tracks,
            startIndex: index,
            playlistData: {
              id: currentPlaylist.id,
              name: currentPlaylist.name,
              tracks: tracks,
            },
          })
        );
        showToast(`Playing from ${currentPlaylist.name}`);
      } else {
        showToast("No preview available", "error");
      }
    } catch (error) {
      console.error("Error playing track:", error);
      showToast("Error playing track", "error");
    } finally {
      setLoading(`track-${trackId}`, false);
    }
  };

  const handlePlayAll = async (shufflePlay = false) => {
    if (!tracks || tracks.length === 0) {
      showToast("Playlist is empty", "error");
      return;
    }

    const loadingKey = shufflePlay ? "shuffle-play" : "play-all";
    setLoading(loadingKey, true);

    const startIndex = shufflePlay ? Math.floor(Math.random() * tracks.length) : 0;
    const firstTrack = tracks[startIndex];

    if (firstTrack) {
      try {
        const trackWithPreview = await getPreviewUrl(firstTrack);
        const updatedTracks = [...tracks];
        updatedTracks[startIndex] = trackWithPreview || firstTrack;

        if (trackWithPreview?.preview_url) {
          if (shufflePlay && !shuffle) {
            dispatch(toggleShuffle());
          }

          dispatch(
            replaceContext({
              contextType: currentPlaylist.id,
              tracks: updatedTracks,
              startIndex,
              playlistData: { ...currentPlaylist, tracks: updatedTracks },
            })
          );
          showToast(shufflePlay ? "Shuffle playing playlist" : "Playing playlist");
        } else {
          showToast("No preview available", "error");
        }
      } catch (error) {
        console.error("Error getting preview URL:", error);
      } finally {
        setLoading(loadingKey, false);
      }
    }
  };

  const handleAddAllToQueue = () => {
    if (!tracks || tracks.length === 0) {
      showToast("No tracks to add", "error");
      return;
    }

    tracks.forEach((track) => {
      dispatch(addToQueue({ song: track, playNext: false }));
    });

    dispatch(switchContext({ contextType: "queue" }));
    showToast(`Added ${tracks.length} tracks to queue`);
  };

  const handlePauseClick = () => {
    dispatch(playPause(false));
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const formatDuration = (ms) => {
    if (!ms) return "--:--";
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const getTotalDuration = () => {
    if (!tracks || tracks.length === 0) return "0 min";
    const totalMs = tracks.reduce((acc, track) => acc + (track.duration_ms || 0), 0);
    const hours = Math.floor(totalMs / 3600000);
    const minutes = Math.floor((totalMs % 3600000) / 60000);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes} min`;
  };

  const handleSaveEdit = () => {
    if (editName.trim() && editName !== currentPlaylist.name) {
      handleRenamePlaylist(currentPlaylist.id, editName.trim());
    }
    setIsEditingName(false);
  };

  const handleDeleteConfirm = () => {
    handleDeletePlaylist(currentPlaylist.id);
    handleClose();
  };

  const isTrackActive = (track, index) => {
    if (activeContext !== currentPlaylist.id) return false;
    return currentIndex === index;
  };

  return (
    <>
      {/* Mobile Full Screen Modal */}
      <div
        className={`sm:hidden fixed inset-0 z-[100] bg-gradient-to-b from-[#1a1848] to-[#0f0b2d] transition-all duration-500 ${
          isAnimating ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Mobile Header */}
        <div className="sticky top-0 z-50 bg-gradient-to-b from-[#1a1848]/95 to-transparent backdrop-blur-lg pb-4">
          <div className="flex items-center justify-between p-4">
            <button onClick={handleClose} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
              <IoArrowBack className="w-6 h-6 text-white" />
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditingName(true)}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <HiOutlinePencil className="w-5 h-5 text-white" />
              </button>

              <button
                onClick={() => setShowDeleteDialog(true)}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <HiOutlineTrash className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Mobile Playlist Info */}
          <div className="px-4">
            <div className="flex items-start gap-4">
              <div className="relative w-24 h-24 rounded-lg overflow-hidden shadow-xl">
                {tracks.length === 0 ? (
                  <div className="w-full h-full bg-gradient-to-br from-[#2d2467]/60 to-[#1a1848]/80 flex items-center justify-center">
                    <Icon icon="solar:playlist-minimalistic-2-bold-duotone" className="w-12 h-12 text-white/25" />
                  </div>
                ) : mosaicImages.length === 4 ? (
                  <div className="grid grid-cols-2 gap-0.5 w-full h-full">
                    {mosaicImages.map((img, idx) => (
                      <img key={idx} src={img} alt="" className="w-full h-full object-cover" />
                    ))}
                  </div>
                ) : (
                  <img
                    src={mosaicImages[0] || placeholderImage}
                    alt={currentPlaylist.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              <div className="flex-1">
                {isEditingName ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={handleSaveEdit}
                    onKeyPress={(e) => e.key === "Enter" && handleSaveEdit()}
                    className="text-xl font-bold text-white bg-white/10 rounded px-2 py-1 mb-2 w-full"
                    autoFocus
                  />
                ) : (
                  <h1 className="text-xl font-bold text-white mb-1">{currentPlaylist.name}</h1>
                )}
                <p className="text-sm text-gray-400">
                  {tracks.length} songs • {getTotalDuration()}
                </p>
              </div>
            </div>

            {/* Mobile Action Buttons */}
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() => handlePlayAll(false)}
                disabled={isLoading("play-all") || tracks.length === 0}
                className="flex-1 flex items-center justify-center gap-2 bg-[#14b8a6] hover:bg-[#0d9488] text-white font-semibold py-3 px-4 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading("play-all") ? (
                  <LoadingState variant="button" text="Loading..." />
                ) : (
                  <>
                    <BsFillPlayFill size={20} />
                    <span>Play All</span>
                  </>
                )}
              </button>
              <button
                onClick={() => handlePlayAll(true)}
                disabled={isLoading("shuffle-play") || tracks.length === 0}
                className={`p-3 rounded-full transition-all ${
                  shuffle ? "bg-[#14b8a6] text-white" : "bg-white/10 text-white hover:bg-white/20"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isLoading("shuffle-play") ? <MusicLoadingSpinner size="sm" /> : <BsShuffle size={20} />}
              </button>
              <button
                onClick={handleAddAllToQueue}
                disabled={tracks.length === 0}
                className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <HiPlus size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pb-24" ref={scrollContainerRef}>
          {tracks.length === 0 ? (
            // Empty Playlist State
            <div className="flex items-center justify-center p-8 min-h-[400px]">
              <div className="text-center max-w-md mx-auto">
                <div className="mb-6 relative inline-block">
                  <div className="absolute inset-0 bg-[#14b8a6]/10 blur-3xl scale-150 animate-pulse-glow"></div>
                  <Icon
                    icon="solar:playlist-minimalistic-2-bold-duotone"
                    className="relative w-32 h-32 text-white/20 mx-auto"
                  />
                </div>

                <h3 className="text-2xl font-bold text-white mb-3">Your playlist is empty</h3>
                <p className="text-gray-400 mb-8 leading-relaxed">
                  Start building your collection by adding songs from anywhere in the app. Just tap the menu (⋮) on any
                  track.
                </p>

                <div className="bg-white/5 rounded-lg p-4 mb-6 border border-white/10">
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-10 h-10 bg-white/10 rounded flex items-center justify-center">
                      <HiDotsVertical className="w-5 h-5 text-white/50" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white/80">Look for this menu on any song</p>
                      <p className="text-xs text-white/50 mt-1">Tap to see playlist options</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    // Clear saved scroll position
                    sessionStorage.removeItem("crescendo_scroll_/");

                    // Immediately close without animation and navigate
                    setIsAnimating(false);
                    dispatch(setModalOpen(false));
                    onClose();
                    navigate("/");

                    // Scroll to top after navigation
                    requestAnimationFrame(() => {
                      if (mainScrollContainerRef.current) {
                        mainScrollContainerRef.current.scrollTop = 0;
                      }
                    });
                  }}
                  className="bg-[#14b8a6] hover:bg-[#0d9488] text-white font-semibold py-3 px-8 rounded-full transition-all transform hover:scale-105 inline-flex items-center gap-2 shadow-lg shadow-[#14b8a6]/30"
                >
                  <HiOutlineSparkles className="w-5 h-5" />
                  Browse Music
                </button>
              </div>
            </div>
          ) : (
            // Track List
            <div className="px-4 pb-4">
              {tracks.map((track, i) => {
                const isActive = isTrackActive(track, i);
                const trackId = getTrackId(track);

                return (
                  <div
                    key={`${trackId}-${i}`}
                    ref={isActive ? activeTrackRef : null}
                    onClick={() => handlePlayClick(track, i)}
                    className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                      isActive ? "bg-white/10" : "hover:bg-white/5"
                    }`}
                  >
                    <div className="relative w-12 h-12 rounded overflow-hidden bg-gray-800">
                      {track.images?.coverart || track.album?.images?.[0]?.url ? (
                        <img
                          src={track.images?.coverart || track.album?.images?.[0]?.url}
                          alt={track.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
                          <BsMusicNoteBeamed className="w-6 h-6 text-gray-600" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate ${isActive ? "text-[#14b8a6]" : "text-white"}`}>
                        {track.title}
                      </p>
                      <p className="text-gray-400 text-sm truncate">{track.subtitle}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div onClick={(e) => e.stopPropagation()}>
                        <SongMenu
                          song={track}
                          onRemoveFromPlaylist={() => {
                            handleRemoveFromPlaylist(currentPlaylist.id, getTrackId(track));
                          }}
                        />
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <PlayPause
                          song={track}
                          handlePause={handlePauseClick}
                          handlePlay={() => handlePlayClick(track, i)}
                          size={36}
                          isLoading={isLoading(`track-${getTrackId(track)}`)}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Tablet View */}
      {isTabletView && (
        <div className="hidden sm:block desktop:hidden">
          <div
            className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
              isAnimating ? "opacity-100" : "opacity-0"
            }`}
            onClick={handleBackdropClick}
          />

          <div
            className={`fixed inset-x-4 inset-y-4 md:inset-8 lg:inset-12 z-[60] transition-all duration-500 ${
              isAnimating ? "opacity-100 scale-100" : "opacity-0 scale-95"
            }`}
          >
            <div className="bg-gradient-to-b from-[#1a1848] to-[#0f0b2d] h-full rounded-2xl shadow-2xl overflow-hidden">
              <div className="h-full flex">
                {/* Left Panel */}
                <div className="w-[340px] p-6 border-r border-white/10 flex flex-col bg-gradient-to-b from-transparent to-black/20 relative">
                  <button
                    onClick={handleClose}
                    className="absolute top-6 left-6 p-2.5 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all z-20 border border-white/10"
                  >
                    <IoArrowBack className="w-5 h-5 text-white" />
                  </button>

                  <div className="flex-1 flex flex-col items-center justify-center">
                    {/* Playlist Image */}
                    <div className="relative w-48 h-48 rounded-xl overflow-hidden shadow-2xl mb-4">
                      {tracks.length === 0 ? (
                        <div className="w-full h-full bg-gradient-to-br from-[#2d2467]/60 to-[#1a1848]/80 flex items-center justify-center">
                          <Icon icon="solar:playlist-minimalistic-2-bold-duotone" className="w-24 h-24 text-white/25" />
                        </div>
                      ) : mosaicImages.length === 4 ? (
                        <div className="grid grid-cols-2 gap-0.5 w-full h-full">
                          {mosaicImages.map((img, idx) => (
                            <img key={idx} src={img} alt="" className="w-full h-full object-cover" />
                          ))}
                        </div>
                      ) : (
                        <img
                          src={mosaicImages[0] || placeholderImage}
                          alt={currentPlaylist.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>

                    {/* Playlist Details */}
                    <div className="text-center">
                      <p className="text-sm text-[#14b8a6] font-semibold mb-3 tracking-wider uppercase">
                        Your Playlist
                      </p>
                      {isEditingName ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onBlur={handleSaveEdit}
                          onKeyPress={(e) => e.key === "Enter" && handleSaveEdit()}
                          className="text-3xl font-bold text-white bg-white/10 rounded px-3 py-2 mb-4 mx-auto max-w-[300px]"
                          autoFocus
                        />
                      ) : (
                        <h1 className="text-3xl font-bold text-white mb-5">{currentPlaylist.name}</h1>
                      )}
                      <div className="flex items-center justify-center gap-4 text-sm text-gray-300 mb-6">
                        <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full">
                          <BsMusicNoteBeamed className="text-[#14b8a6]" />
                          <span>{tracks.length} songs</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full">
                          <BsClock className="text-purple-400" />
                          <span>{getTotalDuration()}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col items-center gap-3">
                        {/* Play All button */}
                        <button
                          onClick={() => handlePlayAll(false)}
                          disabled={isLoading("play-all") || tracks.length === 0}
                          className="flex items-center gap-2 bg-[#14b8a6] hover:bg-[#0d9488] text-white font-semibold py-2.5 px-5 rounded-full transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                          {isLoading("play-all") ? (
                            <LoadingState variant="button" text="Loading..." />
                          ) : (
                            <>
                              <BsFillPlayFill size={22} />
                              <span>Play All</span>
                            </>
                          )}
                        </button>

                        {/* Other buttons */}
                        <div className="flex items-center gap-3">
                          <div className="relative group">
                            <button
                              onClick={() => handlePlayAll(true)}
                              disabled={isLoading("shuffle-play") || tracks.length === 0}
                              className={`p-3 rounded-full transition-all ${
                                shuffle ? "bg-white/10 text-[#14b8a6]" : "bg-white/10 text-white hover:bg-white/20"
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {isLoading("shuffle-play") ? <MusicLoadingSpinner size="sm" /> : <BsShuffle size={15} />}
                            </button>
                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                              Shuffle Play
                            </span>
                          </div>
                          <div className="relative group">
                            <button
                              onClick={handleAddAllToQueue}
                              disabled={tracks.length === 0}
                              className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <HiPlus size={15} />
                            </button>
                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                              Add to Queue
                            </span>
                          </div>
                          <div className="relative group">
                            <button
                              onClick={() => setIsEditingName(true)}
                              className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
                            >
                              <HiOutlinePencil size={15} />
                            </button>
                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                              Rename
                            </span>
                          </div>
                          <div className="relative group">
                            <button
                              onClick={() => setShowDeleteDialog(true)}
                              className="p-3 rounded-full bg-white/10 text-white hover:bg-red-500/20 hover:text-red-400 transition-all"
                            >
                              <HiOutlineTrash size={15} />
                            </button>
                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                              Delete Playlist
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Panel - Track List */}
                <div className="flex-1 overflow-hidden">
                  {tracks.length === 0 ? (
                    // Empty Playlist State
                    <div className="flex items-center justify-center h-full p-8">
                      <div className="text-center max-w-md mx-auto">
                        <div className="mb-6 relative inline-block">
                          <div className="absolute inset-0 bg-[#14b8a6]/10 blur-3xl scale-150 animate-pulse-glow"></div>
                          <Icon
                            icon="solar:playlist-minimalistic-2-bold-duotone"
                            className="relative w-32 h-32 text-white/20 mx-auto"
                          />
                        </div>

                        <h3 className="text-2xl font-bold text-white mb-3">Your playlist is empty</h3>
                        <p className="text-gray-400 mb-8 leading-relaxed">
                          Start building your collection by adding songs from anywhere in the app. Just click the menu
                          (⋮) on any track.
                        </p>

                        <div className="bg-white/5 rounded-lg p-4 mb-6 border border-white/10">
                          <div className="flex items-center gap-3 text-left">
                            <div className="w-10 h-10 bg-white/10 rounded flex items-center justify-center">
                              <HiDotsVertical className="w-5 h-5 text-white/50" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-white/80">Look for this menu on any song</p>
                              <p className="text-xs text-white/50 mt-1">Click to see playlist options</p>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            // Clear saved scroll position
                            sessionStorage.removeItem("crescendo_scroll_/");

                            // Immediately close without animation and navigate
                            setIsAnimating(false);
                            dispatch(setModalOpen(false));
                            onClose();
                            navigate("/");

                            // Scroll to top after navigation
                            requestAnimationFrame(() => {
                              if (mainScrollContainerRef.current) {
                                mainScrollContainerRef.current.scrollTop = 0;
                              }
                            });
                          }}
                          className="bg-[#14b8a6] hover:bg-[#0d9488] text-white font-semibold py-3 px-8 rounded-full transition-all transform hover:scale-105 inline-flex items-center gap-2 shadow-lg shadow-[#14b8a6]/30"
                        >
                          <HiOutlineSparkles className="w-5 h-5" />
                          Browse Music
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full overflow-y-auto custom-scrollbar" ref={scrollContainerRef}>
                      <div className="p-4 pb-24">
                        {tracks.map((track, i) => {
                          const isActive = isTrackActive(track, i);
                          const trackId = getTrackId(track);

                          return (
                            <div
                              key={`${trackId}-${i}`}
                              ref={isActive ? activeTrackRef : null}
                              onClick={() => handlePlayClick(track, i)}
                              className={`group flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-all ${
                                isActive ? "bg-white/10" : "hover:bg-white/5"
                              }`}
                            >
                              <div
                                className={`flex items-center justify-center w-7 h-7 rounded-lg
    text-xs font-semibold transition-all duration-200
    bg-white/[0.08] border border-white/10 text-white/70`}
                              >
                                {i + 1}
                              </div>

                              <div className="relative w-12 h-12 rounded overflow-hidden bg-gray-800">
                                {track.images?.coverart || track.album?.images?.[0]?.url ? (
                                  <img
                                    src={track.images?.coverart || track.album?.images?.[0]?.url}
                                    alt={track.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
                                    <BsMusicNoteBeamed className="w-6 h-6 text-gray-600" />
                                  </div>
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <p className={`font-medium truncate ${isActive ? "text-[#14b8a6]" : "text-white"}`}>
                                  {track.title}
                                </p>
                                <p className="text-gray-400 text-sm truncate">{track.subtitle}</p>
                              </div>

                              <span className="text-gray-400 text-sm hidden md:block">
                                {formatDuration(track.duration_ms)}
                              </span>

                              <div className="flex items-center gap-2">
                                <div onClick={(e) => e.stopPropagation()}>
                                  <SongMenu
                                    song={track}
                                    onRemoveFromPlaylist={() => {
                                      handleRemoveFromPlaylist(currentPlaylist.id, getTrackId(track));
                                    }}
                                  />
                                </div>
                                <div onClick={(e) => e.stopPropagation()}>
                                  <PlayPause
                                    song={track}
                                    handlePause={handlePauseClick}
                                    handlePlay={() => handlePlayClick(track, i)}
                                    size={35}
                                    isLoading={isLoading(`track-${getTrackId(track)}`)}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {/* Modal Player */}
              {isTabletView && currentTrack && <ModalPlayer onOpenNowPlaying={() => setShowNowPlaying(true)} />}
            </div>
          </div>
        </div>
      )}

      {/* Desktop View (1480px+) */}
      {isDesktopScreen && (
        <div className="hidden desktop:block">
          <div
            className={`fixed inset-0 z-40 bg-black/70 backdrop-blur-md transition-all duration-300 ${
              isAnimating ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            onClick={handleBackdropClick}
            style={{
              right: "380px",
            }}
          />

          {/* Slide-in Modal */}
          <div
            className={`fixed left-0 bottom-0 top-0 z-50 transition-all duration-500 overflow-hidden ${
              isAnimating ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"
            }`}
            style={{
              right: "380px",
              background: "linear-gradient(135deg, #1a1848 0%, #0f0b2d 100%)",
              boxShadow: isAnimating ? "0 0 50px rgba(20, 184, 166, 0.15)" : "none",
            }}
          >
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#14b8a6]/5 via-transparent to-purple-600/5 pointer-events-none"></div>
            <div className="h-full flex relative">
              {/* Left Panel */}
              <div className="w-[400px] 2xl:w-[450px] flex-shrink-0 p-6 2xl:p-8 flex flex-col relative">
                <div className="absolute top-20 left-10 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 right-10 w-40 h-40 bg-[#14b8a6]/20 rounded-full blur-3xl"></div>

                <button
                  onClick={handleClose}
                  className="absolute top-6 left-6 p-2.5 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all z-20 border border-white/10"
                >
                  <IoArrowBack className="w-5 h-5 text-white" />
                </button>

                <div className="flex-1 flex flex-col items-center justify-center">
                  {/* Playlist Image */}
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-[#14b8a6] to-purple-600 rounded-3xl blur-lg opacity-30 group-hover:opacity-50 transition duration-500"></div>
                    <div className="relative w-72 h-72 rounded-3xl overflow-hidden shadow-2xl">
                      {tracks.length === 0 ? (
                        <div className="w-full h-full bg-gradient-to-br from-[#2d2467]/60 to-[#1a1848]/80 flex items-center justify-center">
                          <Icon icon="solar:playlist-minimalistic-2-bold-duotone" className="w-32 h-32 text-white/25" />
                        </div>
                      ) : mosaicImages.length === 4 ? (
                        <div className="grid grid-cols-2 gap-0.5 w-full h-full">
                          {mosaicImages.map((img, idx) => (
                            <img key={idx} src={img} alt="" className="w-full h-full object-cover" />
                          ))}
                        </div>
                      ) : (
                        <img
                          src={mosaicImages[0] || placeholderImage}
                          alt={currentPlaylist.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  </div>

                  {/* Playlist Details */}
                  <div className="text-center mt-6">
                    <p className="text-sm text-[#14b8a6] font-semibold mb-3 tracking-wider uppercase">Your Playlist</p>
                    {isEditingName ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={handleSaveEdit}
                        onKeyPress={(e) => e.key === "Enter" && handleSaveEdit()}
                        className="text-4xl font-bold text-white bg-white/10 rounded px-4 py-2 mb-4 max-w-[350px]"
                        autoFocus
                      />
                    ) : (
                      <h1 className="text-4xl font-bold text-white mb-6">{currentPlaylist.name}</h1>
                    )}
                    <div className="flex items-center justify-center gap-5 text-sm text-gray-300 mb-6">
                      <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full">
                        <BsMusicNoteBeamed className="text-[#14b8a6]" />
                        <span>{tracks.length} songs</span>
                      </div>
                      <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full">
                        <BsClock className="text-purple-400" />
                        <span>{getTotalDuration()}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col items-center gap-3">
                      {/* Play All button */}
                      <button
                        onClick={() => handlePlayAll(false)}
                        disabled={isLoading("play-all") || tracks.length === 0}
                        className="flex items-center gap-2 mb-3 bg-[#14b8a6] hover:bg-[#0d9488] text-white font-semibold py-3 px-6 rounded-full transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      >
                        {isLoading("play-all") ? (
                          <LoadingState variant="button" text="Loading..." />
                        ) : (
                          <>
                            <BsFillPlayFill size={24} />
                            <span>Play All</span>
                          </>
                        )}
                      </button>

                      {/* Other buttons */}
                      <div className="flex items-center gap-3">
                        <div className="relative group">
                          <button
                            onClick={() => handlePlayAll(true)}
                            disabled={isLoading("shuffle-play") || tracks.length === 0}
                            className={`p-3 rounded-full transition-all ${
                              shuffle ? "bg-white/10 text-[#14b8a6]" : "bg-white/10 text-white hover:bg-white/20"
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {isLoading("shuffle-play") ? <MusicLoadingSpinner size="sm" /> : <BsShuffle size={15} />}
                          </button>
                          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                            Shuffle Play
                          </span>
                        </div>
                        <div className="relative group">
                          <button
                            onClick={handleAddAllToQueue}
                            disabled={tracks.length === 0}
                            className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <HiPlus size={15} />
                          </button>
                          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                            Add to Queue
                          </span>
                        </div>
                        <div className="relative group">
                          <button
                            onClick={() => setIsEditingName(true)}
                            className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
                          >
                            <HiOutlinePencil size={15} />
                          </button>
                          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                            Rename
                          </span>
                        </div>
                        <div className="relative group">
                          <button
                            onClick={() => setShowDeleteDialog(true)}
                            className="p-3 rounded-full bg-white/10 text-white hover:bg-red-500/20 hover:text-red-400 transition-all"
                          >
                            <HiOutlineTrash size={15} />
                          </button>
                          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                            Delete Playlist
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Panel - Track List */}
              <div className="flex-1 overflow-hidden flex flex-col">
                {tracks.length === 0 ? (
                  // Empty Playlist State
                  <div className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center max-w-md mx-auto">
                      <div className="mb-6 relative inline-block">
                        <div className="absolute inset-0 bg-[#14b8a6]/10 blur-3xl scale-150 animate-pulse-glow"></div>
                        <Icon
                          icon="solar:playlist-minimalistic-2-bold-duotone"
                          className="relative w-32 h-32 text-white/20 mx-auto"
                        />
                      </div>

                      <h3 className="text-2xl font-bold text-white mb-3">Your playlist is empty</h3>
                      <p className="text-gray-400 mb-8 leading-relaxed">
                        Start building your collection by adding songs from anywhere in the app. Just click the menu (⋮)
                        on any track.
                      </p>

                      <div className="bg-white/5 rounded-lg p-4 mb-6 border border-white/10">
                        <div className="flex items-center gap-3 text-left">
                          <div className="w-10 h-10 bg-white/10 rounded flex items-center justify-center">
                            <HiDotsVertical className="w-5 h-5 text-white/50" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-white/80">Look for this menu on any song</p>
                            <p className="text-xs text-white/50 mt-1">Click to see playlist options</p>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          // Clear saved scroll position
                          sessionStorage.removeItem("crescendo_scroll_/");

                          // Immediately close without animation and navigate
                          setIsAnimating(false);
                          dispatch(setModalOpen(false));
                          onClose();
                          navigate("/");

                          // Scroll to top after navigation
                          requestAnimationFrame(() => {
                            if (mainScrollContainerRef.current) {
                              mainScrollContainerRef.current.scrollTop = 0;
                            }
                          });
                        }}
                        className="bg-[#14b8a6] hover:bg-[#0d9488] text-white font-semibold py-3 px-8 rounded-full transition-all transform hover:scale-105 inline-flex items-center gap-2 shadow-lg shadow-[#14b8a6]/30"
                      >
                        <HiOutlineSparkles className="w-5 h-5" />
                        Browse Music
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Track List */}
                    <div className="flex-1 mt-20 overflow-y-auto custom-scrollbar" ref={scrollContainerRef}>
                      <div className="p-4 pt-0">
                        {tracks.map((track, i) => {
                          const isActive = isTrackActive(track, i);
                          const trackId = getTrackId(track);

                          return (
                            <div
                              key={`${trackId}-${i}`}
                              ref={isActive ? activeTrackRef : null}
                              onClick={() => handlePlayClick(track, i)}
                              className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                                isActive ? "bg-white/10" : "hover:bg-white/5"
                              }`}
                            >
                              {/* Track Number with Border */}
                              <div
                                className={`flex items-center justify-center w-7 h-7 rounded-lg
    text-xs font-semibold transition-all duration-200
    bg-white/[0.08] border border-white/10 text-white/70`}
                              >
                                {i + 1}
                              </div>

                              {/* Album Art */}
                              <div className="relative w-12 h-12 rounded overflow-hidden bg-gray-800 flex-shrink-0">
                                {track.images?.coverart || track.album?.images?.[0]?.url ? (
                                  <img
                                    src={track.images?.coverart || track.album?.images?.[0]?.url}
                                    alt={track.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
                                    <BsMusicNoteBeamed className="w-6 h-6 text-gray-600" />
                                  </div>
                                )}
                              </div>

                              {/* Track Info */}
                              <div className="flex-1 min-w-0">
                                <p
                                  className={`font-medium truncate ${
                                    isActive ? "text-[#14b8a6]" : "text-white group-hover:text-[#14b8a6]"
                                  }`}
                                >
                                  {track.title}
                                </p>
                                <p className="text-gray-400 text-sm truncate">{track.subtitle}</p>
                              </div>

                              {/* Duration */}
                              <span className="text-gray-400 text-sm tabular-nums mr-2">
                                {formatDuration(track.duration_ms)}
                              </span>

                              {/* Actions */}
                              <div className="flex items-center gap-3 mr-6">
                                <div onClick={(e) => e.stopPropagation()}>
                                  <SongMenu
                                    song={track}
                                    onRemoveFromPlaylist={() => {
                                      handleRemoveFromPlaylist(currentPlaylist.id, getTrackId(track));
                                    }}
                                  />
                                </div>
                                <div onClick={(e) => e.stopPropagation()}>
                                  <PlayPause
                                    song={track}
                                    handlePause={handlePauseClick}
                                    handlePlay={() => handlePlayClick(track, i)}
                                    size={35}
                                    isLoading={isLoading(`track-${getTrackId(track)}`)}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Now Playing Modal */}
      {showNowPlaying && <NowPlaying isOpen={showNowPlaying} onClose={() => setShowNowPlaying(false)} />}

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Playlist"
        message={`Are you sure you want to delete "${currentPlaylist.name}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="danger"
      />
    </>
  );
};

export default UserPlaylistModal;
