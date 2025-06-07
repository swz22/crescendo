import { useState } from "react";
import { Error, Loader } from "../components";
import PlaylistCard from "../components/PlaylistCard";
import PlaylistModal from "../components/PlaylistModal";
import { useGetFeaturedPlaylistsQuery } from "../redux/services/spotifyCore";

const CommunityPlaylists = () => {
  const { data, isFetching, error } = useGetFeaturedPlaylistsQuery();
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [selectedMosaicImages, setSelectedMosaicImages] = useState([]);

  if (isFetching) return <Loader title="Loading community playlists..." />;
  if (error) return <Error />;

  const handlePlaylistClick = (playlist, mosaicImages) => {
    setSelectedPlaylist(playlist);
    setSelectedMosaicImages(mosaicImages);
  };

  return (
    <div className="flex flex-col">
      <h2 className="font-bold text-3xl text-white text-left mt-4 mb-4">
        Community Playlists
      </h2>
      {data?.message && (
        <p className="text-gray-400 text-lg mb-6">Discover music curated by the community</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {data?.playlists?.map((playlist, i) => (
          <PlaylistCard 
            key={playlist.id || i} 
            playlist={playlist}
            onClickWithMosaic={handlePlaylistClick}
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