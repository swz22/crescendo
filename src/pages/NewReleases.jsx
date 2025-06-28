import { Error, Loader, AppHeader, ResponsiveGrid } from "../components";
import AlbumCard from "../components/AlbumCard";
import HeroSection from "../components/HeroSection";
import {
  useGetNewReleasesQuery,
  useGetAlbumTracksQuery,
} from "../redux/services/spotifyCore";
import { useDispatch } from "react-redux";
import {
  replaceContext,
  addToQueue,
  switchContext,
} from "../redux/features/playerSlice";
import { usePreviewUrl } from "../hooks/usePreviewUrl";
import { useToast } from "../context/ToastContext";

const NewReleases = () => {
  const { data, isFetching, error } = useGetNewReleasesQuery();
  const dispatch = useDispatch();
  const { getPreviewUrl } = usePreviewUrl();
  const { showToast } = useToast();

  // Include all album types and limit to 50
  const allReleases = data?.slice(0, 50) || [];

  // Find Sabrina Carpenter's "Short n' Sweet" album specifically
  const heroAlbum =
    allReleases.find(
      (album) =>
        album.artists?.some((artist) =>
          artist.name?.toLowerCase().includes("sabrina carpenter")
        ) &&
        album.name?.toLowerCase().includes("short") &&
        album.album_type === "album" // Only albums, not singles
    ) ||
    allReleases.find((album) => album.album_type === "album") ||
    allReleases[0];

  // Filter out hero album from grid
  const gridReleases = heroAlbum
    ? allReleases.filter((album) => album.id !== heroAlbum.id)
    : allReleases;

  // Fetch tracks for hero album
  const { data: heroTracks } = useGetAlbumTracksQuery(
    { albumId: heroAlbum?.id },
    { skip: !heroAlbum?.id }
  );

  const handlePlayAlbum = async () => {
    if (!heroAlbum || !heroTracks || heroTracks.length === 0) {
      showToast("No tracks available", "error");
      return;
    }

    try {
      // Add album info to tracks
      const tracksWithAlbumArt = heroTracks.map((track) => ({
        ...track,
        images: {
          coverart: heroAlbum.images?.[0]?.url || "",
          background: heroAlbum.images?.[0]?.url || "",
        },
        album: {
          ...track.album,
          id: heroAlbum.id,
          name: heroAlbum.name,
          images: heroAlbum.images || [],
        },
      }));

      // Get preview URL for first track
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
              id: heroAlbum.id,
              name: `${heroAlbum.name} • ${heroAlbum.artists?.[0]?.name}`,
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
    if (!heroAlbum || !heroTracks || heroTracks.length === 0) {
      showToast("No tracks available", "error");
      return;
    }

    // Add album info to tracks and add to queue
    heroTracks.forEach((track) => {
      const trackWithAlbumArt = {
        ...track,
        images: {
          coverart: heroAlbum.images?.[0]?.url || "",
          background: heroAlbum.images?.[0]?.url || "",
        },
        album: {
          ...track.album,
          id: heroAlbum.id,
          name: heroAlbum.name,
          images: heroAlbum.images || [],
        },
      };
      dispatch(addToQueue({ song: trackWithAlbumArt }));
    });

    dispatch(switchContext({ contextType: "queue" }));
    showToast(`Added ${heroTracks.length} tracks to queue`);
  };

  if (isFetching) return <Loader title="Loading new releases..." />;
  if (error) return <Error />;

  return (
    <div className="flex flex-col">
      <AppHeader
        title="New Releases"
        subtitle="Fresh music from around the world"
      />

      {/* Hero Section */}
      {heroAlbum && (
        <HeroSection
          album={heroAlbum}
          onPlayAlbum={handlePlayAlbum}
          onAddToQueue={handleAddToQueue}
        />
      )}

      {/* Album Grid */}
      <ResponsiveGrid type="albums">
        {gridReleases.map((album, i) => (
          <AlbumCard key={album.id || i} album={album} showTrackCount={true} />
        ))}
      </ResponsiveGrid>
    </div>
  );
};

export default NewReleases;
