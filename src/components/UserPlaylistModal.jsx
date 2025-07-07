import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
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

  // Get current playlist from Redux store
  const currentPlaylist =
    useSelector((state) =>
      state.player.playlists.find((p) => p.id === playlist.id)
    ) || playlist;

  const { getPreviewUrl, prefetchMultiple } = usePreviewUrl();
  const {
    handleRemoveFromPlaylist,
    handleRenamePlaylist,
    handleDeletePlaylist,
  } = usePlaylistManager();

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
  const isTabletView = useMediaQuery(
    "(min-width: 640px) and (max-width: 1479px)"
  );

  const tracks = currentPlaylist.tracks || [];
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
              contextType: currentPlaylist.id,
              tracks: updatedTracks,
              startIndex,
              playlistData: { ...currentPlaylist, tracks: updatedTracks },
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

  const handleAddAllToQueue = () => {
    if (!tracks || tracks.length === 0) {
      showToast("No tracks to add", "error");
      return;
    }

    // Add all tracks to queue
    tracks.forEach((track) => {
      dispatch(addToQueue({ song: track, playNext: false }));
    });

    // Switch to queue context
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
    if (!tracks) return "0 min";
    const totalMs = tracks.reduce(
      (acc, track) => acc + (track.duration_ms || 0),
      0
    );
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
        className={`sm:hidden fixed inset-0 z-40 bg-gradient-to-b from-[#1a1848] to-[#0f0b2d] transition-all duration-500 ${
          isAnimating
            ? "translate-x-0 opacity-100"
            : "translate-x-full opacity-0"
        }`}
      >
        <div className="flex flex-col h-full pb-24">
          {/* Mobile Header*/}
          <div className="flex items-center justify-between p-3 flex-shrink-0">
            <button
              onClick={handleClose}
              className="p-2 rounded-full bg-black/20 hover:bg-black/40 transition-all"
            >
              <IoArrowBack className="w-5 h-5 text-white" />
            </button>
            <h2 className="text-base font-semibold text-white uppercase tracking-wider">
              My Playlist
            </h2>
            <div className="w-9" />
          </div>

          {/* Mobile Album Art and Info */}
          <div className="px-4 pb-4 flex-shrink-0">
            <div className="flex flex-col items-center">
              {/* Album art */}
              <div className="w-[100px] h-[100px] rounded-xl overflow-hidden shadow-2xl mb-3">
                {mosaicImages.length === 4 ? (
                  <div className="grid grid-cols-2 gap-0.5 w-full h-full bg-black">
                    {mosaicImages.map((img, i) => (
                      <img
                        key={i}
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
                ) : (
                  <img
                    src={mosaicImages[0] || placeholderImage}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = placeholderImage;
                    }}
                  />
                )}
              </div>

              {/* Title and subtitle */}
              {isEditingName ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={handleSaveEdit}
                  onKeyPress={(e) => e.key === "Enter" && handleSaveEdit()}
                  className="text-xl font-bold text-white text-center bg-white/10 rounded px-2 py-1 mb-1 max-w-[250px] mx-auto"
                  autoFocus
                />
              ) : (
                <h1 className="text-xl font-bold text-white text-center mb-1">
                  {currentPlaylist.name}
                </h1>
              )}
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span>{tracks?.length || 0} songs</span>
                <span>•</span>
                <span>{getTotalDuration()}</span>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={() => handlePlayAll(false)}
                  disabled={isLoading("play-all")}
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
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePlayAll(true)}
                    disabled={isLoading("shuffle-play")}
                    className={`p-2 rounded-full transition-all ${
                      shuffle
                        ? "bg-white/10 text-[#14b8a6]"
                        : "bg-white/10 text-white hover:bg-white/20"
                    } disabled:opacity-80 disabled:cursor-not-allowed`}
                    title="Shuffle Play"
                  >
                    {isLoading("shuffle-play") ? (
                      <MusicLoadingSpinner size="sm" />
                    ) : (
                      <BsShuffle size={18} />
                    )}
                  </button>
                  <button
                    onClick={handleAddAllToQueue}
                    className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
                    title="Add all to queue"
                  >
                    <HiPlus size={18} />
                  </button>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
                    title="Rename playlist"
                  >
                    <HiOutlinePencil size={18} />
                  </button>
                  <button
                    onClick={() => setShowDeleteDialog(true)}
                    className="p-2 rounded-full bg-white/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all"
                    title="Delete playlist"
                  >
                    <HiOutlineTrash size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Track List */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-4">
              {tracks?.map((track, i) => {
                const isActive = isTrackActive(track, i);
                return (
                  <div
                    key={`${track.key || track.id}-${i}`}
                    ref={isActive ? activeTrackRef : null}
                    onClick={() => handlePlayClick(track, i)}
                    className={`flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-all group cursor-pointer ${
                      isActive ? "bg-white/10" : ""
                    }`}
                  >
                    <span className="text-gray-400 text-sm w-6 text-center">
                      {i + 1}
                    </span>

                    <img
                      src={track.images?.coverart || placeholderImage}
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
                        {track.title}
                      </p>
                      <p className="text-gray-400 text-sm truncate">
                        {track.subtitle}
                      </p>
                    </div>

                    {/* Menu & Play */}
                    <div className="flex items-center gap-1">
                      <div onClick={(e) => e.stopPropagation()}>
                        <SongMenu
                          song={track}
                          onRemoveFromPlaylist={() => {
                            handleRemoveFromPlaylist(
                              currentPlaylist.id,
                              getTrackId(track)
                            );
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
        </div>
      </div>

      {/* Tablet View with Integrated Player */}
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
                <div className="w-9" />
              </div>

              {/* Content */}
              <div className="flex flex-col h-full overflow-hidden">
                <div className="flex gap-6 p-6 border-b border-white/10">
                  {/* Album Art */}
                  <div className="w-48 h-48 flex-shrink-0 rounded-xl overflow-hidden shadow-2xl">
                    {mosaicImages.length === 4 ? (
                      <div className="grid grid-cols-2 gap-1 w-full h-full">
                        {mosaicImages.map((image, index) => (
                          <img
                            key={index}
                            alt={`Album ${index + 1}`}
                            src={image}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = placeholderImage;
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <img
                        alt={playlist.name}
                        src={mosaicImages[0] || placeholderImage}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = placeholderImage;
                        }}
                      />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-center">
                    <p className="text-sm text-[#14b8a6] font-medium mb-2">
                      MY PLAYLIST
                    </p>
                    {isEditingName ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={handleSaveEdit}
                        onKeyPress={(e) =>
                          e.key === "Enter" && handleSaveEdit()
                        }
                        className="text-3xl font-bold text-white bg-white/10 rounded px-3 py-1 mb-3 max-w-[300px]"
                        autoFocus
                      />
                    ) : (
                      <h1 className="text-3xl font-bold text-white mb-3">
                        {currentPlaylist.name}
                      </h1>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                      <span>{tracks?.length || 0} songs</span>
                      <span>•</span>
                      <span>{getTotalDuration()}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handlePlayAll(false)}
                        disabled={isLoading("play-all")}
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
                      <div className="relative group">
                        <button
                          onClick={() => handlePlayAll(true)}
                          disabled={isLoading("shuffle-play")}
                          className={`p-3 rounded-full transition-all ${
                            shuffle
                              ? "bg-white/10 text-[#14b8a6]"
                              : "bg-white/10 text-white hover:bg-white/20"
                          } disabled:opacity-80 disabled:cursor-not-allowed`}
                        >
                          {isLoading("shuffle-play") ? (
                            <MusicLoadingSpinner size="sm" />
                          ) : (
                            <BsShuffle size={20} />
                          )}
                        </button>
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                          Shuffle Play
                        </span>
                      </div>
                      <div className="relative group">
                        <button
                          onClick={handleAddAllToQueue}
                          className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
                          title="Add all to queue"
                        >
                          <HiPlus size={20} />
                        </button>
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                          Add to Queue
                        </span>
                      </div>
                      <div className="relative group">
                        <button
                          onClick={() => setIsEditingName(true)}
                          className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
                          title="Rename playlist"
                        >
                          <HiOutlinePencil size={20} />
                        </button>
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                          Rename
                        </span>
                      </div>
                      <div className="relative group">
                        <button
                          onClick={() => setShowDeleteDialog(true)}
                          className="p-3 rounded-full bg-white/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all"
                          title="Delete playlist"
                        >
                          <HiOutlineTrash size={20} />
                        </button>
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                          Delete
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Track List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                  <div className="space-y-1">
                    {tracks?.map((track, i) => {
                      const isActive = isTrackActive(track, i);
                      return (
                        <div
                          key={`${track.key || track.id}-${i}`}
                          ref={isActive ? activeTrackRef : null}
                          onClick={() => handlePlayClick(track, i)}
                          className={`flex items-center gap-4 p-3 rounded-lg hover:bg-white/10 transition-all group cursor-pointer ${
                            isActive ? "bg-white/10" : ""
                          }`}
                        >
                          <span className="text-gray-400 text-sm w-8 text-center">
                            {i + 1}
                          </span>

                          <img
                            src={track.images?.coverart || placeholderImage}
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
                              {track.title}
                            </p>
                            <p className="text-gray-400 text-sm truncate">
                              {track.subtitle}
                            </p>
                          </div>

                          <span className="text-gray-400 text-sm hidden md:block">
                            {formatDuration(track.duration_ms)}
                          </span>

                          <div className="flex items-center gap-2">
                            <div onClick={(e) => e.stopPropagation()}>
                              <SongMenu
                                song={track}
                                onRemoveFromPlaylist={() => {
                                  handleRemoveFromPlaylist(
                                    currentPlaylist.id,
                                    getTrackId(track)
                                  );
                                }}
                              />
                            </div>
                            <div onClick={(e) => e.stopPropagation()}>
                              <PlayPause
                                song={track}
                                handlePause={handlePauseClick}
                                handlePlay={() => handlePlayClick(track, i)}
                                size={35}
                                isLoading={isLoading(
                                  `track-${getTrackId(track)}`
                                )}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Modal Player */}
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
                ? "bg-black/70 backdrop-blur-md"
                : "bg-transparent pointer-events-none"
            }`}
            onClick={handleBackdropClick}
            style={{
              right: "380px",
            }}
          />

          {/* Slide-in Modal */}
          <div
            className={`fixed left-0 bottom-0 top-0 z-50 transition-all duration-500 overflow-hidden ${
              isAnimating
                ? "translate-x-0 opacity-100"
                : "-translate-x-full opacity-0"
            }`}
            style={{
              right: "380px",
              background: "linear-gradient(135deg, #1a1848 0%, #0f0b2d 100%)",
              boxShadow: isAnimating
                ? "0 0 50px rgba(20, 184, 166, 0.15)"
                : "none",
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

                <div className="flex-1 flex flex-col items-center justify-center relative z-10">
                  {/* Album art with glow effect */}
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-[#14b8a6] to-purple-600 rounded-3xl blur-lg opacity-30 group-hover:opacity-50 transition duration-500"></div>
                    <div className="relative w-72 h-72 rounded-3xl overflow-hidden shadow-2xl">
                      {mosaicImages.length === 4 ? (
                        mosaicImages.every((img) => img === mosaicImages[0]) &&
                        mosaicImages[0] !== placeholderImage ? (
                          <img
                            alt="playlist_cover"
                            src={mosaicImages[0]}
                            className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-110"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = placeholderImage;
                            }}
                          />
                        ) : (
                          <div className="grid grid-cols-2 gap-0.5 w-full h-full bg-black">
                            {mosaicImages.map((image, index) => (
                              <img
                                key={index}
                                alt={`Album ${index + 1}`}
                                src={image}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = placeholderImage;
                                }}
                              />
                            ))}
                          </div>
                        )
                      ) : (
                        <img
                          alt={playlist.name}
                          src={mosaicImages[0] || placeholderImage}
                          className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-110"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = placeholderImage;
                          }}
                        />
                      )}
                    </div>
                  </div>

                  <div className="text-center px-4 mt-8">
                    <p className="text-sm text-[#14b8a6] font-semibold mb-3 tracking-wider uppercase">
                      My Playlist
                    </p>
                    {isEditingName ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={handleSaveEdit}
                        onKeyPress={(e) =>
                          e.key === "Enter" && handleSaveEdit()
                        }
                        className="text-4xl font-bold text-white bg-white/10 rounded px-3 py-1 mb-6 text-center max-w-[320px] mx-auto"
                        autoFocus
                      />
                    ) : (
                      <h1 className="text-4xl font-bold text-white mb-6 line-clamp-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                        {currentPlaylist.name}
                      </h1>
                    )}

                    <div className="flex items-center justify-center gap-6 text-sm text-gray-300 mb-8">
                      <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full">
                        <BsMusicNoteBeamed className="text-[#14b8a6]" />
                        <span>{tracks?.length || 0} songs</span>
                      </div>
                      <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full">
                        <BsClock className="text-purple-400" />
                        <span>{getTotalDuration()}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-6">
                      <button
                        onClick={() => handlePlayAll(false)}
                        disabled={isLoading("play-all")}
                        className="group relative flex items-center justify-center gap-2 bg-gradient-to-r from-[#14b8a6] to-[#0d9488] hover:from-[#0d9488] hover:to-[#14b8a6] text-white font-semibold py-3 px-6 rounded-full transition-all transform hover:scale-105 shadow-xl shadow-[#14b8a6]/30 disabled:opacity-80 disabled:cursor-not-allowed disabled:hover:scale-100 w-48 mx-auto"
                      >
                        <div className="absolute inset-0 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
                        {isLoading("play-all") ? (
                          <LoadingState variant="button" text="Loading..." />
                        ) : (
                          <>
                            <BsFillPlayFill
                              size={24}
                              className="relative z-10"
                            />
                            <span className="relative z-10">Play All</span>
                          </>
                        )}
                      </button>

                      <div className="flex items-center gap-3 justify-center">
                        <div className="relative group">
                          <button
                            onClick={() => handlePlayAll(true)}
                            disabled={isLoading("shuffle-play")}
                            className={`p-2.5 rounded-full backdrop-blur-md transition-all border ${
                              shuffle
                                ? "bg-[#14b8a6]/20 text-[#14b8a6] border-[#14b8a6]/50"
                                : "bg-white/10 text-white hover:bg-white/20 border-white/20"
                            } disabled:opacity-80 disabled:cursor-not-allowed hover:scale-110`}
                          >
                            {isLoading("shuffle-play") ? (
                              <MusicLoadingSpinner size="sm" />
                            ) : (
                              <BsShuffle size={18} />
                            )}
                          </button>
                          <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/10">
                            Shuffle Play
                          </span>
                        </div>
                        <div className="relative group">
                          <button
                            onClick={handleAddAllToQueue}
                            className="p-2.5 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all border border-white/20 hover:scale-110"
                            title="Add all to queue"
                          >
                            <HiPlus size={18} />
                          </button>
                          <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/10">
                            Add to Queue
                          </span>
                        </div>
                        <div className="relative group">
                          <button
                            onClick={() => setIsEditingName(true)}
                            className="p-2.5 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all border border-white/20 hover:scale-110"
                            title="Rename playlist"
                          >
                            <HiOutlinePencil size={18} />
                          </button>
                          <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/10">
                            Rename
                          </span>
                        </div>
                        <div className="relative group">
                          <button
                            onClick={() => setShowDeleteDialog(true)}
                            className="p-2.5 rounded-full bg-white/10 backdrop-blur-md text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all border border-white/20 hover:border-red-500/30 hover:scale-110"
                            title="Delete playlist"
                          >
                            <HiOutlineTrash size={18} />
                          </button>
                          <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/10">
                            Delete
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Panel - Track List */}
              <div className="flex-1 relative overflow-hidden">
                {/* Vertical separator */}
                <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>

                <div className="h-full overflow-y-auto custom-scrollbar p-6 2xl:p-8 pl-8">
                  <div className="space-y-2">
                    {tracks?.map((track, i) => {
                      const isActive = isTrackActive(track, i);
                      return (
                        <div
                          key={`${track.key || track.id}-${i}`}
                          ref={isActive ? activeTrackRef : null}
                          onClick={() => handlePlayClick(track, i)}
                          className={`group flex items-center gap-4 p-4 rounded-xl transition-all cursor-pointer ${
                            isActive
                              ? "bg-gradient-to-r from-[#14b8a6]/20 to-transparent border border-[#14b8a6]/30"
                              : "hover:bg-white/5 border border-transparent hover:border-white/10"
                          }`}
                        >
                          {/* Track numbers */}
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-all ${
                              isActive
                                ? "bg-[#14b8a6]/20 text-[#14b8a6]"
                                : "bg-white/5 text-gray-400 group-hover:bg-white/10 group-hover:text-white"
                            }`}
                          >
                            {i + 1}
                          </div>

                          <img
                            src={track.images?.coverart || placeholderImage}
                            alt={track.title}
                            className={`w-12 h-12 rounded-lg object-cover shadow-lg transition-all ${
                              isActive
                                ? "ring-2 ring-[#14b8a6] ring-offset-2 ring-offset-transparent"
                                : "group-hover:shadow-xl"
                            }`}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = placeholderImage;
                            }}
                          />

                          <div className="flex-1 min-w-0">
                            <p
                              className={`font-medium truncate transition-colors ${
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

                          {/* Actions */}
                          <div className="flex items-center gap-3">
                            <div onClick={(e) => e.stopPropagation()}>
                              <SongMenu
                                song={track}
                                onRemoveFromPlaylist={() => {
                                  handleRemoveFromPlaylist(
                                    currentPlaylist.id,
                                    getTrackId(track)
                                  );
                                }}
                              />
                            </div>
                            <div onClick={(e) => e.stopPropagation()}>
                              <PlayPause
                                song={track}
                                handlePause={handlePauseClick}
                                handlePlay={() => handlePlayClick(track, i)}
                                size={40}
                                isLoading={isLoading(
                                  `track-${getTrackId(track)}`
                                )}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
