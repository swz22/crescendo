import { useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { DetailsHeader, Error, Loader, RelatedSongs } from "../components";
import {
  useGetArtistDetailsQuery,
  useGetArtistTopTracksQuery,
} from "../redux/services/spotifyCore";
import { setActiveSong, playPause } from "../redux/features/playerSlice";
import { usePreviewUrl } from "../hooks/usePreviewUrl";
import { useToast } from "../context/ToastContext";

const ArtistDetails = () => {
  const { id: artistId } = useParams();
  const dispatch = useDispatch();
  const { activeSong, isPlaying } = useSelector((state) => state.player);
  const { getPreviewUrl } = usePreviewUrl();
  const { showToast } = useToast();

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
    try {
      const songWithPreview = await getPreviewUrl(song);

      if (songWithPreview.preview_url) {
        dispatch(
          setActiveSong({
            song: songWithPreview,
            data: topTracks || [],
            i: i,
          })
        );
        dispatch(playPause(true));
      } else {
        showToast("Preview not available for this track", "error");
      }
    } catch (error) {
      console.error("Error playing track:", error);
      // Don't show generic error toast - let the specific error handling in getPreviewUrl handle it
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
