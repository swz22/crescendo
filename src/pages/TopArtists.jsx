import { useState, useEffect } from "react";
import { useGetTopArtistsQuery } from "../redux/services/spotifyCore";
import {
  Error,
  Loader,
  ArtistCard,
  AppHeader,
  ResponsiveGrid,
  Portal,
} from "../components";
import { IoChevronDown, IoGlobe } from "react-icons/io5";

const TopArtists = () => {
  const [selectedRegion, setSelectedRegion] = useState({
    code: "US",
    name: "United States",
  });
  const [showRegionDropdown, setShowRegionDropdown] = useState(false);
  const { data, isFetching, error } = useGetTopArtistsQuery(
    selectedRegion.code
  );
  const [artistsWithImages, setArtistsWithImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(false);

  const regions = [
    { code: "US", name: "United States" },
    { code: "GB", name: "United Kingdom" },
    { code: "CA", name: "Canada" },
    { code: "AU", name: "Australia" },
    { code: "DE", name: "Germany" },
    { code: "FR", name: "France" },
    { code: "ES", name: "Spain" },
    { code: "IT", name: "Italy" },
    { code: "BR", name: "Brazil" },
    { code: "MX", name: "Mexico" },
    { code: "JP", name: "Japan" },
    { code: "KR", name: "South Korea" },
    { code: "IN", name: "India" },
    { code: "SE", name: "Sweden" },
    { code: "NL", name: "Netherlands" },
    { code: "PL", name: "Poland" },
    { code: "AR", name: "Argentina" },
    { code: "CO", name: "Colombia" },
    { code: "CL", name: "Chile" },
    { code: "ZA", name: "South Africa" },
  ];

  useEffect(() => {
    const loadArtistImages = async () => {
      if (!data || data.length === 0) return;

      setLoadingImages(true);
      const artistsWithLoadedImages = await Promise.all(
        data.map(async (artist) => {
          if (artist.coverart) {
            const img = new Image();
            img.src = artist.coverart;
            await new Promise((resolve) => {
              img.onload = resolve;
              img.onerror = resolve;
            });
          }
          return artist;
        })
      );
      setArtistsWithImages(artistsWithLoadedImages);
      setLoadingImages(false);
    };

    loadArtistImages();
  }, [data]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".region-dropdown-container")) {
        setShowRegionDropdown(false);
      }
    };

    if (showRegionDropdown) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showRegionDropdown]);

  const regionSelector = (
    <div className="relative region-dropdown-container">
      <button
        onClick={() => setShowRegionDropdown(!showRegionDropdown)}
        className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all duration-300 border border-white/20"
      >
        <IoGlobe className="w-4 h-4" />
        <span className="font-medium">{selectedRegion.name}</span>
        <IoChevronDown
          className={`w-4 h-4 transition-transform duration-300 ${
            showRegionDropdown ? "rotate-180" : ""
          }`}
        />
      </button>

      {showRegionDropdown && (
        <Portal>
          <div className="fixed inset-0 z-40" style={{ pointerEvents: "none" }}>
            <div
              className="absolute"
              style={{
                top:
                  document
                    .querySelector(".region-dropdown-container")
                    ?.getBoundingClientRect().bottom +
                  8 +
                  "px",
                right:
                  window.innerWidth -
                  document
                    .querySelector(".region-dropdown-container")
                    ?.getBoundingClientRect().right +
                  "px",
                pointerEvents: "auto",
              }}
            >
              <div className="bg-[#1a1848]/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 overflow-hidden min-w-[240px]">
                <div className="max-h-[400px] overflow-y-auto custom-scrollbar p-2">
                  {regions.map((region) => (
                    <button
                      key={region.code}
                      onClick={() => {
                        setSelectedRegion(region);
                        setShowRegionDropdown(false);
                      }}
                      className={`
                        w-full text-left px-4 py-3 rounded-lg
                        transition-all duration-200 flex items-center gap-3
                        ${
                          selectedRegion.code === region.code
                            ? "bg-[#14b8a6]/20 text-white font-semibold border-l-4 border-[#14b8a6]"
                            : "hover:bg-white/10 text-gray-300 hover:text-white border-l-4 border-transparent"
                        }
                      `}
                    >
                      <span className="text-gray-400 text-sm font-medium min-w-[35px]">
                        {region.code}
                      </span>
                      <span className="flex-1">{region.name}</span>
                      {selectedRegion.code === region.code && (
                        <div className="w-2 h-2 bg-[#14b8a6] rounded-full animate-pulse" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );

  if (isFetching || loadingImages)
    return <Loader title={`Loading ${selectedRegion.name} artists...`} />;
  if (error) return <Error />;

  return (
    <div className="flex flex-col">
      <AppHeader
        title="Top Artists"
        subtitle={`Most popular artists in ${selectedRegion.name}`}
        action={regionSelector}
      />

      <ResponsiveGrid type="artists">
        {artistsWithImages.map((artist) => (
          <ArtistCard key={artist.adamid} track={{ artists: [artist] }} />
        ))}
      </ResponsiveGrid>
    </div>
  );
};

export default TopArtists;
