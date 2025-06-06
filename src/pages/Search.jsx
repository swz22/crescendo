import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { Error, Loader, SongCard } from "../components";
import { useGetSongsBySearchQuery } from "../redux/services/spotifyCore";

const Search = () => {
  const { searchTerm } = useParams();
  const { activeSong, isPlaying } = useSelector((state) => state.player);
  const { data, isFetching, error } = useGetSongsBySearchQuery(searchTerm);

  // Extract songs from search results - handle different response structures
  const songs = data?.tracks?.hits?.map(hit => hit.track) || 
                data?.tracks || 
                data?.hits?.map(hit => hit.track) || 
                data || 
                [];

  if (isFetching) return <Loader title={`Searching ${searchTerm}...`} />;

  if (error) return <Error />;

  return (
    <div className="flex flex-col">
      <h2 className="font-bold text-3xl text-white text-left mt-4 mb-10">
        Showing results for <span className="font-black">{searchTerm}</span>
      </h2>

      <div className="flex flex-wrap sm:justify-start justify-center gap-8">
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
          <p className="text-gray-400 text-2xl">No results found for "{searchTerm}"</p>
        )}
      </div>
    </div>
  );
};

export default Search;