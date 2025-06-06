import { ArtistCard, Error, Loader } from "../components";
import { useGetTopChartsQuery } from "../redux/services/shazamCore";

const TopArtists = () => {
  const { data, isFetching, error } = useGetTopChartsQuery();

  if (isFetching) return <Loader title="Loading artists..." />;

  if (error) return <Error />;

  // Extract tracks and get unique artists
  const tracks = data?.tracks || data || [];
  
  // Create a map of unique artists
  const artistsMap = new Map();
  
  tracks.forEach((track) => {
    if (track?.artists?.[0]) {
      const artist = track.artists[0];
      const artistId = artist.adamid || artist.id;
      if (artistId && !artistsMap.has(artistId)) {
        artistsMap.set(artistId, {
          ...artist,
          // Use the track's image as artist image if artist doesn't have one
          coverart: artist.avatar || track.images?.background || track.images?.coverart
        });
      }
    }
  });

  const topArtists = Array.from(artistsMap.values());

  return (
    <div className="flex flex-col">
      <h2 className="font-bold text-3xl text-white text-left mt-4 mb-10">
        Top Artists
      </h2>

      <div className="flex flex-wrap sm:justify-start justify-center gap-8">
        {topArtists.length > 0 ? (
          topArtists.map((artist) => (
            <ArtistCard key={artist.adamid || artist.id} track={{ artists: [artist] }} />
          ))
        ) : (
          <p className="text-gray-400 text-2xl">No artists found</p>
        )}
      </div>
    </div>
  );
};

export default TopArtists;