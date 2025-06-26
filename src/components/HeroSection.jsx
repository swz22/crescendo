import { useNavigate } from "react-router-dom";
import { BsFillPlayFill } from "react-icons/bs";
import { HiPlus } from "react-icons/hi";

const HeroSection = ({ album, onPlayAlbum, onAddToQueue }) => {
  const navigate = useNavigate();

  if (!album) return null;

  const albumImage = album.images?.[0]?.url || "";
  const artistNames =
    album.artists?.map((artist) => artist.name).join(", ") || "Unknown Artist";
  const releaseYear = album.release_date
    ? new Date(album.release_date).getFullYear()
    : "";

  return (
    <div className="relative w-full mb-8">
      {/* Background matching album cards */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl">
        {/* Subtle album art accent */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl">
          <img
            src={albumImage}
            alt=""
            className="w-full h-full object-cover scale-110 blur-3xl opacity-10"
          />
        </div>

        {/* Content */}
        <div className="relative flex flex-col md:flex-row items-center p-6 md:p-8 gap-6 md:gap-8">
          {/* Album Art */}
          <div
            onClick={() => navigate(`/albums/${album.id}`)}
            className="relative w-48 md:w-64 lg:w-72 aspect-square flex-shrink-0 cursor-pointer group/album"
          >
            <img
              src={albumImage}
              alt={album.name}
              className="w-full h-full object-cover rounded-xl shadow-2xl transition-all duration-500 group-hover/album:scale-105"
            />
            {/* Featured Badge */}
            <div className="absolute top-3 left-3 px-3 py-1 bg-[#14b8a6]/90 backdrop-blur-sm rounded-full">
              <p className="text-xs font-semibold text-white">FEATURED</p>
            </div>
          </div>

          {/* Album Info */}
          <div className="flex-1 text-center md:text-left">
            <h2
              onClick={() => navigate(`/albums/${album.id}`)}
              className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 hover:text-[#14b8a6] transition-colors cursor-pointer line-clamp-2"
            >
              {album.name}
            </h2>

            <div className="flex items-center justify-center md:justify-start gap-2 text-lg md:text-xl text-white/80 mb-4">
              {album.artists?.map((artist, index) => (
                <span key={artist.id}>
                  <span
                    onClick={() => navigate(`/artists/${artist.id}`)}
                    className="hover:text-[#14b8a6] transition-colors cursor-pointer"
                  >
                    {artist.name}
                  </span>
                  {index < album.artists.length - 1 && " • "}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-white/60 mb-6">
              <span>
                {album.album_type === "album"
                  ? "Album"
                  : album.album_type?.toUpperCase()}
              </span>
              <span>•</span>
              <span>{releaseYear}</span>
              <span>•</span>
              <span>{album.total_tracks} tracks</span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center md:justify-start gap-5">
              <button
                onClick={onPlayAlbum}
                className="flex items-center gap-2 px-6 py-3 bg-[#14b8a6] hover:bg-[#10a094] text-white rounded-full font-semibold transition-all hover:scale-105 shadow-lg"
              >
                <BsFillPlayFill className="w-6 h-6" />
                Play Album
              </button>
              <button
                onClick={onAddToQueue}
                className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-full font-semibold transition-all border border-white/20"
              >
                <HiPlus className="w-5 h-5" />
                Queue
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
