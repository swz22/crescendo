import { useEffect, useMemo, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import {
  Error,
  Loader,
  SongCard,
  AppHeader,
  ResponsiveGrid,
} from "../components";
import Dropdown from "../components/Dropdown";
import { selectGenreListId } from "../redux/features/playerSlice";
import { useGetSongsByGenreQuery } from "../redux/services/spotifyCore";
import { usePreviewUrl } from "../hooks/usePreviewUrl";
import { usePersistentScroll } from "../hooks/usePersistentScroll";
import { genres, genreIcons } from "../assets/constants";
import { Icon } from "@iconify/react";

const Discover = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { genreListId, isPlaying } = useSelector((state) => state.player);
  const { prefetchPreviewUrl, getPagePrefetchStrategy } = usePreviewUrl();

  usePersistentScroll();

  const selectedGenre = genreListId || "POP";
  const genreTitle =
    genres.find(({ value }) => value === selectedGenre)?.title || "Pop";

  const { data, isFetching, error } = useGetSongsByGenreQuery(selectedGenre);

  // Sort genres alphabetically
  const sortedGenres = useMemo(() => {
    return [...genres].sort((a, b) => a.title.localeCompare(b.title));
  }, []);

  // Prefetch strategy
  useEffect(() => {
    if (!data || isFetching || !data.length) return;

    const strategy = getPagePrefetchStrategy(location.pathname);

    // Only prefetch if strategy suggests it
    if (strategy.maxSongs > 0) {
      const timeoutId = setTimeout(() => {
        // Prefetch the first few songs based on strategy
        data.slice(0, strategy.maxSongs).forEach((song, index) => {
          setTimeout(() => {
            prefetchPreviewUrl(song, { priority: strategy.priority });
          }, index * strategy.delay);
        });
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
  }, [
    data,
    isFetching,
    prefetchPreviewUrl,
    getPagePrefetchStrategy,
    location.pathname,
  ]);

  // Update genre when URL changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const genreRoute = params.get("genre");
    if (genreRoute) {
      // Find genre by route instead of value
      const genre = genres.find((g) => g.route === genreRoute);
      if (genre) {
        dispatch(selectGenreListId(genre.value));
      }
    }
  }, [location, dispatch]);

  const handleGenreChange = (genre) => {
    dispatch(selectGenreListId(genre.value));

    // Use route for URL
    const newUrl = new URL(window.location);
    newUrl.searchParams.set("genre", genre.route);
    window.history.pushState({}, "", newUrl);
  };

  if (isFetching) return <Loader title="Loading songs..." />;
  if (error) return <Error />;

  return (
    <div className="flex flex-col">
      <AppHeader
        title={`Discover ${genreTitle}`}
        subtitle="Find your next favorite song"
        action={
          <Dropdown
            items={sortedGenres}
            value={selectedGenre}
            onChange={handleGenreChange}
            placeholder="Select Genre"
            renderIcon={(genre) => (
              <Icon
                icon={genreIcons[genre.value] || "mdi:music-note"}
                className="w-4 h-4 text-[#14b8a6]"
              />
            )}
            renderLabel={(genre) => genre.title}
            width={160}
          />
        }
      />

      <ResponsiveGrid type="songs">
        {data?.map((song, i) => (
          <SongCard
            key={song?.key || song?.id || i}
            song={song}
            isPlaying={isPlaying}
            activeSong={{}}
            data={data}
            i={i}
          />
        ))}
      </ResponsiveGrid>
    </div>
  );
};

export default Discover;
