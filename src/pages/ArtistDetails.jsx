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

  const handlePlayClick = async (song, i, dataArray) => {
    // Always get preview URL (from cache or fetch)
    const songWithPreview = await getPreviewUrl(song);

    if (songWithPreview.preview_url) {
      // Get current queue
      const currentQueue = store.getState().player.currentSongs || [];

      // Check if song already exists
      const songExists = currentQueue.some(
        (s) => s.key === songWithPreview.key
      );

      let newQueue;
      let newIndex;

      if (songExists) {
        newQueue = currentQueue;
        newIndex = currentQueue.findIndex((s) => s.key === songWithPreview.key);
      } else {
        newQueue = [...currentQueue, songWithPreview];
        newIndex = newQueue.length - 1;
      }

      dispatch(
        setActiveSong({ song: songWithPreview, data: newQueue, i: newIndex })
      );
      dispatch(playPause(true));
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
