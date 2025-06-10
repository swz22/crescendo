import { useState, useEffect } from "react";
import { ArtistCard, Error, Loader } from "../components";
import { useGetTopChartsQuery } from "../redux/services/spotifyCore";
import { IoChevronDown, IoGlobe } from "react-icons/io5";
import { PageHeader } from "../components";

// Region configuration with Spotify market codes
const regions = [
  { name: "United States", code: "US", flag: "🇺🇸" },
  { name: "United Kingdom", code: "GB", flag: "🇬🇧" },
  { name: "Canada", code: "CA", flag: "🇨🇦" },
  { name: "Germany", code: "DE", flag: "🇩🇪" },
  { name: "France", code: "FR", flag: "🇫🇷" },
  { name: "Spain", code: "ES", flag: "🇪🇸" },
  { name: "Italy", code: "IT", flag: "🇮🇹" },
  { name: "Brazil", code: "BR", flag: "🇧🇷" },
  { name: "Mexico", code: "MX", flag: "🇲🇽" },
  { name: "Japan", code: "JP", flag: "🇯🇵" },
  { name: "South Korea", code: "KR", flag: "🇰🇷" },
  { name: "Australia", code: "AU", flag: "🇦🇺" },
  { name: "India", code: "IN", flag: "🇮🇳" },
  { name: "Netherlands", code: "NL", flag: "🇳🇱" },
  { name: "Sweden", code: "SE", flag: "🇸🇪" },
];

const TopArtists = () => {
  const [selectedRegion, setSelectedRegion] = useState(regions[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [artistsWithImages, setArtistsWithImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(true);

  // Pass the selected region code to the query
  const { data, isFetching, error } = useGetTopChartsQuery(selectedRegion.code);

  useEffect(() => {
    if (!data || data.length === 0) {
      setLoadingImages(false);
      return;
    }

    const fetchArtistImages = async () => {
      setLoadingImages(true);

      // Extract unique artists from tracks
      const artistsMap = new Map();

      data.forEach((track) => {
        if (track?.artists?.[0]) {
          const artist = track.artists[0];
          const artistId = artist.id;
          if (artistId && !artistsMap.has(artistId)) {
            artistsMap.set(artistId, {
              ...artist,
              adamid: artist.id,
            });
          }
        }
      });

      const uniqueArtists = Array.from(artistsMap.values());

      // Fetch full artist data with images
      const artistPromises = uniqueArtists.slice(0, 20).map(async (artist) => {
        try {
          const response = await fetch(
            `${import.meta.env.VITE_API_URL}/api/spotify/artists/${
              artist.adamid
            }`
          );
          const fullArtist = await response.json();
          return {
            ...artist,
            coverart: fullArtist.images?.[0]?.url || "",
            images: fullArtist.images,
          };
        } catch (err) {
          console.error(`Failed to fetch artist ${artist.name}:`, err);
          return artist;
        }
      });

      const artistsWithFullData = await Promise.all(artistPromises);
      setArtistsWithImages(artistsWithFullData);
      setLoadingImages(false);
    };

    fetchArtistImages();
  }, [data, selectedRegion]);

  const handleRegionSelect = (region) => {
    setSelectedRegion(region);
    setIsDropdownOpen(false);
  };

  if (isFetching || loadingImages)
    return <Loader title={`Loading ${selectedRegion.name} artists...`} />;
  if (error) return <Error />;

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mt-4 mb-10">
        <h2 className="font-bold text-3xl text-white text-left">Top Artists</h2>

        {/* Region Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 px-4 py-2.5 bg-white/10 hover:bg-white/15 rounded-lg transition-all duration-200 border border-white/10 hover:border-white/20 group"
          >
            <IoGlobe className="text-[#14b8a6] text-lg" />
            <span className="text-white font-medium">
              {selectedRegion.flag} {selectedRegion.name}
            </span>
            <IoChevronDown
              className={`text-gray-400 transition-transform duration-200 ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsDropdownOpen(false)}
              />

              {/* Dropdown Content */}
              <div className="absolute right-0 mt-2 w-64 bg-[#1e1b4b]/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 overflow-hidden z-20 animate-slidedown">
                <div className="py-2 max-h-96 overflow-y-auto custom-scrollbar">
                  {regions.map((region) => (
                    <button
                      key={region.code}
                      onClick={() => handleRegionSelect(region)}
                      className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-white/10 transition-all duration-200 ${
                        selectedRegion.code === region.code
                          ? "bg-[#14b8a6]/20 border-l-4 border-[#14b8a6]"
                          : ""
                      }`}
                    >
                      <span className="text-2xl">{region.flag}</span>
                      <span
                        className={`flex-1 text-left ${
                          selectedRegion.code === region.code
                            ? "text-[#14b8a6] font-semibold"
                            : "text-white"
                        }`}
                      >
                        {region.name}
                      </span>
                      {selectedRegion.code === region.code && (
                        <div className="w-2 h-2 bg-[#14b8a6] rounded-full animate-pulse" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 3xl:grid-cols-7 gap-4 sm:gap-6 lg:gap-8">
        {artistsWithImages.map((artist) => (
          <ArtistCard key={artist.adamid} track={{ artists: [artist] }} />
        ))}
      </div>
    </div>
  );
};

export default TopArtists;
