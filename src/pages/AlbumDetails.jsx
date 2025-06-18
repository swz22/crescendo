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
} from "../redux/features/playerSlice";
import { useToast } from "../context/ToastContext";
import { BsFillPlayFill } from "react-icons/bs";
import { HiPlus } from "react-icons/hi";

// Create a local placeholder to avoid network requests
const createPlaceholder = (text = "No Image") => {
  const svg = `
    <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#4a5568"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="20" fill="#a0aec0" text-anchor="middle" dy=".3em">${text}</text>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

const AlbumDetails = () => {
  const dispatch = useDispatch();
  const { id: albumId } = useParams();
  const { getPreviewUrl } = usePreviewUrl();
  const { showToast } = useToast();
  const { activeSong, isPlaying } = useSelector((state) => state.player);

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

  // Always add album artwork to tracks since the API doesn't include it
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
          id: albumId,
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

        // Create album context and start playing
        dispatch(
          replaceContext({
            contextType: "album",
            tracks: updatedTracks,
            startIndex: 0,
            playlistData: {
              id: albumId,
              name: `${albumData?.name} • ${albumData?.artists?.[0]?.name}`,
              tracks: updatedTracks,
            },
          })
        );

        showToast(`Playing album: ${albumData?.name}`);
      } else {
        showToast("No preview available for this album", "error");
      }
    } catch (error) {
      console.error("Error playing album:", error);
      showToast("Error loading album", "error");
    }
  };

  const handleAddToQueue = () => {
    if (tracksWithAlbumArt && tracksWithAlbumArt.length > 0) {
      tracksWithAlbumArt.forEach((track) => {
        dispatch(addToQueue({ song: track }));
      });
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
        <div className="flex gap-3 mb-6">
          <button
            onClick={handlePlayAlbum}
            className="flex items-center gap-2 px-6 py-3 bg-[#14b8a6] hover:bg-[#10a094] text-white rounded-full font-semibold transition-all hover:scale-105 shadow-lg"
          >
            <BsFillPlayFill className="w-6 h-6" />
            Play Album
          </button>
          <button
            onClick={handleAddToQueue}
            className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full font-semibold transition-all border border-white/20"
          >
            <HiPlus className="w-5 h-5" />
            Add to Queue
          </button>
        </div>

        {/* Track List */}
        <div className="bg-white/5 p-1 rounded-lg">
          {tracksWithAlbumArt?.map((song, i) => (
            <TrackRow
              key={`${albumId}-${song.id || song.key || i}`}
              song={song}
              data={tracksWithAlbumArt}
              i={i}
              isPlaying={isPlaying}
              activeSong={activeSong}
              albumImage={albumData?.images?.[0]?.url}
              showAlbumColumn={false}
              showImage={false}
              isCompact={true}
              handlePauseClick={handlePauseClick}
              handlePlayClick={() => handlePlayClick(song, i)}
            />
          ))}
        </div>

        {/* Album Info */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white/5 p-4 rounded-lg">
            <h3 className="text-white/60 text-sm mb-1">Release Date</h3>
            <p className="text-white font-medium">
              {albumData?.release_date
                ? new Date(albumData.release_date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "Unknown"}
            </p>
          </div>
          <div className="bg-white/5 p-4 rounded-lg">
            <h3 className="text-white/60 text-sm mb-1">Total Tracks</h3>
            <p className="text-white font-medium">
              {albumData?.total_tracks || 0} tracks
            </p>
          </div>
          {albumData?.label && (
            <div className="bg-white/5 p-4 rounded-lg">
              <h3 className="text-white/60 text-sm mb-1">Label</h3>
              <p className="text-white font-medium">{albumData.label}</p>
            </div>
          )}
        </div>

        {/* Copyright */}
        {albumData?.copyrights?.length > 0 && (
          <div className="mt-6">
            <div className="text-white/40 text-xs">
              {albumData.copyrights[0] && (
                <p className="text-white/60 text-sm mt-2">
                  {albumData.copyrights[0].text}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlbumDetails;
