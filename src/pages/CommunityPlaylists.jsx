import { Error, Loader } from "../components";
import PlaylistCard from "../components/PlaylistCard";
import { useGetFeaturedPlaylistsQuery } from "../redux/services/spotifyCore";

const CommunityPlaylists = () => {
  const { data, isFetching, error } = useGetFeaturedPlaylistsQuery();

  if (isFetching) return <Loader title="Loading community playlists..." />;
  if (error) return <Error />;

  return (
    <div className="flex flex-col">
      <h2 className="font-bold text-3xl text-white text-left mt-4 mb-4">
        Community Playlists
      </h2>
      {data?.message && (
        <p className="text-gray-400 text-lg mb-6">Discover music curated by the community</p>
      )}

      <div className="flex flex-wrap sm:justify-start justify-center gap-8">
        {data?.playlists?.map((playlist, i) => (
          <PlaylistCard key={playlist.id || i} playlist={playlist} />
        ))}
      </div>
    </div>
  );
};

export default CommunityPlaylists;