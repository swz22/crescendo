import { useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setSelectedCountry as setSelectedCountryAction } from "../redux/features/playerSlice";
import { Error, Loader, AlbumCard, AppHeader, ResponsiveGrid } from "../components";
import Dropdown from "../components/Dropdown";
import { usePersistentScroll } from "../hooks/usePersistentScroll";
import { useGetTopAlbumsQuery } from "../redux/services/spotifyCore";
import { countries } from "../assets/constants";
import { Icon } from "@iconify/react";

const TopAlbums = () => {
  const dispatch = useDispatch();
  const { selectedCountry } = useSelector((state) => state.player);

  usePersistentScroll();

  const selectedCountryName = countries.find((c) => c.code === selectedCountry)?.name || "United States";

  const { data, isFetching, error } = useGetTopAlbumsQuery({
    country: selectedCountry || "US",
  });

  if (isFetching) return <Loader title="Loading top albums..." />;
  if (error) return <Error />;

  const handleCountryChange = (country) => {
    dispatch(setSelectedCountryAction(country.code));
  };

  // Show US and UK first, then sort alphabetically
  const sortedCountries = [...countries].sort((a, b) => {
    if (a.code === "US") return -1;
    if (b.code === "US") return 1;
    if (a.code === "GB") return -1;
    if (b.code === "GB") return 1;
    return a.name.localeCompare(b.name);
  });

  // Limit to 48 albums for 8 rows of 6
  const displayAlbums = data?.slice(0, 48) || [];

  return (
    <div className="flex flex-col">
      <AppHeader
        title="Top Albums"
        subtitle={`Discover trending albums worldwide`}
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

      <ResponsiveGrid type="albums">
        {displayAlbums.map((album, i) => (
          <AlbumCard key={album.id || `album-${i}`} album={album} i={i} />
        ))}
      </ResponsiveGrid>
    </div>
  );
};

export default TopAlbums;
