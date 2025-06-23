import { useState, useRef } from "react";
import {
  Error,
  Loader,
  ArtistCard,
  AppHeader,
  ResponsiveGrid,
} from "../components";
import DropdownPortal from "../components/DropdownPortal";
import { useGetTopArtistsQuery } from "../redux/services/spotifyCore";
import { IoChevronDown } from "react-icons/io5";
import { HiOutlineGlobeAlt } from "react-icons/hi";

const countries = [
  { code: "US", name: "United States" },
  { code: "AU", name: "Australia" },
  { code: "BR", name: "Brazil" },
  { code: "CA", name: "Canada" },
  { code: "DE", name: "Germany" },
  { code: "ES", name: "Spain" },
  { code: "FR", name: "France" },
  { code: "GB", name: "United Kingdom" },
  { code: "IN", name: "India" },
  { code: "IT", name: "Italy" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "MX", name: "Mexico" },
  { code: "NL", name: "Netherlands" },
  { code: "SE", name: "Sweden" },
  { code: "TW", name: "Taiwan" },
];

const TopArtists = () => {
  const [selectedCountry, setSelectedCountry] = useState("US");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const countryButtonRef = useRef(null);

  const selectedCountryName =
    countries.find((c) => c.code === selectedCountry)?.name || "United States";

  const { data, isFetching, error } = useGetTopArtistsQuery(selectedCountry);

  if (isFetching) return <Loader title="Loading top artists..." />;
  if (error) return <Error />;

  const handleCountryChange = (country) => {
    setSelectedCountry(country.code);
    setShowCountryDropdown(false);
  };

  // Sort countries with US first, then alphabetically
  const sortedCountries = [...countries].sort((a, b) => {
    if (a.code === "US") return -1;
    if (b.code === "US") return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="flex flex-col">
      <AppHeader
        title="Top Artists"
        subtitle={`Most popular artists in ${selectedCountryName}`}
        action={
          <div className="relative" ref={countryButtonRef}>
            <button
              onClick={() => setShowCountryDropdown(!showCountryDropdown)}
              className="flex items-center gap-2 px-4 py-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full transition-all duration-200 border border-white/20 hover:border-white/30 group"
            >
              <HiOutlineGlobeAlt className="text-[#14b8a6] group-hover:text-[#2dd4bf] transition-colors" />
              <span className="text-white font-medium">
                {selectedCountryName}
              </span>
              <IoChevronDown
                className={`text-white/60 transition-all duration-200 ${
                  showCountryDropdown ? "rotate-180" : ""
                }`}
              />
            </button>

            <DropdownPortal
              isOpen={showCountryDropdown}
              onClose={() => setShowCountryDropdown(false)}
              triggerRef={countryButtonRef}
              minWidth={220}
              maxHeight={400}
              placement="bottom-end"
              className="bg-[#1a1848]/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl"
            >
              <div className="py-2">
                {sortedCountries.map((country, index) => {
                  const isSelected = country.code === selectedCountry;
                  const isUS = country.code === "US";

                  return (
                    <div key={country.code}>
                      {isUS && index === 0 && (
                        <div className="px-4 pb-2">
                          <div className="text-xs text-white/40 uppercase tracking-wider font-medium">
                            Popular
                          </div>
                        </div>
                      )}
                      {!isUS && index === 1 && (
                        <>
                          <div className="mx-4 my-2 border-t border-white/10" />
                          <div className="px-4 pb-2 pt-1">
                            <div className="text-xs text-white/40 uppercase tracking-wider font-medium">
                              All Countries
                            </div>
                          </div>
                        </>
                      )}
                      <button
                        onClick={() => handleCountryChange(country)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 transition-all duration-200 group relative overflow-hidden ${
                          isSelected
                            ? "text-[#14b8a6]"
                            : "text-white/80 hover:text-white"
                        }`}
                      >
                        {/* Hover background effect */}
                        <div
                          className={`absolute inset-0 transition-all duration-300 ${
                            isSelected
                              ? "bg-gradient-to-r from-[#14b8a6]/20 to-transparent"
                              : "bg-gradient-to-r from-white/0 to-white/0 hover:from-white/10 hover:to-transparent"
                          }`}
                        />

                        {/* Content */}
                        <div className="relative flex items-center gap-3 w-full">
                          <span className="font-medium text-left flex-1">
                            {country.name}
                          </span>
                          {isSelected && (
                            <div className="w-2 h-2 bg-[#14b8a6] rounded-full animate-pulse" />
                          )}
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </DropdownPortal>
          </div>
        }
      />

      <ResponsiveGrid type="artists">
        {data?.map((artist) => (
          <ArtistCard
            key={artist.adamid || artist.id}
            track={{ artists: [artist] }}
          />
        ))}
      </ResponsiveGrid>
    </div>
  );
};

export default TopArtists;
