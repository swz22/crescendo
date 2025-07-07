import { useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setSelectedCountry as setSelectedCountryAction } from "../redux/features/playerSlice";
import { Error, Loader, ArtistCard, AppHeader, ResponsiveGrid } from "../components";
import Dropdown from "../components/Dropdown";
import { usePersistentScroll } from "../hooks/usePersistentScroll";
import { useGetTopArtistsQuery } from "../redux/services/spotifyCore";
import { countries } from "../assets/constants";
import { Icon } from "@iconify/react";

const TopArtists = () => {
  const dispatch = useDispatch();
  const { selectedCountry } = useSelector((state) => state.player);

  usePersistentScroll();

  const selectedCountryName = countries.find((c) => c.code === selectedCountry)?.name || "United States";

  const { data, isFetching, error } = useGetTopArtistsQuery(selectedCountry || "US");

  if (isFetching) return <Loader title="Loading top artists..." />;
  if (error) return <Error />;

  const handleCountryChange = (country) => {
    dispatch(setSelectedCountryAction(country.code));
  };

  // Sort countries with US and UK first, then alphabetically
  const sortedCountries = [...countries].sort((a, b) => {
    if (a.code === "US") return -1;
    if (b.code === "US") return 1;
    if (a.code === "GB") return -1;
    if (b.code === "GB") return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="flex flex-col">
      <AppHeader
        title="Top Artists"
        subtitle={`Most popular artists in ${selectedCountryName}`}
        showSearch={true}
        action={
          <Dropdown
            items={sortedCountries}
            value={selectedCountry}
            onChange={handleCountryChange}
            placeholder="Select Country"
            renderIcon={(country) => <Icon icon={`circle-flags:${country.flag}`} className="w-5 h-5" />}
            renderLabel={(country) => country.name}
            groups={[
              { label: "Popular", items: ["US", "GB"] },
              {
                label: "All Countries",
                items: sortedCountries.slice(2).map((c) => c.code),
              },
            ]}
            width={200}
            mobileIconOnly={true}
          />
        }
      />

      <ResponsiveGrid type="artists">
        {data?.map((artist) => (
          <ArtistCard key={artist.adamid || artist.id} track={{ artists: [artist] }} />
        ))}
      </ResponsiveGrid>
    </div>
  );
};

export default TopArtists;
