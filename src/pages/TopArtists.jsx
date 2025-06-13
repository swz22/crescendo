import { useState, useEffect } from "react";
import { ArtistCard, Error, Loader, PageHeader } from "../components";
import { useGetTopChartsQuery } from "../redux/services/spotifyCore";
import { IoChevronDown, IoGlobe } from "react-icons/io5";

// Region configuration with Spotify market codes (no flag emojis)
const regions = [
  { name: "United States", code: "US" },
  { name: "United Kingdom", code: "GB" },
  { name: "Canada", code: "CA" },
  { name: "Germany", code: "DE" },
  { name: "France", code: "FR" },
  { name: "Spain", code: "ES" },
  { name: "Italy", code: "IT" },
  { name: "Brazil", code: "BR" },
  { name: "Mexico", code: "MX" },
  { name: "Japan", code: "JP" },
  { name: "South Korea", code: "KR" },
  { name: "Australia", code: "AU" },
  { name: "India", code: "IN" },
  { name: "Netherlands", code: "NL" },
  { name: "Sweden", code: "SE" },
];

const TopArtists = () => {
  const [selectedRegion, setSelectedRegion] = useState(regions[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [artistsWithImages, setArtistsWithImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(true);

  const { data, isFetching, error } = useGetTopChartsQuery(selectedRegion.code);

  useEffect(() => {
    if (!data || data.length === 0) {
      setLoadingImages(false);
      return;
    }

    const fetchArtistImages = async () => {
      setLoadingImages(true);

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
      <PageHeader
        title="Top Artists"
        subtitle={`Trending in ${selectedRegion.name}`}
      />
      <div className="flex items-center justify-between mb-6">
        {/* Region Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 px-4 py-2.5 bg-white/10 hover:bg-white/15 rounded-lg transition-all duration-200 border border-white/20 hover:border-white/30 group backdrop-blur-sm"
          >
            <IoGlobe className="text-[#14b8a6] text-lg" />
            <span className="text-white font-medium">
              {selectedRegion.name}
            </span>
            <IoChevronDown
              className={`text-gray-300 transition-transform duration-200 ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsDropdownOpen(false)}
              />

              <div className="absolute right-0 mt-2 w-64 bg-[#1e1b4b]/98 backdrop-blur-xl rounded-xl shadow-2xl border border-white/20 overflow-hidden z-20 animate-slidedown">
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
                      <span className="text-gray-400 text-sm font-medium min-w-[35px]">
                        {region.code}
                      </span>
                      <span
                        className={`flex-1 text-left ${
                          selectedRegion.code === region.code
                            ? "text-white font-semibold"
                            : "text-gray-200"
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
