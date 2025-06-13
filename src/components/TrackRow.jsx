import React from "react";
import { Link } from "react-router-dom";
import PlayPause from "./PlayPause";

const SongBar = ({
  song,
  i,
  artistId,
  isPlaying,
  activeSong,
  handlePauseClick,
  handlePlayClick,
}) => {
  const isCurrentSong =
    activeSong?.key === song?.key || activeSong?.id === song?.id;

  return (
    <div
      className={`w-full flex flex-row hover:bg-white/10 ${
        isCurrentSong ? "bg-white/10" : ""
      } py-2 p-4 rounded-lg cursor-pointer mb-2`}
    >
      <h3 className="font-bold text-base text-white mr-3">{i + 1}.</h3>
      <div className="flex-1 flex flex-row justify-between items-center">
        <div className="flex-1 flex flex-col justify-center mx-3">
          <Link to={`/songs/${song?.key || song?.id}`}>
            <p className="text-lg font-bold text-white hover:text-[#2dd4bf] transition-colors">
              {song?.title}
            </p>
          </Link>
          <p className="text-sm text-gray-300 mt-1">
            {song?.subtitle || song?.artists?.[0]?.name}
          </p>
        </div>

        <div className="flex items-center">
          <PlayPause
            isPlaying={isPlaying}
            activeSong={activeSong}
            song={song}
            handlePause={handlePauseClick}
            handlePlay={handlePlayClick}
          />
        </div>
      </div>
    </div>
  );
};

export default SongBar;
