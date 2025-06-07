import { useState, useEffect } from "react";
import { ArtistCard, Error, Loader } from "../components";
import { useGetTopChartsQuery } from "../redux/services/spotifyCore";

const TopArtists = () => {
  const { data, isFetching, error } = useGetTopChartsQuery();
  const [artistsWithImages, setArtistsWithImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(true);

  useEffect(() => {
    if (!data || data.length === 0) return;

    const fetchArtistImages = async () => {
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
      const artistPromises = uniqueArtists.map(async (artist) => {
        try {
          const response = await fetch(`http://localhost:3001/api/spotify/artists/${artist.adamid}`);
          const fullArtist = await response.json();
          return {
            ...artist,
            coverart: fullArtist.images?.[0]?.url || '',
            images: fullArtist.images
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
  }, [data]);

  if (isFetching || loadingImages) return <Loader title="Loading artists..." />;
  if (error) return <Error />;

  return (
    <div className="flex flex-col">
      <h2 className="font-bold text-3xl text-white text-left mt-4 mb-10">
        Top Artists
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 3xl:grid-cols-7 gap-4 sm:gap-6 lg:gap-8">
        {artistsWithImages.map((artist) => (
          <ArtistCard key={artist.adamid} track={{ artists: [artist] }} />
        ))}
      </div>
    </div>
  );
};

export default TopArtists;