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
  const { currentTrack, isPlaying, activeContext, currentIndex } = useSelector(
    (state) => state.player
  );
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

  const {
    data: tracks,
    isFetching,
    error,
  } = useGetPlaylistTracksQuery({ playlistId: playlist.id });

  const placeholderImage =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNGE1NTY4Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2EwYWVjMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==";

  useEffect(() => {
    // Start animation on mount
    setIsAnimating(true);
    dispatch(setModalOpen(true));

    // Prevent body scroll on mobile
    if (window.innerWidth < 640) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      dispatch(setModalOpen(false));
      if (window.innerWidth < 640) {
        document.body.style.overflow = "";
      }
    };
  }, [dispatch]);

  // Conservative prefetch for playlists
  useEffect(() => {
    const timeoutIds = [];

    if (tracks && tracks.length > 0) {
      // Only prefetch first 3 tracks with significant delays
      const mainTimeout = setTimeout(() => {
        tracks.slice(0, 3).forEach((track, index) => {
          const trackTimeout = setTimeout(() => {
            if (!isPreviewCached(track)) {
              prefetchPreviewUrl(track, { priority: "low" });
            }
          }, index * 3000); // 3 seconds between each
          timeoutIds.push(trackTimeout);
        });
      }, 1000);

      timeoutIds.push(mainTimeout);

      return () => {
        timeoutIds.forEach((id) => clearTimeout(id));
      };
    }
  }, [tracks, prefetchPreviewUrl, isPreviewCached]);

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
          <div className="flex items-center justify-between p-4 relative z-10">
            <button
              onClick={handleClose}
              className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <IoArrowBack className="w-6 h-6 text-white" />
            </button>
            <span className="text-sm font-medium text-gray-300">
              Community Playlists
            </span>
            <button
              onClick={handleClose}
              className="p-2 -mr-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <IoClose className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Mobile Hero Section */}
          <div className="relative px-4 pb-4">
            {/* Background Blur Effect */}
            <div className="absolute inset-0 -top-20 opacity-30">
              <img
                src={
                  playlist.images?.[0]?.url ||
                  mosaicImages[0] ||
                  placeholderImage
                }
                alt=""
                className="w-full h-full object-cover blur-3xl"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#1a1848]/50 to-[#1a1848]" />
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center text-center">
              {/* Mosaic */}
              <div className="w-32 h-32 mb-4 rounded-xl overflow-hidden shadow-2xl">
                {mosaicImages.length === 4 &&
                !mosaicImages.every((img) => img === mosaicImages[0]) ? (
                  <div className="grid grid-cols-2 gap-0.5 w-full h-full">
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
              <BsFillPlayFill className="w-6 h-6" />
              Play All
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  if (tracks && tracks.length > 0) {
                    try {
                      const randomIndex = Math.floor(
                        Math.random() * tracks.length
                      );
                      getPreviewUrl(tracks[randomIndex]).then(
                        (firstTrackWithPreview) => {
                          if (firstTrackWithPreview?.preview_url) {
                            const tracksWithFirstPreview = [...tracks];
                            tracksWithFirstPreview[randomIndex] =
                              firstTrackWithPreview;

                            dispatch(
                              replaceContext({
                                contextType: "community_playlist",
                                tracks: tracksWithFirstPreview,
                                startIndex: randomIndex,
                                playlistData: {
                                  ...playlist,
                                  tracks: tracksWithFirstPreview,
                                },
                              })
                            );
                            dispatch(toggleShuffle(true));
                            showToast("Shuffle playing playlist");
                          } else {
                            showToast("No preview available", "error");
                          }
                        }
                      );
                    } catch (error) {
                      console.error("Error getting preview URL:", error);
                    }
                  }
                }}
                className="bg-white/10 hover:bg-white/20 text-white py-2.5 rounded-full font-medium transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 border border-white/10"
              >
                <BsShuffle className="w-4 h-4" />
                Shuffle
              </button>
              <button
                onClick={() => {
                  if (tracks && tracks.length > 0) {
                    tracks.forEach((track) => {
                      dispatch(addToQueue({ song: track }));
                    });
                    showToast(`Added ${tracks.length} tracks to queue`);
                  }
                }}
                className="bg-white/10 hover:bg-white/20 text-white py-2.5 rounded-full font-medium transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 border border-white/10"
              >
                <HiPlus className="w-4 h-4" />
                Add to Queue
              </button>
            </div>
          </div>

          {/* Mobile Track List */}
          <div className="flex-1 overflow-hidden bg-black/20 rounded-t-3xl">
            <div
              ref={scrollContainerRef}
              className="h-full overflow-y-auto custom-scrollbar p-4"
            >
              {isFetching ? (
                <Loader title="Loading tracks..." />
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
                        className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                          isActive
                            ? "bg-white/10 shadow-lg"
                            : "hover:bg-white/5 active:bg-white/10"
                        }`}
                      >
                        {/* Track Number/Image */}
                        <div className="flex-shrink-0 w-12 h-12 relative">
                          <img
                            alt={track.title}
                            src={
                              track.images?.coverart ||
                              track.album?.images?.[0]?.url ||
                              placeholderImage
                            }
                            className={`w-full h-full rounded-lg object-cover ${
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
      </div>

      {/* Desktop Slide-up Modal */}
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
            <div className="w-[450px] flex-shrink-0 p-8 flex flex-col">
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
                      src={playlist.images?.[0]?.url || placeholderImage}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = placeholderImage;
                      }}
                    />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 z-20">
                    <div
                      onClick={handlePlayAll}
                      className="w-16 h-16 bg-[#14b8a6] rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer"
                    >
                      <svg
                        className="w-8 h-8 text-white translate-x-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M5 4v12l10-6z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="text-center max-w-sm">
                  <p className="text-[#14b8a6] text-sm font-medium mb-2 uppercase tracking-wider">
                    Community Playlist
                  </p>
                  <h2 className="text-3xl font-bold text-white mb-3">
                    {playlist.name}
                  </h2>
                  <p className="text-gray-300 mb-2">
                    by {playlist.owner?.display_name || "Spotify"}
                  </p>
                  <div className="flex items-center justify-center gap-4 text-gray-400 text-sm mb-6">
                    <span className="flex items-center gap-1">
                      <BsMusicNoteBeamed />
                      {tracks?.length || 0} tracks
                    </span>
                    <span className="flex items-center gap-1">
                      <BsClock />
                      {getTotalDuration()}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={handlePlayAll}
                      className="bg-[#14b8a6] hover:bg-[#0d9488] text-white px-6 py-2.5 rounded-full font-medium transition-all hover:scale-[1.02] flex items-center gap-2 text-sm"
                    >
                      <BsFillPlayFill className="w-5 h-5" />
                      Play All
                    </button>
                    <button
                      onClick={async () => {
                        if (tracks && tracks.length > 0) {
                          try {
                            const randomIndex = Math.floor(
                              Math.random() * tracks.length
                            );
                            const firstTrackWithPreview = await getPreviewUrl(
                              tracks[randomIndex]
                            );

                            if (firstTrackWithPreview?.preview_url) {
                              const tracksWithFirstPreview = [...tracks];
                              tracksWithFirstPreview[randomIndex] =
                                firstTrackWithPreview;

                              dispatch(
                                replaceContext({
                                  contextType: "community_playlist",
                                  tracks: tracksWithFirstPreview,
                                  startIndex: randomIndex,
                                  playlistData: {
                                    ...playlist,
                                    tracks: tracksWithFirstPreview,
                                  },
                                })
                              );
                              dispatch(toggleShuffle(true));
                              showToast("Shuffle playing playlist");
                            } else {
                              showToast("No preview available", "error");
                            }
                          } catch (error) {
                            console.error("Error getting preview URL:", error);
                          }
                        }
                      }}
                      className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-all hover:scale-[1.02] border border-white/10"
                      title="Shuffle play"
                    >
                      <BsShuffle className="w-5 h-5 text-white" />
                    </button>
                    <button
                      onClick={() => {
                        if (tracks && tracks.length > 0) {
                          tracks.forEach((track) => {
                            dispatch(addToQueue({ song: track }));
                          });
                          showToast(`Added ${tracks.length} tracks to queue`);
                        }
                      }}
                      className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-all hover:scale-[1.02] border border-white/10"
                      title="Add to queue"
                    >
                      <HiPlus className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel - Tracks */}
            <div className="flex-1 flex flex-col bg-black/20">
              <div className="p-6 pb-4 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="text-lg font-semibold text-white/80">
                    {tracks?.length || 0} tracks
                  </div>
                </div>
              </div>

              {/* Track List */}
              <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto custom-scrollbar"
              >
                {isFetching ? (
                  <div className="p-6">
                    <Loader title="Loading tracks..." />
                  </div>
                ) : error ? (
                  <div className="p-6">
                    <Error />
                  </div>
                ) : (
                  <div className="px-6 pb-6">
                    {tracks?.map((track, i) => {
                      const isActive = isTrackActive(track, i);
                      return (
                        <div
                          key={`${track.key}-${i}`}
                          ref={isActive ? activeTrackRef : null}
                          className={`group flex items-center gap-4 px-4 py-3 rounded-xl transition-all relative ${
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
    </>
  );
};

export default PlaylistModal;
