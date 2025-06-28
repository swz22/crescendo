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
  switchContext,
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
        .map((track) => track.album?.images?.[0]?.url || placeholderImage)
        .filter((img) => img !== placeholderImage);

      if (imagesToSet.length > 0) {
        setMosaicImages(
          imagesToSet.length === 4
            ? imagesToSet
            : Array(4).fill(imagesToSet[0] || placeholderImage)
        );
      }
    }
  }, [tracks, prefetchMultiple]);

  useEffect(() => {
    if (activeTrackRef.current && activeContext === "community_playlist") {
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
    try {
      const trackWithPreview = await getPreviewUrl(track);
      if (trackWithPreview?.preview_url) {
        // If we're already in the community playlist context at this index, just play/pause
        if (activeContext === "community_playlist" && currentIndex === index) {
          dispatch(playPause(true));
        } else {
          // Otherwise, play from this context and index
          dispatch(
            playFromContext({
              contextType: "community_playlist",
              trackIndex: index,
              trackWithPreview,
            })
          );
        }
      } else {
        showToast("No preview available", "error");
      }
    } catch (error) {
      console.error("Error getting preview URL:", error);
      showToast("Error playing track", "error");
    }
  };

  const handlePlayAll = async () => {
    if (!tracks || tracks.length === 0) return;

    const firstTrack = tracks[0];
    if (firstTrack) {
      try {
        const trackWithPreview = await getPreviewUrl(firstTrack);
        const updatedTracks = [...tracks];
        updatedTracks[0] = trackWithPreview || firstTrack;

        if (trackWithPreview?.preview_url) {
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

              <h1 className="text-2xl font-bold text-white text-center mb-2">
                {playlist.name}
              </h1>
              <p className="text-gray-400 text-sm mb-4">
                {playlist.owner?.display_name || "Spotify"} •{" "}
                {tracks?.length || 0} songs
              </p>

              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={handlePlayAll}
                  className="flex items-center gap-2 bg-[#14b8a6] hover:bg-[#0d9488] text-white font-semibold py-3 px-6 rounded-full transition-all transform hover:scale-105"
                >
                  <BsFillPlayFill size={24} />
                  <span>Play All</span>
                </button>
                <button
                  onClick={() => dispatch(toggleShuffle())}
                  className={`p-3 rounded-full transition-all ${
                    shuffle
                      ? "bg-[#14b8a6] text-white"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  <BsShuffle size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Track List */}
          <div className="flex-1 overflow-y-auto">
            {isFetching ? (
              <div className="flex justify-center p-8">
                <Loader title="Loading tracks..." />
              </div>
            ) : error ? (
              <Error />
            ) : (
              <div className="px-4 pb-4">
                {tracks?.map((track, i) => {
                  const isActive = isTrackActive(track, i);
                  const isCached = isPreviewCached(track);
                  const noPreview = hasNoPreview(track);

                  return (
                    <div
                      key={`${track.key}-${i}`}
                      ref={isActive ? activeTrackRef : null}
                      onClick={() => !noPreview && handlePlayClick(track, i)}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer ${
                        isActive
                          ? "bg-[#14b8a6]/20 ring-2 ring-[#14b8a6]"
                          : "hover:bg-white/5"
                      } ${noPreview ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <span className="text-gray-400 text-sm w-8">{i + 1}</span>

                      <img
                        src={track.album?.images?.[0]?.url || placeholderImage}
                        alt={track.title}
                        className={`w-12 h-12 rounded-lg ${
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

      {/* Tablet/Compact View (640px - 1479px) - Simplified without SidebarPlayer */}
      {!isDesktopScreen && (
        <div className="hidden sm:block">
          {/* Backdrop - Full screen */}
          <div
            className={`fixed inset-0 z-40 transition-all duration-300 ${
              isAnimating
                ? "bg-black/60 backdrop-blur-sm"
                : "bg-transparent pointer-events-none"
            }`}
            onClick={handleBackdropClick}
          />

          {/* Tablet Modal - Centered in full viewport */}
          <div
            className={`fixed z-50 bg-gradient-to-br from-[#1a1848] to-[#0f0b2d] rounded-2xl shadow-2xl transition-all duration-500 flex flex-col
              ${isAnimating ? "opacity-100 scale-100" : "opacity-0 scale-95"}
              left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-4xl`}
            style={{ maxHeight: "90vh", height: "90vh" }}
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
                {/* Horizontal Layout for all Tablet sizes */}
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

                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-center">
                    <p className="text-sm text-[#14b8a6] font-medium mb-2">
                      COMMUNITY PLAYLIST
                    </p>
                    <h1 className="text-3xl font-bold text-white mb-3">
                      {playlist.name}
                    </h1>
                    <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                      <span>{playlist.owner?.display_name || "Spotify"}</span>
                      <span>•</span>
                      <span>{tracks?.length || 0} songs</span>
                      <span>•</span>
                      <span>{getTotalDuration()}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={handlePlayAll}
                        className="flex items-center gap-2 bg-[#14b8a6] hover:bg-[#0d9488] text-white font-semibold py-3 px-6 rounded-full transition-all transform hover:scale-105"
                      >
                        <BsFillPlayFill size={24} />
                        <span>Play All</span>
                      </button>
                      <button
                        onClick={() => dispatch(toggleShuffle())}
                        className={`p-3 rounded-full transition-all ${
                          shuffle
                            ? "bg-[#14b8a6] text-white"
                            : "bg-white/10 text-white hover:bg-white/20"
                        }`}
                      >
                        <BsShuffle size={20} />
                      </button>
                      <button
                        onClick={() => {
                          if (tracks && tracks.length > 0) {
                            tracks.forEach((track) => {
                              dispatch(addToQueue({ song: track }));
                            });
                            dispatch(switchContext({ contextType: "queue" }));
                            showToast(`Added ${tracks.length} songs to queue`);
                          }
                        }}
                        className="p-3 bg-white/10 text-white hover:bg-white/20 rounded-full transition-all"
                      >
                        <HiPlus size={20} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Track List */}
                <div
                  className="flex-1 overflow-y-auto custom-scrollbar"
                  ref={scrollContainerRef}
                >
                  {isFetching ? (
                    <div className="flex justify-center p-8">
                      <Loader title="Loading tracks..." />
                    </div>
                  ) : error ? (
                    <Error />
                  ) : (
                    <div className="p-6">
                      {tracks?.map((track, i) => {
                        const isActive = isTrackActive(track, i);
                        const isCached = isPreviewCached(track);
                        const noPreview = hasNoPreview(track);

                        return (
                          <div
                            key={`${track.key}-${i}`}
                            ref={isActive ? activeTrackRef : null}
                            className={`flex items-center gap-4 p-3 rounded-lg transition-all ${
                              isActive
                                ? "bg-[#14b8a6]/20 ring-2 ring-[#14b8a6]"
                                : "hover:bg-white/5"
                            } ${noPreview ? "opacity-50" : ""}`}
                          >
                            <span className="text-gray-400 text-sm w-8">
                              {i + 1}
                            </span>

                            <img
                              src={
                                track.album?.images?.[0]?.url ||
                                placeholderImage
                              }
                              alt={track.title}
                              className={`w-12 h-12 rounded-lg ${
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

      {/* Desktop View (1480px+) - Unchanged */}
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

                  <div className="text-center max-w-[280px]">
                    <p className="text-sm text-[#14b8a6] font-medium mb-2">
                      COMMUNITY PLAYLIST
                    </p>
                    <h1 className="text-3xl font-bold text-white mb-3 line-clamp-2">
                      {playlist.name}
                    </h1>
                    <p className="text-gray-400 mb-2">
                      by {playlist.owner?.display_name || "Spotify"}
                    </p>
                    <div className="flex items-center justify-center gap-4 text-sm text-gray-400 mb-6">
                      <div className="flex items-center gap-1">
                        <BsMusicNoteBeamed />
                        <span>{tracks?.length || 0} songs</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <BsClock />
                        <span>{getTotalDuration()}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <button
                        onClick={handlePlayAll}
                        className="flex items-center justify-center gap-2 bg-[#14b8a6] hover:bg-[#0d9488] text-white font-semibold py-3 px-6 rounded-full transition-all transform hover:scale-105 shadow-lg shadow-[#14b8a6]/25"
                      >
                        <BsFillPlayFill size={24} />
                        <span>Play All</span>
                      </button>
                      <div className="flex items-center gap-3 justify-center">
                        <button
                          onClick={() => dispatch(toggleShuffle())}
                          className={`p-3 rounded-full transition-all ${
                            shuffle
                              ? "bg-[#14b8a6] text-white"
                              : "bg-white/10 text-white hover:bg-white/20"
                          }`}
                        >
                          <BsShuffle size={20} />
                        </button>
                        <button
                          onClick={() => {
                            if (tracks && tracks.length > 0) {
                              tracks.forEach((track) => {
                                dispatch(addToQueue({ song: track }));
                              });
                              dispatch(switchContext({ contextType: "queue" }));
                              showToast(
                                `Added ${tracks.length} songs to queue`
                              );
                            }
                          }}
                          className="p-3 bg-white/10 text-white hover:bg-white/20 rounded-full transition-all"
                        >
                          <HiPlus size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Panel - Track List */}
              <div className="flex-1 flex flex-col border-l border-white/10">
                {/* Track List Header */}
                <div className="px-6 py-4 border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>#</span>
                      <span className="flex-1">TITLE</span>
                      <IoMdTime size={16} />
                    </div>
                  </div>
                </div>

                {/* Scrollable Track List */}
                <div
                  className="flex-1 overflow-y-auto custom-scrollbar"
                  ref={scrollContainerRef}
                >
                  {isFetching ? (
                    <div className="flex justify-center p-8">
                      <Loader title="Loading tracks..." />
                    </div>
                  ) : error ? (
                    <Error />
                  ) : (
                    <div className="p-6">
                      {tracks?.map((track, i) => {
                        const isActive = isTrackActive(track, i);
                        const isCached = isPreviewCached(track);
                        const noPreview = hasNoPreview(track);

                        return (
                          <div
                            key={`${track.key}-${i}`}
                            ref={isActive ? activeTrackRef : null}
                            onMouseEnter={() =>
                              !isCached &&
                              !noPreview &&
                              prefetchPreviewUrl(track)
                            }
                            className={`group flex items-center gap-4 p-3 rounded-lg transition-all ${
                              isActive
                                ? "bg-[#14b8a6]/20 ring-2 ring-[#14b8a6]"
                                : "hover:bg-white/5"
                            } ${
                              noPreview ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                          >
                            <span className="text-gray-400 text-sm w-8 text-center group-hover:hidden">
                              {i + 1}
                            </span>
                            <div className="text-gray-400 text-sm w-8 text-center hidden group-hover:block">
                              <BsFillPlayFill size={16} className="mx-auto" />
                            </div>

                            <img
                              src={
                                track.album?.images?.[0]?.url ||
                                placeholderImage
                              }
                              alt={track.title}
                              className={`w-12 h-12 rounded-lg ${
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
