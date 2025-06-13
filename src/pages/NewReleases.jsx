import { Error, Loader, AppHeader, ResponsiveGrid } from "../components";
import AlbumCard from "../components/AlbumCard";
import { useGetNewReleasesQuery } from "../redux/services/spotifyCore";

const NewReleases = () => {
  const { data, isFetching, error } = useGetNewReleasesQuery();

  if (isFetching) return <Loader title="Loading new releases..." />;
  if (error) return <Error />;

  const albums = data?.filter((album) => album.album_type === "album") || [];

  return (
    <div className="flex flex-col">
      <AppHeader
        title="New Releases"
        subtitle="Fresh albums from your favorite artists"
      />

      <ResponsiveGrid type="albums">
        {albums.map((album, i) => (
          <AlbumCard key={album.id || i} album={album} showTrackCount={true} />
        ))}
      </ResponsiveGrid>
    </div>
  );
};

export default NewReleases;
