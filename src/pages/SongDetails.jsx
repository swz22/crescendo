import { Link, useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Error, Loader, PlayPause, SongMenu } from "../components";
import { playTrack, playPause } from "../redux/features/playerSlice";
import { usePreviewUrl } from "../hooks/usePreviewUrl";
import {
  getTrackId,
  formatTrackDuration,
  isSameTrack,
} from "../utils/trackUtils";
import {
  useGetSongDetailsQuery,
  useGetArtistTopTracksQuery,
} from "../redux/services/spotifyCore";
import { HiExternalLink, HiMusicNote, HiClock } from "react-icons/hi";
import { BsCalendar3, BsDisc, BsSpotify } from "react-icons/bs";
import { SiGenius, SiGoogle } from "react-icons/si";

const SongDetails = () => {
  const dispatch = useDispatch();
  const { getPreviewUrl } = usePreviewUrl();
  const { songid } = useParams();
  const { isPlaying, currentTrack } = useSelector((state) => state.player);

  const {
    data: songData,
    isFetching: isFetchingSongDetails,
    error: songError,
  } = useGetSongDetailsQuery({ songid });

  const artistId = songData?.artists?.[0]?.id;

  const { data: relatedData, isFetching: isFetchingRelatedSongs } =
    useGetArtistTopTracksQuery({ artistid: artistId }, { skip: !artistId });

  if (isFetchingSongDetails || isFetchingRelatedSongs)
    return <Loader title="Loading song details..." />;

  if (songError) return <Error />;

  const handlePauseClick = () => {
    dispatch(playPause(false));
  };

  const handlePlayClick = async (song, i) => {
    const songWithPreview = await getPreviewUrl(song);

    if (songWithPreview.preview_url) {
      dispatch(
        playTrack({
          track: songWithPreview,
        })
      );
    } else {
      console.error("No preview available for this track");
    }
  };

  const relatedSongs =
    relatedData?.filter((song) => {
      const songKey = getTrackId(song);
      return songKey !== songid;
    }) || [];

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

  const InfoRow = ({ icon: Icon, iconColor, label, value, link }) => (
    <div className="flex items-center justify-between py-2.5 border-b border-white/10 last:border-0">
      <div className="flex items-center gap-2.5">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <span className="text-gray-400 text-xs">{label}</span>
      </div>
      <div className="text-right">
        {link ? (
          <Link
            to={link}
            className="text-white text-sm font-medium hover:text-[#14b8a6] transition-colors inline-flex items-center gap-1"
          >
            {value}
            <HiExternalLink className="w-3 h-3" />
          </Link>
        ) : (
          <span className="text-white text-sm font-medium">{value}</span>
        )}
      </div>
    </div>
  );

  const albumImage =
    songData?.images?.coverart || songData?.album?.images?.[0]?.url || "";
  const placeholderImage =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNGE1NTY4Ii8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZmlsbD0iI2EwYWVjMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4=";

  return (
    <div className="flex flex-col">
      <div className="px-4 md:px-0 pt-6 sm:pt-8">
        <div className="flex items-center gap-3">
          {/* Album Art */}
          <div className="relative flex-shrink-0">
            <img
              alt={songData?.title}
              src={albumImage}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = placeholderImage;
              }}
              className="w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-lg object-cover shadow-lg"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent rounded-lg" />
          </div>

          {/* Title and Artist */}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white line-clamp-1">
              {songData?.title || "Unknown Song"}
            </h1>
            {songData?.artists?.[0] ? (
              <Link
                to={`/artists/${songData.artists[0].id}`}
                className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors inline-block"
              >
                {songData?.subtitle ||
                  songData?.artists?.[0]?.name ||
                  "Unknown Artist"}
              </Link>
            ) : (
              <p className="text-xs sm:text-sm text-gray-400">
                {songData?.subtitle || "Unknown Artist"}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="px-4 md:px-0 pb-24 mt-4 sm:mt-6">
        {/* Mobile Layout */}
        <div className="md:hidden">
          {/* Track Info */}
          <div className="bg-gradient-to-br from-white/[0.07] to-white/[0.05] backdrop-blur-sm rounded-xl border border-white/10 mb-4">
            <div className="p-3">
              <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                <HiMusicNote className="text-[#14b8a6] w-4 h-4" />
                Track Information
              </h2>

              <div className="space-y-0">
                <InfoRow
                  icon={BsDisc}
                  iconColor="text-[#14b8a6]"
                  label="Album"
                  value={songData?.album?.name || "Unknown"}
                  link={
                    songData?.album?.id ? `/albums/${songData.album.id}` : null
                  }
                />
                <InfoRow
                  icon={BsCalendar3}
                  iconColor="text-blue-400"
                  label="Released"
                  value={formatReleaseDate(songData?.album?.release_date)}
                />
                <InfoRow
                  icon={HiClock}
                  iconColor="text-purple-400"
                  label="Duration"
                  value={formatTrackDuration(songData?.duration_ms)}
                />
                {songData?.external_urls?.spotify && (
                  <div className="pt-2.5">
                    <a
                      href={songData.external_urls.spotify}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-2 bg-[#1DB954]/20 hover:bg-[#1DB954]/30 text-[#1DB954] rounded-lg text-sm font-medium transition-all"
                    >
                      <BsSpotify className="w-4 h-4" />
                      Listen on Spotify
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Lyrics Section */}
          <div className="bg-gradient-to-br from-white/[0.06] to-white/[0.03] backdrop-blur-sm rounded-xl p-3 border border-white/10 mb-4">
            <h3 className="text-base font-semibold text-white mb-2.5">
              Lyrics
            </h3>

            <div className="space-y-1.5">
              <a
                href={`https://genius.com/search?q=${encodeURIComponent(
                  `${songData?.title || ""} ${songData?.subtitle || ""}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 rounded-lg text-sm font-medium transition-all"
              >
                <SiGenius className="w-3.5 h-3.5" />
                Search on Genius
              </a>

              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(
                  `${songData?.title || ""} ${songData?.subtitle || ""} lyrics`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg text-sm font-medium transition-all"
              >
                <SiGoogle className="w-3.5 h-3.5" />
                Google Search
              </a>

              <a
                href={`https://www.azlyrics.com/lyrics/${encodeURIComponent(
                  songData?.subtitle?.toLowerCase().replace(/[^a-z0-9]/g, "") ||
                    ""
                )}/${encodeURIComponent(
                  songData?.title?.toLowerCase().replace(/[^a-z0-9]/g, "") || ""
                )}.html`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg text-sm font-medium transition-all"
              >
                <span className="font-bold text-xs">AZ</span>
                Try AZLyrics
              </a>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:block">
          {/* Track Info Section */}
          <div className="mb-6">
            <h2 className="text-xl lg:text-2xl font-bold text-white mb-3 flex items-center gap-2">
              <HiMusicNote className="text-[#14b8a6] w-5 h-5" />
              Track Information
            </h2>

            {/* Info Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
              {/* Album Info Card */}
              <div className="bg-gradient-to-br from-white/[0.07] to-white/[0.05] backdrop-blur-sm rounded-lg p-4 border border-white/10 hover:border-white/20 transition-all">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-[#14b8a6]/20 rounded-lg">
                    <BsDisc className="w-4 h-4 text-[#14b8a6]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-400 mb-0.5">Album</p>
                    <p className="text-white text-sm font-medium">
                      {songData?.album?.name || "Unknown Album"}
                    </p>
                    {songData?.album?.id && (
                      <Link
                        to={`/albums/${songData.album.id}`}
                        className="text-[#14b8a6] text-xs hover:underline mt-0.5 inline-flex items-center gap-1"
                      >
                        View Album
                        <HiExternalLink className="w-2.5 h-2.5" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {/* Duration Card */}
              <div className="bg-gradient-to-br from-white/[0.07] to-white/[0.05] backdrop-blur-sm rounded-lg p-4 border border-white/10 hover:border-white/20 transition-all">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <HiClock className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-400 mb-0.5">Duration</p>
                    <p className="text-white text-sm font-medium">
                      {formatTrackDuration(songData?.duration_ms)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Release Date Card */}
              <div className="bg-gradient-to-br from-white/[0.07] to-white/[0.05] backdrop-blur-sm rounded-lg p-4 border border-white/10 hover:border-white/20 transition-all">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <BsCalendar3 className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-400 mb-0.5">Release Date</p>
                    <p className="text-white text-sm font-medium">
                      {formatReleaseDate(songData?.album?.release_date)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Spotify Link Card */}
              {songData?.external_urls?.spotify && (
                <div className="bg-gradient-to-br from-white/[0.07] to-white/[0.05] backdrop-blur-sm rounded-lg p-4 border border-white/10 hover:border-white/20 transition-all">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <BsSpotify className="w-4 h-4 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-400 mb-0.5">Listen on</p>
                      <a
                        href={songData.external_urls.spotify}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white text-sm font-medium hover:text-[#14b8a6] transition-colors inline-flex items-center gap-1"
                      >
                        Spotify
                        <HiExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Lyrics Search Section */}
            <div className="bg-gradient-to-br from-white/[0.06] to-white/[0.03] backdrop-blur-sm rounded-xl p-5 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-3">Lyrics</h3>
              <p className="text-gray-400 text-sm mb-4">
                Search for lyrics on your favorite platform:
              </p>

              <div className="flex flex-wrap gap-2">
                {/* Genius Button */}
                <a
                  href={`https://genius.com/search?q=${encodeURIComponent(
                    `${songData?.title || ""} ${songData?.subtitle || ""}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 hover:from-yellow-500/30 hover:to-yellow-600/30 border border-yellow-500/50 text-yellow-300 rounded-full text-sm font-medium transition-all hover:scale-105 hover:shadow-lg hover:shadow-yellow-500/20"
                >
                  <SiGenius className="w-3.5 h-3.5" />
                  Search on Genius
                </a>

                {/* Google Button */}
                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(
                    `${songData?.title || ""} ${
                      songData?.subtitle || ""
                    } lyrics`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/20 to-blue-600/20 hover:from-blue-500/30 hover:to-blue-600/30 border border-blue-500/50 text-blue-300 rounded-full text-sm font-medium transition-all hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20"
                >
                  <SiGoogle className="w-3.5 h-3.5" />
                  Google Search
                </a>

                {/* AZLyrics Button */}
                <a
                  href={`https://www.azlyrics.com/lyrics/${encodeURIComponent(
                    songData?.subtitle
                      ?.toLowerCase()
                      .replace(/[^a-z0-9]/g, "") || ""
                  )}/${encodeURIComponent(
                    songData?.title?.toLowerCase().replace(/[^a-z0-9]/g, "") ||
                      ""
                  )}.html`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-purple-600/20 hover:from-purple-500/30 hover:to-purple-600/30 border border-purple-500/50 text-purple-300 rounded-full text-sm font-medium transition-all hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20"
                >
                  <span className="font-bold text-xs">AZ</span>
                  Try AZLyrics
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Related Songs Section */}
        <div className="mt-3">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2">
            Related Songs:
          </h2>
          <div className="space-y-1">
            {relatedSongs.length > 0 ? (
              relatedSongs.map((song, i) => (
                <div
                  key={`related-${song.key || song.id || i}`}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white/10 transition-all cursor-pointer group ${
                    isPlaying && isSameTrack(song, currentTrack)
                      ? "bg-white/10"
                      : ""
                  }`}
                  onClick={() => handlePlayClick(song, i)}
                >
                  {/* Track Number */}
                  <span className="text-gray-400 text-sm w-8 text-left">
                    {i + 1}.
                  </span>

                  {/* Track Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm sm:text-base font-medium truncate">
                      {song?.title || song?.name || "Unknown"}
                    </p>
                    <p className="text-gray-400 text-xs sm:text-sm truncate">
                      {song?.subtitle ||
                        song?.artists?.[0]?.name ||
                        "Unknown Artist"}
                    </p>
                  </div>

                  {/* Menu and Play Button */}
                  <div className="flex items-center gap-2">
                    <div onClick={(e) => e.stopPropagation()}>
                      <SongMenu song={song} />
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <PlayPause
                        isPlaying={isPlaying && isSameTrack(song, currentTrack)}
                        song={song}
                        handlePause={handlePauseClick}
                        handlePlay={() => handlePlayClick(song, i)}
                        size={30}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-sm py-4 text-center">
                No related songs found.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SongDetails;
