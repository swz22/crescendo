import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  playPause,
  playTrack,
  replaceContext,
  setModalOpen,
  toggleShuffle,
  switchContext,
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
import {
  BsMusicNoteBeamed,
  BsClock,
  BsShuffle,
  BsFillPlayFill,
  BsThreeDots,
} from "react-icons/bs";
import { HiPlus, HiOutlinePencil, HiOutlineTrash } from "react-icons/hi";
import { useToast } from "../context/ToastContext";
import { isSameTrack, getTrackId } from "../utils/trackUtils";
import ConfirmDialog from "./ConfirmDialog";

const UserPlaylistModal = ({ playlist, initialMosaicImages, onClose }) => {
  const dispatch = useDispatch();
  const { currentTrack, isPlaying, activeContext, currentIndex, shuffle } =
    useSelector((state) => state.player);
  const { getPreviewUrl, prefetchMultiple } = usePreviewUrl();
  const {
    handleRemoveFromPlaylist,
    handleRenamePlaylist,
    handleDeletePlaylist,
  } = usePlaylistManager();

  const [isAnimating, setIsAnimating] = useState(false);
  const [showNowPlaying, setShowNowPlaying] = useState(false);
  const [selectedTrackIndex, setSelectedTrackIndex] = useState(null);
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(playlist.name);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [mosaicImages, setMosaicImages] = useState(initialMosaicImages || []);
  const scrollContainerRef = useRef(null);
  const activeTrackRef = useRef(null);
  const { showToast } = useToast();
  const { setLoading, isLoading } = useLoadingState();
  const isDesktopScreen = useMediaQuery("(min-width: 1480px)");
  const isTabletView = useMediaQuery(
    "(min-width: 640px) and (max-width: 1479px)"
  );

  const tracks = playlist.tracks || [];
  const placeholderImage =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNGE1NTY4Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2EwYWVjMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==";

  useEffect(() => {
    if (!initialMosaicImages && tracks.length > 0) {
      const imagesToSet = tracks
        .slice(0, 4)
        .map(
          (track) =>
            track.album?.images?.[0]?.url ||
            track.images?.coverart ||
            placeholderImage
        )
        .filter((img) => img !== placeholderImage);

      if (imagesToSet.length > 0) {
        setMosaicImages(
          imagesToSet.length === 4
            ? imagesToSet
            : Array(4).fill(imagesToSet[0] || placeholderImage)
        );
      }
    }
  }, [tracks, initialMosaicImages]);

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimating(true), 50);
    dispatch(setModalOpen(true));
    return () => clearTimeout(timer);
  }, [dispatch]);

  useEffect(() => {
    if (tracks.length > 0) {
      prefetchMultiple(tracks.slice(0, 10), { maxConcurrent: 3 });
    }
  }, [tracks, prefetchMultiple]);

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
        // Switch to this playlist context
        dispatch(
          switchContext({
            contextType: playlist.id,
            contextData: {
              id: playlist.id,
              name: playlist.name,
              tracks: tracks,
            },
          })
        );

        dispatch(
          playTrack({
            track: trackWithPreview,
          })
        );
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
    if (!tracks || tracks.length === 0) return;

    const loadingKey = shufflePlay ? "shuffle-play" : "play-all";
    setLoading(loadingKey, true);

    const startIndex = shufflePlay
      ? Math.floor(Math.random() * tracks.length)
      : 0;
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
              contextType: playlist.id,
              tracks: updatedTracks,
              startIndex: startIndex,
              playlistData: {
                id: playlist.id,
                name: playlist.name,
                tracks: updatedTracks,
              },
            })
          );
          showToast(
            shufflePlay ? "Shuffle playing playlist" : "Playing playlist"
          );
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

  const handlePauseClick = () => {
    dispatch(playPause(false));
  };

  const handleRemoveTrack = (trackIndex) => {
    const track = tracks[trackIndex];
    handleRemoveFromPlaylist(playlist.id, getTrackId(track));
    showToast("Track removed from playlist");
    setSelectedTrackIndex(null);
  };

  const handleSaveEdit = () => {
    if (editName.trim() && editName !== playlist.name) {
      handleRenamePlaylist(playlist.id, editName.trim());
      showToast("Playlist renamed");
    }
    setIsEditingName(false);
  };

  const handleDeleteConfirm = () => {
    handleDeletePlaylist(playlist.id);
    showToast("Playlist deleted");
    handleClose();
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
    if (!tracks) return "0 min";
    const totalMs = tracks.reduce(
      (acc, track) => acc + (track.duration_ms || 0),
      0
    );
    const hours = Math.floor(totalMs / 3600000);
    const minutes = Math.floor((totalMs % 3600000) / 60000);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes} min`;
  };

  const isTrackActive = (track, index) => {
    if (activeContext !== playlist.id) return false;
    return currentIndex === index;
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".dropdown-menu")) {
        setSelectedTrackIndex(null);
        setShowPlaylistMenu(false);
      }
    };

    if (selectedTrackIndex !== null || showPlaylistMenu) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [selectedTrackIndex, showPlaylistMenu]);

  return (
    <>
      {/* Mobile Full Screen Modal */}
      <div
        className={`sm:hidden fixed inset-0 z-40 bg-gradient-to-b from-[#1a1848] to-[#0f0b2d] transition-all duration-500 ${
          isAnimating
            ? "translate-y-0 opacity-100"
            : "translate-y-full opacity-0"
        }`}
      >
        <div className="flex flex-col h-full pb-24">
          {/* Mobile Header */}
          <div className="flex items-center justify-between p-3 flex-shrink-0">
            <button
              onClick={handleClose}
              className="p-2 rounded-full bg-black/20 hover:bg-black/40 transition-all"
            >
              <IoArrowBack className="w-5 h-5 text-white" />
            </button>
            <h2 className="text-base font-semibold text-white uppercase tracking-wider">
              Your Playlist
            </h2>
            <button
              onClick={() => setShowPlaylistMenu(!showPlaylistMenu)}
              className="p-2 rounded-full bg-black/20 hover:bg-black/40 transition-all relative dropdown-menu"
            >
              <BsThreeDots className="w-5 h-5 text-white" />

              {showPlaylistMenu && (
                <div className="absolute right-0 top-12 w-48 bg-[#1e1b4b]/98 backdrop-blur-xl rounded-lg shadow-xl border border-white/20 overflow-hidden z-20">
                  <button
                    onClick={() => {
                      setIsEditingName(true);
                      setShowPlaylistMenu(false);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 text-white hover:bg-white/10 transition-colors text-left"
                  >
                    <HiOutlinePencil className="w-4 h-4" />
                    <span>Rename</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowPlaylistMenu(false);
                      setShowDeleteDialog(true);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-500/10 transition-colors text-left"
                  >
                    <HiOutlineTrash className="w-4 h-4" />
                    <span>Delete Playlist</span>
                  </button>
                </div>
              )}
            </button>
          </div>

          {/* Mobile Album Art and Info */}
          <div className="px-4 pb-4 flex-shrink-0">
            <div className="flex flex-col items-center">
              {/* Album art */}
              <div className="w-[100px] h-[100px] rounded-xl overflow-hidden shadow-2xl mb-3">
                {mosaicImages.length === 4 ? (
                  <div className="grid grid-cols-2 gap-0.5 w-full h-full">
                    {mosaicImages.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = placeholderImage;
                        }}
                      />
                    ))}
                  </div>
                ) : mosaicImages.length > 0 ? (
                  <img
                    src={mosaicImages[0]}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = placeholderImage;
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                    <BsMusicNoteBeamed className="w-12 h-12 text-white/20" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="text-center">
                {isEditingName ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveEdit();
                      if (e.key === "Escape") setIsEditingName(false);
                    }}
                    onBlur={handleSaveEdit}
                    className="text-xl font-bold bg-white/10 border border-white/20 rounded px-3 py-1 text-white outline-none focus:bg-white/20 focus:border-[#14b8a6]/50 text-center"
                    autoFocus
                  />
                ) : (
                  <h1 className="text-xl font-bold text-white mb-1">
                    {playlist.name}
                  </h1>
                )}
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>{tracks.length} songs</span>
                  <span>•</span>
                  <span>{getTotalDuration()}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={() => handlePlayAll(false)}
                  disabled={isLoading("play-all") || tracks.length === 0}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#14b8a6] hover:bg-[#0d9488] text-white font-semibold py-2.5 rounded-lg transition-all disabled:opacity-80 disabled:cursor-not-allowed"
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
                  className={`p-2 rounded-full transition-all ${
                    shuffle
                      ? "bg-white/10 text-[#14b8a6]"
                      : "bg-white/10 text-white hover:bg-white/20"
                  } disabled:opacity-80 disabled:cursor-not-allowed`}
                >
                  {isLoading("shuffle-play") ? (
                    <MusicLoadingSpinner size={20} />
                  ) : (
                    <BsShuffle size={20} />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Track list */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto px-4 pb-4"
          >
            {tracks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <BsMusicNoteBeamed className="w-16 h-16 mb-4 opacity-30" />
                <p className="text-lg">No tracks in this playlist</p>
                <p className="text-sm mt-2">Add some songs to get started!</p>
              </div>
            ) : (
              tracks.map((track, index) => {
                const isActive = isTrackActive(track, index);
                const trackId = getTrackId(track);
                const loadingKey = `track-${trackId}`;

                return (
                  <div
                    key={track.key || track.id || index}
                    ref={isActive ? activeTrackRef : null}
                    className={`flex items-center gap-3 p-3 rounded-lg mb-2 transition-all group ${
                      isActive ? "bg-[#14b8a6]/20" : "hover:bg-white/5"
                    }`}
                    onClick={() => handlePlayClick(track, index)}
                  >
                    <img
                      src={
                        track.album?.images?.[0]?.url ||
                        track.images?.coverart ||
                        placeholderImage
                      }
                      alt={track.title}
                      className={`w-12 h-12 rounded object-cover ${
                        isActive ? "ring-2 ring-[#14b8a6]" : ""
                      }`}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = placeholderImage;
                      }}
                    />

                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-medium truncate ${
                          isActive ? "text-[#14b8a6]" : "text-white"
                        }`}
                      >
                        {track.title || track.name}
                      </p>
                      <p className="text-sm text-gray-400 truncate">
                        {track.subtitle ||
                          track.artists?.map((a) => a.name).join(", ")}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div onClick={(e) => e.stopPropagation()}>
                        <SongMenu song={track} />
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <PlayPause
                          song={track}
                          handlePause={handlePauseClick}
                          handlePlay={() => handlePlayClick(track, index)}
                          size={35}
                          isLoading={isLoading(loadingKey)}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Tablet View */}
      {!isDesktopScreen && (
        <div className="hidden sm:block">
          <div
            className={`fixed inset-0 z-30 transition-all duration-300 ${
              isAnimating
                ? "bg-black/60 backdrop-blur-sm"
                : "bg-transparent pointer-events-none"
            }`}
            onClick={handleBackdropClick}
          />

          {/* Tablet Modal with Integrated Player */}
          <div
            className={`fixed z-40 bg-gradient-to-br from-[#1a1848] to-[#0f0b2d] rounded-2xl shadow-2xl transition-all duration-500 flex flex-col
              ${isAnimating ? "opacity-100 scale-100" : "opacity-0 scale-95"}
              left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-4xl`}
            style={{
              maxHeight: "85vh",
              height: "85vh",
            }}
          >
            <div className="flex flex-col h-full overflow-hidden rounded-2xl">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <button
                  onClick={handleClose}
                  className="p-2 rounded-full bg-black/20 hover:bg-black/40 transition-all"
                >
                  <IoArrowBack className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={() => setShowPlaylistMenu(!showPlaylistMenu)}
                  className="p-2 rounded-full bg-black/20 hover:bg-black/40 transition-all relative dropdown-menu"
                >
                  <BsThreeDots className="w-5 h-5 text-white" />
                  {showPlaylistMenu && (
                    <div className="absolute right-0 top-12 w-48 bg-[#1e1b4b]/98 backdrop-blur-xl rounded-lg shadow-xl border border-white/20 overflow-hidden z-20">
                      <button
                        onClick={() => {
                          setIsEditingName(true);
                          setShowPlaylistMenu(false);
                        }}
                        className="flex items-center gap-3 w-full px-4 py-3 text-white hover:bg-white/10 transition-colors text-left"
                      >
                        <HiOutlinePencil className="w-4 h-4" />
                        <span>Rename</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowPlaylistMenu(false);
                          setShowDeleteDialog(true);
                        }}
                        className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-500/10 transition-colors text-left"
                      >
                        <HiOutlineTrash className="w-4 h-4" />
                        <span>Delete Playlist</span>
                      </button>
                    </div>
                  )}
                </button>
              </div>

              {/* Content */}
              <div className="flex flex-col h-full overflow-hidden">
                <div className="flex gap-6 p-6 border-b border-white/10">
                  {/* Album Art */}
                  <div className="w-48 h-48 flex-shrink-0 rounded-xl overflow-hidden shadow-2xl">
                    {mosaicImages.length === 4 ? (
                      <div className="grid grid-cols-2 gap-0.5 w-full h-full">
                        {mosaicImages.map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = placeholderImage;
                            }}
                          />
                        ))}
                      </div>
                    ) : mosaicImages.length > 0 ? (
                      <img
                        src={mosaicImages[0]}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = placeholderImage;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                        <BsMusicNoteBeamed className="w-16 h-16 text-white/20" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <p className="text-sm text-[#14b8a6] font-medium mb-2">
                      YOUR PLAYLIST
                    </p>
                    {isEditingName ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit();
                          if (e.key === "Escape") setIsEditingName(false);
                        }}
                        onBlur={handleSaveEdit}
                        className="text-3xl font-bold bg-white/10 border border-white/20 rounded px-3 py-1 text-white outline-none focus:bg-white/20 focus:border-[#14b8a6]/50 mb-3 w-full"
                        autoFocus
                      />
                    ) : (
                      <h1 className="text-3xl font-bold text-white mb-3">
                        {playlist.name}
                      </h1>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                      <span>{tracks.length} songs</span>
                      <span>•</span>
                      <span>{getTotalDuration()}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handlePlayAll(false)}
                        disabled={isLoading("play-all") || tracks.length === 0}
                        className="flex items-center gap-2 bg-[#14b8a6] hover:bg-[#0d9488] text-white font-semibold py-3 px-6 rounded-full transition-all transform hover:scale-105 disabled:opacity-80 disabled:cursor-not-allowed disabled:hover:scale-100"
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
                      <button
                        onClick={() => handlePlayAll(true)}
                        disabled={
                          isLoading("shuffle-play") || tracks.length === 0
                        }
                        className={`p-3 rounded-full transition-all ${
                          shuffle
                            ? "bg-white/10 text-[#14b8a6]"
                            : "bg-white/10 text-white hover:bg-white/20"
                        } disabled:opacity-80 disabled:cursor-not-allowed`}
                      >
                        {isLoading("shuffle-play") ? (
                          <MusicLoadingSpinner size={20} />
                        ) : (
                          <BsShuffle size={20} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Track list */}
                <div className="flex-1 overflow-y-auto p-6">
                  {tracks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <BsMusicNoteBeamed className="w-16 h-16 mb-4 opacity-30" />
                      <p className="text-lg">No tracks in this playlist</p>
                      <p className="text-sm mt-2">
                        Add some songs to get started!
                      </p>
                    </div>
                  ) : (
                    tracks.map((track, index) => {
                      const isActive = isTrackActive(track, index);
                      const trackId = getTrackId(track);
                      const loadingKey = `track-${trackId}`;

                      return (
                        <div
                          key={track.key || track.id || index}
                          ref={isActive ? activeTrackRef : null}
                          className={`flex items-center gap-4 p-4 rounded-lg mb-2 transition-all group cursor-pointer ${
                            isActive ? "bg-white/10" : "hover:bg-white/5"
                          }`}
                          onClick={() => handlePlayClick(track, index)}
                        >
                          <span className="text-gray-400 text-sm w-8 text-center">
                            {index + 1}
                          </span>

                          <img
                            src={
                              track.images?.coverart ||
                              track.album?.images?.[0]?.url ||
                              placeholderImage
                            }
                            alt={track.title}
                            className={`w-12 h-12 rounded object-cover ${
                              isActive ? "ring-2 ring-[#14b8a6]" : ""
                            }`}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = placeholderImage;
                            }}
                          />

                          <div className="flex-1 min-w-0">
                            <p
                              className={`font-medium truncate ${
                                isActive
                                  ? "text-[#14b8a6]"
                                  : "text-white group-hover:text-[#14b8a6]"
                              }`}
                            >
                              {track.title}
                            </p>
                            <p className="text-gray-400 text-sm truncate">
                              {track.subtitle}
                            </p>
                          </div>

                          <span className="text-gray-400 text-sm tabular-nums">
                            {formatDuration(track.duration_ms)}
                          </span>

                          <div className="flex items-center gap-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTrackIndex(
                                  selectedTrackIndex === index ? null : index
                                );
                              }}
                              className="p-2 rounded-full hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100 dropdown-menu relative"
                            >
                              <BsThreeDots className="w-4 h-4 text-white/70" />

                              {selectedTrackIndex === index && (
                                <div className="absolute right-0 top-10 w-48 bg-[#282464]/95 backdrop-blur-xl rounded-lg shadow-xl border border-white/20 overflow-hidden z-20">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveTrack(index);
                                    }}
                                    className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-500/10 transition-colors text-left"
                                  >
                                    <HiOutlineTrash className="w-4 h-4" />
                                    <span>Remove from playlist</span>
                                  </button>
                                </div>
                              )}
                            </button>
                            <div onClick={(e) => e.stopPropagation()}>
                              <PlayPause
                                song={track}
                                handlePause={handlePauseClick}
                                handlePlay={() => handlePlayClick(track, index)}
                                size={40}
                                isLoading={isLoading(loadingKey)}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Modal Player for tablet view */}
              {isTabletView && currentTrack && (
                <ModalPlayer onOpenNowPlaying={() => setShowNowPlaying(true)} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Desktop View (1480px+) */}
      {isDesktopScreen && (
        <div className="hidden sm:block">
          <div
            className={`fixed top-0 left-0 bottom-0 z-40 transition-all duration-300 ${
              isAnimating
                ? "translate-x-0 opacity-100"
                : "-translate-x-full opacity-0"
            }`}
            style={{
              width: "calc(100vw - 376px)",
              background: "linear-gradient(to bottom, #0f0b2d, #1a1848)",
            }}
          >
            <div className="flex h-full">
              {/* Sidebar */}
              <div className="w-96 bg-gradient-to-b from-[#1e1b4b]/50 to-[#0f0b2d]/50 backdrop-blur-sm border-r border-white/10 flex flex-col p-8">
                {/* Close button */}
                <button
                  onClick={handleClose}
                  className="self-start p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all mb-8"
                >
                  <IoArrowBack className="w-6 h-6 text-white" />
                </button>

                {/* Playlist artwork */}
                <div className="w-full aspect-square rounded-2xl overflow-hidden shadow-2xl mb-8">
                  {mosaicImages.length === 4 ? (
                    <div className="grid grid-cols-2 gap-0.5 w-full h-full">
                      {mosaicImages.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = placeholderImage;
                          }}
                        />
                      ))}
                    </div>
                  ) : mosaicImages.length > 0 ? (
                    <img
                      src={mosaicImages[0]}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = placeholderImage;
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                      <BsMusicNoteBeamed className="w-24 h-24 text-white/20" />
                    </div>
                  )}
                </div>

                {/* Playlist info */}
                <div className="text-center">
                  <p className="text-sm text-[#14b8a6] font-bold mb-4 tracking-wider uppercase">
                    Your Playlist
                  </p>
                  {isEditingName ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEdit();
                        if (e.key === "Escape") setIsEditingName(false);
                      }}
                      onBlur={handleSaveEdit}
                      className="text-3xl font-bold bg-white/10 border border-white/20 rounded px-3 py-2 text-white outline-none focus:bg-white/20 focus:border-[#14b8a6]/50 mb-4 w-full text-center"
                      autoFocus
                    />
                  ) : (
                    <h1 className="text-3xl font-bold text-white mb-4">
                      {playlist.name}
                    </h1>
                  )}
                  <div className="flex items-center justify-center gap-6 text-sm text-gray-300 mb-8">
                    <div className="flex items-center gap-2">
                      <BsMusicNoteBeamed className="text-[#14b8a6]" />
                      <span>{tracks.length} songs</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BsClock className="text-purple-400" />
                      <span>{getTotalDuration()}</span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => handlePlayAll(false)}
                      disabled={isLoading("play-all") || tracks.length === 0}
                      className="group relative flex items-center justify-center gap-2 bg-[#14b8a6] hover:bg-[#0d9488] text-white font-semibold py-3 px-6 rounded-full transition-all disabled:opacity-80 disabled:cursor-not-allowed"
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
                    <div className="flex items-center gap-3 justify-center">
                      <button
                        onClick={() => handlePlayAll(true)}
                        disabled={
                          isLoading("shuffle-play") || tracks.length === 0
                        }
                        className={`p-2.5 rounded-lg transition-all ${
                          shuffle
                            ? "bg-white/10 text-[#14b8a6]"
                            : "bg-white/10 text-white hover:bg-white/20"
                        } disabled:opacity-80 disabled:cursor-not-allowed`}
                      >
                        <BsShuffle size={20} />
                      </button>
                      <button
                        onClick={() => setShowPlaylistMenu(!showPlaylistMenu)}
                        className="p-2.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all relative dropdown-menu"
                      >
                        <BsThreeDots className="w-5 h-5 text-white" />
                        {showPlaylistMenu && (
                          <div className="absolute right-0 top-12 w-48 bg-[#282464]/95 backdrop-blur-xl rounded-lg shadow-xl border border-white/20 overflow-hidden z-20">
                            <button
                              onClick={() => {
                                setIsEditingName(true);
                                setShowPlaylistMenu(false);
                              }}
                              className="flex items-center gap-3 w-full px-4 py-3 text-white hover:bg-white/10 transition-colors text-left"
                            >
                              <HiOutlinePencil className="w-4 h-4" />
                              <span>Rename</span>
                            </button>
                            <button
                              onClick={() => {
                                setShowPlaylistMenu(false);
                                setShowDeleteDialog(true);
                              }}
                              className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-500/10 transition-colors text-left"
                            >
                              <HiOutlineTrash className="w-4 h-4" />
                              <span>Delete Playlist</span>
                            </button>
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Track list area */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Track list header */}
                <div className="flex items-center px-8 py-3 text-sm text-gray-400 uppercase tracking-wider border-b border-white/10">
                  <span className="w-16 text-center">#</span>
                  <span className="flex-1">Title</span>
                  <span className="w-32 text-right">Duration</span>
                  <span className="w-20"></span>
                </div>

                {/* Tracks */}
                <div className="flex-1 overflow-y-auto">
                  {tracks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <BsMusicNoteBeamed className="w-24 h-24 mb-6 opacity-20" />
                      <p className="text-2xl mb-2">
                        No tracks in this playlist
                      </p>
                      <p className="text-lg">Add some songs to get started!</p>
                    </div>
                  ) : (
                    <div>
                      {tracks.map((track, index) => {
                        const isActive = isTrackActive(track, index);
                        const trackId = getTrackId(track);
                        const loadingKey = `track-${trackId}`;

                        return (
                          <div
                            key={track.key || track.id || index}
                            className={`flex items-center px-8 py-3 group hover:bg-white/5 transition-all cursor-pointer ${
                              isActive ? "bg-white/10" : ""
                            }`}
                            onClick={() => handlePlayClick(track, index)}
                          >
                            <span className="w-16 text-center text-gray-400 text-sm">
                              {index + 1}
                            </span>

                            <div className="flex items-center gap-4 flex-1">
                              <img
                                src={
                                  track.album?.images?.[0]?.url ||
                                  track.images?.coverart ||
                                  placeholderImage
                                }
                                alt={track.title}
                                className={`w-14 h-14 rounded object-cover ${
                                  isActive ? "ring-2 ring-[#14b8a6]" : ""
                                }`}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = placeholderImage;
                                }}
                              />

                              <div className="flex-1 min-w-0">
                                <p
                                  className={`font-medium truncate ${
                                    isActive ? "text-[#14b8a6]" : "text-white"
                                  }`}
                                >
                                  {track.title || track.name}
                                </p>
                                <p className="text-gray-400 text-sm truncate">
                                  {track.subtitle ||
                                    track.artists
                                      ?.map((a) => a.name)
                                      .join(", ")}
                                </p>
                              </div>
                            </div>

                            <span className="w-32 text-right text-gray-400 text-sm tabular-nums">
                              {formatDuration(track.duration_ms)}
                            </span>

                            {/* Actions */}
                            <div className="w-20 flex items-center justify-end gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTrackIndex(
                                    selectedTrackIndex === index ? null : index
                                  );
                                }}
                                className="p-1.5 rounded-full hover:bg-white/10 transition-all dropdown-menu relative"
                              >
                                <BsThreeDots className="w-4 h-4 text-gray-400 hover:text-white" />

                                {selectedTrackIndex === index && (
                                  <div className="absolute right-0 top-8 w-48 bg-[#282464]/95 backdrop-blur-xl rounded-lg shadow-xl border border-white/20 overflow-hidden z-20">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveTrack(index);
                                      }}
                                      className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-500/10 transition-colors text-left"
                                    >
                                      <HiOutlineTrash className="w-4 h-4" />
                                      <span>Remove from playlist</span>
                                    </button>
                                  </div>
                                )}
                              </button>
                              <div onClick={(e) => e.stopPropagation()}>
                                <PlayPause
                                  song={track}
                                  handlePause={handlePauseClick}
                                  handlePlay={() =>
                                    handlePlayClick(track, index)
                                  }
                                  size={35}
                                  isLoading={isLoading(loadingKey)}
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
            </div>
          </div>
        </div>
      )}

      {/* Now Playing Modal */}
      {showNowPlaying && (
        <NowPlaying
          isOpen={showNowPlaying}
          onClose={() => setShowNowPlaying(false)}
        />
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Playlist"
        message={`Are you sure you want to delete "${playlist.name}"? This action cannot be undone.`}
        confirmText="Delete"
        isDestructive
      />
    </>
  );
};

export default UserPlaylistModal;
