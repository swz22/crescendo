import React from "react";
import { useSelector } from "react-redux";
import { selectCurrentContextTracks } from "../redux/features/playerSelectors";
import { HiOutlineQueueList } from "react-icons/hi2";

const QueueButton = ({ onClick }) => {
  const tracks = useSelector(selectCurrentContextTracks);
  const queueCount = tracks.length;

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-full transition-all duration-200 group"
      aria-label={`Queue (${queueCount} tracks)`}
    >
      <HiOutlineQueueList className="w-5 h-5 text-white" />
      <span className="text-white font-medium text-sm">{queueCount}</span>
    </button>
  );
};

export default QueueButton;
