import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  playPause,
  setActiveSong,
  setModalOpen,
} from "../redux/features/playerSlice";
import { useGetPlaylistTracksQuery } from "../redux/services/spotifyCore";
import { usePreviewUrl } from "../hooks/usePreviewUrl";
import PlayPause from "./PlayPause";
import { Error, Loader } from "./";
import { IoClose } from "react-icons/io5";

const PlaylistModal = ({ playlist, initialMosaicImages, onClose }) => {
  const dispatch = useDispatch();
  const { activeSong, isPlaying } = useSelector((state) => state.player);
  const { getPreviewUrl, prefetchMultiple, isPreviewCached, hasNoPreview, prefetchPreviewUrl } = usePreviewUrl();
  const [isAnimating, setIsAnimating] = useState(false);
  const [mosaicImages, setMosaicImages] = useState(initialMosaicImages || []);

  const {
    data: tracks,
    isFetching,
    error,
  } = useGetPlaylistTracksQuery({ playlistId: playlist.id });

  const placeholderImage =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNGE1NTY4Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2EwYWVjMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==";

  useEffect(() => {
    // Start animation on mount
    setIsAnimating(true);
    dispatch(setModalOpen(true));

    // Prevent body scroll when modal is open
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "unset";
      dispatch(setModalOpen(false));
    };
  }, [dispatch]);

  // Prefetch preview URLs when tracks load
  useEffect(() => {
    if (tracks && tracks.length > 0) {
      // Use the new prefetchMultiple method for better performance
      // Only prefetch first 3 tracks with conservative settings
      prefetchMultiple(tracks.slice(0, 3), { 
        maxConcurrent: 2, 
        startDelay: 1000 
      });
    }
  }, [tracks, prefetchMultiple]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(onClose, 200);
  };

  const handlePlayClick = async (song, i) => {
    console.log("handlePlayClick - song:", song, "index:", i);

    // Pause current playback while fetching
    if (isPlaying) {
      dispatch(playPause(false));
    }
    
    // Always get preview URL (from cache or fetch)
    const songWithPreview = await getPreviewUrl(song);
    
    if (songWithPreview.preview_url) {
      console.log('Playing song with preview URL:', songWithPreview);
      dispatch(
        setActiveSong({
          song: songWithPreview,
          data: tracks,
          i,
          playlistId: playlist.id,
        })
      );
      dispatch(playPause(true));
    } else {
      console.error("No preview URL available for this track");
    }
  };

  const handlePauseClick = () => {
    dispatch(playPause(false));
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200 ${
          isAnimating ? "bg-black/60 backdrop-blur-sm" : "bg-transparent"
        }`}
        onClick={handleBackdropClick}
      >
        <div
          className={`bg-gradient-to-br from-purple-900/90 to-black/90 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl transition-all duration-200 transform ${
            isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
          }`}
        >
          {/* Header */}
          <div className="relative p-6 pb-4 bg-gradient-to-b from-white/10 to-transparent">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <IoClose size={24} className="text-white" />
            </button>

            <div className="flex items-start gap-6">
              {/* Mosaic Image - Use the same images as the card */}
              <div className="w-32 h-32 rounded-lg shadow-lg overflow-hidden flex-shrink-0">
                {mosaicImages.length === 4 ? (
                  // Check if all images are the same (playlist cover fallback)
                  mosaicImages.every((img) => img === mosaicImages[0]) &&
                  mosaicImages[0] !== placeholderImage ? (
                    // Show single playlist cover instead of 4 identical quadrants
                    <img
                      src={mosaicImages[0]}
                      alt={playlist.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = placeholderImage;
                      }}
                    />
                  ) : (
                    // Show mosaic grid
                    <div className="grid grid-cols-2 gap-0.5 w-full h-full">
                      {mosaicImages.map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`Album ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = placeholderImage;
                          }}
                        />
                      ))}
                    </div>
                  )
                ) : (
                  // Fallback while loading
                  <img
                    src={playlist.images?.[0]?.url || placeholderImage}
                    alt={playlist.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = placeholderImage;
                    }}
                  />
                )}
              </div>
              <div className="flex-1 min-w-0 pt-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                  {playlist.name}
                </h2>
                <p className="text-gray-300 mb-1">
                  by {playlist.owner?.display_name || "Spotify"}
                </p>
                <p className="text-gray-400 text-sm">
                  {playlist.tracks?.total || 0} tracks
                </p>
              </div>
            </div>
          </div>

          {/* Track List */}
          <div className="p-6 pt-2 overflow-y-auto max-h-[60vh] custom-scrollbar">
            {isFetching && <Loader title="Loading tracks..." />}
            {error && <Error />}
            {tracks && (
              <div className="space-y-1">
                {tracks.map((track, i) => (
                  <div
                    key={track.key || i}
                    className="flex items-center py-2 px-3 hover:bg-white/5 rounded-lg transition-colors group"
                    onMouseEnter={() => {
                      // Prefetch on hover if not already cached
                      if (!isPreviewCached(track)) {
                        prefetchPreviewUrl(track, { priority: 'high' });
                      }
                    }}
                  >
                    <span className="text-gray-500 text-sm w-8 text-center">
                      {i + 1}
                    </span>

                    <img
                      src={track.images?.coverart || placeholderImage}
                      alt={track.title}
                      className="w-12 h-12 rounded ml-3 mr-4 flex-shrink-0"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = placeholderImage;
                      }}
                    />

                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm sm:text-base font-medium truncate">
                        {track.title}
                      </p>
                      <p className="text-gray-400 text-xs sm:text-sm truncate">
                        {track.subtitle}
                      </p>
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                      <PlayPause
                        isPlaying={isPlaying}
                        activeSong={activeSong}
                        song={track}
                        handlePause={handlePauseClick}
                        handlePlay={() => handlePlayClick(track, i)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default PlaylistModal;