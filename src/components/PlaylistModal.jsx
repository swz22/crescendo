import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  playPause,
  playFromContext,
  replaceContext,
  setModalOpen,
  toggleShuffle,
  addToQueue,
  playTrack,
} from "../redux/features/playerSlice";
import { useGetPlaylistTracksQuery } from "../redux/services/spotifyCore";
import { usePreviewUrl } from "../hooks/usePreviewUrl";
import { useMediaQuery } from "../hooks/useMediaQuery";
import PlayPause from "./PlayPause";
import SongMenu from "./SongMenu";
import { Error, Loader } from "./";
import { IoClose, IoArrowBack } from "react-icons/io5";
import {
  BsMusicNoteBeamed,
  BsClock,
  BsCalendar3,
  BsShuffle,
  BsFillPlayFill,
} from "react-icons/bs";
import { IoMdTime } from "react-icons/io";
import { HiPlus } from "react-icons/hi";
import { useToast } from "../context/ToastContext";

const PlaylistModal = ({ playlist, initialMosaicImages, onClose }) => {
  const dispatch = useDispatch();
  const { currentTrack, isPlaying, activeContext, currentIndex, shuffle } =
    useSelector((state) => state.player);
  const {
    getPreviewUrl,
    prefetchMultiple,
    isPreviewCached,
    hasNoPreview,
    prefetchPreviewUrl,
  } = usePreviewUrl();
  const [isAnimating, setIsAnimating] = useState(false);
  const [mosaicImages, setMosaicImages] = useState(initialMosaicImages || []);
  const scrollContainerRef = useRef(null);
  const activeTrackRef = useRef(null);
  const { showToast } = useToast();
  const isLargeScreen = useMediaQuery("(min-width: 1024px)");
  const isDesktopScreen = useMediaQuery("(min-width: 1480px)");

  const {
    data: tracks,
    isFetching,
    error,
  } = useGetPlaylistTracksQuery({ playlistId: playlist.id });

  const placeholderImage =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNGE1NTY4Ii8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyMCIgZmlsbD0iI2EwYWVjMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4=";

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimating(true), 50);
    dispatch(setModalOpen(true));
    return () => clearTimeout(timer);
  }, [dispatch]);

  useEffect(() => {
    if (tracks && tracks.length > 0) {
      prefetchMultiple(tracks.slice(0, 10), { maxConcurrent: 3 });
      const imagesToSet = tracks
        .slice(0, 4)
        .map((track) => track.album?.images?.[0]?.url || placeholderImage);
      while (imagesToSet.length < 4) {
        imagesToSet.push(placeholderImage);
      }
      setMosaicImages(imagesToSet);
    }
  }, [tracks, prefetchMultiple, isPreviewCached]);

  // Auto-scroll to center the active track
  useEffect(() => {
    if (
      activeTrackRef.current &&
      scrollContainerRef.current &&
      tracks &&
      isAnimating &&
      activeContext === "community_playlist"
    ) {
      setTimeout(() => {
        const container = scrollContainerRef.current;
        const activeElement = activeTrackRef.current;

        if (container && activeElement) {
          const containerHeight = container.clientHeight;
          const elementTop = activeElement.offsetTop;
          const elementHeight = activeElement.clientHeight;

          const scrollTo = elementTop - containerHeight / 2 + elementHeight / 2;

          container.scrollTo({
            top: scrollTo,
            behavior: "smooth",
          });
        }
      }, 300);
    }
  }, [currentTrack, tracks, isAnimating, activeContext]);

  const handleClose = () => {
    setIsAnimating(false);
    dispatch(setModalOpen(false));
    setTimeout(onClose, 300);
  };

  const handlePlayClick = async (song, i) => {
    // Individual track play - switches to queue
    dispatch(playPause(false));

    try {
      const songWithPreview = await getPreviewUrl(song);

      if (songWithPreview?.preview_url) {
        dispatch(playTrack({ track: songWithPreview }));
        showToast("Added to queue");
      } else {
        showToast("No preview available for this track", "error");
      }
    } catch (error) {
      console.error("Error getting preview URL:", error);
      showToast("Error loading track preview", "error");
    }
  };

  const handlePlayAll = async () => {
    if (tracks && tracks.length > 0) {
      try {
        const firstTrackWithPreview = await getPreviewUrl(tracks[0]);
        if (firstTrackWithPreview?.preview_url) {
          const updatedTracks = [...tracks];
          updatedTracks[0] = firstTrackWithPreview;

          dispatch(
            replaceContext({
              contextType: "community_playlist",
              tracks: updatedTracks,
              startIndex: 0,
              playlistData: { ...playlist, tracks: updatedTracks },
            })
          );
          showToast("Playing playlist");
        } else {
          showToast("No preview available", "error");
        }
      } catch (error) {
        console.error("Error getting preview URL:", error);
      }
    }
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

  const isTrackActive = (track, index) => {
    if (activeContext !== "community_playlist") return false;
    return currentIndex === index;
  };

  return (
    <>
      {/* Mobile Full Screen Modal */}
      <div
        className={`sm:hidden fixed inset-0 z-50 bg-gradient-to-b from-[#1a1848] to-[#0f0b2d] transition-all duration-500 ${
          isAnimating
            ? "translate-y-0 opacity-100"
            : "translate-y-full opacity-0"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Mobile Header */}
          <div className="flex items-center justify-between p-4">
            <button
              onClick={handleClose}
              className="p-2 rounded-full bg-black/20 hover:bg-black/40 transition-all"
            >
              <IoArrowBack className="w-5 h-5 text-white" />
            </button>
            <h2 className="text-lg font-semibold text-white">
              COMMUNITY PLAYLIST
            </h2>
            <div className="w-9" />
          </div>

          {/* Mobile Album Art and Info */}
          <div className="px-4 pb-4">
            <div className="flex flex-col items-center">
              <div className="w-64 h-64 rounded-2xl overflow-hidden shadow-2xl mb-4">
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
                    src={
                      playlist.images?.[0]?.url ||
                      mosaicImages[0] ||
                      placeholderImage
                    }
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = placeholderImage;
                    }}
                  />
                )}
              </div>

              {/* Playlist Info */}
              <h1 className="text-2xl font-bold text-white mb-1">
                {playlist.name}
              </h1>
              <p className="text-sm text-gray-300 mb-2">
                by {playlist.owner?.display_name || "Spotify"}
              </p>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <BsMusicNoteBeamed />
                  {tracks?.length || 0} tracks
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <BsClock />
                  {getTotalDuration()}
                </span>
              </div>
            </div>
          </div>

          {/* Mobile Action Buttons */}
          <div className="px-4 pb-2 space-y-2">
            <button
              onClick={handlePlayAll}
              className="w-full bg-[#14b8a6] hover:bg-[#0d9488] text-white py-3 rounded-full font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <BsFillPlayFill className="w-5 h-5" />
              Play All
            </button>
          </div>

          {/* Mobile Track List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-4">
            {isFetching ? (
              <div className="flex items-center justify-center h-full">
                <Loader title="Loading tracks..." />
              </div>
            ) : error ? (
              <Error />
            ) : (
              <div className="space-y-1">
                {tracks?.map((track, i) => {
                  const isActive = isTrackActive(track, i);
                  return (
                    <div
                      key={`${track.key}-${i}`}
                      ref={isActive ? activeTrackRef : null}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                        isActive ? "bg-white/10 shadow-lg" : "hover:bg-white/5"
                      }`}
                    >
                      {/* Track Number & Album Art */}
                      <div className="relative">
                        <img
                          alt={track.title}
                          src={
                            track.images?.coverart ||
                            track.album?.images?.[0]?.url ||
                            placeholderImage
                          }
                          className={`w-12 h-12 rounded-lg object-cover ${
                            isActive ? "ring-2 ring-[#14b8a6]" : ""
                          }`}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = placeholderImage;
                          }}
                        />
                        <span className="absolute -top-1 -left-1 bg-black/80 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                          {i + 1}
                        </span>
                      </div>

                      {/* Track Info */}
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
                          <SongMenu song={track} />
                        </div>
                        <PlayPause
                          isPlaying={isPlaying}
                          activeSong={currentTrack}
                          song={track}
                          handlePause={handlePauseClick}
                          handlePlay={() => handlePlayClick(track, i)}
                          size={40}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tablet/Compact View (640px - 1479px) */}
      {!isDesktopScreen && (
        <div className="hidden sm:block">
          {/* Backdrop - respects SidebarPlayer on lg screens */}
          <div
            className={`fixed inset-0 lg:right-[380px] z-40 transition-all duration-300 ${
              isAnimating
                ? "bg-black/60 backdrop-blur-sm"
                : "bg-transparent pointer-events-none"
            }`}
            onClick={handleBackdropClick}
          />

          {/* Tablet Modal - Centered, adjusts for SidebarPlayer */}
          <div
            className={`fixed z-50 bg-gradient-to-br from-[#1a1848] to-[#0f0b2d] rounded-2xl shadow-2xl transition-all duration-500 overflow-hidden
              ${isAnimating ? "opacity-100 scale-100" : "opacity-0 scale-95"}
              ${
                isLargeScreen
                  ? "left-[calc((100%-380px)/2)] top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(90vw,900px)] max-w-[calc(100vw-400px)]"
                  : "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-4xl"
              }`}
            style={{ maxHeight: "90vh" }}
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <button
                  onClick={handleClose}
                  className="p-2 rounded-full bg-black/20 hover:bg-black/40 transition-all"
                >
                  <IoArrowBack className="w-5 h-5 text-white" />
                </button>
                <h2 className="text-lg font-semibold text-white uppercase tracking-wider">
                  Community Playlist
                </h2>
                <div className="w-9" />
              </div>

              {/* Content */}
              <div className="flex flex-col lg:flex-row h-full overflow-hidden">
                {/* Left Panel - Info */}
                <div className="lg:w-80 p-6 border-b lg:border-b-0 lg:border-r border-white/10 flex-shrink-0">
                  <div className="flex flex-col items-center">
                    <div className="w-56 h-56 lg:w-64 lg:h-64 rounded-xl overflow-hidden shadow-2xl mb-4">
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
                          src={
                            playlist.images?.[0]?.url ||
                            mosaicImages[0] ||
                            placeholderImage
                          }
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = placeholderImage;
                          }}
                        />
                      )}
                    </div>

                    <h1 className="text-xl lg:text-2xl font-bold text-white mb-2 text-center">
                      {playlist.name}
                    </h1>
                    <p className="text-sm text-gray-300 mb-3">
                      by {playlist.owner?.display_name || "Spotify"}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
                      <span className="flex items-center gap-1">
                        <BsMusicNoteBeamed />
                        {tracks?.length || 0} tracks
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <BsClock />
                        {getTotalDuration()}
                      </span>
                    </div>

                    <div className="flex flex-col gap-3">
                      <button
                        onClick={handlePlayAll}
                        className="w-full bg-[#14b8a6] hover:bg-[#0d9488] text-white py-3 rounded-full font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                      >
                        <BsFillPlayFill className="w-5 h-5" />
                        Play All
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={async () => {
                            if (tracks && tracks.length > 0) {
                              // First, enable shuffle
                              if (!shuffle) {
                                dispatch(toggleShuffle());
                              }

                              // Get a random track to start with
                              const randomIndex = Math.floor(
                                Math.random() * tracks.length
                              );
                              const randomTrack = tracks[randomIndex];

                              try {
                                const trackWithPreview = await getPreviewUrl(
                                  randomTrack
                                );
                                if (trackWithPreview?.preview_url) {
                                  const updatedTracks = [...tracks];
                                  updatedTracks[randomIndex] = trackWithPreview;

                                  dispatch(
                                    replaceContext({
                                      contextType: "community_playlist",
                                      tracks: updatedTracks,
                                      startIndex: randomIndex,
                                      playlistData: {
                                        ...playlist,
                                        tracks: updatedTracks,
                                      },
                                    })
                                  );
                                  showToast("Shuffle playing playlist");
                                } else {
                                  showToast("No preview available", "error");
                                }
                              } catch (error) {
                                console.error(
                                  "Error getting preview URL:",
                                  error
                                );
                              }
                            }
                          }}
                          className="flex-1 p-2 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white rounded-full transition-all flex items-center justify-center gap-2"
                          title="Shuffle play"
                        >
                          <BsShuffle className="w-4 h-4" />
                          <span className="text-sm">Shuffle</span>
                        </button>

                        <button
                          onClick={async () => {
                            if (tracks && tracks.length > 0) {
                              for (const track of tracks) {
                                await dispatch(addToQueue(track));
                              }
                              showToast(
                                `Added ${tracks.length} tracks to queue`
                              );
                            }
                          }}
                          className="p-2 px-3 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white rounded-full transition-all"
                          title="Add all to queue"
                        >
                          <HiPlus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Panel - Track List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                  {isFetching ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader title="Loading tracks..." />
                    </div>
                  ) : error ? (
                    <Error />
                  ) : (
                    <div className="space-y-2">
                      {tracks?.map((track, i) => {
                        const isActive = isTrackActive(track, i);
                        return (
                          <div
                            key={`${track.key}-${i}`}
                            ref={isActive ? activeTrackRef : null}
                            className={`flex items-center gap-4 p-3 rounded-lg transition-all ${
                              isActive
                                ? "bg-white/10 shadow-lg"
                                : "hover:bg-white/5"
                            }`}
                          >
                            <span className="text-gray-400 w-6 text-center">
                              {i + 1}
                            </span>

                            <img
                              alt={track.title}
                              src={
                                track.images?.coverart ||
                                track.album?.images?.[0]?.url ||
                                placeholderImage
                              }
                              className={`w-10 h-10 rounded object-cover ${
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

                            <span className="text-gray-400 text-sm hidden lg:block">
                              {formatDuration(track.duration_ms)}
                            </span>

                            <div className="flex items-center gap-2">
                              <div onClick={(e) => e.stopPropagation()}>
                                <SongMenu song={track} />
                              </div>
                              <PlayPause
                                isPlaying={isPlaying}
                                activeSong={currentTrack}
                                song={track}
                                handlePause={handlePauseClick}
                                handlePlay={() => handlePlayClick(track, i)}
                                size={35}
                              />
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

      {/* Desktop View (1480px+) */}
      {isDesktopScreen && (
        <div className="hidden sm:block">
          {/* Backdrop - only covers main content area */}
          <div
            className={`fixed top-0 left-0 bottom-0 z-40 transition-all duration-300 ${
              isAnimating
                ? "bg-black/60 backdrop-blur-sm"
                : "bg-transparent pointer-events-none"
            }`}
            onClick={handleBackdropClick}
            style={{
              right: "380px", // Respect SidebarPlayer width
            }}
          />

          {/* Slide-up Modal */}
          <div
            className={`fixed left-0 bottom-0 top-0 z-50 bg-gradient-to-br from-[#1a1848] to-[#0f0b2d] transition-all duration-500 overflow-hidden ${
              isAnimating
                ? "translate-y-0 opacity-100"
                : "translate-y-full opacity-0"
            }`}
            style={{
              right: "380px", // Stop at SidebarPlayer boundary
              boxShadow: isAnimating ? "0 -10px 40px rgba(0,0,0,0.5)" : "none",
            }}
          >
            <div className="h-full flex">
              {/* Left Panel - Info */}
              <div className="w-[400px] 2xl:w-[450px] flex-shrink-0 p-6 2xl:p-8 flex flex-col">
                <button
                  onClick={handleClose}
                  className="absolute top-6 left-6 p-2 rounded-full bg-black/20 hover:bg-black/40 transition-all z-20"
                >
                  <IoArrowBack className="w-5 h-5 text-white" />
                </button>

                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="w-72 h-72 rounded-2xl overflow-hidden shadow-2xl mb-6 group relative">
                    {mosaicImages.length === 4 ? (
                      mosaicImages.every((img) => img === mosaicImages[0]) &&
                      mosaicImages[0] !== placeholderImage ? (
                        <img
                          alt="playlist_cover"
                          src={mosaicImages[0]}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = placeholderImage;
                          }}
                        />
                      ) : (
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
                      )
                    ) : (
                      <img
                        alt={playlist.name}
                        src={
                          playlist.images?.[0]?.url ||
                          mosaicImages[0] ||
                          placeholderImage
                        }
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = placeholderImage;
                        }}
                      />
                    )}
                  </div>

                  {/* Community Playlist Label */}
                  <p className="text-[#14b8a6] text-sm font-semibold uppercase tracking-wider mb-2">
                    Community Playlist
                  </p>

                  <h1 className="text-3xl font-bold text-white mb-2 text-center max-w-sm">
                    {playlist.name}
                  </h1>
                  <p className="text-sm text-gray-300 mb-4">
                    by {playlist.owner?.display_name || "Spotify"}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-400 mb-6">
                    <span className="flex items-center gap-1">
                      <BsMusicNoteBeamed />
                      {tracks?.length || 0} tracks
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <BsClock />
                      {getTotalDuration()}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mb-6">
                    <button
                      onClick={handlePlayAll}
                      className="bg-[#14b8a6] hover:bg-[#0d9488] text-white px-8 py-3 rounded-full font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 shadow-lg"
                    >
                      <BsFillPlayFill className="w-5 h-5" />
                      Play All
                    </button>

                    <button
                      onClick={async () => {
                        if (tracks && tracks.length > 0) {
                          // First, enable shuffle
                          if (!shuffle) {
                            dispatch(toggleShuffle());
                          }

                          // Get a random track to start with
                          const randomIndex = Math.floor(
                            Math.random() * tracks.length
                          );
                          const randomTrack = tracks[randomIndex];

                          try {
                            const trackWithPreview = await getPreviewUrl(
                              randomTrack
                            );
                            if (trackWithPreview?.preview_url) {
                              const updatedTracks = [...tracks];
                              updatedTracks[randomIndex] = trackWithPreview;

                              dispatch(
                                replaceContext({
                                  contextType: "community_playlist",
                                  tracks: updatedTracks,
                                  startIndex: randomIndex,
                                  playlistData: {
                                    ...playlist,
                                    tracks: updatedTracks,
                                  },
                                })
                              );
                              showToast("Shuffle playing playlist");
                            } else {
                              showToast("No preview available", "error");
                            }
                          } catch (error) {
                            console.error("Error getting preview URL:", error);
                          }
                        }
                      }}
                      className="p-3 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white rounded-full transition-all flex items-center gap-2"
                      title="Shuffle play"
                    >
                      <BsShuffle className="w-5 h-5" />
                      <span className="text-sm font-medium">Shuffle Play</span>
                    </button>

                    <button
                      onClick={async () => {
                        if (tracks && tracks.length > 0) {
                          for (const track of tracks) {
                            await dispatch(addToQueue(track));
                          }
                          showToast(`Added ${tracks.length} tracks to queue`);
                        }
                      }}
                      className="p-3 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white rounded-full transition-all"
                      title="Add all to queue"
                    >
                      <HiPlus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Panel - Track List */}
              <div className="flex-1 flex flex-col border-l border-white/10">
                <div
                  ref={scrollContainerRef}
                  className="flex-1 overflow-y-auto custom-scrollbar px-6 2xl:px-8 py-6"
                >
                  {isFetching ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader title="Loading tracks..." />
                    </div>
                  ) : error ? (
                    <Error />
                  ) : (
                    <div className="space-y-2 pb-4">
                      {tracks?.map((track, i) => {
                        const isActive = isTrackActive(track, i);
                        return (
                          <div
                            key={`${track.key}-${i}`}
                            ref={isActive ? activeTrackRef : null}
                            className={`flex items-center gap-3 px-3 2xl:px-4 py-3 rounded-lg transition-all ${
                              isActive
                                ? "bg-white/10 shadow-lg"
                                : "hover:bg-white/5"
                            }`}
                          >
                            <span className="text-gray-400 w-8 text-center">
                              {i + 1}
                            </span>

                            <img
                              alt={track.title}
                              src={
                                track.images?.coverart ||
                                track.album?.images?.[0]?.url ||
                                placeholderImage
                              }
                              className={`w-12 h-12 rounded-lg object-cover ${
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

                            <div
                              className="flex-shrink-0 w-10 flex justify-center"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <SongMenu song={track} />
                            </div>

                            <span className="text-gray-400 text-sm w-16 text-center">
                              {formatDuration(track.duration_ms)}
                            </span>

                            <div className="flex-shrink-0 w-10 flex justify-center">
                              <PlayPause
                                isPlaying={isPlaying}
                                activeSong={currentTrack}
                                song={track}
                                handlePause={handlePauseClick}
                                handlePlay={() => handlePlayClick(track, i)}
                                size={35}
                              />
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
    </>
  );
};

export default PlaylistModal;
