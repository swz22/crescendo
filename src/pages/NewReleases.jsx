import { Error, Loader } from "../components";
import AlbumCard from "../components/AlbumCard";
import { useGetNewReleasesQuery } from "../redux/services/spotifyCore";
import { PageHeader } from "../components";

const NewReleases = () => {
  const { data, isFetching, error } = useGetNewReleasesQuery();

  if (isFetching) return <Loader title="Loading new releases..." />;
  if (error) return <Error />;

  const albums = data?.filter((album) => album.album_type === "album") || [];

  return (
    <div className="flex flex-col">
      <PageHeader title="New Album Releases" />

      <div className="flex flex-col sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-8 px-4 sm:px-0">
        {albums.map((album, i) => (
          <AlbumCard key={album.id || i} album={album} showTrackCount={true} />
        ))}
      </div>
    </div>
  );
};

export default NewReleases;
