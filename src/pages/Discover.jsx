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

  // Sort genres alphabetically
  const sortedGenres = useMemo(() => {
    return [...genres].sort((a, b) => a.title.localeCompare(b.title));
  }, []);

  // Find selected genre index
  const selectedGenreIndex = useMemo(() => {
    return sortedGenres.findIndex((genre) => genre.value === selectedGenre);
  }, [sortedGenres, selectedGenre]);

  const shuffledSongs = useMemo(() => {
    if (!data) return [];

    const uniqueSongs = data.filter((song, index, self) => {
      return (
        index ===
        self.findIndex(
          (s) =>
            s.title?.toLowerCase() === song.title?.toLowerCase() &&
            s.subtitle?.toLowerCase() === song.subtitle?.toLowerCase()
        )
      );
    });

    return [...uniqueSongs].sort(() => Math.random() - 0.5);
  }, [data]);

  useEffect(() => {
    if (shuffledSongs.length > 0) {
      const strategy = getPagePrefetchStrategy(location.pathname);
      const timeoutId = setTimeout(() => {
        shuffledSongs.slice(0, strategy.maxSongs).forEach((song, index) => {
          setTimeout(() => {
            prefetchPreviewUrl(song, { priority: strategy.priority });
          }, index * strategy.delay);
        });
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
  }, [
    shuffledSongs,
    prefetchPreviewUrl,
    getPagePrefetchStrategy,
    location.pathname,
  ]);

  const handleGenreChange = (value) => {
    dispatch(selectGenreListId(value));
    setShowGenreDropdown(false);
  };

  const genreColors = {
    POP: "from-pink-500 to-rose-500",
    HIP_HOP_RAP: "from-purple-600 to-blue-600",
    DANCE: "from-blue-500 to-cyan-500",
    ELECTRONIC: "from-indigo-500 to-purple-600",
    SOUL_RNB: "from-orange-500 to-red-500",
    ALTERNATIVE: "from-gray-700 to-gray-900",
    ROCK: "from-red-700 to-red-900",
    LATIN: "from-yellow-500 to-orange-500",
    FILM_TV: "from-teal-500 to-green-600",
    COUNTRY: "from-yellow-600 to-amber-700",
    WORLDWIDE: "from-green-500 to-emerald-600",
    REGGAE: "from-green-600 to-yellow-600",
    HOUSE: "from-purple-500 to-pink-500",
    K_POP: "from-pink-400 to-purple-600",
    INDIE: "from-amber-500 to-orange-600",
    METAL: "from-gray-900 to-red-900",
    JAZZ: "from-amber-700 to-orange-800",
    CLASSICAL: "from-blue-700 to-indigo-800",
    BLUES: "from-blue-800 to-indigo-900",
    PUNK: "from-red-600 to-pink-600",
    FUNK: "from-purple-700 to-pink-700",
    GOSPEL: "from-yellow-600 to-amber-600",
    DISCO: "from-pink-500 to-purple-600",
    LOFI: "from-purple-400 to-blue-500",
  };

  if (isFetching) return <Loader title={`Loading ${genreTitle} music...`} />;

  if (error) return <Error />;

  return (
    <div className="flex flex-col">
      <AppHeader
        title={`${genreTitle} Music`}
        action={
          <>
            <button
              ref={genreButtonRef}
              onClick={() => setShowGenreDropdown(!showGenreDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200 text-white"
            >
              <HiOutlineSparkles className="w-5 h-5 text-[#14b8a6]" />
              <span className="font-semibold">{genreTitle}</span>
              <IoChevronDown
                className={`w-4 h-4 transition-transform ${
                  showGenreDropdown ? "rotate-180" : ""
                }`}
              />
            </button>

            <DropdownPortal
              isOpen={showGenreDropdown}
              onClose={() => setShowGenreDropdown(false)}
              triggerRef={genreButtonRef}
              minWidth={288}
              maxHeight={384}
              placement="bottom-end"
              selectedIndex={selectedGenreIndex}
            >
              {sortedGenres.map((genre) => (
                <button
                  key={genre.value}
                  onClick={() => {
                    handleGenreChange(genre.value);
                  }}
                  className={`w-full px-4 py-3 text-left hover:bg-white/10 transition-colors flex items-center justify-between group ${
                    selectedGenre === genre.value
                      ? "bg-[#14b8a6]/20 text-[#14b8a6]"
                      : "text-white"
                  }`}
                >
                  <span className="font-medium">{genre.title}</span>
                  <div
                    className={`w-3 h-3 rounded-full bg-gradient-to-r ${
                      genreColors[genre.value] || "from-gray-400 to-gray-600"
                    } ${
                      selectedGenre === genre.value
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-50"
                    } transition-opacity`}
                  />
                </button>
              ))}
            </DropdownPortal>
          </>
        }
      />

      <ResponsiveGrid type="songs">
        {shuffledSongs.map((song, i) => (
          <SongCard
            key={song.key || song.id || i}
            song={song}
            isPlaying={isPlaying}
            activeSong={activeSong}
            data={shuffledSongs}
            i={i}
          />
        ))}
      </ResponsiveGrid>
    </div>
  );
};

export default Discover;
