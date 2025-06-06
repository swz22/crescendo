import { Link } from "react-router-dom";

const AlbumCard = ({ album }) => {
  const albumImage = album.images?.[0]?.url || 'https://via.placeholder.com/400x400.png?text=No+Image';
  const artistNames = album.artists?.map(artist => artist.name).join(', ') || 'Unknown Artist';
  const releaseDate = album.release_date ? new Date(album.release_date).getFullYear() : '';

  return (
    <div className="flex flex-col w-[250px] p-4 bg-white/5 bg-opacity-80 backdrop-blur-sm animate-slideup rounded-lg cursor-pointer">
      <div className="relative w-full h-56 group">
        <img
          alt="album_cover"
          src={albumImage}
          className="w-full h-full rounded-lg object-cover"
        />
        <div className="absolute bottom-2 right-2 bg-black/70 rounded-full px-2 py-1">
          <p className="text-xs text-white">{album.total_tracks} tracks</p>
        </div>
      </div>
      <div className="mt-4 flex flex-col">
        <p className="font-semibold text-lg text-white truncate">
          <Link to={`/albums/${album.id}`}>
            {album.name}
          </Link>
        </p>
        <p className="text-sm truncate text-gray-300 mt-1">
          {artistNames}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {album.album_type} • {releaseDate}
        </p>
      </div>
    </div>
  );
};

export default AlbumCard;