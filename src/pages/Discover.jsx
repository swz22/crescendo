import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import {
  Error,
  Loader,
  SongCard,
  AppHeader,
  ResponsiveGrid,
} from "../components";
import { selectGenreListId } from "../redux/features/playerSlice";
import { useGetSongsByGenreQuery } from "../redux/services/spotifyCore";
import { usePreviewUrl } from "../hooks/usePreviewUrl";
import { genres } from "../assets/constants";
import { IoChevronDown, IoClose } from "react-icons/io5";
import { HiOutlineSparkles } from "react-icons/hi";

const Discover = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { genreListId } = useSelector((state) => state.player);
  const { activeSong, isPlaying } = useSelector((state) => state.player);
  const { prefetchPreviewUrl, getPagePrefetchStrategy } = usePreviewUrl();
  const [showGenreModal, setShowGenreModal] = useState(false);

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
    JAZZ: "from-blue-800 to-indigo-900",
    CLASSICAL: "from-indigo-900 to-purple-900",
    BLUES: "from-blue-900 to-blue-700",
    PUNK: "from-pink-600 to-black",
    FUNK: "from-purple-600 to-orange-600",
    GOSPEL: "from-yellow-600 to-yellow-800",
    DISCO: "from-pink-500 to-purple-600",
    LOFI: "from-blue-300 to-pink-300",
  };

  // Genre selector component
  const genreSelector = (
    <>
      {/* Mobile/Tablet Genre Button */}
      <button
        onClick={() => setShowGenreModal(true)}
        className={`sm:hidden px-3 py-1.5 bg-gradient-to-r ${
          genreColors[selectedGenre] || "from-gray-600 to-gray-700"
        } text-white rounded-full text-sm font-medium shadow-lg flex items-center gap-1 active:scale-95 transition-all`}
      >
        <span className="truncate max-w-[80px]">{genreTitle}</span>
        <IoChevronDown className="w-3 h-3 flex-shrink-0" />
      </button>

      {/* Desktop Genre Dropdown */}
      <div className="hidden sm:block relative">
        <button
          onClick={() => setShowGenreModal(!showGenreModal)}
          className={`px-4 py-2 bg-gradient-to-r ${
            genreColors[selectedGenre] || "from-gray-600 to-gray-700"
          } text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2`}
        >
          <span>{genreTitle}</span>
          <IoChevronDown
            className={`w-4 h-4 transition-transform ${
              showGenreModal ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Desktop Dropdown */}
        {showGenreModal && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowGenreModal(false)}
            />
            <div className="absolute right-0 mt-2 w-64 max-h-[70vh] bg-[#1e1b4b]/98 backdrop-blur-xl rounded-xl shadow-2xl border border-white/20 overflow-hidden z-50 animate-slidedown">
              <div className="py-2 overflow-y-auto custom-scrollbar">
                {genres
                  .sort((a, b) => a.title.localeCompare(b.title))
                  .map((genre) => (
                    <button
                      key={genre.value}
                      onClick={() => {
                        dispatch(selectGenreListId(genre.value));
                        setShowGenreModal(false);
                      }}
                      className={`w-full px-4 py-3 text-left hover:bg-white/10 transition-all flex items-center justify-between group ${
                        selectedGenre === genre.value
                          ? "bg-white/10 border-l-4 border-[#14b8a6]"
                          : ""
                      }`}
                    >
                      <span
                        className={`${
                          selectedGenre === genre.value
                            ? "text-[#14b8a6] font-semibold"
                            : "text-white"
                        }`}
                      >
                        {genre.title}
                      </span>
                      {selectedGenre === genre.value && (
                        <div className="w-2 h-2 bg-[#14b8a6] rounded-full animate-pulse" />
                      )}
                    </button>
                  ))}
              </div>
            </div>
          </>
        )}
      </div>
    </>
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

      {/* Mobile Genre Modal */}
      {showGenreModal && (
        <div
          className="sm:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setShowGenreModal(false)}
        >
          <div
            className="absolute inset-x-4 top-1/2 -translate-y-1/2 max-h-[80vh] bg-gradient-to-br from-[#1e1b4b] to-[#0f172a] rounded-2xl p-6 animate-scaleIn border border-white/20 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <HiOutlineSparkles className="text-[#14b8a6]" />
                Select Genre
              </h3>
              <button
                onClick={() => setShowGenreModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <IoClose className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Genre Grid */}
            <div className="grid grid-cols-2 gap-3 overflow-y-auto max-h-[50vh] custom-scrollbar pr-2">
              {genres
                .sort((a, b) => a.title.localeCompare(b.title))
                .map((genre) => (
                  <button
                    key={genre.value}
                    onClick={() => {
                      dispatch(selectGenreListId(genre.value));
                      setShowGenreModal(false);
                    }}
                    className={`relative p-4 rounded-xl font-medium transition-all active:scale-95 overflow-hidden group ${
                      selectedGenre === genre.value
                        ? `bg-gradient-to-r ${
                            genreColors[genre.value] ||
                            "from-gray-600 to-gray-700"
                          } text-white shadow-lg`
                        : "bg-white/10 text-white hover:bg-white/15"
                    }`}
                  >
                    {selectedGenre === genre.value && (
                      <div className="absolute inset-0 bg-white/20 animate-pulse" />
                    )}
                    <span className="relative z-10">{genre.title}</span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Song Grid */}
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
