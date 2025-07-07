import { useSelector, useDispatch } from "react-redux";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import {
  Error,
  Loader,
  SongCard,
  AppHeader,
  ResponsiveGrid,
  PlayPause,
  SongMenu,
} from "../components";
import { useGetSongsBySearchQuery } from "../redux/services/spotifyCore";
import { playTrack, playPause } from "../redux/features/playerSlice";
import { usePreviewUrl } from "../hooks/usePreviewUrl";
import { useToast } from "../context/ToastContext";
import {
  isSameTrack,
  getTrackId,
  getTrackTitle,
  getTrackArtist,
  getTrackImage,
  getTrackArtistId,
} from "../utils/trackUtils";
import { BsFillPlayFill, BsFillPauseFill } from "react-icons/bs";
import { HiSparkles } from "react-icons/hi";
import MusicLoadingSpinner from "../components/MusicLoadingSpinner";

const Search = () => {
  const { searchTerm } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isPlaying, currentTrack } = useSelector((state) => state.player);
  const { data, isFetching, error } = useGetSongsBySearchQuery(searchTerm);
  const { getPreviewUrl } = usePreviewUrl();
  const { showToast } = useToast();
  const [loadingTracks, setLoadingTracks] = useState({});

  const songs =
    data?.tracks?.hits?.map((hit) => hit.track) ||
    data?.tracks ||
    data?.hits?.map((hit) => hit.track) ||
    data ||
    [];

  const handlePlayClick = useCallback(
    async (song) => {
      const trackId = getTrackId(song);
      setLoadingTracks((prev) => ({ ...prev, [trackId]: true }));

      try {
        const songWithPreview = await getPreviewUrl(song);
        if (songWithPreview?.preview_url) {
          dispatch(
            playTrack({
              track: songWithPreview,
            })
          );
        } else {
          showToast("No preview available for this track", "error");
        }
      } catch (error) {
        console.error("Error playing track:", error);
        showToast("Error playing track", "error");
      } finally {
        setLoadingTracks((prev) => ({ ...prev, [trackId]: false }));
      }
    },
    [dispatch, getPreviewUrl, showToast]
  );

  const handlePauseClick = useCallback(() => {
    dispatch(playPause(false));
  }, [dispatch]);

  const getAlbumId = (song) => {
    return song?.album?.id || null;
  };

  if (isFetching) return <Loader title={`Searching ${searchTerm}...`} />;

  if (error) return <Error />;

  return (
    <div className="flex flex-col">
      <AppHeader
        title="Search Results"
        subtitle={`Showing results for "${searchTerm}"`}
        showSearch={true}
      />

      {songs.length ? (
        <>
          {/* Mobile-only Results Card */}
          <div className="sm:hidden px-4 pb-4">
            <div
              className="relative bg-gradient-to-r from-[#14b8a6]/20 via-purple-600/20 to-pink-600/20 
              rounded-2xl p-4 backdrop-blur-md border border-white/10 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-300 mb-1">Results for</p>
                  <h2 className="text-lg font-bold text-white truncate pr-4">
                    "{searchTerm}"
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <HiSparkles className="w-5 h-5 text-[#14b8a6] animate-pulse" />
                  <span className="text-sm font-medium text-white">
                    {songs.length} {songs.length === 1 ? "result" : "results"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile List View */}
          <div className="sm:hidden px-4 pb-6">
            {songs.map((song, i) => {
              const isCurrentSong = isSameTrack(song, currentTrack);
              const trackId = getTrackId(song);
              const isLoading = loadingTracks[trackId];
              const albumId = getAlbumId(song);
              const artistId = getTrackArtistId(song);

              return (
                <div
                  key={song.key || song.id || i}
                  className={`flex items-center p-3 rounded-xl mb-2 transition-all duration-200 
                    ${
                      isCurrentSong
                        ? "bg-gradient-to-r from-white/[0.12] to-white/[0.08]"
                        : "bg-white/[0.06] active:bg-white/[0.10]"
                    }
                    hover:bg-white/[0.10] group`}
                >
                  {/* Album Art */}
                  <Link
                    to={albumId ? `/albums/${albumId}` : "#"}
                    className="relative w-14 h-14 flex-shrink-0 mr-3 rounded-lg overflow-hidden group/album"
                    onClick={(e) => {
                      if (!albumId) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <img
                      src={getTrackImage(song)}
                      alt={getTrackTitle(song)}
                      className="w-full h-full object-cover transition-transform duration-200 group-active/album:scale-95"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-active/album:opacity-100 transition-opacity duration-200" />
                  </Link>

                  {/* Track Info */}
                  <div className="flex-1 min-w-0 mr-3">
                    <Link
                      to={`/songs/${trackId}`}
                      className="block truncate font-medium text-white text-base hover:text-[#14b8a6] transition-colors active:text-[#14b8a6]/80"
                    >
                      {getTrackTitle(song)}
                    </Link>
                    <p className="truncate text-sm text-gray-300">
                      {artistId ? (
                        <Link
                          to={`/artists/${artistId}`}
                          className="hover:text-[#14b8a6] transition-colors active:text-[#14b8a6]/80"
                        >
                          {getTrackArtist(song)}
                        </Link>
                      ) : (
                        getTrackArtist(song)
                      )}
                    </p>
                  </div>

                  {/* Menu Button */}
                  <div className="flex-shrink-0 mr-2">
                    <SongMenu song={song} />
                  </div>

                  {/* Play Button */}
                  <button
                    onClick={() =>
                      isCurrentSong && isPlaying
                        ? handlePauseClick()
                        : handlePlayClick(song)
                    }
                    disabled={isLoading}
                    className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 flex-shrink-0
                      ${
                        isCurrentSong && isPlaying
                          ? "bg-gradient-to-r from-[#14b8a6] to-[#0891b2] shadow-lg"
                          : "bg-white/10 hover:bg-white/20 active:scale-95"
                      }
                      ${isLoading ? "cursor-not-allowed" : ""}`}
                  >
                    {isLoading ? (
                      <MusicLoadingSpinner size="sm" />
                    ) : isCurrentSong && isPlaying ? (
                      <BsFillPauseFill className="w-5 h-5 text-white" />
                    ) : (
                      <BsFillPlayFill className="w-5 h-5 text-white ml-0.5" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Desktop/Tablet Grid View */}
          <div className="hidden sm:block">
            <ResponsiveGrid type="songs">
              {songs.map((song, i) => (
                <SongCard
                  key={song.key || song.id || i}
                  song={song}
                  isPlaying={isPlaying}
                  data={songs}
                  i={i}
                />
              ))}
            </ResponsiveGrid>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-400 text-xl">
            No results found for "{searchTerm}"
          </p>
        </div>
      )}
    </div>
  );
};

export default Search;
