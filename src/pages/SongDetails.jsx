import { Link, useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Error, Loader, PlayPause, SongMenu } from "../components";
import { playTrack, playPause } from "../redux/features/playerSlice";
import { usePreviewUrl } from "../hooks/usePreviewUrl";
import { useLoadingState } from "../hooks/useLoadingState";
import {
  getTrackId,
  formatTrackDuration,
  isSameTrack,
} from "../utils/trackUtils";
import {
  useGetSongDetailsQuery,
  useGetArtistTopTracksQuery,
} from "../redux/services/spotifyCore";
import {
  HiExternalLink,
  HiMusicNote,
  HiClock,
  HiSparkles,
} from "react-icons/hi";
import { BsCalendar3, BsDisc, BsSpotify, BsVinyl } from "react-icons/bs";
import { SiGenius, SiGoogle } from "react-icons/si";
import { RiAlbumLine } from "react-icons/ri";

const SongDetails = () => {
  const dispatch = useDispatch();
  const { getPreviewUrl } = usePreviewUrl();
  const { setLoading, isLoading } = useLoadingState();
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
    const trackId = getTrackId(song);
    setLoading(`song-${trackId}`, true);

    try {
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
    } finally {
      setLoading(`song-${trackId}`, false);
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

  const InfoCard = ({ icon: Icon, iconColor, label, value, link }) => (
    <div className="group relative bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur-md rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-0.5">
      <div className="flex items-center gap-3">
        <div
          className={`p-2.5 rounded-lg bg-gradient-to-br ${iconColor} shadow-lg`}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-gray-400 mb-0.5">{label}</p>
          {link ? (
            <Link
              to={link}
              className="text-white font-medium hover:text-[#14b8a6] transition-colors flex items-center gap-1.5"
            >
              {value}
              <HiExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100" />
            </Link>
          ) : (
            <p className="text-white font-medium">{value}</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto px-16">
      <div className="p-4 md:p-6 lg:p-8">
        {/* Header with album art */}
        <div className="flex flex-col md:flex-row gap-6 mb-10">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#14b8a6] to-purple-600 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition duration-500"></div>
            <img
              alt="song_img"
              src={songData?.images?.coverart || songData?.images?.background}
              className="relative sm:h-48 h-28 w-28 sm:w-48 object-cover rounded-2xl shadow-2xl transform transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>

          <div className="flex flex-col justify-center">
            <h1 className="font-bold text-3xl sm:text-4xl lg:text-5xl text-white mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              {songData?.title || songData?.name}
            </h1>
            <Link
              to={`/artists/${artistId}`}
              className="text-lg sm:text-xl text-gray-300 hover:text-[#14b8a6] transition-all duration-300 inline-flex items-center gap-2 group"
            >
              {songData?.subtitle ||
                songData?.artists?.[0]?.name ||
                "Unknown Artist"}
              <HiSparkles className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </div>
        </div>

        {/* Track Info Section */}
        <div className="mb-10">
          <h2 className="text-white text-2xl font-bold mb-6 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
              <HiMusicNote className="w-6 h-6 text-purple-400" />
            </div>
            Track Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl">
            <InfoCard
              icon={RiAlbumLine}
              iconColor="from-purple-500/20 to-purple-600/20"
              label="Album"
              value={songData?.album?.name || "Unknown Album"}
              link={songData?.album?.id ? `/albums/${songData.album.id}` : null}
            />
            <InfoCard
              icon={HiClock}
              iconColor="from-blue-500/20 to-blue-600/20"
              label="Duration"
              value={formatTrackDuration(songData?.duration_ms)}
            />
            <InfoCard
              icon={BsCalendar3}
              iconColor="from-green-500/20 to-green-600/20"
              label="Release Date"
              value={formatReleaseDate(songData?.album?.release_date)}
            />
            <InfoCard
              icon={BsSpotify}
              iconColor="from-[#1DB954]/20 to-[#1aa34a]/20"
              label="Listen on"
              value="Spotify"
              link={songData?.external_urls?.spotify}
            />
          </div>
        </div>

        {/* Lyrics Section */}
        <div className="mb-10 max-w-4xl">
          <div className="bg-gradient-to-br from-purple-900/20 via-pink-900/10 to-transparent backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h2 className="text-white text-2xl font-bold mb-4 flex items-center gap-3">
              <BsVinyl className="w-6 h-6 text-purple-400 animate-spin-slow" />
              Lyrics
            </h2>
            <p className="text-gray-300 mb-6">
              Discover the lyrics on your favorite platform:
            </p>
            <div className="flex flex-wrap gap-3">
              {/* Genius Button */}
              <a
                href={`https://genius.com/search?q=${encodeURIComponent(
                  `${songData?.title || ""} ${songData?.subtitle || ""}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 hover:from-yellow-500/30 hover:to-yellow-600/30 border border-yellow-500/50 text-yellow-300 rounded-full text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-yellow-500/20 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>
                <SiGenius className="w-4 h-4 relative z-10" />
                <span className="relative z-10">Search on Genius</span>
              </a>

              {/* Google Button */}
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(
                  `${songData?.title || ""} ${songData?.subtitle || ""} lyrics`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500/20 to-blue-600/20 hover:from-blue-500/30 hover:to-blue-600/30 border border-blue-500/50 text-blue-300 rounded-full text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>
                <SiGoogle className="w-4 h-4 relative z-10" />
                <span className="relative z-10">Google Search</span>
              </a>

              {/* AZLyrics Button */}
              <a
                href={`https://www.azlyrics.com/lyrics/${encodeURIComponent(
                  songData?.subtitle?.toLowerCase().replace(/[^a-z0-9]/g, "") ||
                    ""
                )}/${encodeURIComponent(
                  songData?.title?.toLowerCase().replace(/[^a-z0-9]/g, "") || ""
                )}.html`}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500/20 to-purple-600/20 hover:from-purple-500/30 hover:to-purple-600/30 border border-purple-500/50 text-purple-300 rounded-full text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>
                <span className="font-bold text-sm relative z-10">AZ</span>
                <span className="relative z-10">Try AZLyrics</span>
              </a>
            </div>
          </div>
        </div>

        {/* Related Songs Section */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
              <BsVinyl className="w-6 h-6 text-cyan-400" />
            </div>
            Related Songs
          </h2>

          <div className="space-y-2 max-w-4xl">
            {relatedSongs.length > 0 ? (
              relatedSongs.slice(0, 10).map((song, i) => (
                <div
                  key={`related-${song.key || song.id || i}`}
                  className={`group flex items-center gap-4 p-4 rounded-xl hover:bg-gradient-to-r hover:from-white/[0.08] hover:to-white/[0.02] transition-all duration-300 cursor-pointer backdrop-blur-sm border border-transparent hover:border-white/10 ${
                    isPlaying && isSameTrack(song, currentTrack)
                      ? "bg-gradient-to-r from-[#14b8a6]/10 to-purple-600/10 border-[#14b8a6]/30"
                      : ""
                  }`}
                  onClick={() => handlePlayClick(song, i)}
                >
                  {/* Track Number */}
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center text-gray-400 text-sm font-medium group-hover:text-white transition-colors">
                    {i + 1}
                  </div>

                  {/* Album Thumbnail */}
                  <img
                    src={
                      song?.album?.images?.[0]?.url ||
                      song?.images?.coverart ||
                      songData?.images?.coverart
                    }
                    alt={song?.title}
                    className="w-12 h-12 rounded-lg object-cover shadow-lg"
                  />

                  {/* Track Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate group-hover:text-[#14b8a6] transition-colors">
                      {song?.title || song?.name || "Unknown"}
                    </p>
                    <p className="text-gray-400 text-sm truncate">
                      {song?.subtitle ||
                        song?.artists?.[0]?.name ||
                        "Unknown Artist"}
                    </p>
                  </div>

                  {/* Duration */}
                  <span className="text-gray-400 text-sm hidden sm:block">
                    {formatTrackDuration(song?.duration_ms)}
                  </span>

                  {/* Actions */}
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
                        size={35}
                        isLoading={isLoading(`song-${getTrackId(song)}`)}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400">No related songs found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SongDetails;
