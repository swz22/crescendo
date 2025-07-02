import { useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Error, Loader, TrackRow } from "../components";
import DetailsHeader from "../components/DetailsHeader";
import {
  useGetAlbumDetailsQuery,
  useGetAlbumTracksQuery,
} from "../redux/services/spotifyCore";
import { usePreviewUrl } from "../hooks/usePreviewUrl";
import {
  replaceContext,
  addToQueue,
  playPause,
  playTrack,
  updateAlbumTrack,
  switchContext,
} from "../redux/features/playerSlice";
import { useToast } from "../context/ToastContext";
import { BsFillPlayFill } from "react-icons/bs";
import { HiPlus } from "react-icons/hi";

const AlbumDetails = () => {
  const dispatch = useDispatch();
  const { id: albumId } = useParams();
  const { getPreviewUrl } = usePreviewUrl();
  const { showToast } = useToast();
  const { isPlaying } = useSelector((state) => state.player);

  const {
    data: albumData,
    isFetching: isFetchingAlbumDetails,
    error: albumError,
  } = useGetAlbumDetailsQuery({ albumId });

  const {
    data: tracks,
    isFetching: isFetchingTracks,
    error: tracksError,
  } = useGetAlbumTracksQuery({ albumId });

  if (isFetchingAlbumDetails || isFetchingTracks) {
    return <Loader title="Loading album..." />;
  }

  if (albumError || tracksError) {
    console.error("Errors:", { albumError, tracksError });
    return <Error />;
  }

  const tracksWithAlbumArt =
    tracks?.map((track) => {
      const processedTrack = {
        ...track,
        images: {
          coverart: albumData?.images?.[0]?.url || "",
          background: albumData?.images?.[0]?.url || "",
        },
        album: {
          ...track.album,
          id: albumData?.id,
          name: albumData?.name,
          images: albumData?.images || [],
        },
      };
      return processedTrack;
    }) || [];

  const handlePlayAlbum = async () => {
    if (!tracksWithAlbumArt || tracksWithAlbumArt.length === 0) {
      showToast("No tracks available", "error");
      return;
    }

    try {
      const firstTrackWithPreview = await getPreviewUrl(tracksWithAlbumArt[0]);

      if (firstTrackWithPreview?.preview_url) {
        const updatedTracks = [...tracksWithAlbumArt];
        updatedTracks[0] = firstTrackWithPreview;

        dispatch(
          replaceContext({
            contextType: "album",
            tracks: updatedTracks,
            startIndex: 0,
            playlistData: {
              id: albumData?.id,
              name: albumData?.name,
            },
          })
        );
      } else {
        showToast("No preview available", "error");
      }
    } catch (error) {
      console.error("Error playing album:", error);
      showToast("Error playing album", "error");
    }
  };

  const handleAddToQueue = () => {
    if (tracksWithAlbumArt && tracksWithAlbumArt.length > 0) {
      tracksWithAlbumArt.forEach((track) => {
        dispatch(addToQueue({ song: track }));
      });
      dispatch(switchContext({ contextType: "queue" }));
      showToast(`Added ${tracksWithAlbumArt.length} tracks to queue`);
    }
  };

  const handlePauseClick = () => {
    dispatch(playPause(false));
  };

  const handlePlayClick = async (track, index) => {
    try {
      const songWithPreview = await getPreviewUrl(track);

      if (songWithPreview?.preview_url) {
        dispatch(
          playTrack({
            track: songWithPreview,
          })
        );
      } else {
        showToast("No preview available", "error");
      }
    } catch (error) {
      console.error("Error playing track:", error);
      showToast("Error loading track", "error");
    }
  };

  return (
    <div className="flex flex-col">
      <DetailsHeader albumData={albumData} />

      <div className="mb-10">
        {/* Album Actions */}
        <div className="flex flex-wrap gap-4 mt-6">
          <button
            onClick={handlePlayAlbum}
            className="flex items-center gap-2 px-6 py-3 bg-[#14b8a6] hover:bg-[#10a094] text-white rounded-full font-semibold transition-all hover:scale-105 shadow-lg"
          >
            <BsFillPlayFill className="w-6 h-6" />
            Play Album
          </button>
          <button
            onClick={handleAddToQueue}
            className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-full font-semibold transition-all border border-white/20"
          >
            <HiPlus className="w-5 h-5" />
            Add to Queue
          </button>
        </div>

        {/* Tracks */}
        <div className="mt-8">
          <h2 className="text-white text-2xl font-bold mb-6">Tracks</h2>
          {tracksWithAlbumArt.length > 0 ? (
            tracksWithAlbumArt.map((track, i) => (
              <TrackRow
                key={track.key || track.id || i}
                song={track}
                i={i}
                isPlaying={isPlaying}
                handlePauseClick={handlePauseClick}
                handlePlayClick={() => handlePlayClick(track, i)}
              />
            ))
          ) : (
            <p className="text-gray-400 text-center py-8">
              No tracks available
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlbumDetails;
