import { useEffect, useMemo, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import {
  Error,
  Loader,
  SongCard,
  AppHeader,
  ResponsiveGrid,
} from "../components";
import DropdownPortal from "../components/DropdownPortal";
import { selectGenreListId } from "../redux/features/playerSlice";
import { useGetSongsByGenreQuery } from "../redux/services/spotifyCore";
import { usePreviewUrl } from "../hooks/usePreviewUrl";
import { usePersistentScroll } from "../hooks/usePersistentScroll";
import { genres, genreIcons } from "../assets/constants";
import { IoChevronDown } from "react-icons/io5";
import { Icon } from "@iconify/react";

const Discover = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { genreListId, isPlaying } = useSelector((state) => state.player);
  const { prefetchPreviewUrl, getPagePrefetchStrategy } = usePreviewUrl();
  const [showGenreDropdown, setShowGenreDropdown] = useState(false);
  const genreButtonRef = useRef(null);

  usePersistentScroll();

  const selectedGenre = genreListId || "POP";
  const genreTitle =
    genres.find(({ value }) => value === selectedGenre)?.title || "Pop";

  const { data, isFetching, error } = useGetSongsByGenreQuery(selectedGenre);

  // Sort genres alphabetically
  const sortedGenres = useMemo(() => {
    return [...genres].sort((a, b) => a.title.localeCompare(b.title));
  }, []);

  // Find selected genre index
  const selectedGenreIndex = useMemo(() => {
    return sortedGenres.findIndex((genre) => genre.value === selectedGenre);
  }, [sortedGenres, selectedGenre]);

  // Prefetch strategy
  useEffect(() => {
    if (!data || isFetching || !data.length) return;

    const strategy = getPagePrefetchStrategy(location.pathname);

    // Only prefetch if strategy suggests it
    if (strategy.maxSongs > 0) {
      const timeoutId = setTimeout(() => {
        // Prefetch the first few songs based on strategy
        data.slice(0, strategy.maxSongs).forEach((song, index) => {
          setTimeout(() => {
            prefetchPreviewUrl(song, { priority: strategy.priority });
          }, index * strategy.delay);
        });
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
  }, [
    data,
    isFetching,
    prefetchPreviewUrl,
    getPagePrefetchStrategy,
    location.pathname,
  ]);

  // Update genre when URL changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const genreRoute = params.get("genre");
    if (genreRoute) {
      // Find genre by route instead of value
      const genre = genres.find((g) => g.route === genreRoute);
      if (genre) {
        dispatch(selectGenreListId(genre.value));
      }
    }
  }, [location, dispatch]);

  const handleGenreChange = (genre) => {
    dispatch(selectGenreListId(genre.value));
    setShowGenreDropdown(false);

    // Use route for URL
    const newUrl = new URL(window.location);
    newUrl.searchParams.set("genre", genre.route);
    window.history.pushState({}, "", newUrl);
  };

  if (isFetching) return <Loader title="Loading songs..." />;
  if (error) return <Error />;

  return (
    <div className="flex flex-col">
      <AppHeader
        title={`Discover ${genreTitle}`}
        subtitle="Find your next favorite song"
        action={
          <div className="relative" ref={genreButtonRef}>
            <button
              onClick={() => setShowGenreDropdown(!showGenreDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-white/[0.08] hover:bg-white/[0.12] backdrop-blur-md rounded-full transition-all duration-200 border border-white/20 hover:border-white/30 group"
            >
              <Icon
                icon={genreIcons[selectedGenre] || "mdi:music-note"}
                className="w-4 h-4 text-[#14b8a6]"
              />
              <span className="text-white font-medium text-sm">
                {genreTitle}
              </span>
              <IoChevronDown
                className={`text-white/60 transition-all duration-200 w-3 h-3 ${
                  showGenreDropdown ? "rotate-180" : ""
                }`}
              />
            </button>

            <DropdownPortal
              isOpen={showGenreDropdown}
              onClose={() => setShowGenreDropdown(false)}
              triggerRef={genreButtonRef}
              minWidth={160}
              maxHeight={262}
              placement="bottom-end"
              className="bg-[#1a1848] border border-white/20 rounded-xl"
            >
              <div className="py-2">
                <div className="py-1">
                  {sortedGenres.map((genre, index) => {
                    const isSelected = genre.value === selectedGenre;

                    return (
                      <button
                        key={genre.value}
                        onClick={() => handleGenreChange(genre)}
                        className={`w-full flex items-center gap-3 px-4 py-2 transition-all duration-200 ${
                          isSelected
                            ? "text-[#14b8a6] bg-[#14b8a6]/20"
                            : "text-white/80 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        <Icon
                          icon={genreIcons[genre.value] || "mdi:music-note"}
                          className="w-4 h-4 flex-shrink-0"
                        />
                        <span className="text-sm text-left flex-1">
                          {genre.title}
                        </span>
                        {isSelected && (
                          <div className="w-1.5 h-1.5 bg-[#14b8a6] rounded-full" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </DropdownPortal>
          </div>
        }
      />

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
  );
};

export default Discover;
