import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import { Error, LoadingState, PlayPause, SongMenu } from "../components";
import AlbumCard from "../components/AlbumCard";
import ArtistCard from "../components/ArtistCard";
import {
  useGetArtistDetailsQuery,
  useGetArtistTopTracksQuery,
  useGetArtistAlbumsQuery,
  useGetRecommendedArtistsQuery,
} from "../redux/services/spotifyCore";
import {
  playPause,
  replaceContext,
  switchContext,
} from "../redux/features/playerSlice";
import { usePreviewUrl } from "../hooks/usePreviewUrl";
import { useLoadingState } from "../hooks/useLoadingState";
import { useToast } from "../context/ToastContext";
import {
  formatTrackDuration,
  isSameTrack,
  getTrackId,
} from "../utils/trackUtils";
import {
  HiOutlineUserGroup,
  HiOutlineFire,
  HiOutlineMusicNote,
  HiCheckCircle,
  HiExternalLink,
  HiSparkles,
  HiTrendingUp,
  HiCalendar,
  HiMusicNote,
} from "react-icons/hi";
import {
  BsSpotify,
  BsDisc,
  BsFillPlayFill,
  BsVinyl,
  BsMusicNoteList,
} from "react-icons/bs";
import { RiAlbumLine, RiUserFollowLine } from "react-icons/ri";
import { IoArrowBack } from "react-icons/io5";

const ArtistDetails = () => {
  const { id: artistId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isPlaying, currentTrack } = useSelector((state) => state.player);
  const { getPreviewUrl } = usePreviewUrl();
  const { showToast } = useToast();
  const { setLoading, isLoading } = useLoadingState();

  const {
    data: artistData,
    isFetching: isFetchingArtistDetails,
    error,
  } = useGetArtistDetailsQuery({ artistid: artistId });

  const { data: topTracks, isFetching: isFetchingTopTracks } =
    useGetArtistTopTracksQuery({ artistid: artistId });

  const { data: albumsData, isFetching: isFetchingAlbums } =
    useGetArtistAlbumsQuery({ artistId }, { skip: !artistId });

  // Get recommended artists based on this artist
  const {
    data: relatedArtists,
    isFetching: isFetchingRelated,
    error: relatedError,
  } = useGetRecommendedArtistsQuery(artistId, {
    skip: !artistId,
  });

  // Filter to only show albums and remove duplicates
  const albums =
    albumsData?.filter((album) => {
      // Only include albums
      if (album.album_type !== "album") return false;

      // Remove bonus / special tracks by checking if name contains parentheses
      const hasParentheses = /\([^)]*\)/.test(album.name);
      if (hasParentheses) return false;

      return true;
    }) || [];

  // Further deduplicate by album name
  const uniqueAlbums = albums.reduce((acc, album) => {
    const baseAlbumName = album.name.replace(/\s*\([^)]*\)\s*/g, "").trim();
    if (
      !acc.find(
        (a) => a.name.replace(/\s*\([^)]*\)\s*/g, "").trim() === baseAlbumName
      )
    ) {
      acc.push(album);
    }
    return acc;
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [artistId]);

  if (isFetchingArtistDetails || isFetchingTopTracks) {
    return (
      <LoadingState
        variant="page"
        title="Loading artist..."
        subtitle="Fetching albums and tracks"
      />
    );
  }

  if (error) return <Error />;

  const handlePauseClick = () => {
    dispatch(playPause(false));
  };

  const handlePlayClick = async (song, i) => {
    const trackId = getTrackId(song);
    setLoading(`track-${trackId}`, true);

    try {
      const songWithPreview = await getPreviewUrl(song);

      if (songWithPreview.preview_url) {
        dispatch(
          replaceContext({
            contextType: "queue",
            tracks: [songWithPreview],
            startIndex: 0,
            playlistData: {
              id: `artist-${artistId}`,
              name: `${artistData?.name || "Artist"} - Top Tracks`,
              type: "artist",
            },
          })
        );
        dispatch(switchContext({ contextType: "queue" }));
      } else {
        showToast("No preview available", "error");
      }
    } catch (error) {
      console.error("Error playing track:", error);
      showToast("Error loading track", "error");
    } finally {
      setLoading(`track-${trackId}`, false);
    }
  };

  const handlePlayAll = async () => {
    if (!topTracks || topTracks.length === 0) {
      showToast("No tracks available", "error");
      return;
    }

    setLoading("play-all", true);

    try {
      const tracksToPlay = topTracks.slice(0, 5);
      const tracksWithPreviews = [];

      // Fetch preview URLs for all tracks
      for (const track of tracksToPlay) {
        const trackWithPreview = await getPreviewUrl(track);
        if (trackWithPreview?.preview_url) {
          tracksWithPreviews.push(trackWithPreview);
        }
      }

      if (tracksWithPreviews.length === 0) {
        showToast("No preview available for these tracks", "error");
        return;
      }

      dispatch(
        replaceContext({
          contextType: "queue",
          tracks: tracksWithPreviews,
          startIndex: 0,
          playlistData: {
            id: `artist-${artistId}`,
            name: `${artistData?.name || "Artist"} - Top Tracks`,
            type: "artist",
          },
        })
      );

      dispatch(switchContext({ contextType: "queue" }));
      showToast(`Playing ${tracksWithPreviews.length} tracks`);
    } catch (error) {
      console.error("Error playing all tracks:", error);
      showToast("Error loading tracks", "error");
    } finally {
      setLoading("play-all", false);
    }
  };

  const formatFollowers = (num) => {
    if (!num) return "0";
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const displayAlbums = uniqueAlbums.slice(0, 6);
  const displayTopTracks = topTracks?.slice(0, 5) || [];

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="group bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-md rounded-xl p-3 sm:p-5 border border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-0.5 hover:from-white/[0.10] hover:to-white/[0.04]">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">
            {label}
          </p>
          <p className="text-lg sm:text-2xl font-bold text-white truncate">
            {value}
          </p>
        </div>
        <div
          className={`p-2 sm:p-3 rounded-lg bg-gradient-to-br ${color} shadow-lg flex-shrink-0`}
        >
          <Icon className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative mb-4 sm:mb-6">
        {/* Background Image */}
        <div className="absolute inset-0 h-[400px] sm:h-[450px] overflow-hidden rounded-b-2xl">
          <img
            src={artistData?.images?.background || artistData?.avatar}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-[#1a1848]/90 to-[#1a1848]"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 px-4 sm:px-6 md:px-12 py-6 sm:py-8">
          {/* Mobile Back Button */}
          <div className="sm:hidden absolute top-3 left-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2.5 rounded-2xl bg-white/[0.08] backdrop-blur-xl border border-white/10 shadow-lg active:scale-95 transition-all duration-200"
            >
              <IoArrowBack className="w-5 h-5 text-white" />
            </button>
          </div>
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6 sm:gap-8 mb-6 sm:mb-8">
              {/* Artist Image */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-[#14b8a6] to-purple-600 rounded-full blur-lg opacity-30 group-hover:opacity-50 transition duration-500"></div>
                <img
                  src={artistData?.images?.background || artistData?.avatar}
                  alt={artistData?.name}
                  className="relative w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 rounded-full object-cover shadow-2xl transform transition-transform duration-500 group-hover:scale-105"
                />
                {artistData?.isVerified && (
                  <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 bg-[#14b8a6] rounded-full p-1.5 sm:p-2 shadow-lg">
                    <HiCheckCircle className="w-5 h-5 sm:w-8 sm:h-8 text-white" />
                  </div>
                )}
              </div>

              {/* Artist Info */}
              <div className="text-center md:text-left flex-1">
                <div className="flex items-center gap-2 sm:gap-3 justify-center md:justify-start mb-1 sm:mb-2">
                  <HiCheckCircle className="w-4 h-4 sm:w-6 sm:h-6 text-[#14b8a6]" />
                  <span className="text-xs sm:text-sm font-medium text-[#14b8a6] uppercase tracking-wider">
                    Verified Artist
                  </span>
                </div>
                <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold text-white mb-3 sm:mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  {artistData?.name}
                </h1>
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 justify-center md:justify-start text-gray-300 mb-4 sm:mb-6">
                  <span className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base">
                    <RiUserFollowLine className="w-4 h-4 sm:w-5 sm:h-5" />
                    {formatFollowers(artistData?.followers)} followers
                  </span>
                  <span className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base">
                    <BsMusicNoteList className="w-4 h-4 sm:w-5 sm:h-5" />
                    {topTracks?.length || 0} top tracks
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 sm:gap-4 justify-center md:justify-start">
                  <button
                    onClick={handlePlayAll}
                    disabled={isLoading("play-all")}
                    className="group relative flex items-center gap-2 bg-gradient-to-r from-[#14b8a6] to-[#0d9488] hover:from-[#0d9488] hover:to-[#14b8a6] text-white font-semibold py-2.5 sm:py-3 px-5 sm:px-6 rounded-full transition-all transform hover:scale-105 shadow-xl shadow-[#14b8a6]/30 disabled:opacity-80 disabled:cursor-not-allowed disabled:hover:scale-100 text-sm sm:text-base"
                  >
                    {isLoading("play-all") ? (
                      <LoadingState variant="button" text="Loading..." />
                    ) : (
                      <>
                        <BsFillPlayFill size={20} className="sm:w-6 sm:h-6" />
                        <span>Play Top Tracks</span>
                      </>
                    )}
                  </button>
                  <a
                    href={`https://open.spotify.com/artist/${artistId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-full font-medium transition-all border border-white/20 hover:border-white/30 hover:shadow-lg hover:shadow-white/10 text-sm sm:text-base"
                  >
                    <BsSpotify className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline">Open in</span> Spotify
                    <HiExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <StatCard
                icon={RiUserFollowLine}
                label="Followers"
                value={formatFollowers(artistData?.followers)}
                color="from-blue-500/20 to-cyan-500/20"
              />
              <StatCard
                icon={HiOutlineFire}
                label="Popularity"
                value={`${artistData?.popularity || 0}%`}
                color="from-orange-500/20 to-red-500/20"
              />
              <StatCard
                icon={BsMusicNoteList}
                label="Top Tracks"
                value={topTracks?.length || 0}
                color="from-green-500/20 to-emerald-500/20"
              />
              <StatCard
                icon={RiAlbumLine}
                label="Albums"
                value={displayAlbums?.length || 0}
                color="from-purple-500/20 to-pink-500/20"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 md:px-12 pb-12 max-w-7xl mx-auto">
        {/* Top Tracks Section */}
        <div className="mb-8 sm:mb-12 mt-4 sm:mt-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-[#14b8a6]/20 to-cyan-500/20">
              <HiOutlineFire className="w-5 h-5 sm:w-7 sm:h-7 text-[#14b8a6]" />
            </div>
            Popular Tracks
          </h2>

          <div className="bg-gradient-to-br from-white/[0.03] to-white/[0.01] backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-6 border border-white/10">
            {displayTopTracks.length > 0 ? (
              <div className="space-y-1 sm:space-y-3">
                {displayTopTracks.map((track, i) => {
                  const isActive =
                    isSameTrack(track, currentTrack) && isPlaying;
                  return (
                    <div
                      key={`${track.key || track.id}-${i}`}
                      onClick={() => handlePlayClick(track, i)}
                      className={`group flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl transition-all cursor-pointer ${
                        isActive
                          ? "bg-gradient-to-r from-[#14b8a6]/20 to-transparent border border-[#14b8a6]/30"
                          : "hover:bg-white/5 border border-transparent hover:border-white/10"
                      }`}
                    >
                      {/* Rank */}
                      <div
                        className={`text-lg sm:text-2xl font-bold w-6 sm:w-8 text-center hidden xs:block ${
                          isActive ? "text-[#14b8a6]" : "text-gray-400"
                        }`}
                      >
                        {i + 1}
                      </div>

                      {/* Album Art */}
                      <img
                        src={
                          track?.album?.images?.[0]?.url ||
                          track?.images?.coverart
                        }
                        alt={track?.title}
                        className={`w-12 h-12 sm:w-14 sm:h-14 rounded-lg object-cover shadow-lg transition-all flex-shrink-0 ${
                          isActive
                            ? "ring-2 ring-[#14b8a6] ring-offset-2 ring-offset-transparent"
                            : "group-hover:shadow-xl"
                        }`}
                      />

                      {/* Track Info */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-medium truncate transition-colors text-sm sm:text-base ${
                            isActive
                              ? "text-[#14b8a6]"
                              : "text-white group-hover:text-[#14b8a6]"
                          }`}
                        >
                          {track?.title || track?.name}
                        </p>
                        <p className="text-gray-400 text-xs sm:text-sm truncate">
                          {track?.album?.name || "Single"}
                        </p>
                      </div>

                      {/* Duration */}
                      <span className="text-gray-400 text-sm tabular-nums hidden sm:block">
                        {formatTrackDuration(track?.duration_ms)}
                      </span>

                      {/* Actions */}
                      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        <div onClick={(e) => e.stopPropagation()}>
                          <SongMenu song={track} />
                        </div>
                        <div onClick={(e) => e.stopPropagation()}>
                          <PlayPause
                            isPlaying={isActive}
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
            ) : (
              <p className="text-center text-gray-400 py-8">
                No tracks available
              </p>
            )}
          </div>
        </div>

        {/* Albums Section */}
        {displayAlbums.length > 0 && (
          <div className="mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                <BsDisc className="w-5 h-5 sm:w-7 sm:h-7 text-purple-400" />
              </div>
              Albums
            </h2>

            {/* Dynamic grid */}
            <div
              className={`grid gap-4 sm:gap-6 ${
                displayAlbums.length === 1
                  ? "grid-cols-1 max-w-xs mx-auto"
                  : displayAlbums.length === 2
                  ? "grid-cols-2 max-w-2xl mx-auto"
                  : displayAlbums.length === 3
                  ? "grid-cols-2 sm:grid-cols-3 max-w-4xl mx-auto"
                  : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6"
              }`}
            >
              {displayAlbums.map((album, i) => (
                <div
                  key={album.id || i}
                  className={`${
                    displayAlbums.length <= 2
                      ? "max-w-[200px] sm:max-w-[250px] mx-auto w-full"
                      : ""
                  }`}
                >
                  <AlbumCard album={album} showYear={true} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Similar Artists Section */}
        {relatedArtists && relatedArtists.length > 0 && (
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
                <HiSparkles className="w-5 h-5 sm:w-7 sm:h-7 text-cyan-400" />
              </div>
              Similar Artists
            </h2>

            <div className="grid grid-cols-3 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
              {relatedArtists.slice(0, 6).map((artist, i) => (
                <div
                  key={artist.id || i}
                  onClick={() => navigate(`/artists/${artist.id}`)}
                  className="cursor-pointer transform transition-transform hover:scale-105"
                >
                  <ArtistCard track={{ artists: [artist] }} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArtistDetails;
