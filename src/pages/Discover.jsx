import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import {
  Error,
  Loader,
  SongCard,
  AppHeader,
  ResponsiveGrid,
  Portal,
} from "../components";
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

  const selectedGenre = genreListId || "POP";
  const genreTitle =
    genres.find(({ value }) => value === selectedGenre)?.title || "Pop";

  const { data, isFetching, error } = useGetSongsByGenreQuery(selectedGenre);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".genre-dropdown-container")) {
        setShowGenreDropdown(false);
      }
    };

    if (showGenreDropdown) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showGenreDropdown]);

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

  const selectedColor = genreColors[selectedGenre] || genreColors.POP;

  const genreSelector = (
    <div className="relative genre-dropdown-container">
      <button
        onClick={() => setShowGenreDropdown(!showGenreDropdown)}
        className={`
          flex items-center gap-2 px-4 py-2.5
          bg-gradient-to-r ${selectedColor}
          text-white font-semibold rounded-full
          shadow-lg hover:shadow-xl transform hover:scale-105
          transition-all duration-300 group
        `}
      >
        <HiOutlineSparkles className="w-4 h-4" />
        <span>{genreTitle}</span>
        <IoChevronDown
          className={`w-4 h-4 transition-transform duration-300 ${
            showGenreDropdown ? "rotate-180" : ""
          }`}
        />
      </button>

      {showGenreDropdown && (
        <Portal>
          <div className="fixed inset-0 z-40" style={{ pointerEvents: "none" }}>
            <div
              className="absolute"
              style={{
                top:
                  document
                    .querySelector(".genre-dropdown-container")
                    ?.getBoundingClientRect().bottom +
                  8 +
                  "px",
                left:
                  document
                    .querySelector(".genre-dropdown-container")
                    ?.getBoundingClientRect().left + "px",
                pointerEvents: "auto",
              }}
            >
              <div className="bg-[#1a1848]/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 overflow-hidden">
                <div className="max-h-[400px] overflow-y-auto custom-scrollbar p-2">
                  {genres.map((genre) => (
                    <button
                      key={genre.value}
                      onClick={() => {
                        dispatch(selectGenreListId(genre.value));
                        setShowGenreDropdown(false);
                      }}
                      className={`
                        w-full text-left px-4 py-3 rounded-lg
                        transition-all duration-200 flex items-center justify-between
                        ${
                          selectedGenre === genre.value
                            ? "bg-white/20 text-white font-semibold"
                            : "hover:bg-white/10 text-gray-300 hover:text-white"
                        }
                      `}
                    >
                      <span>{genre.title}</span>
                      {selectedGenre === genre.value && (
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );

  if (isFetching) return <Loader title="Loading songs..." />;
  if (error) return <Error />;

  return (
    <div className="flex flex-col">
      <AppHeader
        title="Discover"
        subtitle="Find your next favorite track"
        action={genreSelector}
      />

      <ResponsiveGrid type="songs">
        {shuffledSongs.map((song, i) => (
          <SongCard
            key={song.key || i}
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
