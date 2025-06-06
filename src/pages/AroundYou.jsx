import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Error, Loader, SongCard } from "../components";
import { useGetSongsByCountryQuery, useGetChartsListQuery } from "../redux/services/shazamCore";

const CountryTracks = () => {
  const [selectedCountryId, setSelectedCountryId] = useState("");
  const { activeSong, isPlaying } = useSelector((state) => state.player);
  
  // Get charts list to get available countries
  const { data: chartsData, isLoading: chartsLoading } = useGetChartsListQuery();
  
  // Set default country when charts data loads
  useEffect(() => {
    if (chartsData && !selectedCountryId) {
      // Default to US or first available country
      const usCountry = chartsData.countries?.find(c => c.id === 'US');
      const defaultCountry = usCountry || chartsData.countries?.[0];
      if (defaultCountry) {
        setSelectedCountryId(defaultCountry.listid);
      }
    }
  }, [chartsData, selectedCountryId]);
  
  // Get songs for the selected country
  const { data, isFetching, error } = useGetSongsByCountryQuery(
    selectedCountryId,
    { skip: !selectedCountryId }
  );

  if (chartsLoading) return <Loader title="Loading countries..." />;
  if (isFetching) return <Loader title="Loading Songs..." />;
  if (error) return <Error />;
  
  // Extract tracks from the response
  const songs = data?.tracks || data || [];
  const countries = chartsData?.countries || [];

  return (
    <div className="flex flex-col">
      <div className="w-full flex justify-between items-center sm:flex-row flex-col mt-4 mb-10">
        <h2 className="font-bold text-3xl text-white text-left">
          Around You
        </h2>
        
        <select
          onChange={(e) => setSelectedCountryId(e.target.value)}
          value={selectedCountryId}
          className="bg-black text-gray-300 p-3 text-sm rounded-lg outline-none sm:mt-0 mt-5"
        >
          {countries.map((country) => (
            <option key={country.listid} value={country.listid}>
              {country.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap sm:justify-start justify-center gap-8">
        {songs?.map((song, i) => (
          <SongCard
            key={song.key}
            song={song}
            isPlaying={isPlaying}
            activeSong={activeSong}
            data={songs}
            i={i}
          />
        ))}
      </div>
    </div>
  );
};

export default CountryTracks;