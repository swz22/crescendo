import { ArtistCard } from "../components";
import { useGetSongsQuery } from "../redux/services/shazam";

const Artists = () => {
  const { data, isFetching, error } = useGetSongsQuery({
    genreListId: "genre-global-chart-1",
  });

  if (isFetching) {
    return <div className="h-screen text-white">Now Loading...</div>;
  }

  if (error) return "Something went wrong...";

  return (
    <div className="flex flex-col">
      <h2 className="font-bold text-3xl text-white text-left">
        Discover top artists
      </h2>
      <div className="mt-6 flex flex-wrap gap-8">
        {data?.tracks.map((track) => (
          <ArtistCard key={track.key} track={track} />
        ))}
      </div>
    </div>
  );
};

export default Artists;
