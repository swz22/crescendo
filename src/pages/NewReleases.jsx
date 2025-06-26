import { Error, Loader, AppHeader, ResponsiveGrid } from "../components";
import AlbumCard from "../components/AlbumCard";
import HeroSection from "../components/HeroSection";
import { useGetNewReleasesQuery } from "../redux/services/spotifyCore";
import { useToast } from "../context/ToastContext";

const NewReleases = () => {
  const { data, isFetching, error } = useGetNewReleasesQuery();
  const { showToast } = useToast();

  if (isFetching) return <Loader title="Loading new releases..." />;
  if (error) return <Error />;

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

  const handlePlayAlbum = async () => {
    if (!heroAlbum) return;
    showToast("Playing album...");
  };

  const handleAddToQueue = () => {
    if (!heroAlbum) return;
    showToast(`Added ${heroAlbum.name} to queue`);
  };

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
