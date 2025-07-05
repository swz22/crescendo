import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import { Error, LoadingState, PlayPause, SongMenu } from "../components";
import AlbumCard from "../components/AlbumCard";
import ArtistCard from "../components/ArtistCard";
import {
  useGetArtistDetailsQuery,
  useGetArtistTopTracksQuery,
  useGetArtistAlbumsQuery,
  useGetRecommendedArtistsQuery,
} from "../redux/services/spotifyCore";
import {
  playPause,
  replaceContext,
  switchContext,
} from "../redux/features/playerSlice";
import { usePreviewUrl } from "../hooks/usePreviewUrl";
import { useLoadingState } from "../hooks/useLoadingState";
import { useToast } from "../context/ToastContext";
import {
  formatTrackDuration,
  isSameTrack,
  getTrackId,
} from "../utils/trackUtils";
import {
  HiOutlineUserGroup,
  HiOutlineFire,
  HiOutlineMusicNote,
  HiCheckCircle,
  HiExternalLink,
} from "react-icons/hi";
import { BsSpotify, BsDisc, BsFillPlayFill } from "react-icons/bs";

const ArtistDetails = () => {
  const { id: artistId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isPlaying, currentTrack } = useSelector((state) => state.player);
  const { getPreviewUrl } = usePreviewUrl();
  const { showToast } = useToast();
  const { setLoading, isLoading } = useLoadingState();

  const {
    data: artistData,
    isFetching: isFetchingArtistDetails,
    error,
  } = useGetArtistDetailsQuery({ artistid: artistId });

  const { data: topTracks, isFetching: isFetchingTopTracks } =
    useGetArtistTopTracksQuery({ artistid: artistId });

  const { data: albumsData, isFetching: isFetchingAlbums } =
    useGetArtistAlbumsQuery({ artistId }, { skip: !artistId });

  // Get recommended artists based on this artist
  const {
    data: relatedArtists,
    isFetching: isFetchingRelated,
    error: relatedError,
  } = useGetRecommendedArtistsQuery(artistId, {
    skip: !artistId,
  });

  // Filter to only show albums and remove duplicates
  const albums =
    albumsData?.filter((album) => {
      // Only include albums
      if (album.album_type !== "album") return false;

      // Remove bonus / special tracks by checking if name contains parentheses
      const hasParentheses = /\([^)]*\)/.test(album.name);
      if (hasParentheses) return false;

      return true;
    }) || [];

  // Further deduplicate by album name
  const uniqueAlbums = albums.reduce((acc, album) => {
    const baseAlbumName = album.name.replace(/\s*\([^)]*\)\s*/g, "").trim();
    if (
      !acc.find(
        (a) => a.name.replace(/\s*\([^)]*\)\s*/g, "").trim() === baseAlbumName
      )
    ) {
      acc.push(album);
    }
    return acc;
  }, []);

  // Loading state for core data
  if (isFetchingArtistDetails || isFetchingTopTracks)
    return (
      <LoadingState
        variant="page"
        title="Loading artist details..."
        subtitle="Fetching top tracks and albums"
      />
    );

  if (error) return <Error />;

  const handlePauseClick = () => {
    dispatch(playPause(false));
  };

  const handlePlayClick = async (song, i) => {
    const trackId = getTrackId(song);
    setLoading(`track-${trackId}`, true);

    try {
      const songWithPreview = await getPreviewUrl(song);

      if (songWithPreview.preview_url) {
        dispatch(
          replaceContext({
            contextType: "queue",
            tracks: [songWithPreview],
            startIndex: 0,
            playlistData: {
              id: `artist-${artistId}`,
              name: `${artistData?.name || "Artist"} - Top Tracks`,
              type: "artist",
            },
          })
        );
        dispatch(switchContext({ contextType: "queue" }));
      } else {
        showToast("No preview available", "error");
      }
    } catch (error) {
      console.error("Error playing track:", error);
      showToast("Error loading track", "error");
    } finally {
      setLoading(`track-${trackId}`, false);
    }
  };

  const handlePlayAll = async () => {
    if (!topTracks || topTracks.length === 0) {
      showToast("No tracks available", "error");
      return;
    }

    setLoading("play-all", true);

    try {
      const tracksToPlay = topTracks.slice(0, 5);
      const tracksWithPreviews = [];

      // Fetch preview URLs for all tracks
      for (const track of tracksToPlay) {
        const trackWithPreview = await getPreviewUrl(track);
        if (trackWithPreview?.preview_url) {
          tracksWithPreviews.push(trackWithPreview);
        }
      }

      if (tracksWithPreviews.length === 0) {
        showToast("No preview available for these tracks", "error");
        return;
      }

      dispatch(
        replaceContext({
          contextType: "queue",
          tracks: tracksWithPreviews,
          startIndex: 0,
          playlistData: {
            id: `artist-${artistId}`,
            name: `${artistData?.name || "Artist"} - Top Tracks`,
            type: "artist",
          },
        })
      );

      dispatch(switchContext({ contextType: "queue" }));
      showToast(`Playing ${tracksWithPreviews.length} tracks`);
    } catch (error) {
      console.error("Error playing all tracks:", error);
      showToast("Error loading tracks", "error");
    } finally {
      setLoading("play-all", false);
    }
  };

  const artistImage =
    artistData?.images?.background || artistData?.avatar || "";
  const artistBio = artistData?.bio || "";
  const genres = artistData?.genres || [];
  const followers = artistData?.followers
    ? artistData.followers.toLocaleString()
    : "0";

  return (
    <div className="flex flex-col">
      {/* Artist Header */}
      <div className="relative px-4 md:px-6 lg:px-8 pt-8 pb-6">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#14b8a6]/20 to-transparent -z-10" />

        {/* Artist Info */}
        <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
          {/* Artist Image */}
          {artistImage && (
            <div className="relative w-48 h-48 md:w-64 md:h-64 flex-shrink-0">
              <img
                src={artistImage}
                alt={artistData?.name}
                className="w-full h-full object-cover rounded-full shadow-2xl"
                onError={(e) => {
                  e.target.src =
                    "data:image/svg+xml,%3Csvg width='300' height='300' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100%25' height='100%25' fill='%234a5568'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial, sans-serif' font-size='24' fill='%23a0aec0' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";
                }}
              />
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#14b8a6]/30 to-purple-600/30 -z-10 scale-110 blur-2xl" />
            </div>
          )}

          {/* Artist Details */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm text-[#14b8a6] font-medium flex items-center gap-1">
                <HiCheckCircle className="w-4 h-4" />
                Verified Artist
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              {artistData?.name || "Unknown Artist"}
            </h1>

            <div className="flex flex-col gap-3">
              {/* Stats */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
                <span className="flex items-center gap-1">
                  <HiOutlineUserGroup className="w-4 h-4" />
                  {followers} followers
                </span>
                {topTracks && topTracks.length > 0 && (
                  <span className="flex items-center gap-1">
                    <HiOutlineMusicNote className="w-4 h-4" />
                    {topTracks.length} top tracks
                  </span>
                )}
              </div>

              {/* Genres */}
              {genres.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {genres.slice(0, 4).map((genre, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-white/10 rounded-full text-sm capitalize"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mt-6">
              <button
                onClick={handlePlayAll}
                disabled={
                  !topTracks || topTracks.length === 0 || isLoading("play-all")
                }
                className="flex items-center gap-2 px-4 py-2 bg-[#14b8a6] text-white rounded-full text-sm font-medium hover:bg-[#0d9488] transition-all transform hover:scale-105 disabled:opacity-80 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isLoading("play-all") ? (
                  <LoadingState variant="button" text="Loading..." />
                ) : (
                  <>
                    <BsFillPlayFill className="w-4 h-4" />
                    Play Top Tracks
                  </>
                )}
              </button>

              <button
                onClick={() =>
                  window.open(
                    `https://open.spotify.com/artist/${artistId}`,
                    "_blank"
                  )
                }
                className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-full text-sm font-medium hover:bg-white/20 transition-all border border-white/20"
              >
                <BsSpotify className="w-4 h-4" />
                Open in Spotify
                <HiExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Albums Section */}
      {uniqueAlbums && uniqueAlbums.length > 0 && (
        <div className="px-4 md:px-6 lg:px-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <BsDisc className="text-[#14b8a6]" />
            Albums
          </h2>

          {isFetchingAlbums ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-2 border-[#14b8a6] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {uniqueAlbums.slice(0, 12).map((album) => (
                <AlbumCard key={album.id} album={album} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Similar Artists Section */}
      <div className="px-4 md:px-6 lg:px-8 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <HiOutlineUserGroup className="text-[#14b8a6]" />
          Similar Artists
        </h2>

        {isFetchingRelated ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-[#14b8a6] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : relatedError ? (
          <p className="text-gray-400">
            Error loading similar artists. Please try again later.
          </p>
        ) : relatedArtists && relatedArtists.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {relatedArtists.slice(0, 12).map((artist) => (
              <ArtistCard key={artist.id} track={{ artists: [artist] }} />
            ))}
          </div>
        ) : (
          <p className="text-gray-400">No similar artists found.</p>
        )}
      </div>

      {/* Top Tracks Section */}
      <div className="px-4 md:px-6 lg:px-8 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <HiOutlineFire className="text-[#14b8a6]" />
          Top Tracks
        </h2>

        {topTracks && topTracks.length > 0 ? (
          <div className="space-y-2">
            {topTracks.slice(0, 5).map((track, i) => {
              const isCurrentSong = isSameTrack(track, currentTrack);
              const trackId = getTrackId(track);
              const isTrackLoading = isLoading(`track-${trackId}`);

              return (
                <div
                  key={track.key || track.id || i}
                  className={`flex items-center gap-4 p-3 rounded-lg hover:bg-white/10 transition-colors cursor-pointer group ${
                    isCurrentSong ? "bg-white/10" : ""
                  }`}
                  onClick={() => handlePlayClick(track, i)}
                >
                  {/* Track number */}
                  <span className="text-gray-400 text-sm w-5">{i + 1}</span>

                  {/* Album art */}
                  <img
                    src={
                      track.album?.images?.[0]?.url ||
                      track.images?.coverart ||
                      ""
                    }
                    alt={track.title || track.name}
                    className="w-12 h-12 rounded object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />

                  {/* Track info */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-medium truncate ${
                        isCurrentSong ? "text-[#14b8a6]" : "text-white"
                      }`}
                    >
                      {track.title || track.name}
                    </p>
                    <p className="text-gray-400 text-sm truncate">
                      {track.album?.name || "Single"}
                    </p>
                  </div>

                  {/* Duration */}
                  <span className="text-gray-400 text-sm hidden md:block">
                    {formatTrackDuration(track.duration_ms)}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <div onClick={(e) => e.stopPropagation()}>
                      <SongMenu song={track} />
                    </div>
                    <PlayPause
                      song={track}
                      handlePause={handlePauseClick}
                      handlePlay={() => handlePlayClick(track, i)}
                      size={30}
                      isLoading={isTrackLoading}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-400">No top tracks found.</p>
        )}
      </div>
    </div>
  );
};

export default ArtistDetails;
