import { useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { store } from "../redux/store";
import { DetailsHeader, Error, Loader, RelatedSongs } from "../components";
import {
  useGetArtistDetailsQuery,
  useGetArtistTopTracksQuery,
} from "../redux/services/spotifyCore";
import { usePreviewUrl } from "../hooks/usePreviewUrl";
import { setActiveSong, playPause } from "../redux/features/playerSlice";

const ArtistDetails = () => {
  const { id: artistId } = useParams();
  const dispatch = useDispatch();
  const { activeSong, isPlaying } = useSelector((state) => state.player);
  const { getPreviewUrl, isPreviewCached } = usePreviewUrl();

  const {
    data: artistData,
    isFetching: isFetchingArtistDetails,
    error,
  } = useGetArtistDetailsQuery({ artistid: artistId });

  const { data: topTracks, isFetching: isFetchingTopTracks } =
    useGetArtistTopTracksQuery({ artistid: artistId });

  if (isFetchingArtistDetails || isFetchingTopTracks)
    return <Loader title="Loading artist details..." />;

  if (error) return <Error />;

  const handlePauseClick = () => {
    dispatch(playPause(false));
  };

  const handlePlayClick = async (song, i) => {
    // Always get preview URL (from cache or fetch)
    const songWithPreview = await getPreviewUrl(song);

    if (songWithPreview.preview_url) {
      // Pass the full topTracks array as the queue
      dispatch(
        setActiveSong({
          song: songWithPreview,
          data: topTracks || [], // Use the full artist top tracks
          i: i,
        })
      );
      dispatch(playPause(true));
    } else {
      // Show error message if no preview available
      console.error("No preview available for this track");
    }
  };

  return (
    <div className="flex flex-col">
      <DetailsHeader artistId={artistId} artistData={artistData} />

      <RelatedSongs
        data={topTracks || []}
        artistId={artistId}
        isPlaying={isPlaying}
        activeSong={activeSong}
        handlePauseClick={handlePauseClick}
        handlePlayClick={handlePlayClick}
      />
    </div>
  );
};

export default ArtistDetails;
