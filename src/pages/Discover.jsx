import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import { BsFillPlayFill, BsFillPauseFill } from "react-icons/bs";
import { HiSparkles } from "react-icons/hi";

import { Error, Loader, SongCard, AppHeader, ResponsiveGrid, PlayPause, SongMenu } from "../components";
import Dropdown from "../components/Dropdown";
import MusicLoadingSpinner from "../components/MusicLoadingSpinner";

import { selectGenreListId, playTrack, playPause } from "../redux/features/playerSlice";
import { useGetSongsByGenreQuery } from "../redux/services/spotifyCore";
import { usePreviewUrl } from "../hooks/usePreviewUrl";
import { usePersistentScroll } from "../hooks/usePersistentScroll";
import { useToast } from "../context/ToastContext";

import { genres, genreIcons } from "../assets/constants";

import {
  isSameTrack,
  getTrackId,
  getTrackTitle,
  getTrackArtist,
  getTrackImage,
  getTrackArtistId,
} from "../utils/trackUtils";

const Discover = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { genreListId, isPlaying, currentTrack } = useSelector((state) => state.player);
  const { prefetchPreviewUrl, getPagePrefetchStrategy, getPreviewUrl } = usePreviewUrl();
  const { showToast } = useToast();

  const [loadingTracks, setLoadingTracks] = useState({});
  usePersistentScroll();

  const selectedGenre = genreListId || "POP";
  const genreTitle = genres.find(({ value }) => value === selectedGenre)?.title || "Pop";
  const { data, isFetching, error } = useGetSongsByGenreQuery(selectedGenre);

  const sortedGenres = useMemo(() => [...genres].sort((a, b) => a.title.localeCompare(b.title)), []);

  useEffect(() => {
    if (!data || isFetching || !data.length) return;
    const strategy = getPagePrefetchStrategy(location.pathname);
    if (strategy.maxSongs > 0) {
      const timeoutId = setTimeout(() => {
        data.slice(0, strategy.maxSongs).forEach((song, index) => {
          setTimeout(() => prefetchPreviewUrl(song, { priority: strategy.priority }), index * strategy.delay);
        });
      }, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [data, isFetching, prefetchPreviewUrl, getPagePrefetchStrategy, location.pathname]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const genreRoute = params.get("genre");
    if (genreRoute) {
      const genre = genres.find((g) => g.route === genreRoute);
      if (genre) dispatch(selectGenreListId(genre.value));
    }
  }, [location, dispatch]);

  const getGenreLabel = (genre) => {
    const mobileLabels = {
      Electronic: "EDM",
      "R&B/Soul": "R&B",
      Alternative: "Alt",
      "Film & TV": "Film",
    };
    const isMobile = window.innerWidth < 640;
    return isMobile ? mobileLabels[genre.title] || genre.title : genre.title;
  };

  const handleGenreChange = (genre) => {
    dispatch(selectGenreListId(genre.value));
    const newUrl = new URL(window.location);
    newUrl.searchParams.set("genre", genre.route);
    window.history.pushState({}, "", newUrl);
  };

  const handlePlayClick = useCallback(
    async (song) => {
      const trackId = getTrackId(song);
      setLoadingTracks((prev) => ({ ...prev, [trackId]: true }));
      try {
        const songWithPreview = await getPreviewUrl(song);
        if (songWithPreview?.preview_url) {
          dispatch(playTrack({ track: songWithPreview }));
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

  const handlePauseClick = useCallback(() => dispatch(playPause(false)), [dispatch]);

  const getAlbumId = (song) => song?.album?.id || null;

  if (isFetching) return <Loader title="Loading songs..." />;
  if (error) return <Error />;

  return (
    <div className="flex flex-col">
      <AppHeader
        title="Discover"
        subtitle="Find your next favorite song"
        showSearch={true}
        action={
          <Dropdown
            items={sortedGenres}
            value={selectedGenre}
            onChange={handleGenreChange}
            placeholder="Select Genre"
            renderIcon={(genre) => (
              <Icon icon={genreIcons[genre.value] || "mdi:music-note"} className="w-4 h-4 text-[#14b8a6]" />
            )}
            renderLabel={getGenreLabel}
            width={160}
          />
        }
      />

      {/* Mobile View */}
      <div className="sm:hidden">
        <div className="px-4 pb-4">
          <div className="relative bg-gradient-to-br from-[#14b8a6]/10 via-[#0891b2]/10 to-purple-600/10 rounded-2xl p-4 backdrop-blur-md border border-white/10 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-300 mb-1">Now Playing</p>
                <h2 className="text-lg font-bold text-white">{genreTitle} Hits</h2>
              </div>
              <div className="flex items-center gap-2">
                <HiSparkles className="w-5 h-5 text-[#14b8a6] animate-pulse" />
                <span className="text-sm font-medium text-white">{data?.length || 0} tracks</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 pb-6">
          {data?.map((song, i) => {
            const isCurrentSong = isSameTrack(song, currentTrack);
            const trackId = getTrackId(song);
            const isLoading = loadingTracks[trackId];
            const albumId = getAlbumId(song);
            const artistId = getTrackArtistId(song);

            return (
              <div
                key={song.key || song.id || i}
                className={`flex items-center p-3 rounded-xl mb-2 transition-all duration-200 ${
                  isCurrentSong
                    ? "bg-gradient-to-r from-white/[0.12] to-white/[0.08]"
                    : "bg-white/[0.06] active:bg-white/[0.10]"
                } hover:bg-white/[0.10] group`}
              >
                <Link
                  to={albumId ? `/albums/${albumId}` : "#"}
                  className="relative w-14 h-14 flex-shrink-0 mr-3 rounded-lg overflow-hidden group/album"
                  onClick={(e) => {
                    if (!albumId) e.preventDefault();
                  }}
                >
                  <img
                    src={getTrackImage(song)}
                    alt={getTrackTitle(song)}
                    className="w-full h-full object-cover transition-transform duration-200 group-active/album:scale-95"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-active/album:opacity-100 transition-opacity duration-200" />
                </Link>

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

                <div className="flex-shrink-0 mr-2">
                  <SongMenu song={song} />
                </div>

                <button
                  onClick={() => (isCurrentSong && isPlaying ? handlePauseClick() : handlePlayClick(song))}
                  disabled={isLoading}
                  className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 flex-shrink-0 ${
                    isCurrentSong && isPlaying
                      ? "bg-gradient-to-r from-[#14b8a6] to-[#0891b2] shadow-lg"
                      : "bg-white/10 hover:bg-white/20 active:scale-95"
                  } ${isLoading ? "cursor-not-allowed" : ""}`}
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
      </div>

      {/* Desktop/Tablet Grid */}
      <div className="hidden sm:block">
        <ResponsiveGrid type="songs">
          {data?.map((song, i) => (
            <SongCard
              key={song?.key || song?.id || i}
              song={song}
              isPlaying={isPlaying}
              activeSong={{}}
              data={data}
              i={i}
            />
          ))}
        </ResponsiveGrid>
      </div>
    </div>
  );
};

export default Discover;
