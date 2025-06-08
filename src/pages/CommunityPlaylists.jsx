import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Error, Loader } from "../components";
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
  const [featuredPlaylist, setFeaturedPlaylist] = useState(null);

  // Auto-load "Owner of a Lonely Heart Radio" as featured playlist
  useEffect(() => {
    if (data?.playlists?.length > 0 && !currentPlaylist && !featuredPlaylist) {
      // Debug: log all playlist names to see exact spelling
      console.log(
        "Available playlists:",
        data.playlists.map((p) => p.name)
      );

      const lonelyHeartPlaylist = data.playlists.find(
        (p) =>
          p.name.toLowerCase().includes("owner of a lonely heart") ||
          p.name.toLowerCase().includes("lonely heart")
      );

      const featured = lonelyHeartPlaylist || data.playlists[0];
      console.log("Featured playlist selected:", featured?.name);

      setFeaturedPlaylist(featured);
      dispatch(setCurrentPlaylist(featured));
    }
  }, [data, currentPlaylist, featuredPlaylist, dispatch]);

  if (isFetching) return <Loader title="Loading community playlists..." />;
  if (error) return <Error />;

  const handlePlaylistClick = (playlist, mosaicImages) => {
    setSelectedPlaylist(playlist);
    setSelectedMosaicImages(mosaicImages);
  };

  return (
    <div className="flex flex-col">
      <div className="mb-6">
        <h2 className="font-bold text-3xl text-white text-left mt-4 mb-2">
          Community Playlists
        </h2>
        <p className="text-gray-400 text-lg">
          Discover music curated by the community
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {data?.playlists && data.playlists.length > 0 ? (
          [...data.playlists]
            .sort((a, b) => {
              // Put featured playlist first
              if (a.id === featuredPlaylist?.id) return -1;
              if (b.id === featuredPlaylist?.id) return 1;
              return 0;
            })
            .map((playlist, i) => (
              <PlaylistCard
                key={playlist.id || i}
                playlist={playlist}
                onClickWithMosaic={handlePlaylistClick}
                isFeatured={playlist.id === featuredPlaylist?.id}
              />
            ))
        ) : (
          <p className="text-gray-400 col-span-full text-center">
            No playlists available
          </p>
        )}
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
