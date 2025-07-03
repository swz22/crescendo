import { useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setSelectedCountry as setSelectedCountryAction } from "../redux/features/playerSlice";
import {
  Error,
  Loader,
  ArtistCard,
  AppHeader,
  ResponsiveGrid,
} from "../components";
import DropdownPortal from "../components/DropdownPortal";
import { usePersistentScroll } from "../hooks/usePersistentScroll";
import { useGetTopArtistsQuery } from "../redux/services/spotifyCore";
import { countries } from "../assets/constants";
import { IoChevronDown, IoCloseCircle } from "react-icons/io5";
import { Icon } from "@iconify/react";

const TopArtists = () => {
  const dispatch = useDispatch();
  const { selectedCountry } = useSelector((state) => state.player);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const countryButtonRef = useRef(null);

  usePersistentScroll();

  const selectedCountryName =
    countries.find((c) => c.code === selectedCountry)?.name || "United States";

  const selectedCountryFlag =
    countries.find((c) => c.code === selectedCountry)?.flag || "us";

  const { data, isFetching, error } = useGetTopArtistsQuery(
    selectedCountry || "US"
  );

  if (isFetching) return <Loader title="Loading top artists..." />;
  if (error) return <Error />;

  const handleCountryChange = (country) => {
    dispatch(setSelectedCountryAction(country.code));
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
              className="flex items-center gap-2 px-4 py-2 bg-white/[0.08] hover:bg-white/[0.12] backdrop-blur-md rounded-full transition-all duration-200 border border-white/20 hover:border-white/30 group"
            >
              <Icon
                icon={`circle-flags:${selectedCountryFlag}`}
                className="w-4 h-4"
              />
              <span className="text-white font-medium text-sm">
                {selectedCountryName}
              </span>
              <IoChevronDown
                className={`text-white/60 transition-all duration-200 w-3 h-3 ${
                  showCountryDropdown ? "rotate-180" : ""
                }`}
              />
            </button>

            <DropdownPortal
              isOpen={showCountryDropdown}
              onClose={() => setShowCountryDropdown(false)}
              triggerRef={countryButtonRef}
              minWidth={200}
              maxHeight={262}
              placement="bottom-end"
              className="bg-[#1a1848] border border-white/20 rounded-xl"
            >
              <div className="py-2">
                <div className="py-1">
                  {sortedCountries.map((country, index) => {
                    const isSelected = country.code === selectedCountry;
                    const isUS = country.code === "US";

                    return (
                      <div key={country.code}>
                        {isUS && index === 0 && (
                          <div className="px-4 pb-1">
                            <div className="text-[10px] text-white/40 uppercase tracking-wider font-medium">
                              Popular
                            </div>
                          </div>
                        )}
                        {!isUS && index === 1 && (
                          <>
                            <div className="mx-4 my-1 border-t border-white/10" />
                            <div className="px-4 pb-1 pt-1">
                              <div className="text-[10px] text-white/40 uppercase tracking-wider font-medium">
                                All Countries
                              </div>
                            </div>
                          </>
                        )}
                        <button
                          onClick={() => handleCountryChange(country)}
                          className={`w-full flex items-center gap-3 px-4 py-2 transition-all duration-200 ${
                            isSelected
                              ? "text-[#14b8a6] bg-[#14b8a6]/20"
                              : "text-white/80 hover:text-white hover:bg-white/10"
                          }`}
                        >
                          <Icon
                            icon={`circle-flags:${country.flag}`}
                            className="w-4 h-4 flex-shrink-0"
                          />
                          <span className="text-sm text-left flex-1">
                            {country.name}
                          </span>
                          {isSelected && (
                            <div className="w-1.5 h-1.5 bg-[#14b8a6] rounded-full" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
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
