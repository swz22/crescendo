import { useDispatch, useSelector } from "react-redux";
import { Error, Loader, SongCard } from "../components";
import { selectGenreListId } from "../redux/features/playerSlice";
import { useGetSongsBySearchQuery } from "../redux/services/spotifyCore";
import { genres } from "../assets/constants";

const Discover = () => {
  const dispatch = useDispatch();
  const { genreListId } = useSelector((state) => state.player);
  const { activeSong, isPlaying } = useSelector((state) => state.player);
  
  const genreTitle = genres.find(({ value }) => value === genreListId)?.title || 'Pop';
  const { data, isFetching, error } = useGetSongsBySearchQuery(genreTitle.toLowerCase());

  if (isFetching) return <Loader title="Loading songs..." />;

  if (error) return <Error />;

  const songs = data?.tracks?.hits?.map(hit => ({
    ...hit.track,
    key: hit.track?.key || hit.track?.hub?.actions?.[0]?.id
  })) || [];

  console.log('Search data:', data);
  console.log('Extracted songs:', songs);

  return (
    <div className="flex flex-col">
      <div className="w-full flex justify-between items-center sm:flex-row flex-col mt-4 mb-10">
        <div className="text-white">
          <h2 className="font-bold text-3xl text-left text-white"> 
            ♫ Discover {genreTitle} Music ♫
          </h2>
          <div className="font-xs mt-2"> 
            * Using search results for genre discovery since charts API is currently unavailable * 
          </div>
        </div>

        <select
          onChange={(e) => dispatch(selectGenreListId(e.target.value))}
          value={genreListId || "genre-global-chart-1"}
          className="bg-black text-gray-300 p-3 text-sm rounded-lg outline-none sm:mt-0 mt-5"
        >
          {genres.map((genre) => (
            <option key={genre.value} value={genre.value}>
              {genre.title}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap sm:justify-start justify-center gap-8">
        {songs.length > 0 ? (
          songs.map((song, i) => (
            <SongCard
              key={song?.key || i}
              song={song}
              isPlaying={isPlaying}
              activeSong={activeSong}
              data={songs}
              i={i}
            />
          ))
        ) : (
          <p className="text-gray-300 text-2xl">No songs found for {genreTitle}</p>
        )}
      </div>
    </div>
  );
};

export default Discover;