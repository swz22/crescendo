import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  playPause,
  playTrack,
  replaceContext,
  setModalOpen,
  toggleShuffle,
  addToQueue,
  switchContext,
} from "../redux/features/playerSlice";
import { useGetPlaylistTracksQuery } from "../redux/services/spotifyCore";
import { usePreviewUrl } from "../hooks/usePreviewUrl";
import { useLoadingState } from "../hooks/useLoadingState";
import { useMediaQuery } from "../hooks/useMediaQuery";
import PlayPause from "./PlayPause";
import LoadingState from "./LoadingState";
import MusicLoadingSpinner from "./MusicLoadingSpinner";
import SongMenu from "./SongMenu";
import ModalPlayer from "./ModalPlayer";
import NowPlaying from "./NowPlaying";
import { Error, Loader } from "./";
import { IoClose, IoArrowBack } from "react-icons/io5";
import { BsMusicNoteBeamed, BsClock, BsCalendar3, BsShuffle, BsFillPlayFill } from "react-icons/bs";
import { IoMdTime } from "react-icons/io";
import { HiPlus } from "react-icons/hi";
import { useToast } from "../context/ToastContext";
import { isSameTrack, getTrackId } from "../utils/trackUtils";

const PlaylistModal = ({ playlist, initialMosaicImages, onClose }) => {
  const dispatch = useDispatch();
  const { currentTrack, isPlaying, activeContext, currentIndex, shuffle } = useSelector((state) => state.player);
  const { getPreviewUrl, prefetchMultiple, isPreviewCached, hasNoPreview, prefetchPreviewUrl } = usePreviewUrl();
  const [isAnimating, setIsAnimating] = useState(false);
  const [mosaicImages, setMosaicImages] = useState(initialMosaicImages || []);
  const [showNowPlaying, setShowNowPlaying] = useState(false);
  const scrollContainerRef = useRef(null);
  const activeTrackRef = useRef(null);
  const { showToast } = useToast();
  const { setLoading, isLoading } = useLoadingState();
  const isDesktopScreen = useMediaQuery("(min-width: 1480px)");
  const isTabletView = useMediaQuery("(min-width: 640px) and (max-width: 1479px)");

  const { data: tracks, isFetching, error } = useGetPlaylistTracksQuery({ playlistId: playlist.id });

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
        setMosaicImages(imagesToSet.length === 4 ? imagesToSet : Array(4).fill(imagesToSet[0] || placeholderImage));
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
    const trackId = getTrackId(track);
    setLoading(`track-${trackId}`, true);

    try {
      const trackWithPreview = await getPreviewUrl(track);
      if (trackWithPreview?.preview_url) {
        const updatedTracks = [...tracks];
        updatedTracks[index] = trackWithPreview;

        dispatch(
          replaceContext({
            contextType: "community_playlist",
            tracks: updatedTracks,
            startIndex: index,
            playlistData: {
              id: playlist.id,
              name: playlist.name,
              tracks: updatedTracks,
            },
          })
        );
        showToast(`Playing from ${playlist.name}`);
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
              contextType: "community_playlist",
              tracks: updatedTracks,
              startIndex,
              playlistData: { ...playlist, tracks: updatedTracks },
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
    const totalMs = tracks.reduce((acc, track) => acc + (track.duration_ms || 0), 0);
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
        className={`sm:hidden fixed inset-0 z-40 bg-gradient-to-b from-[#1a1848] to-[#0f0b2d] transition-all duration-500 ${
          isAnimating ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
        }`}
      >
        <div className="flex flex-col h-full pb-safe">
          {/* Mobile Header*/}
          <div className="flex items-center justify-between p-3 pt-safe">
            <button
              onClick={handleClose}
              className="p-2.5 rounded-2xl bg-white/[0.08] backdrop-blur-xl 
                border border-white/10 shadow-lg
                active:scale-95 transition-all duration-200"
            >
              <IoArrowBack className="w-5 h-5 text-white" />
            </button>
            <h2 className="text-sm font-semibold text-white/90 uppercase tracking-wider">Community Playlist</h2>
            <div className="w-[42px]" />
          </div>

          {/* Mobile Album Art and Info */}
          <div className="px-4 pb-4 flex-shrink-0">
            <div className="flex gap-5 items-center">
              {/* Album art */}
              <div className="relative flex-shrink-0">
                {/* Animated glow background */}
                <div
                  className="absolute -inset-3 bg-gradient-to-r from-[#14b8a6]/20 via-purple-600/20 to-[#14b8a6]/20 
                  rounded-2xl blur-xl animate-pulse-glow"
                ></div>

                {/* Album art container */}
                <div
                  className="relative w-[100px] h-[100px] rounded-xl overflow-hidden shadow-2xl 
                  ring-1 ring-white/10"
                >
                  {mosaicImages.length === 4 ? (
                    <div className="grid grid-cols-2 gap-0.5 w-full h-full bg-black/50">
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
                      src={mosaicImages[0] || playlist.images?.[0]?.url || placeholderImage}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = placeholderImage;
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Title and metadata */}
              <div className="flex-1 ml-1">
                <h1 className="text-[22px] font-bold text-white mb-2 line-clamp-2">{playlist.name}</h1>
                <p className="text-sm text-white/60 font-medium mb-3">by {playlist.owner?.display_name || "Spotify"}</p>

                {/* Stats */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <BsMusicNoteBeamed className="w-4 h-4 text-[#14b8a6]" />
                    <span className="text-sm text-white/80">{tracks?.length || 0} songs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BsClock className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-white/80">{getTotalDuration()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2.5 mt-5">
              {/* Play All button */}
              <button
                onClick={() => handlePlayAll(false)}
                disabled={isLoading("play-all")}
                className="flex-1 relative group"
              >
                <div
                  className="absolute -inset-0.5 bg-gradient-to-r from-[#14b8a6] to-[#0891b2] 
                  rounded-xl blur opacity-50 group-active:opacity-70 transition duration-200"
                ></div>

                <div
                  className="relative flex items-center justify-center gap-2 
                  bg-gradient-to-r from-[#14b8a6] to-[#0891b2] 
                  text-white font-semibold py-3 px-4 rounded-xl
                  transition-all duration-200 transform active:scale-[0.98]"
                >
                  {isLoading("play-all") ? (
                    <LoadingState variant="button" text="Loading..." />
                  ) : (
                    <>
                      <BsFillPlayFill size={20} />
                      <span className="text-sm">Play All</span>
                    </>
                  )}
                </div>
              </button>

              {/* Secondary actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePlayAll(true)}
                  disabled={isLoading("shuffle-play")}
                  className={`p-3 rounded-xl transition-all duration-200 
                    backdrop-blur-md border
                    ${
                      shuffle
                        ? "bg-[#14b8a6]/20 border-[#14b8a6]/50 text-[#14b8a6]"
                        : "bg-white/[0.08] border-white/10 text-white/70"
                    } 
                    active:scale-95 disabled:opacity-70`}
                >
                  {isLoading("shuffle-play") ? <MusicLoadingSpinner size="sm" /> : <BsShuffle size={18} />}
                </button>

                <button
                  onClick={handleAddAllToQueue}
                  className="p-3 rounded-xl bg-white/[0.08] backdrop-blur-md 
                    border border-white/10 text-white/70 
                    active:scale-95 transition-all duration-200"
                >
                  <HiPlus size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Track List */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {isFetching ? (
              <div className="flex items-center justify-center h-full">
                <Loader title="Loading tracks..." />
              </div>
            ) : error ? (
              <Error />
            ) : (
              <div className="px-3 pb-3">
                <div className="space-y-1.5">
                  {tracks?.map((track, i) => {
                    const isActive =
                      isSameTrack(track, currentTrack) && activeContext === "community_playlist" && currentIndex === i;
                    return (
                      <div
                        key={`${track.key || track.id}-${i}`}
                        ref={isActive ? activeTrackRef : null}
                        onClick={() => handlePlayClick(track, i)}
                        className={`relative flex items-center gap-3 p-3 rounded-xl 
                          transition-all duration-200 cursor-pointer group
                          ${
                            isActive
                              ? "bg-gradient-to-r from-[#14b8a6]/15 to-transparent backdrop-blur-md"
                              : "hover:bg-white/[0.05] active:bg-white/[0.08]"
                          }`}
                      >
                        {/* Track number */}
                        <div
                          className={`flex items-center justify-center w-7 h-7 rounded-lg
                          text-xs font-semibold transition-all duration-200
                          ${isActive ? "bg-[#14b8a6]/20 text-[#14b8a6]" : "bg-white/[0.06] text-white/50"}`}
                        >
                          {i + 1}
                        </div>

                        {/* Album art */}
                        <img
                          src={track.images?.coverart || placeholderImage}
                          alt={track.title}
                          className="w-11 h-11 rounded-lg object-cover shadow-md flex-shrink-0"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = placeholderImage;
                          }}
                        />

                        {/* Track info */}
                        <div className="flex-1 min-w-0">
                          <p
                            className={`font-medium truncate text-sm leading-tight
                            ${isActive ? "text-[#14b8a6]" : "text-white/90"}`}
                          >
                            {track.title}
                          </p>
                          <p className="text-white/50 text-xs truncate">{track.subtitle}</p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <div onClick={(e) => e.stopPropagation()}>
                            <SongMenu song={track} />
                          </div>
                          <div onClick={(e) => e.stopPropagation()}>
                            <PlayPause
                              song={track}
                              handlePause={handlePauseClick}
                              handlePlay={() => handlePlayClick(track, i)}
                              size={34}
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
      </div>

      {/* Tablet View with Integrated Player */}
      {!isDesktopScreen && (
        <div className="hidden sm:block">
          <div
            className={`fixed inset-0 z-30 transition-all duration-300 ${
              isAnimating ? "bg-black/60 backdrop-blur-sm" : "bg-transparent pointer-events-none"
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
                <button onClick={handleClose} className="p-2 rounded-full bg-black/20 hover:bg-black/40 transition-all">
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
                        src={playlist.images?.[0]?.url || mosaicImages[0] || placeholderImage}
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
                    <p className="text-sm text-[#14b8a6] font-medium mb-2">COMMUNITY PLAYLIST</p>
                    <h1 className="text-3xl font-bold text-white mb-3">{playlist.name}</h1>
                    <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                      <span>{playlist.owner?.display_name || "Spotify"}</span>
                      <span>•</span>
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
                            shuffle ? "bg-white/10 text-[#14b8a6]" : "bg-white/10 text-white hover:bg-white/20"
                          } disabled:opacity-80 disabled:cursor-not-allowed`}
                        >
                          {isLoading("shuffle-play") ? <MusicLoadingSpinner size="sm" /> : <BsShuffle size={20} />}
                        </button>
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                          Shuffle Play
                        </span>
                      </div>
                      <div className="relative group">
                        <button
                          onClick={handleAddAllToQueue}
                          className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
                        >
                          <HiPlus size={20} />
                        </button>
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                          Add to Queue
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Track List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                  {isFetching ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader title="Loading tracks..." />
                    </div>
                  ) : error ? (
                    <Error />
                  ) : (
                    <div className="space-y-1">
                      {tracks?.map((track, i) => {
                        const isActive =
                          isSameTrack(track, currentTrack) &&
                          activeContext === "community_playlist" &&
                          currentIndex === i;
                        return (
                          <div
                            key={`${track.key || track.id}-${i}`}
                            ref={isActive ? activeTrackRef : null}
                            onClick={() => handlePlayClick(track, i)}
                            className={`relative flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-all group cursor-pointer ${
                              isActive
                                ? "bg-gradient-to-r from-[#14b8a6]/15 to-transparent before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-[#14b8a6] before:rounded-l-lg"
                                : ""
                            }`}
                          >
                            <span className="text-gray-400 text-sm w-8 text-center">{i + 1}</span>

                            <img
                              src={track.images?.coverart || placeholderImage}
                              alt={track.title}
                              className="w-12 h-12 rounded object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = placeholderImage;
                              }}
                            />

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
                                <SongMenu song={track} />
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
        <div className="hidden sm:block">
          <div
            className={`fixed top-0 left-0 bottom-0 z-40 transition-all duration-300 ${
              isAnimating ? "bg-black/70 backdrop-blur-md" : "bg-transparent pointer-events-none"
            }`}
            onClick={handleBackdropClick}
            style={{
              right: "380px", // Respect SidebarPlayer width
            }}
          />

          {/* Slide-in Modal */}
          <div
            className={`fixed left-0 bottom-0 top-0 z-50 transition-all duration-500 overflow-hidden ${
              isAnimating ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"
            }`}
            style={{
              right: "380px", // Stop at SidebarPlayer boundary
              background: "linear-gradient(135deg, #1a1848 0%, #0f0b2d 100%)",
              boxShadow: isAnimating ? "0 0 50px rgba(20, 184, 166, 0.15)" : "none",
            }}
          >
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#14b8a6]/5 via-transparent to-purple-600/5 pointer-events-none"></div>

            <div className="h-full flex relative">
              {/* Left Panel - Info */}
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
                        mosaicImages.every((img) => img === mosaicImages[0]) && mosaicImages[0] !== placeholderImage ? (
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
                          src={playlist.images?.[0]?.url || mosaicImages[0] || placeholderImage}
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
                      Community Playlist
                    </p>
                    <h1 className="text-4xl font-bold text-white mb-4 line-clamp-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                      {playlist.name}
                    </h1>
                    <p className="text-gray-300 mb-6">by {playlist.owner?.display_name || "Spotify"}</p>

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
                            <BsFillPlayFill size={24} className="relative z-10" />
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
                            {isLoading("shuffle-play") ? <MusicLoadingSpinner size="sm" /> : <BsShuffle size={18} />}
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
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Panel - Track List */}
              <div className="flex-1 relative overflow-hidden">
                {/* Subtle vertical separator */}
                <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>

                <div className="h-full overflow-y-auto custom-scrollbar p-6 2xl:p-8 pl-8">
                  {isFetching ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader title="Loading tracks..." />
                    </div>
                  ) : error ? (
                    <Error />
                  ) : (
                    <div className="space-y-2">
                      {tracks?.map((track, i) => {
                        const isActive =
                          isSameTrack(track, currentTrack) &&
                          activeContext === "community_playlist" &&
                          currentIndex === i;
                        return (
                          <div
                            key={`${track.key || track.id}-${i}`}
                            ref={isActive ? activeTrackRef : null}
                            onClick={() => handlePlayClick(track, i)}
                            className={`relative group flex items-center gap-4 p-4 rounded-xl transition-all cursor-pointer ${
                              isActive
                                ? "bg-gradient-to-r from-[#14b8a6]/20 to-transparent before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-[#14b8a6] before:rounded-l-xl"
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
                              className="w-12 h-12 rounded-lg object-cover shadow-lg transition-all group-hover:shadow-xl"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = placeholderImage;
                              }}
                            />

                            <div className="flex-1 min-w-0">
                              <p
                                className={`font-medium truncate transition-colors ${
                                  isActive ? "text-[#14b8a6]" : "text-white group-hover:text-[#14b8a6]"
                                }`}
                              >
                                {track.title}
                              </p>
                              <p className="text-gray-400 text-sm truncate">{track.subtitle}</p>
                            </div>

                            <span className="text-gray-400 text-sm tabular-nums">
                              {formatDuration(track.duration_ms)}
                            </span>

                            {/* Actions */}
                            <div className="flex items-center gap-3">
                              <div onClick={(e) => e.stopPropagation()}>
                                <SongMenu song={track} />
                              </div>
                              <div onClick={(e) => e.stopPropagation()}>
                                <PlayPause
                                  song={track}
                                  handlePause={handlePauseClick}
                                  handlePlay={() => handlePlayClick(track, i)}
                                  size={40}
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
            </div>
          </div>
        </div>
      )}

      {/* Now Playing Modal */}
      {showNowPlaying && <NowPlaying isOpen={showNowPlaying} onClose={() => setShowNowPlaying(false)} />}
    </>
  );
};

export default PlaylistModal;
