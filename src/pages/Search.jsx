import { useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Error, Loader, SongCard } from "../components";
import { useGetSongsBySearchQuery } from "../redux/services/spotifyCore";
import { FiSearch } from "react-icons/fi";

const Search = () => {
  const { searchTerm } = useParams();
  const navigate = useNavigate();
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm || "");
  const { activeSong, isPlaying } = useSelector((state) => state.player);
  const { data, isFetching, error } = useGetSongsBySearchQuery(searchTerm);

  // Update local search when route changes
  useEffect(() => {
    setLocalSearchTerm(searchTerm || "");
  }, [searchTerm]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (localSearchTerm.trim()) {
      navigate(`/search/${localSearchTerm.trim()}`);
    }
  };

  // Extract songs from search results
  const songs =
    data?.tracks?.hits?.map((hit) => hit.track) ||
    data?.tracks ||
    data?.hits?.map((hit) => hit.track) ||
    data ||
    [];

  if (isFetching) return <Loader title={`Searching ${searchTerm}...`} />;

  if (error) return <Error />;

  return (
    <div className="flex flex-col">
      <div className="mb-8">
        <h2 className="font-bold text-3xl text-white text-left mb-4">
          Showing results for{" "}
          <span className="font-black text-[#14b8a6]">{searchTerm}</span>
        </h2>

        {/* Search bar on results page */}
        <form onSubmit={handleSearch} className="max-w-2xl">
          <div className="relative group">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#14b8a6] transition-colors" />
            <input
              name="search-field"
              id="search-field"
              className="w-full bg-white/[0.08] backdrop-blur-xl border border-white/20 rounded-full 
                         placeholder-gray-400 outline-none text-base text-white pl-12 pr-4 py-3
                         focus:bg-white/[0.12] focus:border-[#14b8a6]/50 focus:shadow-[0_0_30px_rgba(20,184,166,0.3)] 
                         transition-all duration-300 hover:bg-white/10 hover:border-white/30"
              placeholder="Search for songs, artists..."
              type="search"
              value={localSearchTerm}
              onChange={(e) => setLocalSearchTerm(e.target.value)}
            />
            {localSearchTerm && (
              <button
                type="button"
                onClick={() => setLocalSearchTerm("")}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-all duration-200 hover:scale-110"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {songs.length ? (
          songs.map((song, i) => (
            <SongCard
              key={song.key || song.id || i}
              song={song}
              isPlaying={isPlaying}
              activeSong={activeSong}
              data={songs}
              i={i}
            />
          ))
        ) : (
          <p className="text-gray-400 text-2xl col-span-full">
            No results found for "{searchTerm}"
          </p>
        )}
      </div>
    </div>
  );
};

export default Search;
