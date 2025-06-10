import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { Error, Loader, SongCard, Searchbar } from "../components";
import { selectGenreListId } from "../redux/features/playerSlice";
import { useGetSongsByGenreQuery } from "../redux/services/spotifyCore";
import { usePreviewUrl } from "../hooks/usePreviewUrl";
import { genres } from "../assets/constants";

const Discover = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { genreListId } = useSelector((state) => state.player);
  const { activeSong, isPlaying } = useSelector((state) => state.player);
  const { prefetchPreviewUrl, getPagePrefetchStrategy } = usePreviewUrl();

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

  if (isFetching) return <Loader title="Loading songs..." />;
  if (error) return <Error />;

  const genreColors = {
    POP: "from-pink-500 to-rose-500",
    HIP_HOP_RAP: "from-[#6366f1] to-[#0ea5e9]",
    DANCE: "from-blue-500 to-cyan-500",
    ELECTRONIC: "from-indigo-500 to-blue-600",
    SOUL_RNB: "from-orange-500 to-red-500",
    ALTERNATIVE: "from-gray-700 to-gray-900",
    ROCK: "from-red-700 to-red-900",
    LATIN: "from-yellow-500 to-orange-500",
    FILM_TV: "from-teal-500 to-green-600",
    COUNTRY: "from-yellow-600 to-amber-700",
    WORLDWIDE: "from-green-500 to-emerald-600",
    REGGAE: "from-green-600 to-yellow-600",
    HOUSE: "from-[#0ea5e9] to-[#6366f1]",
    K_POP: "from-pink-400 to-[#6366f1]",
    INDIE: "from-amber-500 to-orange-600",
    METAL: "from-gray-900 to-red-900",
    JAZZ: "from-blue-800 to-indigo-900",
    CLASSICAL: "from-[#1a1f3a] to-[#6366f1]",
    BLUES: "from-blue-900 to-blue-700",
    PUNK: "from-pink-600 to-black",
    FUNK: "from-[#6366f1] to-orange-600",
    GOSPEL: "from-yellow-600 to-yellow-800",
    DISCO: "from-pink-500 to-[#6366f1]",
    LOFI: "from-[#0ea5e9]/50 to-pink-300",
  };

  return (
    <div className="flex flex-col">
      <div className="w-full mb-6 mt-8">
        <div className="flex items-center justify-between gap-8 mb-4">
          <h2 className="font-bold text-3xl text-white">
            Discover {genreTitle}
          </h2>
          <div className="flex-1 max-w-2xl">
            <Searchbar />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4 max-h-24 overflow-y-auto genre-pills-container p-1">
          {[...genres]
            .sort((a, b) => a.title.localeCompare(b.title))
            .map((genre) => (
              <button
                key={genre.value}
                onClick={() => dispatch(selectGenreListId(genre.value))}
                className={`px-4 py-2 rounded-full font-medium transition-all duration-300 ${
                  selectedGenre === genre.value
                    ? `bg-gradient-to-r ${
                        genreColors[genre.value] || "from-gray-600 to-gray-700"
                      } text-white shadow-lg scale-105 ring-2 ring-white/30`
                    : "bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white hover:scale-105 backdrop-blur-sm border border-white/10"
                }`}
              >
                {genre.title}
              </button>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
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
      </div>
    </div>
  );
};

export default Discover;
