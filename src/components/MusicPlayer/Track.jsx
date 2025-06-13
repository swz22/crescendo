import React from "react";
import { Link } from "react-router-dom";
import { usePlaylistManager } from "../../hooks/usePlaylistManager";
import AddToPlaylistDropdown from "../AddToPlaylistDropdown.jsx";

const Track = ({ isPlaying, isActive, activeSong, songImage }) => {
  const { playlists } = usePlaylistManager();
  const trackId = activeSong?.key || activeSong?.id || activeSong?.track_id;

  return (
    <div className="flex-1 flex items-center justify-start min-w-0">
      <div
        className={`${
          isPlaying && isActive ? "animate-[spin_3s_linear_infinite]" : ""
        } hidden sm:block h-12 w-12 sm:h-16 sm:w-16 mr-3 sm:mr-4 flex-shrink-0`}
      >
        <img
          src={songImage}
          alt="cover art"
          className="rounded-full"
          onError={(e) => {
            e.target.src =
              "https://via.placeholder.com/64x64.png?text=No+Image";
          }}
        />
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <p className="truncate text-white font-bold text-sm sm:text-lg">
          {activeSong?.title ||
            activeSong?.attributes?.name ||
            "No active Song"}
        </p>
        <p className="truncate text-gray-300 text-xs sm:text-sm">
          {activeSong?.subtitle ||
            activeSong?.attributes?.artistName ||
            activeSong?.artist ||
            "Unknown Artist"}
        </p>
        {activeSong && (
          <div className="flex items-center gap-3 mt-1">
            {activeSong?.album?.id && (
              <Link
                to={`/albums/${activeSong.album.id}`}
                className="text-xs text-gray-400 hover:text-[#14b8a6] transition-colors inline-flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                  />
                </svg>
                View Album
              </Link>
            )}
            <AddToPlaylistDropdown track={activeSong}>
              <button className="text-xs text-gray-400 hover:text-[#14b8a6] transition-colors inline-flex items-center gap-1">
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add to Playlist
              </button>
            </AddToPlaylistDropdown>
          </div>
        )}
      </div>
    </div>
  );
};

export default Track;
