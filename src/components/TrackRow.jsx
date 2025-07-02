import React from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import PlayPause from "./PlayPause";
import SongMenu from "./SongMenu";
import { usePreviewUrl } from "../hooks/usePreviewUrl";
import { isSameTrack } from "../utils/trackUtils";

const TrackRow = ({
  song,
  i,
  artistId,
  isPlaying,
  handlePauseClick,
  handlePlayClick,
  showMenu = true,
}) => {
  const { hasNoPreview } = usePreviewUrl();
  const { currentTrack } = useSelector((state) => state.player);
  const isCurrentSong = isSameTrack(song, currentTrack);

  // Check if preview is unavailable
  const isUnavailable = hasNoPreview(song);

  const handleClick = () => {
    if (!isUnavailable) {
      handlePlayClick();
    }
  };

  return (
    <div
      className={`w-full flex flex-row hover:bg-white/10 ${
        isCurrentSong ? "bg-white/10" : ""
      } ${
        isUnavailable ? "opacity-60" : ""
      } py-2 p-4 rounded-lg cursor-pointer mb-2 transition-all duration-200 group`}
    >
      <h3 className="font-bold text-base text-white mr-3">{i + 1}.</h3>
      <div className="flex-1 flex flex-row justify-between items-center">
        <div className="flex-1 flex flex-col justify-center mx-3">
          <Link
            to={`/songs/${song?.key || song?.id}`}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-lg font-bold text-white hover:text-[#2dd4bf] transition-colors">
              {song?.title}
            </p>
          </Link>
          <p className="text-sm text-gray-300 mt-1">
            {song?.subtitle || song?.artists?.[0]?.name}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {showMenu && !isUnavailable && (
            <div onClick={(e) => e.stopPropagation()}>
              <SongMenu song={song} />
            </div>
          )}

          <div>
            <PlayPause
              song={song}
              handlePause={handlePauseClick}
              handlePlay={handlePlayClick}
              disabled={isUnavailable}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(TrackRow, (prevProps, nextProps) => {
  return (
    prevProps.song?.key === nextProps.song?.key &&
    prevProps.i === nextProps.i &&
    prevProps.isPlaying === nextProps.isPlaying &&
    prevProps.showMenu === nextProps.showMenu
  );
});
