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
import { genres } from "../assets/constants";
import { IoChevronDown } from "react-icons/io5";
import { HiOutlineSparkles } from "react-icons/hi";
import { Icon } from "@iconify/react";

const Discover = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { genreListId } = useSelector((state) => state.player);
  const { activeSong, isPlaying } = useSelector((state) => state.player);
  const { prefetchPreviewUrl, getPagePrefetchStrategy } = usePreviewUrl();
  const [showGenreDropdown, setShowGenreDropdown] = useState(false);
  const genreButtonRef = useRef(null);

  const selectedGenre = genreListId || "POP";
  const genreTitle =
    genres.find(({ value }) => value === selectedGenre)?.title || "Pop";

  const { data, isFetching, error } = useGetSongsByGenreQuery(selectedGenre);

  // Genre icons mapping with Iconify
  const genreIcons = {
    POP: "mdi:star-four-points-outline",
    HIP_HOP_RAP: "mdi:microphone-variant",
    DANCE: "mdi:speaker-wireless",
    ELECTRONIC: "mdi:waveform",
    SOUL_RNB: "mdi:heart-multiple",
    ALTERNATIVE: "mdi:vinyl",
    ROCK: "mdi:guitar-electric",
    LATIN: "game-icons:maracas",
    FILM_TV: "mdi:movie-open-outline",
    COUNTRY: "mdi:hat-fedora",
    REGGAE: "mdi:palm-tree",
    HOUSE: "mdi:city",
    K_POP: "mdi:heart-settings-outline",
    INDIE: "mdi:cassette",
    METAL: "game-icons:anvil-impact",
    JAZZ: "game-icons:saxophone",
    CLASSICAL: "mdi:piano",
    BLUES: "mdi:music-clef-treble",
    PUNK: "game-icons:safety-pin",
    FUNK: "mdi:music-box-multiple-outline",
    GOSPEL: "mdi:cross",
    DISCO: "mdi:star-circle-outline",
    LOFI: "mdi:coffee-outline",
  };

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
      }, 2000); // Initial delay before starting prefetch

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
    const genre = params.get("genre");
    if (genre && genres.find((g) => g.value === genre)) {
      dispatch(selectGenreListId(genre));
    }
  }, [location, dispatch]);

  const handleGenreChange = (genre) => {
    dispatch(selectGenreListId(genre.value));
    setShowGenreDropdown(false);

    // Update URL
    const newUrl = new URL(window.location);
    newUrl.searchParams.set("genre", genre.value);
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
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full transition-all duration-200 border border-white/20 hover:border-white/30 group"
            >
              <HiOutlineSparkles className="text-[#14b8a6] group-hover:text-[#2dd4bf] transition-colors" />
              <span className="text-white font-medium">{genreTitle}</span>
              <IoChevronDown
                className={`text-white/60 transition-all duration-200 ${
                  showGenreDropdown ? "rotate-180" : ""
                }`}
              />
            </button>

            <DropdownPortal
              isOpen={showGenreDropdown}
              onClose={() => setShowGenreDropdown(false)}
              triggerRef={genreButtonRef}
              minWidth={220}
              maxHeight={400}
              placement="bottom-end"
              className="bg-[#1a1848]/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl"
            >
              <div className="py-2">
                {sortedGenres.map((genre, index) => {
                  const iconName = genreIcons[genre.value] || "mdi:music-note";
                  const isSelected = genre.value === selectedGenre;

                  return (
                    <button
                      key={genre.value}
                      onClick={() => handleGenreChange(genre)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 transition-all duration-200 group relative overflow-hidden ${
                        isSelected
                          ? "text-[#14b8a6]"
                          : "text-white/80 hover:text-white"
                      }`}
                    >
                      {/* Hover background effect */}
                      <div
                        className={`absolute inset-0 transition-all duration-300 ${
                          isSelected
                            ? "bg-gradient-to-r from-[#14b8a6]/20 to-transparent"
                            : "bg-gradient-to-r from-white/0 to-white/0 hover:from-white/10 hover:to-transparent"
                        }`}
                      />

                      {/* Content */}
                      <div className="relative flex items-center gap-3 w-full">
                        <Icon
                          icon={iconName}
                          className={`w-5 h-5 flex-shrink-0 transition-all duration-200 ${
                            isSelected
                              ? "text-[#14b8a6]"
                              : "group-hover:text-[#14b8a6]"
                          }`}
                        />
                        <span className="font-medium text-left flex-1">
                          {genre.title}
                        </span>
                        {isSelected && (
                          <div className="w-2 h-2 bg-[#14b8a6] rounded-full animate-pulse" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </DropdownPortal>
          </div>
        }
      />

      <ResponsiveGrid type="songs">
        {data?.map((song, i) => (
          <SongCard
            key={song.key}
            song={song}
            isPlaying={isPlaying}
            activeSong={activeSong}
            data={data}
            i={i}
          />
        ))}
      </ResponsiveGrid>
    </div>
  );
};

export default Discover;
