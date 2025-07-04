import { Link, useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { DetailsHeader, Error, Loader, RelatedSongs } from "../components";
import { playTrack, playPause } from "../redux/features/playerSlice";
import { usePreviewUrl } from "../hooks/usePreviewUrl";
import { getTrackId, formatTrackDuration } from "../utils/trackUtils";
import {
  useGetSongDetailsQuery,
  useGetArtistTopTracksQuery,
} from "../redux/services/spotifyCore";

const SongDetails = () => {
  const dispatch = useDispatch();
  const { getPreviewUrl } = usePreviewUrl();
  const { songid } = useParams();
  const { isPlaying } = useSelector((state) => state.player);

  const {
    data: songData,
    isFetching: isFetchingSongDetails,
    error: songError,
  } = useGetSongDetailsQuery({ songid });

  const artistId = songData?.artists?.[0]?.id;

  const { data: relatedData, isFetching: isFetchingRelatedSongs } =
    useGetArtistTopTracksQuery({ artistid: artistId }, { skip: !artistId });

  if (isFetchingSongDetails || isFetchingRelatedSongs)
    return <Loader title="Loading song details..." />;

  if (songError) return <Error />;

  const handlePauseClick = () => {
    dispatch(playPause(false));
  };

  const handlePlayClick = async (song, i) => {
    const songWithPreview = await getPreviewUrl(song);

    if (songWithPreview.preview_url) {
      dispatch(
        playTrack({
          track: songWithPreview,
        })
      );
    } else {
      console.error("No preview available for this track");
    }
  };

  const relatedSongs =
    relatedData?.filter((song) => {
      const songKey = getTrackId(song);
      return songKey !== songid;
    }) || [];

  return (
    <div className="flex flex-col">
      <DetailsHeader artistId="" songData={songData} />

      <div className="mb-10">
        <h2 className="text-white text-3xl font-bold">Track Information</h2>

        {/* Song Info */}
        <div className="mt-5">
          <div className="bg-white/5 p-4 rounded-lg">
            <h3 className="text-white text-xl font-semibold mb-3">Details</h3>
            <p className="text-gray-400 mb-2">
              <span className="text-gray-300">Album:</span>{" "}
              {songData?.album?.name || "Unknown"}
            </p>
            <p className="text-gray-400 mb-2">
              <span className="text-gray-300">Duration:</span>{" "}
              {formatTrackDuration(songData?.duration_ms)}
            </p>
            <p className="text-gray-400 mb-2">
              <span className="text-gray-300">Release Date:</span>{" "}
              {songData?.album?.release_date
                ? new Date(songData.album.release_date).toLocaleDateString(
                    "en-US",
                    {
                      month: "numeric",
                      day: "numeric",
                      year: "2-digit",
                    }
                  )
                : "Unknown"}
            </p>
          </div>
        </div>
      </div>

      <RelatedSongs
        data={relatedSongs}
        isPlaying={isPlaying}
        handlePauseClick={handlePauseClick}
        handlePlayClick={handlePlayClick}
      />
    </div>
  );
};

export default SongDetails;
