import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  playPause,
  setActiveSong,
  setShuffleWithStart,
} from "../redux/features/playerSlice";
import { usePreviewUrl } from "../hooks/usePreviewUrl";
import {
  useGetAlbumDetailsQuery,
  useGetAlbumTracksQuery,
} from "../redux/services/spotifyCore";
import { Error, Loader, PlayPause } from "../components";
import {
  BsFillPlayFill,
  BsShuffle,
  BsCalendar3,
  BsVinyl,
  BsClock,
} from "react-icons/bs";
import { HiOutlineSparkles } from "react-icons/hi";
import { IoMdTime } from "react-icons/io";

const AlbumDetails = () => {
  const { id: albumId } = useParams();
  const dispatch = useDispatch();
  const { activeSong, isPlaying } = useSelector((state) => state.player);
  const { getPreviewUrl, prefetchPreviewUrl, isPreviewCached } =
    usePreviewUrl();
  const [dominantColor, setDominantColor] = useState("rgb(20, 184, 166)");
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const {
    data: albumData,
    isFetching: isFetchingAlbum,
    error: albumError,
  } = useGetAlbumDetailsQuery({ albumId });

  const {
    data: tracks,
    isFetching: isFetchingTracks,
    error: tracksError,
  } = useGetAlbumTracksQuery({ albumId });

  console.log("Album ID:", albumId);
  console.log("Album Data:", albumData);
  console.log("Album Error:", albumError);
  console.log("Tracks:", tracks);
  console.log("Tracks Error:", tracksError);

  // Extract dominant color from album art
  useEffect(() => {
    if (albumData?.images?.[0]?.url && !isImageLoaded) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = albumData.images[0].url;
      img.onload = () => {
        setIsImageLoaded(true);
        // Simple color extraction - in production you'd use a library
        setDominantColor("rgb(20, 184, 166)"); // Teal fallback
      };
    }
  }, [albumData, isImageLoaded]);

  // Prefetch tracks
  useEffect(() => {
    if (tracks && tracks.length > 0) {
      // Prefetch first 5 tracks
      tracks.slice(0, 5).forEach((track, index) => {
        setTimeout(() => {
          if (!isPreviewCached(track)) {
            prefetchPreviewUrl(track, {
              priority: index === 0 ? "high" : "low",
            });
          }
        }, index * 1000);
      });
    }
  }, [tracks, prefetchPreviewUrl, isPreviewCached]);

  if (isFetchingAlbum || isFetchingTracks) {
    return <Loader title="Loading album..." />;
  }

  if (albumError || tracksError) return <Error />;

  const handlePlayClick = async (track, index) => {
    const songWithPreview = await getPreviewUrl(track);
    if (songWithPreview.preview_url) {
      const trackWithAlbumArt = {
        ...songWithPreview,
        images: {
          ...songWithPreview.images,
          coverart:
            albumData?.images?.[0]?.url || songWithPreview.images?.coverart,
        },
      };

      const tracksWithAlbumArt = tracks.map((t) => ({
        ...t,
        images: {
          ...t.images,
          coverart: albumData?.images?.[0]?.url || t.images?.coverart,
        },
      }));

      dispatch(
        setActiveSong({
          song: trackWithAlbumArt,
          data: tracksWithAlbumArt,
          i: index,
        })
      );
      dispatch(playPause(true));
    }
  };
  const handlePauseClick = () => {
    dispatch(playPause(false));
  };

  const handlePlayAll = () => {
    if (tracks && tracks.length > 0) {
      handlePlayClick(tracks[0], 0);
    }
  };

  const handleShuffle = async () => {
    if (tracks && tracks.length > 0) {
      const randomIndex = Math.floor(Math.random() * tracks.length);

      // Set shuffle mode and start playing
      dispatch(setShuffleWithStart({ startIndex: randomIndex }));

      // Play the random track
      await handlePlayClick(tracks[randomIndex], randomIndex);
    }
  };

  // Calculate total duration
  const totalDuration =
    tracks?.reduce((acc, track) => acc + (track.duration_ms || 0), 0) || 0;
  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return hours > 0 ? `${hours} hr ${remainingMinutes} min` : `${minutes} min`;
  };

  // Format individual track duration
  const formatTrackDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const albumImage =
    albumData?.images?.[0]?.url ||
    "https://via.placeholder.com/500x500.png?text=No+Image";
  const releaseYear = albumData?.release_date
    ? new Date(albumData.release_date).getFullYear()
    : "";

  return (
    <div className="flex flex-col">
      {/* Hero Section with gradient background */}
      <div
        className="relative h-[400px] w-full bg-gradient-to-b from-transparent via-black/50 to-[#1a1848]"
        style={{
          background: `linear-gradient(to bottom, ${dominantColor}20, transparent 50%, #1a1848)`,
        }}
      >
        {/* Blurred background */}
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={albumImage}
            alt="background"
            className="w-full h-full object-cover opacity-20 blur-3xl scale-110"
          />
        </div>

        {/* Content */}
        <div className="relative flex items-end h-full px-6 pb-8">
          <div className="flex items-end gap-6">
            {/* Album Cover with vinyl effect */}
            <div className="relative group">
              <img
                src={albumImage}
                alt={albumData?.name}
                className="w-60 h-60 rounded-lg shadow-2xl shadow-black/50 group-hover:scale-105 transition-transform duration-300"
              />
              {/* Vinyl record behind album */}
              <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-56 h-56 bg-black rounded-full opacity-0 group-hover:opacity-100 group-hover:translate-x-8 transition-all duration-500">
                <div className="absolute inset-4 bg-gray-900 rounded-full">
                  <div className="absolute inset-8 bg-black rounded-full flex items-center justify-center">
                    <BsVinyl
                      className="w-12 h-12 text-gray-800 animate-spin"
                      style={{ animationDuration: "3s" }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Album Info */}
            <div className="flex-1 mb-4">
              <p className="text-white/80 text-sm font-medium mb-2">
                {albumData?.album_type?.toUpperCase()}
              </p>
              <h1 className="text-5xl font-bold text-white mb-4">
                {albumData?.name}
              </h1>
              <div className="flex items-center gap-4 text-white/90">
                <Link
                  to={`/artists/${albumData?.artists?.[0]?.id}`}
                  className="font-semibold hover:underline"
                >
                  {albumData?.artists?.map((artist) => artist.name).join(", ")}
                </Link>
                <span className="text-white/60">•</span>
                <span className="flex items-center gap-1">
                  <BsCalendar3 className="w-4 h-4" />
                  {releaseYear}
                </span>
                <span className="text-white/60">•</span>
                <span>{tracks?.length || 0} songs</span>
                <span className="text-white/60">•</span>
                <span className="flex items-center gap-1">
                  <BsClock className="w-4 h-4" />
                  {formatDuration(totalDuration)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-6 py-6 flex items-center gap-4">
        <button
          onClick={handlePlayAll}
          className="bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-full p-4 transition-all hover:scale-105 shadow-lg shadow-[#14b8a6]/25"
        >
          <BsFillPlayFill size={28} className="translate-x-0.5" />
        </button>
        <button
          onClick={handleShuffle}
          className="border border-white/20 hover:border-white/40 text-white rounded-full px-6 py-3 transition-all hover:scale-105 flex items-center gap-2"
        >
          <BsShuffle size={20} />
          Shuffle
        </button>
      </div>

      {/* Track List */}
      <div className="px-6">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          {tracks?.map((track, index) => {
            const isCurrentSong =
              activeSong?.key === track.key ||
              activeSong?.title === track.title;

            return (
              <div
                key={track.key || index}
                className={`group flex items-center py-3 px-4 rounded-lg hover:bg-white/5 transition-all ${
                  isCurrentSong ? "bg-white/10" : ""
                }`}
                onMouseEnter={() => {
                  if (!isPreviewCached(track)) {
                    prefetchPreviewUrl(track, { priority: "high" });
                  }
                }}
              >
                {/* Track Number / Play Button */}
                <div className="w-10 mr-4 flex items-center justify-center">
                  <span
                    className={`text-sm ${
                      isCurrentSong ? "text-[#14b8a6]" : "text-white/60"
                    } group-hover:hidden`}
                  >
                    {index + 1}
                  </span>
                  <div className="hidden group-hover:block">
                    <PlayPause
                      isPlaying={isPlaying}
                      activeSong={activeSong}
                      song={track}
                      handlePause={handlePauseClick}
                      handlePlay={() => handlePlayClick(track, index)}
                      size={20}
                    />
                  </div>
                </div>

                {/* Track Info */}
                <div className="flex-1">
                  <p
                    className={`font-medium ${
                      isCurrentSong ? "text-[#14b8a6]" : "text-white"
                    }`}
                  >
                    {track.title || track.name}
                  </p>
                  <p className="text-sm text-white/60">
                    {track.artists?.map((artist) => artist.name).join(", ")}
                  </p>
                </div>

                {/* Popularity indicator */}
                {track.track?.popularity && (
                  <div className="flex items-center gap-1 mr-6">
                    <HiOutlineSparkles className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-white/60">
                      {track.track.popularity}
                    </span>
                  </div>
                )}

                {/* Duration */}
                <div className="flex items-center gap-1 text-white/60">
                  <IoMdTime className="w-4 h-4" />
                  <span className="text-sm">
                    {formatTrackDuration(track.duration_ms)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Album Credits */}
        {albumData?.label && (
          <div className="mt-8 mb-12">
            <h3 className="text-white text-lg font-semibold mb-4">
              Album Credits
            </h3>
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
              <p className="text-white/80">
                <span className="text-white/60">Label:</span> {albumData.label}
              </p>
              {albumData?.copyrights?.[0] && (
                <p className="text-white/60 text-sm mt-2">
                  {albumData.copyrights[0].text}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlbumDetails;
