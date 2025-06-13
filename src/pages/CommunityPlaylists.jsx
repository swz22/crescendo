import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Error, Loader, PageHeader } from "../components";
import PlaylistCard from "../components/PlaylistCard";
import PlaylistModal from "../components/PlaylistModal";
import {
  useGetFeaturedPlaylistsQuery,
  useGetPlaylistTracksQuery,
} from "../redux/services/spotifyCore";
import { setCurrentPlaylist } from "../redux/features/playerSlice";

const CommunityPlaylists = () => {
  const dispatch = useDispatch();
  const { currentPlaylist } = useSelector((state) => state.player);
  const { data, isFetching, error } = useGetFeaturedPlaylistsQuery();
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [selectedMosaicImages, setSelectedMosaicImages] = useState([]);

  // Safely compute featured playlist
  const featuredPlaylist = useMemo(() => {
    if (!data?.playlists?.length) return null;

    // Look for "Owner of a Lonely Heart Radio" or similar
    const lonelyHeartPlaylist = data.playlists.find(
      (p) =>
        p?.name?.toLowerCase().includes("owner of a lonely heart") ||
        p?.name?.toLowerCase().includes("lonely heart")
    );

    return lonelyHeartPlaylist || data.playlists[0];
  }, [data]);

  // Auto-load featured playlist as current if none selected
  useEffect(() => {
    if (featuredPlaylist && !currentPlaylist) {
      dispatch(setCurrentPlaylist(featuredPlaylist));
    }
  }, [featuredPlaylist, currentPlaylist, dispatch]);

  if (isFetching) return <Loader title="Loading community playlists..." />;
  if (error) return <Error />;

  // Handle empty or invalid data
  const playlists = data?.playlists || [];
  if (playlists.length === 0) {
    return (
      <div className="flex flex-col">
        <PageHeader
          title="Community Playlists"
          subtitle="Discover music curated by the community"
        />
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-400 text-lg">No playlists available</p>
        </div>
      </div>
    );
  }

  const handlePlaylistClick = (playlist, mosaicImages) => {
    setSelectedPlaylist(playlist);
    setSelectedMosaicImages(mosaicImages || []);
  };

  // Sort playlists with featured first
  const sortedPlaylists = [...playlists].sort((a, b) => {
    if (a?.id === featuredPlaylist?.id) return -1;
    if (b?.id === featuredPlaylist?.id) return 1;
    return 0;
  });

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Community Playlists"
        subtitle="Discover music curated by the community"
      />
      <div className="flex flex-col sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 px-4 sm:px-0">
        {sortedPlaylists.map((playlist, i) => (
          <PlaylistCard
            key={playlist?.id || `playlist-${i}`}
            playlist={playlist}
            onClickWithMosaic={handlePlaylistClick}
            isFeatured={playlist?.id === featuredPlaylist?.id}
          />
        ))}
      </div>

      {selectedPlaylist && (
        <PlaylistModal
          playlist={selectedPlaylist}
          initialMosaicImages={selectedMosaicImages}
          onClose={() => {
            setSelectedPlaylist(null);
            setSelectedMosaicImages([]);
          }}
        />
      )}
    </div>
  );
};

export default CommunityPlaylists;
