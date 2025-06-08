import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import PlayPause from "./PlayPause";
import Tooltip from "./Tooltip";
import { playPause, setActiveSong } from "../redux/features/playerSlice";
import { useGetTopChartsQuery } from "../redux/services/spotifyCore";
import { usePreviewUrl } from "../hooks/usePreviewUrl";

// Utility function to clean up titles
const cleanTitle = (title) => {
  if (!title) return "";
  // Remove content in parentheses and brackets
  return title
    .replace(/\s*\([^)]*\)/g, "") // Remove (anything)
    .replace(/\s*\[[^\]]*\]/g, "") // Remove [anything]
    .trim();
};

const TopChartCard = ({
  song,
  i,
  isPlaying,
  activeSong,
  handlePauseClick,
  handlePlayClick,
  data,
  prefetchPreviewUrl,
  isPreviewCached,
}) => {
  const displayTitle = cleanTitle(song?.title);

  const handleMouseEnter = () => {
    if (!isPreviewCached(song)) {
      prefetchPreviewUrl(song, { priority: "high" });
    }
  };

  return (
    <div
      className={`w-full flex flex-row items-center hover:bg-[#4c426e] ${
        activeSong?.title === song?.title ? "bg-[#4c426e]" : "bg-transparent"
      } py-2 p-3 rounded-lg cursor-pointer mb-1`}
      onMouseEnter={handleMouseEnter}
    >
      <h3 className="font-bold text-sm text-white mr-3">{i + 1}.</h3>
      <div className="flex-1 flex flex-row justify-between items-center">
        <img
          className="w-14 h-14 rounded-lg"
          src={song?.images?.coverart}
          alt={song?.title}
        />
        <div className="flex-1 flex flex-col justify-center mx-3 min-w-0">
          <Link to={`/songs/${song.key}`}>
            <Tooltip text={song?.title}>
              <p className="text-base font-bold text-white truncate">
                {displayTitle}
              </p>
            </Tooltip>
          </Link>
          <Tooltip text={song?.subtitle}>
            <p className="text-sm text-gray-300 truncate">{song?.subtitle}</p>
          </Tooltip>
        </div>
      </div>
      <PlayPause
        isPlaying={isPlaying}
        activeSong={activeSong}
        song={song}
        handlePause={handlePauseClick}
        handlePlay={() => handlePlayClick(song, i, data)}
      />
    </div>
  );
};

const RecentlyPlayedCard = ({
  song,
  i,
  isPlaying,
  activeSong,
  handlePauseClick,
  handlePlayClick,
  data,
  prefetchPreviewUrl,
  isPreviewCached,
}) => {
  const displayTitle = cleanTitle(song?.title);

  const handleMouseEnter = () => {
    if (!isPreviewCached(song)) {
      prefetchPreviewUrl(song, { priority: "high" });
    }
  };

  return (
    <div
      className={`w-full flex items-center hover:bg-[#4c426e] ${
        activeSong?.key === song?.key ? "bg-[#4c426e]" : "bg-transparent"
      } py-2 px-3 rounded-lg cursor-pointer transition-all duration-200`}
      onMouseEnter={handleMouseEnter}
    >
      <span className="text-gray-500 text-sm w-4 mr-3">{i + 1}</span>

      <img
        className="w-12 h-12 rounded-md mr-3"
        src={
          song?.images?.coverart ||
          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzRhNTU2OCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IiNhMGFlYzAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4="
        }
        alt={song?.title}
      />

      <div className="flex-1 flex flex-col justify-center min-w-0">
        <Link to={`/songs/${song.key}`}>
          <Tooltip text={song?.title}>
            <p className="text-white font-medium text-sm hover:underline truncate">
              {displayTitle}
            </p>
          </Tooltip>
        </Link>
        <Tooltip text={song?.subtitle}>
          <p className="text-gray-400 text-xs truncate">{song?.subtitle}</p>
        </Tooltip>
      </div>

      <PlayPause
        isPlaying={isPlaying}
        activeSong={activeSong}
        song={song}
        handlePause={handlePauseClick}
        handlePlay={() => handlePlayClick(song, i, data)}
      />
    </div>
  );
};

const MusicSidebar = () => {
  const dispatch = useDispatch();
  const {
    activeSong,
    isPlaying,
    recentlyPlayed = [],
  } = useSelector((state) => state.player);
  const { data, isFetching, error } = useGetTopChartsQuery();
  const {
    getPreviewUrl,
    prefetchPreviewUrl,
    prefetchMultiple,
    isPreviewCached,
  } = usePreviewUrl();
  const divRef = useRef(null);

  useEffect(() => {
    if (divRef.current) {
      divRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  // Conservative prefetch - only first 3 tracks after delay
  useEffect(() => {
    if (data && data.length > 0) {
      // Wait 2 seconds before starting any prefetch
      const timeoutId = setTimeout(() => {
        // Only prefetch first 3 tracks with delays between each
        data.slice(0, 3).forEach((song, index) => {
          setTimeout(() => {
            prefetchPreviewUrl(song, { priority: "low" });
          }, index * 3000); // 3 seconds between each prefetch
        });
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
  }, [data, prefetchPreviewUrl]);

  const topPlays =
    data
      ?.filter((song, index, self) => {
        return (
          index ===
          self.findIndex(
            (s) =>
              s.title?.toLowerCase() === song.title?.toLowerCase() &&
              s.subtitle?.toLowerCase() === song.subtitle?.toLowerCase()
          )
        );
      })
      .slice(0, 4) || [];

  const handlePauseClick = () => {
    dispatch(playPause(false));
  };

  const handlePlayClick = async (song, i, songArray) => {
    // Always get preview URL (from cache or fetch)
    const songWithPreview = await getPreviewUrl(song);

    if (songWithPreview.preview_url) {
      dispatch(setActiveSong({ song: songWithPreview, data: songArray, i }));
      dispatch(playPause(true));
    } else {
    }
  };

  if (isFetching) {
    return (
      <div className="xl:ml-6 ml-0 xl:mb-0 mb-6 flex-1 xl:max-w-[400px] max-w-full flex flex-col">
        <div className="w-full h-20 bg-gray-800 animate-pulse rounded-lg mb-4" />
        <div className="w-full h-20 bg-gray-800 animate-pulse rounded-lg mb-4" />
        <div className="w-full h-20 bg-gray-800 animate-pulse rounded-lg mb-4" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="xl:ml-6 ml-0 xl:mb-0 mb-6 flex-1 xl:max-w-[400px] max-w-full flex flex-col">
        <p className="text-gray-400">Error loading tracks</p>
      </div>
    );
  }

  return (
    <div
      ref={divRef}
      className="xl:ml-6 ml-0 xl:mb-0 mb-6 flex-1 xl:max-w-[400px] max-w-full flex flex-col"
    >
      {/* Top Tracks Section */}
      <div className="w-full flex flex-col">
        <div className="flex flex-row justify-between items-center">
          <h2 className="text-white font-bold text-xl">Top Tracks</h2>
          <Link to="/top-charts">
            <p className="text-gray-300 text-base cursor-pointer">See more</p>
          </Link>
        </div>

        <div className="mt-4 flex flex-col gap-1">
          {topPlays?.map((song, i) => (
            <TopChartCard
              key={song.key}
              song={song}
              i={i}
              isPlaying={isPlaying}
              activeSong={activeSong}
              handlePauseClick={handlePauseClick}
              handlePlayClick={handlePlayClick}
              data={topPlays}
              prefetchPreviewUrl={prefetchPreviewUrl}
              isPreviewCached={isPreviewCached}
            />
          ))}
        </div>
      </div>

      {/* Recently Played Section */}
      <div className="w-full flex flex-col mt-6">
        <div className="flex flex-row justify-between items-center mb-4">
          <h2 className="text-white font-bold text-xl">Recently Played</h2>
        </div>

        {!recentlyPlayed || recentlyPlayed.length === 0 ? (
          <p className="text-gray-400 text-sm">
            Start playing songs to see your history
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              {recentlyPlayed.slice(0, 5).map((song, i) => (
                <RecentlyPlayedCard
                  key={`recent-${song.key}-${i}`}
                  song={song}
                  i={i}
                  isPlaying={isPlaying}
                  activeSong={activeSong}
                  handlePauseClick={handlePauseClick}
                  handlePlayClick={handlePlayClick}
                  data={recentlyPlayed.slice(0, 5)}
                  prefetchPreviewUrl={prefetchPreviewUrl}
                  isPreviewCached={isPreviewCached}
                />
              ))}
            </div>

            {recentlyPlayed.length > 5 && (
              <p className="text-gray-500 text-xs text-center mt-3">
                +{recentlyPlayed.length - 5} more in history
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MusicSidebar;
