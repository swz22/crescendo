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
import { Error, Loader } from "./";
import { IoClose, IoArrowBack } from "react-icons/io5";
import {
  BsMusicNoteBeamed,
  BsClock,
  BsCalendar3,
  BsShuffle,
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

    return () => {
      dispatch(setModalOpen(false));
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
          showToast("No preview available for this track", "error");
        }
      } catch (error) {
        console.error("Error getting preview URL:", error);
        showToast("Error loading track preview", "error");
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

  const isTrackActive = (track, index) => {
    if (activeContext !== "community_playlist") return false;
    return currentIndex === index;
  };

  return (
    <>
      {/* Backdrop - only covers main content area */}
      <div
        className={`fixed top-0 left-0 bottom-0 z-40 transition-all duration-300 ${
          isAnimating ? "bg-black/40" : "bg-transparent pointer-events-none"
        }`}
        onClick={handleBackdropClick}
        style={{
          right: "420px",
          backdropFilter: isAnimating ? "blur(8px)" : "blur(0px)",
          WebkitBackdropFilter: isAnimating ? "blur(8px)" : "blur(0px)",
        }}
      >
        <div
          className={`absolute inset-0 transition-transform duration-300 ${
            isAnimating ? "scale-95 opacity-50" : "scale-100 opacity-100"
          }`}
        />
      </div>

      {/* Slide-out panel */}
      <div
        className={`fixed top-0 left-0 bottom-0 w-[calc(100%-420px)] bg-gradient-to-br from-[#1e1b4b]/98 to-[#0f172a]/98 z-40 shadow-2xl transition-all duration-300 ease-out transform ${
          isAnimating ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          maxWidth: "calc(100% - 420px)",
          boxShadow: isAnimating ? "10px 0 40px rgba(0,0,0,0.5)" : "none",
        }}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="relative p-6 bg-gradient-to-b from-white/5 to-transparent border-b border-white/10">
            <button
              onClick={handleClose}
              className="absolute top-6 left-6 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all hover:scale-110 group"
            >
              <IoArrowBack
                size={20}
                className="text-white group-hover:text-[#14b8a6] transition-colors"
              />
            </button>

            <button
              onClick={handleClose}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all hover:scale-110"
            >
              <IoClose size={24} className="text-white" />
            </button>

            <div className="flex items-start gap-6 mt-12">
              {/* Playlist Image */}
              <div className="w-40 h-40 rounded-xl shadow-2xl overflow-hidden flex-shrink-0 group relative">
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                {playlist.name.toLowerCase().includes("lonely heart") ? (
                  // Custom artwork for featured playlist
                  <div className="w-full h-full relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#14b8a6] via-[#0891b2] to-[#0e7490] animate-gradient">
                      <div className="absolute inset-0 bg-black/20"></div>
                    </div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                      <div className="relative mb-3">
                        <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                          <svg
                            className="w-12 h-12 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                          </svg>
                        </div>
                      </div>
                      <p className="text-white/80 text-[10px] font-medium">
                        FEATURED
                      </p>
                    </div>
                  </div>
                ) : mosaicImages.length === 4 &&
                  !mosaicImages.every((img) => img === mosaicImages[0]) ? (
                  // Mosaic grid
                  <div className="grid grid-cols-2 gap-0.5 w-full h-full">
                    {mosaicImages.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`Album ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = placeholderImage;
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  // Single image
                  <img
                    src={playlist.images?.[0]?.url || placeholderImage}
                    alt={playlist.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = placeholderImage;
                    }}
                  />
                )}
                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  <div
                    onClick={handlePlayAll}
                    className="w-14 h-14 bg-[#14b8a6] rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer"
                  >
                    <svg
                      className="w-6 h-6 text-white translate-x-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M5 4v12l10-6z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="flex-1 min-w-0 pt-2">
                <p className="text-[#14b8a6] text-sm font-medium mb-2 uppercase tracking-wider">
                  Playlist
                </p>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
                  {playlist.name}
                </h2>
                <p className="text-gray-300 mb-2">
                  by {playlist.owner?.display_name || "Spotify"}
                </p>
                <div className="flex items-center gap-4 text-gray-400 text-sm">
                  <span className="flex items-center gap-1">
                    <BsMusicNoteBeamed />
                    {playlist.tracks?.total || 0} tracks
                  </span>
                  <span className="flex items-center gap-1">
                    <BsClock />
                    {tracks
                      ? `${Math.floor(
                          tracks.reduce(
                            (acc, t) => acc + (t.duration_ms || 0),
                            0
                          ) / 60000
                        )} min`
                      : "-- min"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Track List */}
          <div
            className="flex-1 overflow-y-auto custom-scrollbar"
            ref={scrollContainerRef}
          >
            {isFetching && (
              <div className="p-6">
                <Loader title="Loading tracks..." />
              </div>
            )}
            {error && (
              <div className="p-6">
                <Error />
              </div>
            )}
            {tracks && (
              <div className="p-6 pt-2">
                {/* Playlist Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10 group hover:border-[#14b8a6]/40 transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <BsClock className="text-[#14b8a6] text-lg" />
                      <p className="text-gray-400 text-sm">Total Duration</p>
                    </div>
                    <p className="text-white text-xl font-bold">
                      {Math.floor(
                        tracks.reduce(
                          (acc, t) => acc + (t.duration_ms || 0),
                          0
                        ) / 60000
                      )}{" "}
                      min
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10 group hover:border-[#14b8a6]/40 transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <IoMdTime className="text-[#14b8a6] text-lg" />
                      <p className="text-gray-400 text-sm">Avg Duration</p>
                    </div>
                    <p className="text-white text-xl font-bold">
                      {formatDuration(
                        tracks.reduce(
                          (acc, t) => acc + (t.duration_ms || 0),
                          0
                        ) / tracks.length
                      )}
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10 group hover:border-[#14b8a6]/40 transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <BsCalendar3 className="text-[#14b8a6] text-lg" />
                      <p className="text-gray-400 text-sm">Last Updated</p>
                    </div>
                    <p className="text-white text-xl font-bold">
                      {new Date().toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                {/* Play All / Add to Queue / Shuffle Buttons */}
                <div className="flex gap-3 mb-6">
                  <button
                    onClick={handlePlayAll}
                    className="flex-1 bg-[#14b8a6] hover:bg-[#0d9488] text-white py-3 px-4 rounded-lg font-semibold transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M5 4v12l10-6z" />
                    </svg>
                    Play All
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
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 px-4 rounded-lg font-semibold transition-all hover:scale-[1.02] flex items-center justify-center gap-2 border border-white/10"
                  >
                    <HiPlus className="w-5 h-5" />
                    Add to Queue
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
                            dispatch(toggleShuffle());
                            showToast("Shuffling playlist");
                          } else {
                            showToast(
                              "No preview available for this track",
                              "error"
                            );
                          }
                        } catch (error) {
                          console.error("Error getting preview URL:", error);
                          showToast("Error loading track preview", "error");
                        }
                      }
                    }}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 px-4 rounded-lg font-semibold transition-all hover:scale-[1.02] flex items-center justify-center gap-2 border border-white/10"
                  >
                    <BsShuffle className="w-5 h-5" />
                    Shuffle
                  </button>
                </div>

                {/* Track List Header */}
                <div className="flex items-center px-4 pb-2 border-b border-white/10 mb-2">
                  <span className="text-gray-400 text-xs uppercase w-8 text-center">
                    #
                  </span>
                  <span className="text-gray-400 text-xs uppercase ml-3 mr-4">
                    Title
                  </span>
                  <span className="text-gray-400 text-xs uppercase ml-auto mr-4">
                    Duration
                  </span>
                </div>

                <div className="space-y-1">
                  {tracks.map((track, i) => {
                    const isActive = isTrackActive(track, i);
                    const isCurrentSong = isActive && isPlaying;

                    return (
                      <div
                        key={track.key || track.id || i}
                        ref={isActive ? activeTrackRef : null}
                        className={`flex items-center py-3 px-4 rounded-lg transition-all duration-200 group relative overflow-hidden ${
                          isActive
                            ? "bg-gradient-to-r from-[#14b8a6]/20 to-transparent border-l-4 border-[#14b8a6]"
                            : "hover:bg-white/5"
                        }`}
                        onMouseEnter={() => {
                          if (!isPreviewCached(track)) {
                            prefetchPreviewUrl(track, { priority: "high" });
                          }
                        }}
                      >
                        {/* Track number */}
                        <span
                          className={`text-sm w-8 text-center flex-shrink-0 ${
                            isActive
                              ? "text-[#14b8a6] font-bold"
                              : "text-gray-500"
                          }`}
                        >
                          {isCurrentSong ? (
                            <div className="flex justify-center gap-[2px]">
                              <div className="w-[2px] h-3 bg-[#14b8a6] rounded-full animate-pulse" />
                              <div className="w-[2px] h-3 bg-[#14b8a6] rounded-full animate-pulse delay-75" />
                              <div className="w-[2px] h-3 bg-[#14b8a6] rounded-full animate-pulse delay-150" />
                            </div>
                          ) : (
                            i + 1
                          )}
                        </span>

                        {/* Album art */}
                        <img
                          src={track.images?.coverart || placeholderImage}
                          alt={track.title}
                          className={`w-12 h-12 rounded-lg ml-3 mr-4 flex-shrink-0 ${
                            isActive ? "ring-2 ring-[#14b8a6]" : ""
                          }`}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = placeholderImage;
                          }}
                        />

                        {/* Track info */}
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

                        {/* Duration */}
                        <span className="text-gray-400 text-sm mx-4 font-medium bg-black/20 px-2 py-1 rounded">
                          {formatDuration(track.duration_ms)}
                        </span>

                        {/* Play button */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <PlayPause
                            isPlaying={isPlaying}
                            activeSong={currentTrack}
                            song={track}
                            handlePause={handlePauseClick}
                            handlePlay={() => handlePlayClick(track, i)}
                            size={35}
                          />
                        </div>

                        {/* Now playing indicator */}
                        {isActive && (
                          <div className="absolute top-1 right-4 bg-[#14b8a6] text-white text-xs px-2 py-0.5 rounded-full font-medium">
                            Now Playing
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default PlaylistModal;
