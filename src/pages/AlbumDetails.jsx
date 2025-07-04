import { Link, useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Error, Loader, PlayPause, SongMenu } from "../components";
import {
  useGetAlbumDetailsQuery,
  useGetAlbumTracksQuery,
} from "../redux/services/spotifyCore";
import { usePreviewUrl } from "../hooks/usePreviewUrl";
import {
  replaceContext,
  addToQueue,
  playPause,
  playTrack,
  switchContext,
} from "../redux/features/playerSlice";
import { useToast } from "../context/ToastContext";
import { isSameTrack, formatTrackDuration } from "../utils/trackUtils";
import { BsFillPlayFill, BsCalendar3, BsDisc, BsSpotify } from "react-icons/bs";
import { HiPlus, HiMusicNote, HiClock } from "react-icons/hi";
import { RiAlbumLine } from "react-icons/ri";

const AlbumDetails = () => {
  const dispatch = useDispatch();
  const { id: albumId } = useParams();
  const { getPreviewUrl } = usePreviewUrl();
  const { showToast } = useToast();
  const { isPlaying, currentTrack } = useSelector((state) => state.player);

  const {
    data: albumData,
    isFetching: isFetchingAlbumDetails,
    error: albumError,
  } = useGetAlbumDetailsQuery({ albumId });

  const {
    data: tracks,
    isFetching: isFetchingTracks,
    error: tracksError,
  } = useGetAlbumTracksQuery({ albumId });

  if (isFetchingAlbumDetails || isFetchingTracks) {
    return <Loader title="Loading album..." />;
  }

  if (albumError || tracksError) {
    console.error("Errors:", { albumError, tracksError });
    return <Error />;
  }

  const tracksWithAlbumArt =
    tracks?.map((track) => {
      const processedTrack = {
        ...track,
        images: {
          coverart: albumData?.images?.[0]?.url || "",
          background: albumData?.images?.[0]?.url || "",
        },
        album: {
          ...track.album,
          id: albumData?.id,
          name: albumData?.name,
          images: albumData?.images || [],
        },
      };
      return processedTrack;
    }) || [];

  const handlePlayAlbum = async () => {
    if (!tracksWithAlbumArt || tracksWithAlbumArt.length === 0) {
      showToast("No tracks available", "error");
      return;
    }

    try {
      const firstTrackWithPreview = await getPreviewUrl(tracksWithAlbumArt[0]);

      if (firstTrackWithPreview?.preview_url) {
        const updatedTracks = [...tracksWithAlbumArt];
        updatedTracks[0] = firstTrackWithPreview;

        dispatch(
          replaceContext({
            contextType: "album",
            tracks: updatedTracks,
            startIndex: 0,
            playlistData: {
              id: albumData?.id,
              name: albumData?.name,
            },
          })
        );
      } else {
        showToast("No preview available", "error");
      }
    } catch (error) {
      console.error("Error playing album:", error);
      showToast("Error playing album", "error");
    }
  };

  const handleAddToQueue = () => {
    if (tracksWithAlbumArt && tracksWithAlbumArt.length > 0) {
      tracksWithAlbumArt.forEach((track) => {
        dispatch(addToQueue({ song: track }));
      });
      dispatch(switchContext({ contextType: "queue" }));
      showToast(`Added ${tracksWithAlbumArt.length} tracks to queue`);
    }
  };

  const handlePauseClick = () => {
    dispatch(playPause(false));
  };

  const handlePlayClick = async (track, index) => {
    try {
      const songWithPreview = await getPreviewUrl(track);

      if (songWithPreview?.preview_url) {
        dispatch(
          playTrack({
            track: songWithPreview,
          })
        );
      } else {
        showToast("No preview available", "error");
      }
    } catch (error) {
      console.error("Error playing track:", error);
      showToast("Error loading track", "error");
    }
  };

  const formatReleaseDate = (dateString) => {
    if (!dateString) return "Unknown";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const getTotalDuration = () => {
    if (!tracksWithAlbumArt) return "0 min";
    const totalMs = tracksWithAlbumArt.reduce(
      (acc, track) => acc + (track.duration_ms || 0),
      0
    );
    const minutes = Math.floor(totalMs / 60000);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return hours > 0 ? `${hours}h ${remainingMinutes}m` : `${minutes} min`;
  };

  const albumImage = albumData?.images?.[0]?.url || "";
  const placeholderImage =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNGE1NTY4Ii8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZmlsbD0iI2EwYWVjMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4=";

  // Mobile info row component
  const InfoRow = ({ icon: Icon, iconColor, label, value }) => (
    <div className="flex items-center justify-between py-2.5 border-b border-white/10 last:border-0">
      <div className="flex items-center gap-2.5">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <span className="text-gray-400 text-xs">{label}</span>
      </div>
      <span className="text-white text-sm font-medium">{value}</span>
    </div>
  );

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="px-4 md:px-0 pt-6 sm:pt-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-start gap-4">
          {/* Album Art */}
          <div className="relative flex-shrink-0">
            <img
              alt={albumData?.name}
              src={albumImage}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = placeholderImage;
              }}
              className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-xl object-cover shadow-2xl"
            />
            {/* Gradient glow */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#14b8a6]/30 to-purple-600/30 -z-10 scale-110 blur-2xl" />
          </div>

          {/* Album Info */}
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
              {albumData?.name || "Unknown Album"}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-sm sm:text-base">
              {albumData?.artists?.map((artist, i) => (
                <span key={artist.id}>
                  <Link
                    to={`/artists/${artist.id}`}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {artist.name}
                  </Link>
                  {i < albumData.artists.length - 1 && (
                    <span className="text-gray-500 ml-2">•</span>
                  )}
                </span>
              ))}
            </div>

            {/* Action Buttons - Desktop */}
            <div className="hidden sm:flex items-center gap-3 mt-4">
              <button
                onClick={handlePlayAlbum}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#14b8a6] hover:bg-[#10a094] text-white rounded-full font-medium transition-all hover:scale-105 shadow-lg"
              >
                <BsFillPlayFill className="w-5 h-5" />
                Play Album
              </button>
              <button
                onClick={handleAddToQueue}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-full font-medium transition-all border border-white/20"
              >
                <HiPlus className="w-4 h-4" />
                Add to Queue
              </button>
              {albumData?.external_urls?.spotify && (
                <a
                  href={albumData.external_urls.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 text-[#1DB954] hover:text-[#1ed760] hover:bg-white/10 rounded-full transition-all"
                >
                  <BsSpotify className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Action Buttons */}
        <div className="flex sm:hidden items-center gap-2 mt-4">
          <button
            onClick={handlePlayAlbum}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#14b8a6] hover:bg-[#10a094] text-white rounded-lg font-medium transition-all"
          >
            <BsFillPlayFill className="w-5 h-5" />
            Play Album
          </button>
          <button
            onClick={handleAddToQueue}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium"
          >
            <HiPlus className="w-4 h-4" />
            Queue
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="px-4 md:px-0 pb-24 mt-4 sm:mt-6">
        {/* Mobile Layout */}
        <div className="md:hidden">
          {/* Album Info */}
          <div className="bg-gradient-to-br from-white/[0.07] to-white/[0.05] backdrop-blur-sm rounded-xl border border-white/10 mb-4">
            <div className="p-3">
              <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                <RiAlbumLine className="text-[#14b8a6] w-4 h-4" />
                Album Information
              </h2>

              <div className="space-y-0">
                {albumData?.label && (
                  <InfoRow
                    icon={BsDisc}
                    iconColor="text-purple-400"
                    label="Label"
                    value={albumData.label}
                  />
                )}
                <InfoRow
                  icon={BsCalendar3}
                  iconColor="text-blue-400"
                  label="Released"
                  value={formatReleaseDate(albumData?.release_date)}
                />
                <InfoRow
                  icon={HiClock}
                  iconColor="text-[#14b8a6]"
                  label="Duration"
                  value={getTotalDuration()}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Layout - Album Info */}
        <div className="hidden md:block mb-5">
          <div className="bg-gradient-to-br from-white/[0.06] to-white/[0.03] backdrop-blur-sm rounded-xl p-5 border border-white/10">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <RiAlbumLine className="text-[#14b8a6]" />
              Album Information
            </h2>
            <div className="grid grid-cols-3 gap-4">
              {albumData?.label && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Label</p>
                  <p className="text-sm font-medium text-white">
                    {albumData.label}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-400 mb-1">Release Date</p>
                <p className="text-sm font-medium text-white">
                  {formatReleaseDate(albumData?.release_date)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Duration</p>
                <p className="text-sm font-medium text-white">
                  {getTotalDuration()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tracks Section */}
        <div className="mt-3">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2">
            Tracks
          </h2>
          <div className="space-y-1">
            {tracksWithAlbumArt.length > 0 ? (
              tracksWithAlbumArt.map((track, i) => (
                <div
                  key={track.key || track.id || i}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white/10 transition-all cursor-pointer group ${
                    isPlaying && isSameTrack(track, currentTrack)
                      ? "bg-white/10"
                      : ""
                  }`}
                  onClick={() => handlePlayClick(track, i)}
                >
                  {/* Track Number */}
                  <span className="text-gray-400 text-sm w-8 text-left">
                    {i + 1}.
                  </span>

                  {/* Track Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm sm:text-base font-medium truncate">
                      {track?.title || track?.name || "Unknown"}
                    </p>
                    <p className="text-gray-400 text-xs sm:text-sm">
                      {formatTrackDuration(track?.duration_ms)}
                    </p>
                  </div>

                  {/* Menu and Play Button */}
                  <div className="flex items-center gap-2">
                    <div onClick={(e) => e.stopPropagation()}>
                      <SongMenu song={track} />
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <PlayPause
                        isPlaying={
                          isPlaying && isSameTrack(track, currentTrack)
                        }
                        song={track}
                        handlePause={handlePauseClick}
                        handlePlay={() => handlePlayClick(track, i)}
                        size={30}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-sm py-4 text-center">
                No tracks available.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlbumDetails;
