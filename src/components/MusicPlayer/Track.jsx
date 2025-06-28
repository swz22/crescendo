import React from "react";

const Track = ({ isPlaying, isActive, activeSong, songImage }) => {
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
      </div>
    </div>
  );
};

export default Track;
