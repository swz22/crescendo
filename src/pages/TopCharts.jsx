import { useSelector } from "react-redux";
import { Error, Loader, SongCard } from "../components";
import { useGetSongsBySearchQuery } from "../redux/services/shazamCore";

const TopCharts = () => {
  // Use search for "trending" or "top hits" since charts endpoint returns no data
  const { data, isFetching, error } = useGetSongsBySearchQuery("trending 2024");
  const { activeSong, isPlaying } = useSelector((state) => state.player);

  if (isFetching) return <Loader title="Loading Top Charts" />;

  if (error) return <Error />;

  // Extract tracks from search results
  const tracks = data?.tracks?.hits?.map(hit => ({
    ...hit.track,
    key: hit.track?.key || hit.track?.hub?.actions?.[0]?.id
  })) || [];

  console.log('TopCharts search data:', data);
  console.log('Extracted tracks:', tracks);

  return (
    <div className="flex flex-col">
      <h2 className="font-bold text-3xl text-white text-left mt-4 mb-10">
        Top Charts
        <span className="text-base font-normal block mt-2">
          (Using trending search results - Charts API unavailable)
        </span>
      </h2>

      <div className="flex flex-wrap sm:justify-start justify-center gap-8">
        {tracks.map((song, i) => (
          <SongCard
            key={song.key || i}
            song={song}
            isPlaying={isPlaying}
            activeSong={activeSong}
            data={tracks}
            i={i}
          />
        ))}
      </div>
    </div>
  );
};

export default TopCharts;



