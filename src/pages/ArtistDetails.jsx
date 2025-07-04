import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Error, Loader, PlayPause, SongMenu } from "../components";
import AlbumCard from "../components/AlbumCard";
import ArtistCard from "../components/ArtistCard";
import {
  useGetArtistDetailsQuery,
  useGetArtistTopTracksQuery,
  useGetArtistAlbumsQuery,
  useGetSongsBySearchQuery,
} from "../redux/services/spotifyCore";
import {
  playPause,
  replaceContext,
  switchContext,
} from "../redux/features/playerSlice";
import { usePreviewUrl } from "../hooks/usePreviewUrl";
import { useToast } from "../context/ToastContext";
import { formatTrackDuration, isSameTrack } from "../utils/trackUtils";
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

  const {
    data: artistData,
    isFetching: isFetchingArtistDetails,
    error,
  } = useGetArtistDetailsQuery({ artistid: artistId });

  const { data: topTracks, isFetching: isFetchingTopTracks } =
    useGetArtistTopTracksQuery({ artistid: artistId });

  const { data: albumsData, isFetching: isFetchingAlbums } =
    useGetArtistAlbumsQuery({ artistId }, { skip: !artistId });

  // Get the primary genre for the artist
  const primaryGenre = artistData?.genres?.[0];

  // Search for artists in the same genre
  const { data: genreSearchResults, isFetching: isFetchingRelated } =
    useGetSongsBySearchQuery(primaryGenre ? `genre:"${primaryGenre}"` : "", {
      skip: !primaryGenre,
    });

  // Extract unique artists from the search results
  const relatedArtists =
    genreSearchResults?.artists
      ?.filter((artist) => artist.id !== artistId)
      .slice(0, 6) || [];

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
    }
  };

  const handlePlayAll = async () => {
    if (!topTracks || topTracks.length === 0) {
      showToast("No tracks available", "error");
      return;
    }

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
    } catch (error) {
      console.error("Error playing all tracks:", error);
      showToast("Failed to play tracks", "error");
    }
  };

  const formatNumber = (num) => {
    if (!num) return "0";
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const artistImage =
    artistData?.images?.background || artistData?.images?.coverart || "";

  return (
    <div className="flex flex-col">
      {/* Header Section */}
      <div className="relative">
        <div className="absolute inset-0 h-96 bg-gradient-to-b from-[#14b8a6]/20 to-transparent" />

        {/* Header Content */}
        <div className="relative px-4 md:px-6 lg:px-8 pt-8 pb-6">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
            {/* Artist Image */}
            <div className="relative group">
              <img
                src={artistImage}
                alt={artistData?.name}
                className="w-48 h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 rounded-full object-cover shadow-2xl"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src =
                    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNGE1NTY4Ii8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZmlsbD0iI2EwYWVjMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4=";
                }}
              />
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#14b8a6]/40 to-purple-600/40 blur-3xl scale-110 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>

            {/* Artist Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <p className="text-sm font-medium text-[#14b8a6] uppercase tracking-wider">
                  Artist
                </p>
                {artistData?.popularity >= 70 && (
                  <HiCheckCircle
                    className="w-5 h-5 text-[#14b8a6]"
                    title="Verified Artist"
                  />
                )}
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
                {artistData?.name || "Unknown Artist"}
              </h1>

              {/* Stats Bar */}
              <div className="flex flex-wrap items-center gap-6 text-white/80">
                <div className="flex items-center gap-2">
                  <HiOutlineUserGroup className="w-5 h-5 text-[#14b8a6]" />
                  <span className="text-lg font-semibold">
                    {formatNumber(artistData?.followers || 0)}
                  </span>
                  <span className="text-sm">followers</span>
                </div>

                <div className="flex items-center gap-2">
                  <HiOutlineFire className="w-5 h-5 text-orange-500" />
                  <span className="text-lg font-semibold">
                    {artistData?.popularity || 0}
                  </span>
                  <span className="text-sm">popularity</span>
                </div>

                {artistData?.genres?.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <HiOutlineMusicNote className="w-5 h-5 text-purple-500" />
                    {artistData.genres.slice(0, 3).map((genre, i) => (
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
                  disabled={!topTracks || topTracks.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-[#14b8a6] text-white rounded-full text-sm font-medium hover:bg-[#0d9488] transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <BsFillPlayFill className="w-4 h-4" />
                  Play Top Tracks
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
      </div>

      {/* Albums Section */}
      {uniqueAlbums && uniqueAlbums.length > 0 && (
        <div className="px-4 md:px-6 lg:px-8 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <BsDisc className="text-[#14b8a6]" />
              Albums
            </h2>
            <span className="text-gray-400 text-sm">
              {uniqueAlbums.length} albums
            </span>
          </div>

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

      {/* Similar Artists Section - Using Genre Search */}
      {relatedArtists && relatedArtists.length > 0 && (
        <div className="px-4 md:px-6 lg:px-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <HiOutlineUserGroup className="text-[#14b8a6]" />
            {primaryGenre ? `More ${primaryGenre} Artists` : "Similar Artists"}
          </h2>

          {isFetchingRelated ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-2 border-[#14b8a6] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {relatedArtists.map((artist) => (
                <ArtistCard key={artist.id} track={{ artists: [artist] }} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Top Songs Section */}
      <div className="px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Top Songs</h2>
          {topTracks && topTracks.length > 0 && (
            <span className="text-gray-400 text-sm">
              {topTracks.length} tracks
            </span>
          )}
        </div>

        {topTracks && topTracks.length > 0 ? (
          <div className="space-y-2">
            {topTracks.map((track, i) => {
              const isCurrentSong = isSameTrack(track, currentTrack);

              return (
                <div
                  key={`${track.id}-${i}`}
                  className={`group flex items-center gap-4 p-4 rounded-lg hover:bg-white/10 transition-all ${
                    isCurrentSong ? "bg-white/10" : ""
                  }`}
                >
                  {/* Track number */}
                  <span className="text-gray-400 w-6 text-center">{i + 1}</span>

                  {/* Track image */}
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
