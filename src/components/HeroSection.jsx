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
    <>
      {/* Mobile Layout */}
      <div className="md:hidden mb-4 px-3 xs:px-4">
        <div
          className="relative overflow-hidden bg-gradient-to-br from-white/[0.03] to-white/[0.06] 
          rounded-2xl p-3 xs:p-4 border border-white/10 backdrop-blur-xl"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#14b8a6]/10 to-purple-600/10 opacity-50" />
          <div className="relative">
            {/* Top Section */}
            <div className="flex gap-3">
              {/* Album Art */}
              <div
                onClick={() => navigate(`/albums/${album.id}`)}
                className="relative flex-shrink-0 cursor-pointer group"
              >
                <div className="relative w-[100px] xs:w-[120px] h-[100px] xs:h-[120px]">
                  <img
                    src={albumImage}
                    alt={album.name}
                    className="w-full h-full object-cover rounded-xl shadow-2xl 
                      transition-transform duration-300 group-hover:scale-105"
                  />
                  <div
                    className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#14b8a6]/30 
                    to-purple-600/30 blur-2xl -z-10 scale-110 opacity-0 group-hover:opacity-100 
                    transition-opacity duration-300"
                  />
                </div>
                {/* Featured Badge */}
                <div
                  className="absolute -top-1 -right-1 px-2 py-0.5 bg-gradient-to-r 
                  from-[#14b8a6] to-[#0d9488] rounded-full shadow-lg"
                >
                  <p className="text-[10px] font-bold text-white uppercase tracking-wider">
                    Featured
                  </p>
                </div>
              </div>

              {/* Album Info */}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <h2
                  onClick={() => navigate(`/albums/${album.id}`)}
                  className="text-base xs:text-lg font-bold text-white leading-tight mb-1 
                    line-clamp-2 cursor-pointer hover:text-[#14b8a6] transition-colors"
                >
                  {album.name}
                </h2>
                <p
                  onClick={() => navigate(`/artists/${album.artists?.[0]?.id}`)}
                  className="text-xs xs:text-sm text-white/80 mb-1.5 truncate 
                    cursor-pointer hover:text-[#14b8a6] transition-colors"
                >
                  {artistNames}
                </p>
                <div className="flex items-center gap-2 text-[10px] xs:text-xs text-white/60">
                  <span className="uppercase">
                    {album.album_type || "Album"}
                  </span>
                  <span>•</span>
                  <span>{releaseYear}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col xs:flex-row gap-2 mt-3">
              <button
                onClick={onPlayAlbum}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 
                  bg-gradient-to-r from-[#14b8a6] to-[#0d9488] text-white rounded-xl 
                  text-sm font-semibold shadow-lg active:scale-95 transition-all duration-200
                  hover:shadow-[#14b8a6]/30 hover:shadow-xl"
              >
                <BsFillPlayFill className="w-5 h-5" />
                Play Album
              </button>
              <button
                onClick={onAddToQueue}
                className="flex-1 xs:flex-initial flex items-center justify-center gap-2 
                  px-4 py-2.5 bg-white/10 backdrop-blur-sm text-white rounded-xl 
                  text-sm font-semibold transition-all duration-200 border border-white/20 
                  active:scale-95 hover:bg-white/20"
              >
                <HiPlus className="w-4 h-4" />
                <span className="xs:inline">Add to Queue</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tablet Layout - Fixed for 768px to 925px */}
      <div className="hidden md:block tablet:hidden mb-8 px-4 sm:px-0">
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl">
          <div className="relative flex items-center p-6 gap-6">
            {/* Album Art - Smaller for tablet */}
            <div
              onClick={() => navigate(`/albums/${album.id}`)}
              className="relative w-40 h-40 flex-shrink-0 cursor-pointer group/album"
            >
              <img
                src={albumImage}
                alt={album.name}
                className="w-full h-full object-cover rounded-xl shadow-2xl transition-all duration-500 group-hover/album:scale-105"
              />
              {/* Featured Badge */}
              <div className="absolute top-2 left-2 px-2.5 py-1 bg-[#14b8a6]/90 backdrop-blur-sm rounded-full">
                <p className="text-xs font-semibold text-white">FEATURED</p>
              </div>
            </div>

            {/* Album Info */}
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-white mb-2">
                {album.name}
              </h2>
              <p
                onClick={() => navigate(`/artists/${album.artists?.[0]?.id}`)}
                className="text-lg text-white/80 mb-3 hover:text-[#14b8a6] cursor-pointer transition-colors"
              >
                {artistNames}
              </p>
              <div className="flex items-center gap-3 text-sm text-white/60 mb-5">
                <span>
                  {album.album_type === "single"
                    ? "Single"
                    : album.album_type === "compilation"
                    ? "Compilation"
                    : "Album"}
                </span>
                <span>•</span>
                <span>{releaseYear}</span>
                <span>•</span>
                <span>{album.total_tracks} tracks</span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-4">
                <button
                  onClick={onPlayAlbum}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#14b8a6] hover:bg-[#10a094] text-white rounded-full font-semibold transition-all hover:scale-105 shadow-lg"
                >
                  <BsFillPlayFill className="w-5 h-5" />
                  Play Album
                </button>
                <button
                  onClick={onAddToQueue}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-full font-semibold transition-all border border-white/20"
                >
                  <HiPlus className="w-4 h-4" />
                  Queue
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout (925px+) */}
      <div className="hidden tablet:block mb-10">
        <div className="relative bg-gradient-to-r from-white/5 to-white/[0.02] backdrop-blur-sm rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#14b8a6]/10 to-purple-600/10 opacity-50"></div>
          <div className="relative flex items-end p-8 gap-8">
            {/* Album Art */}
            <div
              onClick={() => navigate(`/albums/${album.id}`)}
              className="relative w-60 h-60 flex-shrink-0 cursor-pointer group/album"
            >
              <img
                src={albumImage}
                alt={album.name}
                className="w-full h-full object-cover rounded-2xl shadow-2xl transition-all duration-500 group-hover/album:scale-105"
              />
              {/* Featured Badge */}
              <div className="absolute top-3 left-3 px-4 py-2 bg-[#14b8a6]/90 backdrop-blur-sm rounded-full">
                <p className="text-sm font-semibold text-white">FEATURED</p>
              </div>
              {/* Gradient glow */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#14b8a6]/20 to-purple-600/20 -z-10 scale-110 blur-3xl"></div>
            </div>

            {/* Album Info */}
            <div className="flex-1 flex flex-col justify-end">
              <p className="text-sm text-white/60 uppercase tracking-widest mb-2">
                {album.album_type === "single"
                  ? "Single"
                  : album.album_type === "compilation"
                  ? "Compilation"
                  : "Album"}
              </p>
              <h1 className="text-5xl font-bold text-white mb-3 leading-tight">
                {album.name}
              </h1>
              <p
                onClick={() => navigate(`/artists/${album.artists?.[0]?.id}`)}
                className="text-xl text-white/80 mb-4 hover:text-[#14b8a6] cursor-pointer transition-colors inline-flex"
              >
                {artistNames}
              </p>
              <div className="flex items-center gap-4 text-sm text-white/60 mb-8">
                <span>{releaseYear}</span>
                <span>•</span>
                <span>{album.total_tracks} tracks</span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center md:justify-start gap-5">
                <button
                  onClick={onPlayAlbum}
                  className="flex items-center gap-2 px-6 py-3 bg-[#14b8a6] hover:bg-[#10a094] text-white rounded-full font-semibold transition-all hover:scale-105 shadow-lg whitespace-nowrap"
                >
                  <BsFillPlayFill className="w-6 h-6" />
                  Play Album
                </button>
                <button
                  onClick={onAddToQueue}
                  className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-full font-semibold transition-all border border-white/20 whitespace-nowrap"
                >
                  <HiPlus className="w-5 h-5" />
                  Queue
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HeroSection;
