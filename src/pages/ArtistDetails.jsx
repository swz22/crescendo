import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { DetailsHeader, Error, Loader, RelatedSongs } from "../components";
import { useGetArtistDetailsQuery } from "../redux/services/shazamCore";

const ArtistDetails = () => {
  const { id: artistId } = useParams();
  const { activeSong, isPlaying } = useSelector((state) => state.player);
  const {
    data: artistData,
    isFetching: isFetchingArtistDetails,
    error,
  } = useGetArtistDetailsQuery(artistId);

  if (isFetchingArtistDetails)
    return <Loader title="Loading artist details..." />;

  if (error) return <Error />;

  // Debug log to see the structure
  console.log('Artist data structure:', artistData);

  // Handle different possible response structures
  const artist = artistData?.data?.[0] || artistData?.artists?.[0] || artistData;
  
  // Extract top songs - handle different possible paths
  const getTopSongs = () => {
    if (artist?.views?.["top-songs"]?.data) {
      return artist.views["top-songs"].data;
    }
    if (artistData?.songs) {
      return artistData.songs;
    }
    if (artistData?.data?.views?.["top-songs"]?.data) {
      return artistData.data.views["top-songs"].data;
    }
    return [];
  };

  const topSongs = getTopSongs();

  return (
    <div className="flex flex-col">
      <DetailsHeader 
        artistId={artistId} 
        artistData={artist} 
      />

      <RelatedSongs
        data={topSongs}
        artistId={artistId}
        isPlaying={isPlaying}
        activeSong={activeSong}
      />
    </div>
  );
};

export default ArtistDetails;