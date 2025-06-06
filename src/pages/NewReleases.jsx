import { Error, Loader } from "../components";
import AlbumCard from "../components/AlbumCard";
import { useGetNewReleasesQuery } from "../redux/services/spotifyCore";

const NewReleases = () => {
  const { data, isFetching, error } = useGetNewReleasesQuery();

  if (isFetching) return <Loader title="Loading new releases..." />;
  if (error) return <Error />;

  return (
    <div className="flex flex-col">
      <h2 className="font-bold text-3xl text-white text-left mt-4 mb-10">
        New Releases
      </h2>

      <div className="flex flex-wrap sm:justify-start justify-center gap-8">
        {data?.map((album, i) => (
          <AlbumCard key={album.id || i} album={album} />
        ))}
      </div>
    </div>
  );
};

export default NewReleases;