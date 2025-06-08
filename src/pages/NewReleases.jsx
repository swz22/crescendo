import { Error, Loader } from "../components";
import AlbumCard from "../components/AlbumCard";
import { useGetNewReleasesQuery } from "../redux/services/spotifyCore";

const NewReleases = () => {
  const { data, isFetching, error } = useGetNewReleasesQuery();

  if (isFetching) return <Loader title="Loading new releases..." />;
  if (error) return <Error />;

  // Filter out singles and only show albums
  const albums = data?.filter(album => album.album_type === 'album') || [];

  return (
    <div className="flex flex-col">
      <h2 className="font-bold text-3xl text-white text-left mt-4 mb-10">
        New Album Releases
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
        {albums.map((album, i) => (
          <AlbumCard key={album.id || i} album={album} showTrackCount={true} />
        ))}
      </div>
    </div>
  );
};

export default NewReleases;